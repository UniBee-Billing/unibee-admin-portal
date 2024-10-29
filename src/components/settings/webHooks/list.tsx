import {
  EditOutlined,
  LoadingOutlined,
  PlusOutlined,
  ProfileOutlined
} from '@ant-design/icons'
import { Button, Popover, Space, Table, Tag, Tooltip, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../../helpers'
import { getWebhookListReq } from '../../../requests'
import { TWebhook } from '../../../shared.types'
// import '../../shared.css'
import WebhookDetail from './detail'

const Index = () => {
  const navigate = useNavigate()
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false)
  const [webhookList, setWebhookList] = useState<TWebhook[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const toggleDetailModal = () => setDetailModalOpen(!detailModalOpen)
  const [currentWebhookIdx, setCurrentWebhookIdx] = useState(-1)

  const onNewWebhook = () => {
    setCurrentWebhookIdx(-1)
    toggleDetailModal()
  }

  const columns: ColumnsType<TWebhook> = [
    {
      title: 'Endpoint Id',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Merchant Id',
      dataIndex: 'merchantId',
      key: 'merchantId'
    },
    {
      title: 'Url',
      dataIndex: 'webhookUrl',
      key: 'webhookUrl'
    },
    {
      title: 'Events',
      dataIndex: 'webhookEvents',
      key: 'webhookEvents',
      render: (evt) => (
        <Popover
          placement="top"
          content={
            <Space size={[0, 8]} wrap style={{ width: '380px' }}>
              {evt.map((e: string) => (
                <Tag key={e}>{e}</Tag>
              ))}
            </Space>
          }
        >
          <div
            style={{
              width: '18px',
              height: '24px',
              cursor: 'pointer',
              color: '#1677ff'
            }}
          >
            {evt.length}
          </div>
        </Popover>
      )
    },
    {
      title: 'Modified at',
      dataIndex: 'gmtModify',
      key: 'gmtModify',
      render: (d) => formatDate(d)
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => formatDate(d) // dayjs(new Date(d * 1000)).format('YYYY-MMM-DD')
    },
    {
      title: (
        <>
          <span>Action</span>
          <Tooltip title="New">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={onNewWebhook}
              icon={<PlusOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      key: 'action',
      render: (_) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              className="btn-edit-webhook"
              style={{ border: 'unset' }}
              icon={<EditOutlined />}
            />
          </Tooltip>
          <Tooltip title="View logs">
            <Button
              className="btn-view-webhook-logs"
              style={{ border: 'unset' }}
              icon={<ProfileOutlined />}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const fetchData = async () => {
    setLoading(true)
    const [endpointList, err] = await getWebhookListReq(fetchData)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    setWebhookList(endpointList)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      {detailModalOpen && (
        <WebhookDetail
          detail={
            currentWebhookIdx == -1 ? null : webhookList[currentWebhookIdx]
          }
          closeModal={toggleDetailModal}
          refresh={fetchData}
        />
      )}
      <Table
        columns={columns}
        dataSource={webhookList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={(_, rowIndex) => {
          return {
            onClick: (evt) => {
              setCurrentWebhookIdx(rowIndex as number)
              if (
                evt.target instanceof Element &&
                evt.target.closest('.btn-edit-webhook') != null
              ) {
                toggleDetailModal()
              } else {
                // toggleLogModal()
                navigate(
                  `/configuration/webhook-logs/${webhookList[rowIndex as number].id}`
                )
              }
            }
          }
        }}
      />
    </div>
  )
}

export default Index
