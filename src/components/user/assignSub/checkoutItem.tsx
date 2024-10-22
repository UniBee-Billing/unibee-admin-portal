import { Skeleton } from 'antd'

export interface CheckoutItemProps {
  label: string
  loading: boolean
  value: string | number | undefined
  labelStyle?: string
  valueStyle?: string
}

export const CheckoutItem = ({
  label,
  value,
  loading,
  labelStyle,
  valueStyle
}: CheckoutItemProps) =>
  value && (
    <div className="flex items-center justify-between">
      <span className={`text-lg ${labelStyle}`}>{label}</span>
      {loading ? (
        <Skeleton.Input style={{ height: 20 }} active />
      ) : (
        <span className={valueStyle}>{value}</span>
      )}
    </div>
  )
