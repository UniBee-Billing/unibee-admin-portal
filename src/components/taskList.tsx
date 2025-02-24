import { downloadStaticFile, formatDate } from '@/helpers'
import { getDownloadListReq } from '@/requests'
import { AppTask, AppTaskStatus } from '@/shared.types'
import {
  DownloadOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Divider,
  Drawer,
  Pagination,
  Popover,
  Row,
  Spin,
  Tooltip,
  message
} from 'antd'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { CSSProperties, useEffect, useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism'
import { useInterval } from 'usehooks-ts'
import { AppTaskStatusTag } from './ui/statusTag'
dayjs.extend(duration)
dayjs.extend(relativeTime)

SyntaxHighlighter.registerLanguage('json', json)

const PAGE_SIZE = 10

const Index = ({ onClose }: { onClose: () => void }) => {
  // cannot use usePagination hook here, if user is on list page which also has pagination,
  // taskList's page will read that list page's page number.
  const [page, setPage] = useState(0)
  const onPageChange = (page: number) => {
    setPage(page - 1)
  }

  const [taskList, setTaskList] = useState<AppTask[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const getList = async () => {
    if (loading) {
      // if loading is true, skip the current run
      return
    }
    setLoading(true)
    const [res, err] = await getDownloadListReq(page, PAGE_SIZE, getList)
    setLoading(false)

    if (null != err) {
      message.error(err.message)
      return
    }
    const { downloads, total } = res
    setTaskList(downloads ?? [])
    setTotal(total)
  }

  useEffect(() => {
    getList()
  }, [page])

  useInterval(getList, 6000)

  return (
    <Drawer
      title="Task list"
      placement="right"
      width={600}
      onClose={onClose}
      open={true}
      extra={
        <Tooltip title="Refresh">
          <span
            className={` ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={getList}
          >
            <SyncOutlined />
          </span>
        </Tooltip>
      }
    >
      <div>
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 24 }} />}
          spinning={loading}
        >
          <div
            style={{
              overflowY: 'auto',
              height: '100%',
              maxHeight: 'calc(100vh - 162px)'
            }}
          >
            {taskList.map((t) => (
              <div key={t.id}>
                <TaskItem key={t.id} t={t} />
                <Divider style={{ margin: '16px 0' }} />
              </div>
            ))}
          </div>
        </Spin>

        <div className="mx-0 my-4 flex items-center justify-end">
          <Pagination
            current={page + 1}
            pageSize={PAGE_SIZE}
            total={total}
            size="small"
            onChange={onPageChange}
            disabled={loading}
            showSizeChanger={false}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>
      </div>
    </Drawer>
  )
}

export default Index

const renderJson = (text: string) => {
  if (null == text || '' == text) {
    return ''
  }
  let parsedJson = ''
  try {
    parsedJson = JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    parsedJson = text
  }
  return (
    <div>
      <Popover
        placement="right"
        content={
          <div>
            <SyntaxHighlighter language="json" style={prism}>
              {parsedJson}
            </SyntaxHighlighter>
          </div>
        }
      >
        <div className="cursor-pointer">
          <InfoCircleOutlined />
        </div>
      </Popover>
    </div>
  )
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '24px',
  color: '#757575'
}

const TaskItem = ({ t }: { t: AppTask }) => {
  const onDownload = (url: string) => () => {
    downloadStaticFile(url, `${t.taskName}_${t.id}.${t.format}`)
  }
  return (
    <div style={{ height: '50px' }}>
      <Row style={rowStyle}>
        <Col span={3}>{t.id}</Col>
        <Col span={3} className="font-bold text-gray-500">
          Task
        </Col>
        <Col span={8}>
          <div className="flex">
            {t.taskName}&nbsp;{t.payload != 'null' && renderJson(t.payload)}
          </div>
        </Col>
        <Col span={6}>
          {AppTaskStatusTag(t.status)}
          {t.status == AppTaskStatus.FAILED && (
            <Popover
              placement="right"
              content={
                <div className="min-w-48 max-w-60">{t.failureReason}</div>
              }
            >
              <InfoCircleOutlined />
            </Popover>
          )}
        </Col>
        <Col span={2}>
          {t.status == AppTaskStatus.SUCCEEDED && (
            <Button
              onClick={onDownload(t.downloadUrl)}
              size="small"
              icon={<DownloadOutlined />}
            />
          )}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={3}></Col>
        <Col span={3} className="font-bold text-gray-500">
          Start
        </Col>
        <Col span={8}>{formatDate(t.startTime, true)}</Col>
        <Col span={2} className="font-bold text-gray-500">
          End
        </Col>
        <Col span={6}>
          {t.finishTime == 0 ? '―' : formatDate(t.finishTime, true)}
        </Col>
      </Row>
    </div>
  )
}
