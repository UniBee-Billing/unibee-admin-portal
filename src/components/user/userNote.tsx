import { DoubleRightOutlined } from '@ant-design/icons'
import { Badge, Button, Divider, message } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'
import { formatDate } from '../../helpers'
import { createUserNoteReq, getUserNoteReq } from '../../requests'
import { TUserNote } from '../../shared.types'

const Index = ({
  pushed,
  togglePush
}: {
  pushed: boolean
  togglePush: () => void
}) => {
  const pathName = window.location.pathname.split('/')
  const userId = Number(pathName.pop())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [noteList, setNoteList] = useState<TUserNote[]>([])
  const [note, setNote] = useState('')

  const createNote = async () => {
    if (isNaN(userId)) {
      return
    }
    if (note.trim() == '') {
      return
    }

    setSubmitting(true)
    const [_, err] = await createUserNoteReq({ userId, note })
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
    if (isNaN(userId)) {
      message.error("User didn't exist")
      return
    }

    setLoading(true)
    const [list, err] = await getUserNoteReq({
      userId,
      page: 0,
      count: 100,
      refreshCb: fetchData
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setNoteList(list ?? [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div
      className="absolute h-full rounded"
      style={{
        width: '30%',
        right: pushed ? '-30%' : 0,
        border: '1px solid #EEE',
        transition: 'right 0.3s ease-in-out'
      }}
    >
      <div
        onClick={togglePush}
        className="absolute flex cursor-pointer items-center justify-center"
        style={{ width: '32px', height: '32px', left: '-36px', top: '-4px' }}
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
        User side note
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
          maxLength={200}
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
            disabled={isNaN(userId) || loading || submitting}
            loading={submitting}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Index

const Note = ({ content }: { content: TUserNote }) => {
  return (
    <div className="my-2">
      <div
        className="mb-1 whitespace-pre-wrap"
        // dangerouslySetInnerHTML={{ __html: linkify(content.note) }}
      >
        {content.note}
      </div>
      <div className="my-2" style={{ fontSize: '11px', color: 'lightgray' }}>
        <span>{`${content.merchantMember.firstName} ${content.merchantMember.lastName}`}</span>
        :&nbsp;&nbsp;
        {formatDate(content.createTime, true)}
      </div>
    </div>
  )
}
