import { formatDate } from '@/helpers'
import { createAdminNoteReq, getAdminNoteReq } from '@/requests'
import { TAdminNote } from '@/shared.types'
import { DoubleRightOutlined } from '@ant-design/icons'
import { Badge, Button, Divider, message } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'
import './adminNote.css'

const Index = ({
  pushed,
  togglePush
}: {
  pushed: boolean
  togglePush: () => void
}) => {
  const pathName = window.location.pathname.split('/')
  const subscriptionId = pathName.pop()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [noteList, setNoteList] = useState<TAdminNote[]>([])
  const [note, setNote] = useState('')

  const createNote = async () => {
    if (subscriptionId == null) {
      return
    }
    if (note.trim() == '') {
      return
    }

    setSubmitting(true)
    const [_, err] = await createAdminNoteReq({ subscriptionId, note })
    setSubmitting(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setNote('')
    fetchData()
  }

  const onNoteChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) =>
    setNote(evt.target.value)

  const fetchData = async () => {
    if (subscriptionId == null) {
      message.error("Subscription didn't exist")
      return
    }

    setLoading(true)
    const [list, err] = await getAdminNoteReq({
      subscriptionId,
      page: 0,
      count: 500,
      refreshCb: fetchData
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    if (null == list) {
      return
    }
    setNoteList(list)
  }
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div
      className="absolute h-full rounded"
      style={{
        width: '30%',
        height: 'calc(100vh - 210px)',
        right: pushed ? '-30%' : 0,
        border: '1px solid #EEE',
        transition: 'right 0.3s ease-in-out'
      }}
    >
      <div
        onClick={togglePush}
        className="absolute flex cursor-pointer items-center justify-center"
        style={{ width: '32px', height: '32px', left: '-24px', top: '-4px' }}
      >
        {noteList.length === 0 ? (
          <DoubleRightOutlined rotate={pushed ? 180 : 0} />
        ) : (
          <Badge count={noteList.length} offset={[-30, 7]} size="small">
            <DoubleRightOutlined rotate={pushed ? 180 : 0} />
          </Badge>
        )}
      </div>
      <div className="flex h-8 items-center justify-center bg-gray-200 text-gray-500">
        Admin side note
      </div>
      <div
        className="mb-4 flex flex-col px-2 text-gray-500"
        style={{
          height: 'calc(100% - 200px)',
          overflowY: 'auto',
          borderBottom: '1px solid lightgray'
        }}
      >
        {noteList.map((n, idx) => (
          <div key={n.id}>
            <Note content={n} />
            {idx < noteList.length - 1 && (
              <Divider style={{ margin: '12px 0' }} />
            )}
          </div>
        ))}
      </div>

      <div
        className="absolute bottom-0 flex w-full flex-col items-center justify-center"
        style={{
          height: '150px'
        }}
      >
        <TextArea
          rows={4}
          maxLength={500}
          showCount
          value={note}
          onChange={onNoteChange}
          style={{ width: '95%' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '48px'
          }}
        >
          <Button
            onClick={createNote}
            disabled={
              loading ||
              submitting ||
              subscriptionId == null ||
              subscriptionId == ''
            }
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Index

const Note = ({ content }: { content: TAdminNote }) => {
  return (
    <div className="my-2">
      <div className="mb-1 whitespace-pre-wrap">{content.note}</div>
      <div className="my-2" style={{ fontSize: '11px', color: 'lightgray' }}>
        <span>{content.firstName}</span>:&nbsp;&nbsp;
        {formatDate(content.createTime, true)}
      </div>
    </div>
  )
}
