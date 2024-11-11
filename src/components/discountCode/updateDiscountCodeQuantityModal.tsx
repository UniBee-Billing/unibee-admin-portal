import { Button, InputNumber, message, Modal, ModalProps } from 'antd'
import { useState } from 'react'
import { useLoading } from '../../hooks'
import { request } from '../../requests/client'

interface UpdateDiscountCodeQuantityModalProps extends ModalProps {
  discountId: number
  close: () => void
  onSuccess: (delta: number) => void
}

const HELP_TEXT_COLOR_MAP = {
  increased: 'text-green-500',
  decreased: 'text-yellow-500'
}

const createUpdateFetcher =
  (endpoint: string) =>
  (
    discountId: UpdateDiscountCodeQuantityModalProps['discountId'],
    quantityDelta: number
  ) =>
    request.post(endpoint, { id: discountId, amount: quantityDelta })

const increaseDiscountCodeQuantity = createUpdateFetcher(
  '/merchant/discount/quantity_increment'
)

const decreaseDiscountCodeQuantity = createUpdateFetcher(
  '/merchant/discount/decrease_quantity'
)

export const UpdateDiscountCodeQuantityModal = (
  props: UpdateDiscountCodeQuantityModalProps
) => {
  const [quantityDelta, setQuantityDelta] = useState(0)
  const { isLoading, withLoading } = useLoading()
  const helpTextVerb = quantityDelta > 0 ? 'increased' : 'decreased'
  const isQuantityChanged = quantityDelta !== 0
  const helpText = !isQuantityChanged
    ? 'The inventory has not changed'
    : `The inventory will be ${helpTextVerb} by ${Math.abs(quantityDelta)}`
  const helpTextColor = isQuantityChanged
    ? HELP_TEXT_COLOR_MAP[helpTextVerb]
    : 'text-gray-400'

  const handleOkButtonClick = async () => {
    const update =
      quantityDelta > 0
        ? increaseDiscountCodeQuantity
        : decreaseDiscountCodeQuantity

    const [, err] = await withLoading(() =>
      update(props.discountId, Math.abs(quantityDelta))
    )

    if (err) {
      message.error(err.message)
      return
    }

    message.success('Discount code quantity updated successfully')
    props.close()
    props.onSuccess(quantityDelta)
  }

  return (
    <Modal
      title="Update discount code quantity"
      onCancel={() => props.close()}
      {...props}
      footer={[
        <Button key="cancel" onClick={() => props.close()} loading={isLoading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isLoading}
          disabled={!isQuantityChanged}
          onClick={handleOkButtonClick}
        >
          Submit
        </Button>
      ]}
    >
      <div className="mb-4">
        Increase or decrease the inventory of discount code
      </div>
      <InputNumber
        value={quantityDelta}
        onChange={(delta) => setQuantityDelta(delta ?? 0)}
      />
      <div className={`mt-1 ${helpTextColor}`}>{helpText}</div>
    </Modal>
  )
}
