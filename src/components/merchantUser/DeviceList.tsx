import { useState, useEffect } from 'react'
import { Button, Modal, Table, Tag, message } from 'antd'
import {
  CloseCircleOutlined,
  DeleteOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { formatDate } from '../../helpers'
import type { ColumnsType } from 'antd/es/table'
import { deleteTotpDeviceReq } from '../../requests'
import { DeviceData } from '../../shared.types'

interface DeviceListProps {
  visible: boolean
  userId: string | number
  onClose: () => void
  deviceList?: DeviceData[]
}

const DeviceList = ({
  visible,
  userId,
  onClose,
  deviceList = []
}: DeviceListProps) => {
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<DeviceData[]>([])
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null)

  useEffect(() => {
    if (deviceList && deviceList.length > 0) {
      setDevices(deviceList)
    }
  }, [deviceList])

  const handleClearDevice = (device: DeviceData) => {
    setSelectedDevice(device)
    setConfirmModalVisible(true)
  }

  const handleClearAllDevices = () => {
    setSelectedDevice(null)
    setConfirmModalVisible(true)
  }

  const confirmClearDevice = async () => {
    setLoading(true)
    try {
      if (selectedDevice) {
        const [, err] = await deleteTotpDeviceReq(
          Number(userId),
          selectedDevice.identity
        )

        if (err) {
          message.error(err.message || 'Failed to clear device')
          setLoading(false)
          return
        }

        setDevices(devices.filter((d) => d.identity !== selectedDevice.identity))
        message.success(`Device ${selectedDevice.name} has been cleared`)
      } else {
        const results = await Promise.all(
          devices.map((device) =>
            deleteTotpDeviceReq(Number(userId), device.identity)
          )
        )

        const failedRequests = results.filter(([, err]) => err != null)
        if (failedRequests.length > 0) {
          message.error(`Failed to clear ${failedRequests.length} devices`)
        } else {
          setDevices([])
          message.success('All devices have been cleared')
        }
      }
    } catch {
      message.error('Failed to clear device(s)')
    } finally {
      setLoading(false)
      setConfirmModalVisible(false)
    }
  }

  const columns: ColumnsType<DeviceData> = [
    {
      title: 'Device Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {record.currentDevice && (
            <div style={{ marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(22, 119, 255, 0.1)',
                  color: '#1677ff'
                }}
              >
                Current Device
              </span>
            </div>
          )}
          <span>{name}</span>
        </div>
      )
    },
    {
      title: 'Login Time',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      render: (time) => formatDate(time)
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActiveTime',
      key: 'lastActiveTime',
      render: (time) => formatDate(time)
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status ? 'green' : 'default'}>
          {status ? 'Active' : 'Offline'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          danger
          icon={<CloseCircleOutlined style={{ fontSize: '16px' }} />}
          onClick={() => handleClearDevice(record)}
          type="link"
        >
          Clear Login
        </Button>
      )
    }
  ]

  return (
    <>
      <Modal
        title="Device List"
        open={visible}
        onCancel={onClose}
        footer={
          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
          >
            <Button
              key="clearAll"
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearAllDevices}
              disabled={devices.length === 0}
            >
              Clear All Devices
            </Button>
            <Button key="close" onClick={onClose}>
              Close
            </Button>
          </div>
        }
        width={900}
      >
        <Table
          columns={columns}
          dataSource={devices}
          rowKey="identity"
          loading={loading}
          pagination={false}
        />
      </Modal>

      <Modal
        title="Confirmation"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={confirmClearDevice}
        okText="Yes, Clear"
        okButtonProps={{ danger: true, loading }}
        cancelButtonProps={{ disabled: loading }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <QuestionCircleOutlined
            style={{ color: '#faad14', fontSize: '22px', marginRight: '12px' }}
          />
          <div>
            {selectedDevice ? (
              <p>
                Are you sure you want to clear the device "
                {selectedDevice.name}"? This user will need to re-authenticate
                on this device.
              </p>
            ) : (
              <p>
                Are you sure you want to clear all devices? This user will need
                to re-authenticate on all devices.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

export default DeviceList
