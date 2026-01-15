import CouponPopover from '@/components/ui/couponPopover'
import LongTextPopover from '@/components/ui/longTextPopover'
import { randomString, showAmount } from '@/helpers'
import {
  createInvoiceReq,
  deleteInvoiceReq,
  getSplitPaymentsReq,
  publishInvoiceReq,
  refundReq,
  revokeInvoiceReq,
  saveInvoiceReq,
  sendInvoiceInMailReq
} from '@/requests'
import {
  IProfile,
  InvoiceItem,
  SplitPayment,
  TInvoicePerm,
  UserInvoice
} from '@/shared.types'
import { SplitPaymentStatus } from '@/components/invoice/transactionHistory'
import { useAppConfigStore } from '@/stores'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Input, Modal, Row, Select, message } from 'antd'
import { Currency } from 'dinero.js'
import update from 'immutability-helper'
import { useEffect, useState } from 'react'

const newPlaceholderItem = (): InvoiceItem => ({
  id: randomString(8),
  description: '',
  amount: 0,
  unitAmountExcludingTax: '', // item price with single unit
  amountExcludingTax: 0, // item price with quantity multiplied
  discountAmount: 0,
  quantity: '1',
  currency: 'EUR',
  tax: 0,
  taxPercentage: 0
})

// this component is used for creating new invoice(including refund invoice) or editing existing draft invoice.
interface Props {
  user: IProfile
  isOpen: boolean
  detail: UserInvoice | null // null means creating a draft invoice, non-null means: creating refund invoice or editing a draft invoice, in these cases, invoice object already exist.
  permission: TInvoicePerm
  refundMode: boolean
  // items: InvoiceItem[] | null;
  closeModal: () => void
  refresh: () => void
}
const Index = ({
  user,
  isOpen,
  detail,
  permission,
  refundMode,
  closeModal,
  refresh
}: Props) => {
  const appConfig = useAppConfigStore()
  const CURRENCIES = appConfig.supportCurrency
  const [loading, setLoading] = useState(false)
  if (detail != null) {
    detail.lines?.forEach((item) => {
      item.id = randomString(8)
    })
  }

  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>(
    detail == null ? [newPlaceholderItem()] : detail.lines
  )
  const defaultCurrency =
    detail == null || detail.lines == null || detail.lines.length == 0
      ? 'EUR'
      : detail.lines[0].currency // assume all invoice items have the same currencies.
  const [currency, setCurrency] = useState(defaultCurrency)
  const [taxPercentage, setTaxScale] = useState<string>(
    detail == null // detail == null: creating invoice from scratch, non-null: editing existing invoice.
      ? user.taxPercentage / 100 + '' // read default taxRate from profile
      : detail.taxPercentage / 100 + '' // non-null: editing existing invoice.
  )
  const [invoiceName, setInvoiceName] = useState(
    detail == null ? '' : detail.invoiceName
  )
  const [refundAmt, setRefundAmt] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null
  )
  const [payments, setPayments] = useState<SplitPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  // Check if invoice has split payment
  const hasSplitPayment = detail?.metadata?.HasSplitPayment === true

  // Fetch split payments when in refund mode and has split payment
  useEffect(() => {
    const fetchPayments = async () => {
      if (!refundMode || !detail?.invoiceId || !hasSplitPayment) return

      setPaymentsLoading(true)
      const [res, err] = await getSplitPaymentsReq(detail.invoiceId)
      setPaymentsLoading(false)

      if (err) {
        console.error('Failed to fetch payments:', err)
        return
      }

      if (res?.payments) {
        // Filter only successful payments
        const successfulPayments = res.payments.filter(
          (p: SplitPayment) => p.status === SplitPaymentStatus.SUCCESS
        )
        setPayments(successfulPayments)

        // Auto-select if only one payment
        if (successfulPayments.length === 1) {
          setSelectedPaymentId(successfulPayments[0].paymentId)
        }
      }
    }

    fetchPayments()
  }, [refundMode, detail?.invoiceId, hasSplitPayment])

  const onCurrencyChange = (v: string) => setCurrency(v)
  const onTaxScaleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const t = evt.target.value
    setTaxScale(t)
    const newList = invoiceList.map((iv) => ({
      ...iv,
      tax:
        (Number(iv.quantity) * Number(iv.unitAmountExcludingTax) * Number(t)) /
        100
    }))
    setInvoiceList(newList)
  }
  const onInvoiceNameChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setInvoiceName(evt.target.value)

  const onRefundAmtChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setRefundAmt(evt.target.value)

  const onRefundReasonChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setRefundReason(evt.target.value)

  const addInvoiceItem = () => {
    setInvoiceList(
      update(invoiceList, {
        $push: [newPlaceholderItem()]
      })
    )
  }

  const removeInvoiceItem = (invoiceId: string) => () => {
    const idx = invoiceList.findIndex((v) => v.id == invoiceId)
    if (idx != -1) {
      setInvoiceList(update(invoiceList, { $splice: [[idx, 1]] }))
    }
  }

  const validateFields = () => {
    if (
      taxPercentage.trim() == '' ||
      isNaN(Number(taxPercentage)) ||
      Number(taxPercentage) < 0
    ) {
      message.error('Please input valid tax rate(in percentage)')
      return false
    }
    for (let i = 0; i < invoiceList.length; i++) {
      if (invoiceList[i].description == '') {
        message.error('Description is required')
        return false
      }
      let q = Number(invoiceList[i].quantity)
      if (!Number.isInteger(q) || q <= 0) {
        message.error('Please input valid quantity')
        return false
      }
      q = Number(invoiceList[i].unitAmountExcludingTax) // TODO: JPY has no decimal point, take that into account.
      if (isNaN(q) || q <= 0) {
        message.error('Please input valid amount')
        return false
      }
    }
    return true
  }

  // click the "Save" button
  const onSave = (isFinished: boolean) => async () => {
    if (!validateFields()) {
      return
    }
    const CURRENCY = CURRENCIES.find((c) => c.Currency == currency)
    if (CURRENCY == undefined) {
      return
    }
    const invoiceItems = invoiceList.map((v) => ({
      description: v.description,
      unitAmountExcludingTax: Number(v.unitAmountExcludingTax) * CURRENCY.Scale,
      quantity: Number(v.quantity)
    }))
    setLoading(true)
    let _saveInvoiceRes, err
    if (detail == null) {
      // creating a draft invoice from scratch
      ;[_saveInvoiceRes, err] = await createInvoiceReq({
        userId: user!.id as number,
        taxPercentage: Number(taxPercentage) * 100,
        currency,
        name: invoiceName,
        invoiceItems,
        finish: isFinished
      })
    } else {
      // saving an existing draft invoice
      ;[_saveInvoiceRes, err] = await saveInvoiceReq({
        invoiceId: detail.invoiceId,
        taxPercentage: Number(taxPercentage) * 100,
        currency: detail.currency,
        name: invoiceName,
        invoiceItems
      })
    }
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    closeModal()
    message.success('Invoice saved.')
    refresh()
  }

  const onCreate = async () => {
    if (detail == null) {
      await onSave(true)()
      return
    }
    // Do validation check first.
    setLoading(true)
    const [_, err] = await publishInvoiceReq({
      invoiceId: detail.invoiceId,
      payMethod: 1,
      daysUtilDue: 1
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    closeModal()
    message.success('Invoice generated and sent.')
    refresh()
  }

  // revoke: just the opposite of publish (back to unpublished state)
  // delete. They have the same structure, and I'm too lazy to duplicate it.
  const onDeleteOrRevoke = async (action: 'delete' | 'revoke') => {
    if (detail == null) {
      return
    }

    const callMethod = action == 'delete' ? deleteInvoiceReq : revokeInvoiceReq
    setLoading(true)
    const [_, err] = await callMethod(detail.invoiceId)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Invoice ${action}d.`)
    closeModal()
    refresh()
  }

  const onDelete = () => onDeleteOrRevoke('delete')
  const onRevoke = () => onDeleteOrRevoke('revoke')

  const onRefund = async () => {
    if (detail == null) {
      return
    }

    // Validate payment selection when there are split payments
    if (hasSplitPayment && payments.length > 1 && !selectedPaymentId) {
      message.error('Please select a payment method to refund')
      return
    }

    if (refundReason == '') {
      message.error('Please input refund reason with less than 64 characters')
      return
    }

    const amt = Number(refundAmt)
    if (isNaN(amt) || amt <= 0) {
      message.error('Please input a valid refund amount')
      return
    }

    // Get max refundable amount based on selected payment (for split payment) or invoice total
    const selectedPayment = hasSplitPayment
      ? payments.find((p) => p.paymentId === selectedPaymentId)
      : null
    const maxRefundable = selectedPayment
      ? selectedPayment.totalAmount / 100 // Convert from cents
      : detail.totalAmount

    if (amt > maxRefundable) {
      message.error(
        `Refund amount must be less than or equal to ${showAmount(maxRefundable * 100, currency, true)}`
      )
      return
    }

    setLoading(true)
    const [_, err] = await refundReq({
      invoiceId: detail?.invoiceId,
      paymentId: selectedPaymentId || undefined,
      refundAmount: amt * appConfig.currency[currency as Currency]!.Scale,
      reason: refundReason
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Refund request created.')
    closeModal()
    refresh()
  }

  const onSendInvoice = async () => {
    if (detail == null || detail.invoiceId == '' || detail.invoiceId == null) {
      return
    }
    setLoading(true)
    const [_, err] = await sendInvoiceInMailReq(detail.invoiceId)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Invoice sent.')
    closeModal()
  }

  const onFieldChange =
    (invoiceId: string, fieldName: string) =>
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const idx = invoiceList.findIndex((v) => v.id == invoiceId)
      if (idx == -1) {
        return
      }
      let newList = update(invoiceList, {
        [idx]: { [fieldName]: { $set: evt.target.value } }
      })
      newList = update(newList, {
        [idx]: {
          amount: {
            $set:
              Number(newList[idx].quantity) *
              Number(newList[idx].unitAmountExcludingTax)
          },
          tax: {
            $set:
              Math.round(
                Number(newList[idx].quantity) *
                  Number(newList[idx].unitAmountExcludingTax) *
                  (Number(taxPercentage) / 100) *
                  100
              ) / 100
          }
        }
      })
      setInvoiceList(newList)
    }

  const getSubTotal = (
    invoices: InvoiceItem[],
    asNumber?: boolean
  ): string | number => {
    if (invoices == null) {
      invoices = []
    }
    let total = invoices.reduce(
      (accu, curr) =>
        accu +
        Math.round(
          (Number(curr.unitAmountExcludingTax) * (curr.quantity as number) +
            Number.EPSILON) *
            100
        ) /
          100,
      0
    )
    if (isNaN(total)) {
      if (asNumber) {
        return 0
      } else return ''
    }

    total = Math.round((total + Number.EPSILON) * 100) / 100
    // 3rd argument is 'whether ignoreFactor',
    return asNumber ? total : showAmount(total, currency, true)
  }

  const getVATAmt = (asNumber: boolean) => {
    // in refund mode, total/tax are calculated in BE, FE doesn't need to do anything
    if (refundMode) {
      return asNumber
        ? detail?.taxAmount
        : showAmount(detail?.taxAmount, detail?.currency, true)
    }
    // when creating/editing a draft invoice, totalAmt/tax need to be calculated in real-time(reading from tax input, amount field, )
    const tax = Number(taxPercentage)
    if (isNaN(tax) || tax < 0) {
      return asNumber ? 0 : showAmount(0, currency, true)
    }
    const amt =
      Math.round(
        (((getSubTotal(invoiceList, true) as number) * tax) / 100 +
          Number.EPSILON) *
          100
      ) / 100
    return asNumber ? amt : showAmount(amt, currency, true)
  }

  const getTotal = (asNumber: boolean) => {
    // in refund mode, total/tax are calculated in BE, FE doesn't need to do anything
    if (refundMode) {
      return asNumber
        ? detail?.totalAmount
        : showAmount(detail?.totalAmount, detail?.currency, true)
    }
    // when creating/editing a draft invoice, total/tax need to be calculated in real-time(reading from tax input, amount field, )
    let total =
      (getSubTotal(invoiceList, true) as number) + (getVATAmt(true) as number)
    total = Math.round((total + Number.EPSILON) * 100) / 100
    return asNumber ? total : showAmount(total, currency, true)
  }

  return (
    <Modal
      title={
        refundMode ? (
          'Refund Invoice Detail'
        ) : (
          <span>
            New invoice Detail
            <span className="text-sm font-normal text-gray-400">{` (${user.email}, ${user.firstName} ${user.lastName})`}</span>
          </span>
        )
      }
      open={isOpen}
      width={'820px'}
      footer={null}
      closeIcon={null}
    >
      <div className="h-1"></div>
      {!refundMode && (
        <>
          <Row style={{ marginTop: '16px' }}>
            <Col span={4} style={{ fontWeight: 'bold' }}>
              Currency
            </Col>
            <Col span={4} style={{ fontWeight: 'bold' }}>
              Tax Rate
            </Col>
            <Col span={6} style={{ fontWeight: 'bold' }}>
              Invoice title
            </Col>
          </Row>
          <Row
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <Col span={4}>
              {!permission.editable ? (
                <span>{currency}</span>
              ) : (
                <Select
                  style={{ width: 100, margin: '8px 0' }}
                  value={currency}
                  onChange={onCurrencyChange}
                  options={CURRENCIES.map((c) => ({
                    value: c.Currency,
                    label: c.Currency
                  }))}
                />
              )}
            </Col>
            <Col span={4}>
              {!permission.editable ? (
                <span>{taxPercentage} %</span>
              ) : (
                <Input
                  value={taxPercentage}
                  suffix="%"
                  onChange={onTaxScaleChange}
                  type="number"
                  style={{ width: '110px' }}
                />
              )}
            </Col>
            <Col span={6}>
              {!permission.editable ? (
                <span>{detail?.invoiceName}</span>
              ) : (
                <Input value={invoiceName} onChange={onInvoiceNameChange} />
              )}
            </Col>
          </Row>
          <div className="h-4"></div>
        </>
      )}
      {/* Item description table - with border styling in refund mode */}
      <div
        style={
          refundMode
            ? {
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '16px',
                backgroundColor: '#fafafa'
              }
            : {}
        }
      >
        <Row
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: refundMode ? '#f5f5f5' : 'transparent',
            padding: refundMode ? '8px 0' : '0',
            borderRadius: refundMode ? '4px' : '0'
          }}
        >
          <Col span={10}>
            <span style={{ fontWeight: 'bold', color: '#666' }}>
              Item description
            </span>
          </Col>
          <Col span={4}>
            <div style={{ fontWeight: 'bold', color: '#666' }}>Amount</div>
          </Col>
          <Col span={1}></Col>
          <Col span={5}>
            <span style={{ fontWeight: 'bold', color: '#666' }}>Quantity</span>
          </Col>
          <Col span={3}>
            <span style={{ fontWeight: 'bold', color: '#666' }}>Subtotal</span>
          </Col>
          {permission.editable && (
            <Col span={1}>
              <div
                onClick={addInvoiceItem}
                style={{ fontWeight: 'bold', width: '64px', cursor: 'pointer' }}
              >
                <PlusOutlined />
              </div>
            </Col>
          )}
        </Row>
        {invoiceList &&
          invoiceList.map((v, i) => (
            <Row
              key={v.id}
              style={{
                margin: '8px 0',
                display: 'flex',
                alignItems: 'center',
                padding: refundMode ? '8px 0' : '0',
                borderBottom: refundMode ? '1px solid #f0f0f0' : 'none'
              }}
            >
              <Col span={10}>
                {!permission.editable ? (
                  <span>
                    <LongTextPopover text={v.description} width="312px" />
                  </span>
                ) : (
                  <Input
                    value={v.description}
                    onChange={onFieldChange(v.id!, 'description')}
                    style={{ width: '95%' }}
                  />
                )}
              </Col>
              <Col span={4}>
                {!permission.editable ? (
                  <span>
                    {showAmount(
                      v.unitAmountExcludingTax as number,
                      v.currency,
                      true
                    )}
                  </span>
                ) : (
                  <>
                    <Input
                      type="number"
                      prefix={
                        CURRENCIES.find((c) => c.Currency == currency)?.Symbol
                      }
                      value={v.unitAmountExcludingTax}
                      onChange={onFieldChange(v.id!, 'unitAmountExcludingTax')}
                      style={{ width: '80%' }}
                    />
                  </>
                )}
              </Col>
              <Col span={1} style={{ fontSize: '18px' }}>
                x
              </Col>
              <Col span={5}>
                {!permission.editable ? (
                  <span>{v.quantity}</span>
                ) : (
                  <Input
                    type="number"
                    value={v.quantity}
                    onChange={onFieldChange(v.id!, 'quantity')}
                    style={{ width: '60%' }}
                  />
                )}
              </Col>
              <Col span={3}>{getSubTotal([invoiceList[i]])}</Col>
              {permission.editable && (
                <Col span={1}>
                  <div
                    onClick={removeInvoiceItem(v.id!)}
                    style={{
                      fontWeight: 'bold',
                      width: '64px',
                      cursor: 'pointer'
                    }}
                  >
                    <MinusOutlined />
                  </div>
                </Col>
              )}
            </Row>
          ))}
      </div>
      {!refundMode && <Divider />}

      {refundMode ? (
        <>
          {/* Info Cards Row */}
          <Row gutter={16} className="my-4" style={{ display: 'flex' }}>
            {/* Left Card - Basic Info */}
            <Col span={12} style={{ display: 'flex' }}>
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  padding: '16px',
                  flex: 1
                }}
              >
                <Row className="mb-3">
                  <Col span={12}>
                    <div className="text-gray-400 text-sm">Email:</div>
                    <div className="font-medium">{user.email}</div>
                  </Col>
                  <Col span={12}>
                    <div className="text-gray-400 text-sm">Tax Rate:</div>
                    <div className="font-medium">{taxPercentage}%</div>
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>
                    <div className="text-gray-400 text-sm">Invoice Title:</div>
                    <div className="font-medium">
                      {detail?.invoiceName || '-'}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="text-gray-400 text-sm">Currency:</div>
                    <div className="font-medium">{currency}</div>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Right Card - Amount Info */}
            <Col span={12} style={{ display: 'flex' }}>
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  padding: '16px',
                  flex: 1
                }}
              >
                <Row className="mb-3 flex justify-between">
                  <span className="font-medium">Total discounted</span>
                  <span className="font-medium">
                    {detail?.discountAmount !== undefined &&
                    detail?.discountAmount > 0
                      ? '-'
                      : ''}
                    {showAmount(detail?.discountAmount, detail?.currency, true)}
                    <CouponPopover coupon={detail?.discount} />
                  </span>
                </Row>
                <Row className="mb-3 flex justify-between">
                  <span className="text-gray-400">VAT ({taxPercentage}%)</span>
                  <span>{getVATAmt(false)}</span>
                </Row>
                <Row className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">{getTotal(false)}</span>
                </Row>
              </div>
            </Col>
          </Row>

          {/* Refund Order Dropdown - only show for split payment invoices */}
          {hasSplitPayment && (
            <div className="my-4">
              <div className="mb-2 text-gray-700">Refund Order</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Select a payment to refund"
                value={selectedPaymentId}
                onChange={(value) => setSelectedPaymentId(value)}
                loading={paymentsLoading}
                disabled={loading || paymentsLoading}
                options={payments.map((p) => ({
                  value: p.paymentId,
                  label: `${p.paymentId} - ${p.gatewayName} - ${showAmount(p.totalAmount, p.currency)}`
                }))}
              />
            </div>
          )}

          {/* Refund Amount & Reason Row */}
          <Row gutter={16} className="my-4">
            <Col span={12}>
              <div className="mb-2 text-gray-700">Refund Amount</div>
              <Input
                disabled={loading}
                prefix={CURRENCIES.find((c) => c.Currency == currency)?.Symbol}
                placeholder={`Type in amount less than ${
                  selectedPaymentId
                    ? showAmount(
                        payments.find((p) => p.paymentId === selectedPaymentId)
                          ?.totalAmount,
                        currency
                      )
                    : getTotal(false)
                }`}
                value={refundAmt}
                onChange={onRefundAmtChange}
              />
            </Col>
            <Col span={12}>
              <div className="mb-2 text-gray-700">
                Refund Reason<span className="text-red-500">*</span>
              </div>
              <Input
                maxLength={64}
                placeholder="Enter Refund Reason..."
                value={refundReason}
                disabled={loading}
                onChange={onRefundReasonChange}
              />
              <div className="text-gray-400 text-xs mt-1">Max characters: 64</div>
            </Col>
          </Row>
        </>
      ) : (
        <>
          <Row className="my-2">
            <Col span={16}> </Col>
            <Col span={4} className="text-lg text-gray-700">
              VAT(
              {`${taxPercentage}%`})
            </Col>
            <Col span={4} className="text-lg text-gray-700">
              {getVATAmt(false)}
            </Col>
          </Row>

          <Row className="my-2">
            <Col span={16}> </Col>
            <Col span={4} className="text-lg text-gray-700">
              Total
            </Col>
            <Col span={4} className="text-lg text-gray-700">
              <span style={{ fontWeight: 'bold' }}>{getTotal(false)}</span>
            </Col>
          </Row>
        </>
      )}

      {refundMode ? (
        // Refund mode buttons - matching design
        <Row gutter={16} className="mt-6">
          <Col span={12}>
            <Button
              onClick={closeModal}
              disabled={loading}
              style={{ width: '100%', height: '40px' }}
            >
              Close
            </Button>
          </Col>
          <Col span={12}>
            <Button
              type="primary"
              onClick={onRefund}
              loading={loading}
              disabled={
                loading ||
                !refundAmt ||
                !refundReason ||
                (hasSplitPayment && payments.length > 1 && !selectedPaymentId)
              }
              style={{
                width: '100%',
                height: '40px'
              }}
            >
              Refund
            </Button>
          </Col>
        </Row>
      ) : (
        // Non-refund mode buttons
        <div className="mt-6 flex items-center justify-between gap-4">
          {permission.deletable ? (
            <Button
              type="primary"
              danger
              onClick={onDelete}
              loading={loading}
              disabled={!permission.deletable || loading}
            >
              Delete
            </Button>
          ) : (
            <span>&nbsp;</span>
          )}

          {permission.revokable ? (
            <Button
              type="primary"
              danger
              onClick={onRevoke}
              loading={loading}
              disabled={!permission.revokable || loading}
            >
              Cancel
            </Button>
          ) : (
            <span>&nbsp;</span>
          )}

          <div style={{ display: 'flex', gap: '16px' }}>
            <Button onClick={closeModal} disabled={loading}>
              Close
            </Button>
            {permission.sendable && (
              <Button
                type="primary"
                onClick={onSendInvoice}
                loading={loading}
                disabled={loading}
              >
                Send Invoice
              </Button>
            )}
            {(permission.savable || permission.creatable) && (
              <Button
                type="primary"
                onClick={onSave(false)}
                loading={loading}
                disabled={
                  loading || invoiceList == null || invoiceList.length == 0
                }
              >
                Save
              </Button>
            )}
            {permission.publishable && (
              <Button onClick={onCreate} loading={loading} disabled={loading}>
                Create
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default Index
