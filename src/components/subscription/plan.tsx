import { showAmount } from '@/helpers'
import { IPlan, PlanType } from '@/shared.types'
import { Checkbox, InputNumber } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import React, { useEffect, useState } from 'react'
import LongTextPopover from '../ui/longTextPopover'

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
      return [sec / units[i].value, units[i].value]
    }
  }
  throw Error('Invalid time unit')
}

interface IPLanProps {
  plan: IPlan
  selectedPlan: number | null
  isActive: boolean
  width?: string
  isThumbnail?: boolean
  setSelectedPlan?: (p: number) => void
  onAddonChange?: (
    addonId: number,
    quantity: number | null,
    checked: boolean | null
  ) => void
}

const Index = ({
  plan,
  selectedPlan,
  isActive,
  width,
  setSelectedPlan,
  onAddonChange
}: IPLanProps) => {
  const [totalAmount, setTotalAmount] = useState(0)
  const addonCheck = (addonId: number) => (e: CheckboxChangeEvent) => {
    onAddonChange?.(addonId, null, e.target.checked)
  }
  const addonQuantityChange = (addonId: number, delta: number) => {
    const addon = plan.addons?.find((a) => a.id === addonId)
    if (!addon) return
    const currentQty = Number(addon.quantity) || 1
    const newQty = Math.max(1, currentQty + delta)
    onAddonChange?.(addonId, newQty, null)
  }

  const addonQuantityInputChange = (addonId: number, value: number | null) => {
    const quantity = Math.max(1, Number(value) || 1)
    onAddonChange?.(addonId, quantity, null)
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
      const [val, unit] = secondsToUnit(durationTime)
      lengthUnit = unit
      durationTime = val
      requireCardInfo = trialDemand == 'paymentMethod' ? true : false
      autoRenew = cancelAtTrialEnd == 1 ? false : true
    }
    if (!enabled) {
      return null
    }
    return (
      <div className="text-sm text-gray-500">
        <div>Trial Price: {showAmount(amount, plan.currency)}</div>
        <div>
          Trial length:&nbsp;
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
    <div style={{ width: width ?? '16rem' }}>
      <div
        onClick={() => setSelectedPlan?.(plan.id)}
        style={{
          border: `1px solid ${isActive ? '#1677ff' : '#e5e7eb'}`,
          borderRadius: 8,
          padding: '16px',
          background: '#fff',
          cursor: 'pointer'
        }}
      >
        {/* Plan name + price */}
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
          <LongTextPopover text={plan.planName} width="250px" />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          {showAmount(plan.amount, plan.currency)}
        </div>

        {/* Addons */}
        {plan.addons && plan.addons.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              Add-ons (Optional)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {plan.addons.map((a) => (
                <div
                  key={a.id}
                  style={{
                    border: `1px solid ${a.checked ? '#1677ff' : '#e5e7eb'}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    background: a.checked ? '#e6f4ff' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox
                      onChange={addonCheck(a.id)}
                      checked={a.checked}
                      style={{ marginRight: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.planName}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {`${showAmount(a.amount, a.currency)}/${a.intervalCount == 1 ? '' : a.intervalCount}${a.intervalUnit}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        onClick={(e) => { e.stopPropagation(); addonQuantityChange(a.id, -1) }}
                        style={{ cursor: 'pointer', color: '#1677ff', fontWeight: 700, fontSize: 18, lineHeight: 1, userSelect: 'none' }}
                      >—</span>
                      <InputNumber
                        min={1}
                        controls={false}
                        value={Number(a.quantity) || 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(value) => addonQuantityInputChange(a.id, value)}
                        style={{ width: 48 }}
                        className="addon-qty-input"
                      />
                      <span
                        onClick={(e) => { e.stopPropagation(); addonQuantityChange(a.id, 1) }}
                        style={{ cursor: 'pointer', color: '#1677ff', fontWeight: 700, fontSize: 18, lineHeight: 1, userSelect: 'none' }}
                      >+</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {showAmount((Number(a.quantity) || 1) * a.amount, a.currency)}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {`${showAmount(a.amount, a.currency)} × ${Number(a.quantity) || 1}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>{trialInfo()}</div>
      </div>
    </div>
  )
}

export default Index
