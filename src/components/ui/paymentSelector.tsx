import React from 'react'
import { useAppConfigStore } from '../../stores'
import AmexIcon from './icon/amex.svg?react'
import BitcoinIcon from './icon/bitcoin-btc-logo.svg?react'
import EthIcon from './icon/ethereum-eth-logo.svg?react'
import LitecoinIcon from './icon/litecoin-ltc-logo.svg?react'
import MastercardIcon from './icon/mastercard.svg?react'
import UsdtIcon from './icon/tether-usdt-logo.svg?react'
import VisaIcon from './icon/visa.svg?react'
import WireIcon from './icon/wire-transfer-1.svg?react'

const Cards = [<VisaIcon />, <MastercardIcon />, <AmexIcon />]
const Cryptos = [<BitcoinIcon />, <EthIcon />, <UsdtIcon />, <LitecoinIcon />]
const WireTrasfer = [<WireIcon />]

const Index = ({
  selected,
  onSelect,
  disabled
}: {
  selected: number | undefined
  onSelect: React.ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
}) => {
  const appConfig = useAppConfigStore()
  const gateways = appConfig.gateway
    .map((g) => ({
      ...g,
      label:
        g.gatewayType == 1
          ? 'Bank Card'
          : g.gatewayType == 2
            ? 'Cryptocurrency'
            : 'Wire Transfer'
    }))
    .sort((a, b) => a.gatewayId - b.gatewayId)

  return (
    <div className="flex flex-col gap-3">
      {gateways.map((g) => {
        const isCard = g.gatewayName == 'stripe'
        const payMethod =
          g.gatewayType == 1
            ? 'card-payment'
            : g.gatewayType == 2
              ? 'crypto-payment'
              : 'wire-payment'
        return (
          <label
            key={g.gatewayId}
            // htmlFor={isCard ? 'card-payment' : 'crypto-payment'}
            htmlFor={payMethod}
            className={`flex h-12 w-full ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} items-center justify-between rounded border border-solid ${selected == g.gatewayId ? 'border-blue-500' : 'border-gray-200'} px-2`}
          >
            <div className="flex">
              <input
                type="radio"
                name="payment-method"
                // id={isCard ? 'card-payment' : 'crypto-payment'}
                id={payMethod}
                value={g.gatewayId}
                checked={g.gatewayId == selected}
                onChange={onSelect}
                disabled={disabled}
              />
              <div className="ml-2 flex justify-between">{g.label}</div>
            </div>
            <div className="flex items-center justify-center gap-2">
              {payMethod == 'card-payment'
                ? Cards.map((c, idx) => (
                    <div key={idx} className="flex h-7 w-7 items-center">
                      {c}
                    </div>
                  ))
                : payMethod == 'crypto-payment'
                  ? Cryptos.map((c, idx) => (
                      <div key={idx} className="flex h-5 w-5 items-center">
                        {c}
                      </div>
                    ))
                  : WireTrasfer.map((c, idx) => (
                      <div key={idx} className="flex h-12 w-12 items-center">
                        {c}
                      </div>
                    ))}
            </div>
          </label>
        )
      })}
    </div>
  )
}

export default Index
