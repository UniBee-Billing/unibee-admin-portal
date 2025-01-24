import React, { ChangeEventHandler } from 'react'
import { TGateway } from '../../shared.types'
import { useAppConfigStore } from '../../stores'

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
    <div className="flex w-full flex-col gap-3">
      {gateways.map(({ gatewayId, gatewayName, displayName, gatewayIcons }) => (
        <label
          onClick={onLabelClick}
          key={gatewayId}
          htmlFor={`payment-${gatewayName}`}
          className={`flex h-12 w-full ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} items-center justify-between rounded border border-solid ${selected == gatewayId ? 'border-blue-500' : 'border-gray-200'} px-2`}
        >
          <div className="flex">
            <input
              type="radio"
              name={`payment-${gatewayName}`}
              id={`payment-${gatewayName}`}
              value={gatewayId}
              checked={gatewayId === selected}
              onChange={onChange}
              disabled={disabled}
            />
            <div className="ml-2 flex justify-between">{displayName}</div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {gatewayIcons.map((i) => (
              <img key={i} height={24} src={i} />
            ))}
          </div>
        </label>
      ))}
    </div>
  )
}

export default Index
