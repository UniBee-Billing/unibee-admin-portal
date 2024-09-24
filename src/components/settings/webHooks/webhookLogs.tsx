import {
  CopyOutlined,
  LoadingOutlined,
  SendOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Pagination,
  Popover,
  Space,
  Table,
  Tooltip,
  message
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism'
import { formatDate } from '../../../helpers'
import { useCopyContent, usePagination } from '../../../hooks'
import { getWebhookLogs, resendWebhookEvt } from '../../../requests'
import { TWebhookLogs } from '../../../shared.types'
SyntaxHighlighter.registerLanguage('json', json)

const APP_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10

const Index = () => {
  const navigate = useNavigate()
  const params = useParams()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const endpointId = Number(params.id)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [logs, setLogs] = useState<TWebhookLogs[]>([])
  const copyContent = (text: string) => async () => {
    const err = await useCopyContent(text)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Copied')
  }

  const fetchData = async () => {
    if (isNaN(endpointId)) {
      message.error('Invalid endpoint Id')
      return
    }
    setLoading(true)
    const [res, err] = await getWebhookLogs(
      { endpointId, page, count: PAGE_SIZE },
      fetchData
    )
    setLoading(false)
    const { endpointLogList, total } = res
    if (err != null) {
      message.error(err.message)
      return
    }
    setTotal(total)
    setLogs(endpointLogList ?? [])
  }

  const resend = (logId: number) => async () => {
    setResending(true)
    const [resendRes, err] = await resendWebhookEvt(logId)
    setResending(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success('Event resent')
    // fetchData() // resend won't create a new log record, no need to refresh
  }

  const renderJson = (text: string) => {
    if (null == text || '' == text) {
      return ''
    }
    let parsedJson = ''
    try {
      parsedJson = JSON.stringify(JSON.parse(text), null, 2)
    } catch (err) {
      parsedJson = text
    }

    return (
      <Popover
        placement="right"
        content={
          <div
            style={{
              width: '360px',
              maxHeight: '380px',
              minHeight: '80px',
              overflow: 'auto'
            }}
          >
            <SyntaxHighlighter language="json" style={prism}>
              {parsedJson}
            </SyntaxHighlighter>

            <Button
              type="link"
              size="small"
              onClick={copyContent(parsedJson)}
              icon={<CopyOutlined />}
              style={{
                position: 'absolute',
                right: '22px',
                bottom: '12px',
                opacity: 0.7
              }}
            >
              Copy
            </Button>
          </div>
        }
      >
        <div
          style={{
            width: '80px',
            height: '60px',
            overflow: 'hidden'
          }}
        >
          {text}
        </div>
      </Popover>
    )
  }

  const columns: ColumnsType<TWebhookLogs> = [
    {
      title: 'Id',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Url',
      dataIndex: 'webhookUrl',
      key: 'webhookUrl',
      // width: 100,
      render: (text) => (
        <div
          style={{
            width: '100px',
            height: '60px',
            overflow: 'hidden'
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      )
    },
    {
      title: 'Event',
      dataIndex: 'webhookEvent',
      key: 'webhookEvent',
      // width: 120,
      render: (text) => (
        <div
          style={{
            width: '120px',
            height: '60px',
            overflow: 'hidden'
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      )
    },
    {
      title: 'Request Id',
      dataIndex: 'requestId',
      key: 'requestId',
      // width: 120,
      render: (text) => (
        <div
          style={{
            width: '120px',
            height: '60px',
            overflow: 'hidden'
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      )
    },
    {
      title: 'Request Body',
      dataIndex: 'body',
      key: 'body',
      width: 140,
      render: (text) => renderJson(text)
    },
    {
      title: 'Response',
      dataIndex: 'response',
      key: 'response',
      width: 120,
      render: (text) => renderJson(text)
    },
    {
      title: 'mamo',
      dataIndex: 'mamo',
      key: 'mamo',
      width: 120,
      render: (text) => renderJson(text)
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 120,
      render: (d) =>
        // dayjs(new Date(d * 1000)).format('YYYY-MMM-DD, HH:MM:ss')
        formatDate(d, true)
    },
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      dataIndex: 'action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Resend">
            <Button
              disabled={resending}
              style={{ border: 'unset' }}
              onClick={resend(record.id)}
              icon={<SendOutlined />}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const goBack = () => navigate(`${APP_PATH}configuration?tab=webhook`)

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
      />
      <div className="flex w-full justify-end">
        <div className="mx-0 my-4 flex w-3/6 items-center justify-between">
          <Button onClick={goBack}>Go Back</Button>
          <Pagination
            current={page + 1} // back-end starts with 0, front-end starts with 1
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
    </>
  )
}

export default Index
