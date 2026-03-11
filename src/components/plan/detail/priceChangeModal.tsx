import {
    activePriceChangePreviewReq,
    activePriceChangeConfirmReq
} from '@/requests'
import { showAmount } from '@/helpers'
import {
    ExclamationCircleOutlined,
    ArrowDownOutlined,
    ArrowUpOutlined,
    InfoCircleOutlined
} from '@ant-design/icons'
import { Modal, message, Spin, InputNumber } from 'antd'
import { useEffect, useState } from 'react'
import { useAppConfigStore } from '@/stores'
import { Currency } from 'dinero.js'

interface Props {
    open: boolean
    onCancel: () => void
    onSuccess: () => void
    planId: number
    oldAmount: number // in smallest currency unit (cents)
    currency: string
}

const PriceChangeModal = ({
    open,
    onCancel,
    onSuccess,
    planId,
    oldAmount,
    currency
}: Props) => {
    const [loading, setLoading] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [newPriceInput, setNewPriceInput] = useState<number | null>(null)
    const [previewData, setPreviewData] = useState<{
        activeAffectedSubscriptions: number
        totalAffectedSubscriptions: number
    } | null>(null)

    const appConfig = useAppConfigStore()
    const currencyObj = appConfig.currency[currency as Currency]
    const scale = currencyObj?.Scale ?? 100
    const symbol = currencyObj?.Symbol ?? ''

    // Display amount (from cents to display units)
    const oldDisplayAmount = oldAmount / scale

    // New amount in cents
    const newAmountInCents =
        newPriceInput != null ? Math.round(newPriceInput * scale) : 0
    const priceChanged =
        newPriceInput != null && newAmountInCents !== Math.round(oldAmount)

    useEffect(() => {
        if (open) {
            // Initialize with current price
            setNewPriceInput(oldDisplayAmount)
            setPreviewData(null)
        }
    }, [open])

    // Fetch preview when new price changes
    useEffect(() => {
        if (!open || !priceChanged) {
            if (!priceChanged) setPreviewData(null)
            return
        }
        const timer = setTimeout(() => {
            fetchPreview()
        }, 500)
        return () => clearTimeout(timer)
    }, [newAmountInCents, open])

    const fetchPreview = async () => {
        if (!priceChanged) return
        setLoading(true)
        const [data, err] = await activePriceChangePreviewReq({
            planId,
            newAmount: newAmountInCents
        })
        setLoading(false)
        if (err) {
            message.error(err.message)
            return
        }
        setPreviewData(data)
    }

    const handleConfirm = async () => {
        if (!priceChanged) return
        setConfirming(true)
        const [, err] = await activePriceChangeConfirmReq({
            planId,
            newAmount: newAmountInCents,
            confirmOldAmount: oldAmount
        })
        setConfirming(false)
        if (err) {
            message.error(err.message)
            return
        }
        message.success('Price updated successfully')
        onSuccess()
    }

    const pctChange =
        oldAmount > 0 ? ((newAmountInCents - oldAmount) / oldAmount) * 100 : 0
    const isIncrease = pctChange > 0
    const isDecrease = pctChange < 0
    const changeColor = isIncrease ? '#ff4d4f' : '#52c41a'
    const tagBg = isIncrease ? '#fff1f0' : '#f6ffed'
    const pctText = `${isIncrease ? '+' : ''}${pctChange.toFixed(1)}%`
    const activeCount = previewData?.activeAffectedSubscriptions ?? 0

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#fff1f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ExclamationCircleOutlined
                            style={{ color: '#ff4d4f', fontSize: 18 }}
                        />
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>
                        Update Plan Price
                    </span>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '6px 20px',
                            borderRadius: 6,
                            border: '1px solid #d9d9d9',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: 14
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={confirming || loading || !priceChanged}
                        style={{
                            padding: '6px 20px',
                            borderRadius: 6,
                            border: 'none',
                            background:
                                confirming || loading || !priceChanged
                                    ? '#d9d9d9'
                                    : '#ff4d4f',
                            color: '#fff',
                            cursor:
                                confirming || loading || !priceChanged
                                    ? 'not-allowed'
                                    : 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            opacity: confirming || loading || !priceChanged ? 0.6 : 1
                        }}
                    >
                        {confirming ? 'Applying...' : 'Confirm and Apply'}
                    </button>
                </div>
            }
            width={520}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <div style={{ padding: '8px 0' }}>
                    {/* New price input */}
                    <div style={{ marginBottom: 16 }}>
                        <div
                            style={{
                                fontSize: 14,
                                color: '#333',
                                marginBottom: 8,
                                fontWeight: 500
                            }}
                        >
                            Enter new price ({symbol})
                        </div>
                        <InputNumber
                            value={newPriceInput}
                            onChange={(val) => setNewPriceInput(val)}
                            prefix={symbol}
                            min={0}
                            style={{ width: '100%' }}
                            size="large"
                            placeholder="Enter new price"
                        />
                    </div>

                    {priceChanged && (
                        <>
                            <p
                                style={{
                                    color: '#333',
                                    fontSize: 14,
                                    lineHeight: 1.6
                                }}
                            >
                                You are about to modify the price of an
                                existing plan. This change will affect{' '}
                                <span
                                    style={{
                                        color: '#ff4d4f',
                                        fontWeight: 700
                                    }}
                                >
                                    {activeCount}
                                </span>{' '}
                                active subscriptions. Impacted users will be
                                charged the new price starting from their next
                                billing cycle.
                            </p>

                            {/* Price comparison card */}
                            <div
                                style={{
                                    background: '#fafafa',
                                    borderRadius: 8,
                                    border: '1px solid #f0f0f0',
                                    padding: '16px 20px',
                                    marginTop: 16
                                }}
                            >
                                {/* Current Price */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <span
                                        style={{ color: '#666', fontSize: 14 }}
                                    >
                                        Current Price
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 600,
                                            color: '#333'
                                        }}
                                    >
                                        {showAmount(oldAmount, currency)}
                                    </span>
                                </div>

                                {/* Arrow */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        padding: '8px 0'
                                    }}
                                >
                                    {isIncrease ? (
                                        <ArrowUpOutlined
                                            style={{
                                                color: changeColor,
                                                fontSize: 16
                                            }}
                                        />
                                    ) : (
                                        <ArrowDownOutlined
                                            style={{
                                                color: changeColor,
                                                fontSize: 16
                                            }}
                                        />
                                    )}
                                </div>

                                {/* New Price */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <span
                                        style={{ color: '#666', fontSize: 14 }}
                                    >
                                        New Price
                                    </span>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 18,
                                                fontWeight: 600,
                                                color: '#333'
                                            }}
                                        >
                                            {showAmount(
                                                newAmountInCents,
                                                currency
                                            )}
                                        </span>
                                        {(isIncrease || isDecrease) && (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: changeColor,
                                                    background: tagBg,
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    fontWeight: 500
                                                }}
                                            >
                                                {pctText}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Warning */}
                            <div
                                style={{
                                    marginTop: 16,
                                    padding: '12px 16px',
                                    background: '#fffbe6',
                                    border: '1px solid #ffe58f',
                                    borderRadius: 8,
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'flex-start'
                                }}
                            >
                                <InfoCircleOutlined
                                    style={{
                                        color: '#faad14',
                                        fontSize: 14,
                                        marginTop: 3
                                    }}
                                />
                                <span
                                    style={{
                                        color: '#8c6d1f',
                                        fontSize: 13,
                                        lineHeight: 1.5
                                    }}
                                >
                                    This action cannot be undone. Make sure you
                                    have communicated this change to your
                                    customers before proceeding.
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </Spin>
        </Modal>
    )
}

export default PriceChangeModal
