import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Input, Modal, Row, Select, message } from 'antd'
import update from 'immutability-helper'
import { useState } from 'react'
import { CURRENCY } from '../../../constants'
import { ramdonString, showAmount } from '../../../helpers'
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
} from '../../../shared.types.d'

const newPlaceholderItem = (): InvoiceItem => ({
  id: ramdonString(8),
  description: '',
  amount: 0,
  unitAmountExcludingTax: '', // item price with single unit
  amountExcludingTax: 0, // item price with quantity multiplied
  quantity: '1',
  currency: 'EUR',
  tax: 0,
  taxPercentage: 0
})

interface Props {
  user: IProfile | undefined
  isOpen: boolean
  detail: UserInvoice | null // null means new user, no data available
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
  const [loading, setLoading] = useState(false)
  // const appConfigStore = useAppConfigStore();
  if (detail != null) {
    detail.lines &&
      detail.lines.forEach((item) => {
        item.id = ramdonString(8)
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
  const taxPercentageTmp = detail == null ? '' : detail.taxPercentage / 100
  const [taxPercentage, setTaxScale] = useState<string>(taxPercentageTmp + '')
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

  const onSave = (isFinished: boolean) => async () => {
    if (!validateFields()) {
      return
    }
    const invoiceItems = invoiceList.map((v) => ({
      description: v.description,
      unitAmountExcludingTax:
        Number(v.unitAmountExcludingTax) * CURRENCY[currency].stripe_factor,
      quantity: Number(v.quantity)
    }))
    setLoading(true)
    let saveInvoiceRes, err
    if (detail == null) {
      // creating a new invoice
      ;[saveInvoiceRes, err] = await createInvoiceReq({
        userId: user!.id as number,
        taxPercentage: Number(taxPercentage) * 100,
        currency,
        name: invoiceName,
        invoiceItems,
        finish: isFinished
      })
    } else {
      // saving an invoice
      ;[saveInvoiceRes, err] = await saveInvoiceReq({
        invoiceId: detail.invoiceId,
        taxPercentage: Number(taxPercentage) / 100,
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

  // ----------------
  // what if user made some changes, then click 'create' to publish, backend still uses the old data before the local change.
  const onPublish = async () => {
    if (detail == null) {
      console.log('publis new invoice, detail is null? ', detail)
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
    const total = getTotal(invoiceList, true)
    if (isNaN(amt) || amt > (total as number)) {
      message.error(
        'Refund amount must be less than or equal to invoice amount'
      )
      return
    }

    setLoading(true)
    const [_, err] = await refundReq(
      {
        invoiceId: detail?.invoiceId,
        refundAmount: Number(refundAmt),
        reason: refundReason
      },
      currency
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Refund request created.') // does user get refund immeidately? or there is a pending process
    // for stripe/paypal, most of times, refund will be done immediately
    // for crypto/wire_transfer, refund invoice is in processig status, admin has to mark them as paid.
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
      console.log('after field change, new invoiceList: ', newList)
    }

  // to get a numerical value with 2 decimal points, but still not right
  // https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  // TODO:
  // line1: 33.93 * 35
  // line2: 77.95 * 3
  // we get: 1421.3999999999
  const getTotal = (
    invoices: InvoiceItem[],
    asNumber?: boolean
  ): string | number => {
    // if (asNumber == null) {
    // asNumber = false;
    // }
    if (invoices == null) {
      invoices = []
    }
    let total = invoices.reduce(
      (accu, curr) =>
        accu +
        Math.round(
          (Number(curr.unitAmountExcludingTax) * (curr.quantity as number) +
            Number(curr.tax) +
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
      // return "";
    }

    total = Math.round((total + Number.EPSILON) * 100) / 100
    // 3rd argument is 'whether ignoreFactor',
    // readonly: false, is used when admin need to create a new invoice, $100 need to be shown as $100, no factor considered
    return asNumber ? total : showAmount(total, currency, true)
  }

  return (
    <Modal
      title="Invoice Detail"
      open={isOpen}
      width={'820px'}
      footer={null}
      closeIcon={null}
    >
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
              options={[
                { value: 'EUR', label: 'EUR' },
                { value: 'USD', label: 'USD' },
                { value: 'JPY', label: 'JPY' }
              ]}
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

      <Row style={{ display: 'flex', alignItems: 'center' }}>
        <Col span={10}>
          <span style={{ fontWeight: 'bold' }}>Item description</span>
        </Col>
        <Col span={4}>
          <div style={{ fontWeight: 'bold' }}>Amount</div>
          {/* <div style={{ fontWeight: 'bold' }}>(exclude Tax)</div> */}
        </Col>
        <Col span={1}></Col>
        <Col span={3}>
          <span style={{ fontWeight: 'bold' }}>Quantity</span>
        </Col>
        <Col span={2}>
          <span style={{ fontWeight: 'bold' }}>Tax</span>
        </Col>
        <Col span={3}>
          <span style={{ fontWeight: 'bold' }}>Total</span>
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
                <span>{v.description}</span>
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
                  {/* CURRENCY[currency].symbol */}
                  <Input
                    type="number"
                    prefix={CURRENCY[currency].symbol}
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
            <Col span={3}>
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
            <Col span={2}>{`${CURRENCY[currency].symbol} ${v.tax}`}</Col>
            <Col span={3}>{getTotal([invoiceList[i]])}</Col>
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

      <Row className="flex items-center">
        <Col span={20}>
          {refundMode && (
            <div className="mr-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2">Refund Reason:</div>
                <Input
                  style={{ width: '256px' }}
                  maxLength={64}
                  placeholder="Max characters: 64"
                  value={refundReason}
                  onChange={onRefundReasonChange}
                />
              </div>

              <div className="flex items-center">
                <div className="mr-4">Refund Amt:</div>
                <Input
                  style={{ width: '100px' }}
                  prefix={CURRENCY[currency].symbol}
                  placeholder={`≤ ${getTotal(invoiceList)}`}
                  value={refundAmt}
                  onChange={onRefundAmtChange}
                />
              </div>
            </div>
          )}
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>{getTotal(invoiceList)}</span>
          {detail != null && detail.link != '' && detail.link != null && (
            <a
              href={detail.link}
              target="_blank"
              style={{ fontSize: '11px', marginLeft: '4px', color: '#757575' }}
              rel="noreferrer"
            >
              Payment Link
            </a>
          )}
        </Col>
      </Row>

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
            <Button onClick={onPublish} loading={loading} disabled={loading}>
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
