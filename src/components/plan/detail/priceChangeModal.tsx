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
import { Modal, message, Spin } from 'antd'
import { useEffect, useState } from 'react'

interface Props {
    open: boolean
    onCancel: () => void
    onSuccess: () => void
    planId: number
    oldAmount: number // in smallest currency unit (cents)
    newAmount: number // in smallest currency unit (cents)
    currency: string
}

const PriceChangeModal = ({
    open,
    onCancel,
    onSuccess,
    planId,
    oldAmount,
    newAmount,
    currency
}: Props) => {
    const [loading, setLoading] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [previewData, setPreviewData] = useState<{
        activeAffectedSubscriptions: number
        totalAffectedSubscriptions: number
    } | null>(null)

    useEffect(() => {
        if (open) {
            fetchPreview()
        } else {
            setPreviewData(null)
        }
    }, [open])

    const fetchPreview = async () => {
        setLoading(true)
        const [data, err] = await activePriceChangePreviewReq({ planId, newAmount })
        setLoading(false)
        if (err) {
            message.error(err.message)
            return
        }
        setPreviewData(data)
    }

    const handleConfirm = async () => {
        setConfirming(true)
        const [, err] = await activePriceChangeConfirmReq({
            planId,
            newAmount,
            confirmOldAmount: oldAmount
        })
        setConfirming(false)
        if (err) {
            message.error(err.message)
            return
        }
        message.success('Price updated successfully. Please click Publish to make the new price live.')
        onSuccess()
    }

    const pctChange =
        oldAmount > 0 ? ((newAmount - oldAmount) / oldAmount) * 100 : 0
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
                        Confirm Price Change
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
                        disabled={confirming || loading}
                        style={{
                            padding: '6px 20px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#ff4d4f',
                            color: '#fff',
                            cursor: confirming || loading ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            opacity: confirming || loading ? 0.6 : 1
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
                    <p style={{ color: '#333', fontSize: 14, lineHeight: 1.6 }}>
                        You are about to modify the price of an existing plan. This change
                        will affect{' '}
                        <span style={{ color: '#ff4d4f', fontWeight: 700 }}>
                            {activeCount}
                        </span>{' '}
                        active subscriptions. Impacted users will be charged the new price
                        starting from their next billing cycle.
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
                            <span style={{ color: '#666', fontSize: 14 }}>
                                Current Price
                            </span>
                            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
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
                                    style={{ color: changeColor, fontSize: 16 }}
                                />
                            ) : (
                                <ArrowDownOutlined
                                    style={{ color: changeColor, fontSize: 16 }}
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
                            <span style={{ color: '#666', fontSize: 14 }}>New Price</span>
                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <span
                                    style={{ fontSize: 18, fontWeight: 600, color: '#333' }}
                                >
                                    {showAmount(newAmount, currency)}
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
                            style={{ color: '#faad14', fontSize: 14, marginTop: 3 }}
                        />
                        <span
                            style={{ color: '#8c6d1f', fontSize: 13, lineHeight: 1.5 }}
                        >
                            This action cannot be undone. Make sure you have communicated
                            this change to your customers before proceeding.
                        </span>
                    </div>
                </div>
            </Spin>
        </Modal>
    )
}

export default PriceChangeModal
