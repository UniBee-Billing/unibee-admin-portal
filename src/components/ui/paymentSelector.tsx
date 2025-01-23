import React, { ChangeEventHandler } from 'react'
import { useAppConfigStore } from '../../stores'
/*
import PayPalIcon from './icon/PayPal.svg?react'
import AmexIcon from './icon/amex.svg?react'
import BitcoinIcon from './icon/bitcoin-btc-logo.svg?react'
import EthIcon from './icon/ethereum-eth-logo.svg?react'
import LitecoinIcon from './icon/litecoin-ltc-logo.svg?react'
import MastercardIcon from './icon/mastercard.svg?react'
import UsdtIcon from './icon/tether-usdt-logo.svg?react'
import VisaIcon from './icon/visa.svg?react'
import WireIcon from './icon/wire-transfer-1.svg?react'
*/

/*
enum PAYMENT_METHODS {
  stripe = 'stripe',
  paypal = 'paypal',
  changelly = 'changelly',
  unitpay = 'unitpay',
  wire_transfer = 'wire_transfer',
  payssion = 'payssion'
}
  */

/*
const PAYMENTS: {
  [key in PAYMENT_METHODS]: {
    label: string
    order: number
    logo: ReactNode
  }
} = {
  stripe: {
    label: 'Bank Cards',
    logo: [<VisaIcon />, <MastercardIcon />, <AmexIcon />].map((c, idx) => (
      <div key={idx} className="flex h-7 w-7 items-center">
        {c}
      </div>
    )),
    order: 1
  },
  paypal: {
    label: 'PayPal',
    logo: [<PayPalIcon />].map((c, idx) => (
      <div key={idx} className="flex h-16 w-16 items-center">
        {c}
      </div>
    )),
    order: 2
  },
  changelly: {
    label: 'Crypto',
    logo: [<BitcoinIcon />, <EthIcon />, <UsdtIcon />, <LitecoinIcon />].map(
      (c, idx) => (
        <div key={idx} className="flex h-5 w-5 items-center">
          {c}
        </div>
      )
    ),
    order: 3
  },
  wire_transfer: {
    label: 'Wire Transfer',
    logo: [<WireIcon />].map((c, idx) => (
      <div key={idx} className="flex h-8 w-8 items-center">
        {c}
      </div>
    )),
    order: 4
  },
  [PAYMENT_METHODS.unitpay]: {
    label: 'UniPay',
    order: 5,
    logo: undefined
  },
  [PAYMENT_METHODS.payssion]: {
    label: 'Payssion',
    order: 6,
    logo: undefined
  }
}
  */

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
  const gateways = appConfig.gateway.filter((g) => g.IsSetupFinished)
  /*
    .map((g) => ({
      ...g,
      label: PAYMENTS[g.gatewayName as PAYMENT_METHODS].label,
      logo: PAYMENTS[g.gatewayName as PAYMENT_METHODS].logo,
      order: PAYMENTS[g.gatewayName as PAYMENT_METHODS].order
    }))
    .sort((a, b) => a.order - b.order)
    */

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
