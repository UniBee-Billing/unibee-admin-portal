import { DeleteOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from 'antd'
import { safeConvertPascalCaseToSentence } from '../../../utils'

interface FieldItemProps {
  value: string
  onDeleteButtonClick(fieldName: string): void
}

export const FieldItem = ({ value, onDeleteButtonClick }: FieldItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: value })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      {...attributes}
      style={style}
      ref={setNodeRef}
      key={value}
      className="group flex h-8 items-center justify-between rounded px-3 py-1 hover:bg-[#ebebeb]"
    >
      <div className="flex-1" {...listeners}>
        {safeConvertPascalCaseToSentence(value)}
      </div>
      <Button
        onClick={() => onDeleteButtonClick(value)}
        className="hidden group-hover:block"
        icon={<DeleteOutlined />}
        variant="text"
        color="default"
        shape="circle"
      ></Button>
    </div>
  )
}
