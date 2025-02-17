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
    <div className="flex max-h-64 w-full flex-col gap-3 overflow-y-auto pr-4">
      {gateways.map(
        ({ gatewayId, gatewayName, displayName, gatewayIcons, archive }) => (
          <label
            onClick={onLabelClick}
            key={gatewayId}
            htmlFor={`payment-${gatewayName}`}
            className={`flex h-12 w-full shrink-0 grow-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} items-center justify-between rounded border border-solid ${selected == gatewayId ? 'border-blue-500' : 'border-gray-200'} px-2`}
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
        )
      )}
    </div>
  )
}

export default Index
