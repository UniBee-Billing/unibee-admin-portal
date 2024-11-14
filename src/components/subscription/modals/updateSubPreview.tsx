import { LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Modal, Row, Spin } from 'antd'
import { isObject } from 'lodash'
import { PropsWithChildren } from 'react'
import { showAmount } from '../../../helpers'
import { IPreview } from '../../../shared.types'

interface UpdateSubPreviewProps {
  isOpen: boolean
  loading: boolean
  previewInfo: IPreview | null
  onCancel: () => void
  onConfirm: () => void
}

const Placeholder = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Spin
      spinning={true}
      indicator={<LoadingOutlined style={{ fontSize: '32px' }} spin />}
    />
  </div>
)

const HEADERS = [
  'Item description',
  'Amount\n(exclude Tax)',
  'Quantity',
  'Discount amount',
  'Tax',
  'Total'
]
const TEMPLATE_SPANS = [8, 4, 3, 4, 2, 3]

type BaseTemplateValue = string | number

type TemplateValue =
  | BaseTemplateValue
  | {
      className: string
      value: BaseTemplateValue
    }

const applyTemplate = (
  values: TemplateValue[],
  isBold: boolean | undefined = false
) => (
  <Row gutter={16}>
    {TEMPLATE_SPANS.map((span, index) => {
      const { value, className } = isObject(values[index])
        ? values[index]
        : { value: values[index], className: isBold ? 'font-bold' : '' }

      return (
        <Col key={value} span={span} className={className}>
          {value}
        </Col>
      )
    })}
  </Row>
)

const Headers = () => applyTemplate(HEADERS, true)

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const DividerLine = ({ children }: PropsWithChildren<{}>) => (
  <Divider plain style={{ margin: '8px 0', color: '#757575' }}>
    {children}
  </Divider>
)

interface InvoiceItemProps {
  lines: IPreview['nextPeriodInvoice']['lines']
}

const InvoiceItem = ({ lines }: InvoiceItemProps) =>
  lines.map(
    ({
      description,
      unitAmountExcludingTax,
      currency,
      quantity,
      discountAmount,
      tax,
      amount
    }) =>
      applyTemplate([
        description,
        showAmount(unitAmountExcludingTax as number, currency),
        quantity,
        !discountAmount ? '-' : showAmount(discountAmount as number, currency),
        showAmount(tax as number, currency),
        showAmount(amount as number, currency)
      ])
  )

interface TotalConfirmProps {
  value: string
  className: string
}

const TotalConfirm = ({ value, className }: TotalConfirmProps) => (
  <div className={className}>
    {applyTemplate(new Array(TEMPLATE_SPANS.length - 1).concat(value), true)}
  </div>
)

export const UpdateSubPreviewModal = ({
  isOpen,
  loading,
  previewInfo,
  onCancel,
  onConfirm
}: UpdateSubPreviewProps) => {
  return (
    <Modal
      title="Subscription Update Preview"
      open={isOpen}
      footer={[
        <Button disabled={loading} onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          Confirm
        </Button>
      ]}
      width={1100} // AntD not support fit-content width for modal in current version
    >
      {!previewInfo ? (
        <Placeholder />
      ) : (
        <>
          <Headers />
          <DividerLine>↓ Next billing period invoices ↓</DividerLine>
          <InvoiceItem lines={previewInfo.nextPeriodInvoice.lines} />
          <TotalConfirm
            className="mt-2"
            value={showAmount(
              previewInfo.nextPeriodInvoice.totalAmount,
              previewInfo.nextPeriodInvoice.currency
            )}
          />
          <DividerLine>↓ Current billing period invoices ↓</DividerLine>
          <InvoiceItem lines={previewInfo.invoice.lines} />
          <TotalConfirm
            className="mt-2"
            value={showAmount(
              previewInfo.invoice.totalAmount,
              previewInfo.invoice.currency
            )}
          />
        </>
      )}
    </Modal>
  )
}
