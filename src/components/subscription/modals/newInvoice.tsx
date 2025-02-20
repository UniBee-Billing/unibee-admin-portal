import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Input, Modal, Row, Select, message } from 'antd'
import { Currency } from 'dinero.js'
import update from 'immutability-helper'
import { useState } from 'react'
import { randomString, showAmount } from '../../../helpers'
import {
  createInvoiceReq,
  deleteInvoiceReq,
  publishInvoiceReq,
  refundReq,
  revokeInvoiceReq,
  saveInvoiceReq,
  sendInvoiceInMailReq
} from '../../../requests'
import {
  IProfile,
  InvoiceItem,
  TInvoicePerm,
  UserInvoice
} from '../../../shared.types'
import { useAppConfigStore } from '../../../stores'
import CouponPopover from '../../ui/couponPopover'
import LongTextPopover from '../../ui/longTextPopover'

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
    if (refundReason == '') {
      message.error('Please input refund reason with less than 64 characters')
      return
    }
    const amt = Number(refundAmt)
    if (isNaN(amt) || amt > detail.totalAmount) {
      message.error(
        'Refund amount must be less than or equal to invoice amount'
      )
      return
    }

    setLoading(true)
    const [_, err] = await refundReq({
      invoiceId: detail?.invoiceId,
      refundAmount: amt * appConfig.currency[currency as Currency]!.Scale,
      reason: refundReason
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Refund request created.') // does user get refund immediately? or there is a pending process
    // for stripe/paypal, most of times, refund will be done immediately
    // for crypto/wire_transfer, refund invoice is in processing status, admin has to mark them as paid.
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
        <span>
          {refundMode ? 'Refund invoice detail' : 'New invoice Detail'}
          {''}
          <span className="text-sm font-normal text-gray-400">{` (${user.email}, ${user.firstName} ${user.lastName})`}</span>
        </span>
      }
      open={isOpen}
      width={'820px'}
      footer={null}
      closeIcon={null}
    >
      <div className="h-1"></div>
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
        style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
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
      <Row style={{ display: 'flex', alignItems: 'center' }}>
        <Col span={10}>
          <span style={{ fontWeight: 'bold' }}>Item description</span>
        </Col>
        <Col span={4}>
          <div style={{ fontWeight: 'bold' }}>Amount</div>
        </Col>
        <Col span={1}></Col>
        <Col span={5}>
          <span style={{ fontWeight: 'bold' }}>Quantity</span>
        </Col>
        <Col span={3}>
          <span style={{ fontWeight: 'bold' }}>Subtotal</span>
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
            style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}
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
              ×
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
      <Divider />

      {refundMode && (
        <Row className="flex items-center">
          <Col span={14}> </Col>
          <Col span={6} style={{ fontSize: '18px' }} className="text-red-800">
            Total Discounted
          </Col>
          <Col className="text-red-800" span={4}>
            {` ${detail?.discountAmount !== undefined && detail?.discountAmount > 0 ? '-' : ''}${showAmount(detail?.discountAmount, detail?.currency, true)}`}
            <CouponPopover coupon={detail?.discount} />
          </Col>
        </Row>
      )}

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

      {
        <Row className="my-2">
          <Col span={16}> </Col>
          <Col span={4} className="text-lg text-gray-700">
            Total
          </Col>
          <Col span={4} className="text-lg text-gray-700">
            <span style={{ fontWeight: 'bold' }}>{getTotal(false)}</span>
          </Col>
        </Row>
      }
      {refundMode && (
        <Row className="my-6 flex items-center">
          <Col span={16}>
            <div className="flex items-center">
              <div className="mr-2">Refund Reason:</div>
              <Input
                style={{ width: '288px' }}
                maxLength={64}
                placeholder="Max characters: 64"
                value={refundReason}
                disabled={loading}
                onChange={onRefundReasonChange}
              />
            </div>
          </Col>
          <Col span={8}>
            <div className="flex items-center">
              <div className="mr-4">Refund Amount:</div>
              <Input
                style={{ width: '100px' }}
                disabled={loading}
                prefix={CURRENCIES.find((c) => c.Currency == currency)?.Symbol}
                placeholder={`≤ ${showAmount(detail?.totalAmount, detail?.currency, true)}`}
                value={refundAmt}
                onChange={onRefundAmtChange}
              />
            </div>
          </Col>
        </Row>
      )}

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
            {`${!permission.editable ? 'Close' : 'Close'}`}
          </Button>
          {permission.sendable &&
            !refundMode && ( // when in refundMode, I don't want this "send invoice" button to appear even it's sendable == true
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
          {refundMode && (
            <Button
              type="primary"
              onClick={onRefund}
              loading={loading}
              disabled={loading}
            >
              Refund
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default Index
