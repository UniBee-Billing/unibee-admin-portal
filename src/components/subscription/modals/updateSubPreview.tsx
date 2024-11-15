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

const TEMPLATE_SPANS = [12, 4, 3, 2, 3]

type BaseTemplateValue = string | number

type TemplateValue =
  | BaseTemplateValue
  | {
      className: string
      value: BaseTemplateValue
    }

interface InvoiceTemplateProps {
  values: TemplateValue[]
  isBold?: boolean
}

const InvoiceTemplate = ({ values, isBold }: InvoiceTemplateProps) => (
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

const Headers = () => (
  <InvoiceTemplate
    isBold
    values={[
      'Item description',
      'Amount\n(exclude Tax)',
      'Quantity',
      'Tax',
      'Total'
    ]}
  />
)

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
      tax,
      amount
    }) => (
      <InvoiceTemplate
        key={description}
        values={[
          description,
          showAmount(unitAmountExcludingTax as number, currency),
          quantity,
          showAmount(tax as number, currency),
          showAmount(amount as number, currency)
        ]}
      />
    )
  )

interface TotalConfirmProps {
  value: string
  className: string
}

const TotalConfirm = ({ value, className }: TotalConfirmProps) => (
  <div className={className}>
    <InvoiceTemplate
      values={new Array(TEMPLATE_SPANS.length - 1).concat(value)}
      isBold
    />
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
      onCancel={onCancel}
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
      width={800} // AntD not support fit-content width for modal in current version
    >
      {!previewInfo ? (
        <Placeholder />
      ) : (
        <div className="mb-4">
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
        </div>
      )}
    </Modal>
  )
}
