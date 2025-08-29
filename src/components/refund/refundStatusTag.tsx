import React from 'react'
import { Tag } from 'antd'

interface RefundStatusTagProps {
  status: string
}

const RefundStatusTag: React.FC<RefundStatusTagProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'success',
          text: 'Completed',
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'partial':
        return {
          color: 'warning',
          text: 'Partial',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'failed':
        return {
          color: 'error',
          text: 'Failed',
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'processing':
        return {
          color: 'processing',
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'cancelled':
        return {
          color: 'default',
          text: 'Cancelled',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
      default:
        return {
          color: 'default',
          text: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Tag
      color={config.color}
      className={`${config.className} font-medium border`}
    >
      {config.text}
    </Tag>
  )
}

export default RefundStatusTag 