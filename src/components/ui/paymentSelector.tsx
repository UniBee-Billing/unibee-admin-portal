import { GatewayPaymentType, TGateway } from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import { CheckOutlined } from '@ant-design/icons'
import { Divider } from 'antd'
import React, { ChangeEventHandler, useState } from 'react'

const Index = ({
  selected,
  onSelect,
  disabled
}: {
  selected: number | undefined
  onSelect: (v: number) => void
  disabled?: boolean
}) => {
  const appConfig = useAppConfigStore()
  const gateways = appConfig.gateway.sort(
    (a: TGateway, b: TGateway) => a.sort - b.sort
  )

  // console.log('gateways', gateways)

  const onLabelClick: React.MouseEventHandler<HTMLLabelElement> = (e) => {
    if (disabled) {
      return
    }

    if (e.target instanceof HTMLInputElement) {
      onSelect(Number(e.target.value))
    }
  }

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (disabled) {
      return
    }
    onSelect(Number(e.target.value))
  }

  return (
    <div className="flex max-h-64 w-full flex-col gap-3 overflow-y-auto pr-4">
      {gateways.map(
        ({
          gatewayId,
          gatewayName,
          displayName,
          gatewayIcons,
          archive,
          gatewayPaymentTypes
        }) => (
          <div
            key={gatewayId}
            className={`rounded border border-solid ${selected == gatewayId ? 'border-blue-500' : 'border-gray-200'}`}
          >
            <label
              onClick={onLabelClick}
              // key={gatewayId}
              htmlFor={`payment-${gatewayName}`}
              className={`flex h-12 w-full shrink-0 grow-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} items-center justify-between px-2`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name={`payment-${gatewayName}`}
                  id={`payment-${gatewayName}`}
                  value={gatewayId}
                  checked={gatewayId === selected}
                  onChange={onChange}
                  disabled={disabled}
                />
                <div className="ml-2 flex items-center justify-between">
                  {displayName}
                  {archive && (
                    <span className="text-xs font-bold text-gray-400">
                      &nbsp; ARV
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-3 flex items-center justify-end gap-2">
                {gatewayIcons.map((i) => (
                  <div
                    key={i}
                    className="flex h-7 max-w-14 items-center justify-center"
                  >
                    <img src={i} className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            </label>
            {gatewayPaymentTypes != null && gatewayPaymentTypes.length > 0 && (
              <PaymentTypesSelector
                selected={selected}
                onSelect={onSelect}
                list={gatewayPaymentTypes}
              />
            )}
          </div>
        )
      )}
    </div>
  )
}

export default Index

// if Payssion is not selected, then subtypes should not be selected either.
const PaymentTypesSelector = ({
  selected,
  onSelect,
  list
}: {
  selected: number | undefined
  onSelect: (v: number) => void
  list: GatewayPaymentType[]
}) => {
  const [selectedPaymentType, setSelectedPaymentType] = useState('')

  return (
    <div className="mb-2 flex w-full flex-wrap gap-3 px-2">
      <Divider style={{ margin: '2px 0' }} />
      {list.map((p) => (
        <div
          key={p.paymentType}
          className={`flex w-[48%] rounded-sm bg-gray-100 p-2 hover:cursor-pointer ${selectedPaymentType == p.paymentType ? 'bg-blue-100' : ''}`}
          onClick={() => setSelectedPaymentType(p.paymentType)}
        >
          <div className="flex w-3/4 flex-col gap-1">
            <div>{p.name} </div>
            <div className="text-xs text-gray-500">{p.countryName}</div>
          </div>
          <div className="flex w-1/4 items-center justify-center">
            <div>
              {selectedPaymentType == p.paymentType && (
                <CheckOutlined className="text-blue-500" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
