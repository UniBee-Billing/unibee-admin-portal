import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { Empty } from 'antd'
import { WithStyle } from '../../../shared.types'
import { FieldItem } from './fieldItem'

interface FieldsPreviewProps {
  fields: string[]
  onFieldsChange: (fields: string[]) => void
  onDeleteButtonClick: (field: string) => void
}

export const FieldsPreview = ({
  fields,
  className,
  onFieldsChange,
  onDeleteButtonClick
}: WithStyle<FieldsPreviewProps>) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over!.id) {
      const oldIndex = fields.indexOf(active.id.toString())
      const newIndex = fields.indexOf(over!.id.toString())
      const movedItems = arrayMove(fields, oldIndex, newIndex)

      onFieldsChange(movedItems)
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={fields} strategy={verticalListSortingStrategy}>
        <div className={`${className}`}>
          {fields.length > 0 ? (
            fields.map((field) => (
              <FieldItem
                onDeleteButtonClick={onDeleteButtonClick}
                key={field}
                value={field}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <Empty 
                description="No fields selected" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
