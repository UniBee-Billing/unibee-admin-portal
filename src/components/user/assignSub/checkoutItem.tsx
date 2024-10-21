import { Skeleton } from 'antd'

export interface CheckoutItemProps {
  label: string
  loading: boolean
  value: string | number | undefined
}

export const CheckoutItem = ({ label, value, loading }: CheckoutItemProps) =>
  value && (
    <div className="flex items-center justify-between">
      <span className="text-lg">{label}</span>
      {loading ? (
        <Skeleton.Input style={{ height: 20 }} active />
      ) : (
        <span>{value}</span>
      )}
    </div>
  )
