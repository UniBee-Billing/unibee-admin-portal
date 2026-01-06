import { ReactNode } from 'react'

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string | number
  iconBgColor?: string
}

export const StatsCard = ({ icon, label, value, iconBgColor }: StatsCardProps) => {
  return (
    <div 
      className="rounded-xl p-4 flex items-center gap-4"
      style={{ 
        backgroundColor: '#fff',
        border: '1px solid #e8e8e8'
      }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: iconBgColor || '#f5f5f5' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  )
}
