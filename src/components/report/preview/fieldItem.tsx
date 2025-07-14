import { CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { safeConvertPascalCaseToSentence } from '../../../utils'

interface FieldItemProps {
  value: string
  onDeleteButtonClick(fieldName: string): void
  isDeletable?: boolean
}

export const FieldItem = ({
  value,
  onDeleteButtonClick,
  isDeletable
}: FieldItemProps) => {
  return (
    <div
      key={value}
      className="group flex items-center rounded-sm bg-gray-100 border border-gray-300 px-2 py-1 text-sm"
    >
      <div className="mr-1">{safeConvertPascalCaseToSentence(value)}</div>
      {isDeletable && (
        <Button
          onClick={() => onDeleteButtonClick(value)}
          className="flex"
          icon={<CloseOutlined style={{ fontSize: '10px' }} />}
          type="text"
          size="small"
          shape="circle"
        />
      )}
    </div>
  )
}
