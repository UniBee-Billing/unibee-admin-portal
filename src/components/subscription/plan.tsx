import { Checkbox, Input } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import React, { useEffect, useState } from 'react'
import { showAmount } from '../../helpers'
import { IPlan } from '../../shared.types'

const TIME_UNITS = [
  // in seconds
  { label: 'hours', value: 60 * 60 },
  { label: 'days', value: 60 * 60 * 24 },
  { label: 'weeks', value: 60 * 60 * 24 * 7 },
  { label: 'months(30days)', value: 60 * 60 * 24 * 30 }
]

const secondsToUnit = (sec: number) => {
  const units = [...TIME_UNITS].sort((a, b) => b.value - a.value)
  for (let i = 0; i < units.length; i++) {
    if (sec % units[i].value === 0) {
      return [sec / units[i].value, units[i].value] // if sec is 60 * 60 * 24 * 30 * 3, then return [3, 60 * 60 * 24 * 30 * 3]
    }
  }
  throw Error('Invalid time unit')
}

interface IPLanProps {
  plan: IPlan
  selectedPlan: number | null
  isActive: boolean // whether current plan is the one user has subscribed(Y: highlight it)
  setSelectedPlan: (p: number) => void
  onAddonChange: (
    addonId: number,
    quantity: number | null,
    checked: boolean | null
  ) => void
}

const Index = ({
  plan,
  selectedPlan,
  isActive,
  setSelectedPlan,
  onAddonChange
}: IPLanProps) => {
  const [totalAmount, setTotalAmount] = useState(0)
  const addonCheck = (addonId: number) => (e: CheckboxChangeEvent) => {
    onAddonChange(addonId, null, e.target.checked)
  }
  const addonQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddonChange(Number(e.target.id), Number(e.target.value), null)
  }

  const trialInfo = () => {
    let enabled = false
    const { trialAmount, trialDurationTime, trialDemand, cancelAtTrialEnd } =
      plan
    const amount = Number(trialAmount)
    let durationTime = Number(trialDurationTime)
    let requireCardInfo = false
    let autoRenew = false
    let lengthUnit = 0
    if (!isNaN(durationTime) && durationTime > 0) {
      enabled = true
      // amount = getAmount(trialAmount, plan.currency);
      const [val, unit] = secondsToUnit(durationTime)
      lengthUnit = unit
      durationTime = val
      // setTrialLengthUnit(unit)
      //  trialDemand?: 'paymentMethod' | '' | boolean // backe
      requireCardInfo = trialDemand == 'paymentMethod' ? true : false
      //   cancelAtTrialEnd?: 0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UX, front-end use <Switch />
      autoRenew = cancelAtTrialEnd == 1 ? false : true
    }
    if (!enabled) {
      return null
    }
    return (
      <div className="text-sm text-gray-500">
        <div>Trial Price: {showAmount(amount, plan.currency)}</div>
        <div>
          Trial lengh:&nbsp;
          {durationTime}&nbsp;
          {TIME_UNITS.find((u) => u.value == lengthUnit)?.label}
        </div>
        <div>{requireCardInfo && 'Require bank card'}</div>
        <div>{autoRenew && 'Auto renew'}</div>
      </div>
    )
  }

  useEffect(() => {
    let amount = plan.amount
    if (plan.addons != null && plan.addons.length > 0) {
      plan.addons.forEach((a) => {
        if (a.checked && Number.isInteger(Number(a.quantity))) {
          amount += Number(a.amount) * Number(a.quantity)
        }
      })
      if (isNaN(amount)) {
        amount = plan.amount
      }
    }
    setTotalAmount(amount)
  }, [plan])

  return (
    <div>
      <div
        onClick={() => setSelectedPlan(plan.id)}
        className="flex h-80 w-64 cursor-pointer flex-col items-center justify-center gap-6 rounded-md px-2 py-2"
        style={{
          border: `1px solid ${isActive ? 'orange' : '#BDBDBD'}`,
          background: selectedPlan == plan.id ? '#FFF' : '#FBFBFB',
          /*
          boxShadow:
            selectedPlan == plan.id
              ? "rgba(0, 0, 0, 0.35) 0px 5px 15px"
              : "unset",
          */
          cursor: 'pointer'
        }}
      >
        <div style={{ fontSize: '28px' }}>{plan.planName}</div>
        <div>{plan.description}</div>

        {plan.addons && (
          <div className="flex flex-col gap-2">
            {plan.addons.map((a) => (
              <div
                className="flex w-full items-center justify-between"
                key={a.id}
              >
                <Checkbox onChange={addonCheck(a.id)} checked={a.checked}>
                  <div style={{ display: 'flex' }}>
                    <div>
                      <div
                        style={{
                          width: '120px',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {a.planName}
                      </div>
                      <div style={{ fontSize: '11px' }}>{` ${showAmount(
                        a.amount,
                        a.currency
                      )}/${a.intervalCount == 1 ? '' : a.intervalCount}${
                        a.intervalUnit
                      }`}</div>
                    </div>

                    <Input
                      id={a.id.toString()}
                      value={a.quantity || 0}
                      onChange={addonQuantityChange}
                      disabled={!a.checked}
                      size="small"
                      style={{ width: '48px', height: '24px' }}
                      placeholder="count"
                    />
                  </div>
                </Checkbox>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: '14px' }}>{`${showAmount(
          plan.amount,
          plan.currency
        )}/${plan.intervalCount == 1 ? '' : plan.intervalCount}${
          plan.intervalUnit
        }`}</div>
        <div style={{ fontSize: '24px' }}>
          Total:&nbsp;
          {`${showAmount(totalAmount, plan.currency)}/${
            plan.intervalCount == 1 ? '' : plan.intervalCount
          }${plan.intervalUnit}`}
        </div>
        <div>{trialInfo()}</div>
      </div>
    </div>
  )
}

export default Index
