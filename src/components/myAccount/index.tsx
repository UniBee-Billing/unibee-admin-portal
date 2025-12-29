import { Button, Divider, message, Alert, Typography, Tooltip, Space, Tag, Modal, Input } from 'antd'
import { Link } from 'react-router-dom'
import MerchantInfo from './merchantInfo'
import MyProfile from './profile'
import { useRef, useState } from 'react'
import { useMerchantMemberProfileStore } from '../../stores'
import { getMemberProfileReq, resetTotpReq } from '../../requests'
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleFilled,
  LaptopOutlined,
  SecurityScanOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import DeviceList from '../merchantUser/DeviceList'
import { IMerchantMemberProfile } from '../../shared.types'

const { Text } = Typography

const Index = () => {
  const merchantInfoRef = useRef<{ submitForm: () => void } | null>(null)
  const profileRef = useRef<{ submitForm: () => void } | null>(null)
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const [deviceListVisible, setDeviceListVisible] = useState(false)
  const [removeTotp2FAModalOpen, setRemoveTotp2FAModalOpen] = useState(false)

  const handleSaveAll = () => {
    merchantInfoRef.current?.submitForm()
    profileRef.current?.submitForm()
  }

  const refreshMemberProfile = async () => {
    const [memberProfileData, err] = await getMemberProfileReq()
    if (!err && memberProfileData?.merchantMember) {
      merchantMemberProfile.setProfile(memberProfileData.merchantMember)
    }
  }

  const toggleDeviceList = () => {
    setDeviceListVisible(!deviceListVisible)
  }

  const toggleRemoveTotp2FAModal = () => {
    setRemoveTotp2FAModalOpen(!removeTotp2FAModalOpen)
  }

  return (
    <>
      <Divider
        orientation="left"
        style={{ color: '#757575', fontSize: '14px' }}
      >
        Company profile
      </Divider>
      <MerchantInfo ref={merchantInfoRef} />
      <Divider
        orientation="left"
        style={{ color: '#757575', fontSize: '14px' }}
      >
        My profile
      </Divider>
      <MyProfile ref={profileRef} />

      <Divider
        orientation="left"
        style={{ color: '#757575', fontSize: '14px' }}
      >
        Two-Factor Authentication (2FA)
        <Tooltip title="Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.">
          <ExclamationCircleOutlined
            style={{ marginLeft: '8px', color: 'rgba(0, 0, 0, 0.45)' }}
          />
        </Tooltip>
      </Divider>

      <div
        style={{
          background: '#fff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #f0f0f0',
          marginBottom: '24px'
        }}
      >
        {merchantMemberProfile.totpType !== 0 ? (
          <Alert
            message={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <Text strong>Status </Text>
                  <Tag color="success" style={{ marginLeft: '8px' }}>
                    Enabled
                  </Tag>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary">
                      Your account is protected with two-factor authentication
                    </Text>
                  </div>
                </div>
                <Space>
                  <Button icon={<LaptopOutlined />} onClick={toggleDeviceList}>
                    View Devices
                  </Button>
                  <Button
                    type="primary"
                    danger
                    icon={<SecurityScanOutlined />}
                    onClick={toggleRemoveTotp2FAModal}
                  >
                    Remove 2FA
                  </Button>
                </Space>
              </div>
            }
            type="success"
            showIcon
            icon={<CheckCircleFilled style={{ color: '#52c41a' }} />}
            style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
          />
        ) : (
          <Alert
            message={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <Text strong>Status </Text>
                  <Tag color="default" style={{ marginLeft: '8px' }}>
                    Disabled
                  </Tag>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary">
                      Enhance your account security by enabling two-factor
                      authentication
                    </Text>
                  </div>
                </div>
                <Link to="/two-factorsetup">
                  <Button type="primary">Set up 2FA</Button>
                </Link>
              </div>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined style={{ color: '#faad14' }} />}
            style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
          />
        )}
      </div>

      <div className="flex justify-center mt-8">
        <Button
          type="primary"
          onClick={handleSaveAll}
          style={{ backgroundColor: '#286ede', color: '#FFFFFF' }}
        >
          Save
        </Button>
      </div>

      <DeviceList
        visible={deviceListVisible}
        onClose={toggleDeviceList}
        userId={merchantMemberProfile.id}
        deviceList={merchantMemberProfile.deviceList || []}
      />

      {removeTotp2FAModalOpen && (
        <RemoveTotp2FAModal
          closeModal={toggleRemoveTotp2FAModal}
          refresh={refreshMemberProfile}
          userData={merchantMemberProfile.getProfile()}
        />
      )}
    </>
  )
}

const RemoveTotp2FAModal = ({
  closeModal,
  refresh,
  userData
}: {
  closeModal: () => void
  refresh: () => void
  userData: IMerchantMemberProfile
}) => {
  const [loading, setLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState([
    '',
    '',
    '',
    '',
    '',
    ''
  ])
  const [error, setError] = useState('')
  const merchantMemberProfileStore = useMerchantMemberProfileStore()

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode]
      newCode[index] = value
      setVerificationCode(newCode)
      setError('')

      if (value && index < 5) {
        const nextInput = document.getElementById(
          `remove-2fa-code-${index + 1}`
        )
        nextInput?.focus()
      }
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`remove-2fa-code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    if (pastedData.length > 0) {
      const newCode = [...verificationCode]
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedData[i] || ''
      }
      setVerificationCode(newCode)
      setError('')
      const focusIndex = Math.min(pastedData.length, 5)
      const targetInput = document.getElementById(
        `remove-2fa-code-${focusIndex}`
      )
      targetInput?.focus()
    }
  }

  const onConfirm = async () => {
    const totpCode = verificationCode.join('')
    if (totpCode.length !== 6) {
      setError('Please enter 6-digit verification code')
      return
    }

    setLoading(true)
    const [, err] = await resetTotpReq(totpCode)
    setLoading(false)

    if (err != null) {
      message.error(err.message)
      setError('Verification code is incorrect or expired')
      return
    }

    message.success('2FA has been removed successfully')

    merchantMemberProfileStore.setProfile({
      ...userData,
      totpType: 0
    })

    closeModal()
    refresh()
  }

  return (
    <Modal
      title="Confirm 2FA Removal"
      open={true}
      onCancel={closeModal}
      width={600}
      footer={[
        <Button key="cancel" onClick={closeModal} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          Confirm Removal
        </Button>
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '16px 0' }}>
        <div style={{ color: '#faad14', marginRight: '16px', fontSize: '20px' }}>
          <SafetyOutlined style={{ fontSize: '24px' }} />
        </div>
        <div>
          <p style={{ marginBottom: '8px', fontSize: '16px' }}>
            Are you sure you want to remove two-factor authentication? This
            action will remove all current security verification methods.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div
          style={{ marginBottom: '8px', fontWeight: 500, textAlign: 'center' }}
        >
          Verification Code
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          {verificationCode.map((digit, index) => (
            <Input
              key={index}
              id={`remove-2fa-code-${index}`}
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) =>
                handleKeyDown(index, e as React.KeyboardEvent<HTMLInputElement>)
              }
              onPaste={handlePaste}
              style={{
                width: '48px',
                height: '48px',
                textAlign: 'center',
                fontSize: '18px'
              }}
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </div>
        {error && (
          <div
            style={{
              color: '#ff4d4f',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '8px'
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{ color: '#8c8c8c', fontSize: '14px', textAlign: 'center' }}
        >
          Please enter the 6-digit code from your authenticator app
        </div>
      </div>
    </Modal>
  )
}

export default Index
