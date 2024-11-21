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
        <div className={`h-[406px] overflow-y-scroll px-1 py-2 ${className}`}>
          {fields.map((field) => (
            <FieldItem
              onDeleteButtonClick={onDeleteButtonClick}
              key={field}
              value={field}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
