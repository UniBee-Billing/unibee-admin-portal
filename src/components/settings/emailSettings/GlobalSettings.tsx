import { Button, Input, Typography, message } from 'antd'
import { useState, useEffect, useRef } from 'react'
import { getMerchantEmailConfigReq, saveEmailSenderSetupReq } from '@/requests/emailService'
import { uiConfigStore } from '@/stores'

const { Text } = Typography

interface GlobalSettingsProps {
  onDirtyChange?: (isDirty: boolean) => void
}

const GlobalSettings = ({ onDirtyChange }: GlobalSettingsProps) => {
  const { sidebarCollapsed } = uiConfigStore()
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const initialValues = useRef({ fromName: '', fromEmail: '' })

  useEffect(() => {
    fetchEmailSenderConfig()
  }, [])
  
  useEffect(() => {
    const isDirty = fromName !== initialValues.current.fromName || 
                    fromEmail !== initialValues.current.fromEmail
    onDirtyChange?.(isDirty)
  }, [fromName, fromEmail, onDirtyChange])

  const fetchEmailSenderConfig = async () => {
    setLoading(true)
    try {
      const [data, error] = await getMerchantEmailConfigReq()
      if (error) {
        return
      }
      if (data?.emailSender) {
        const name = data.emailSender.name || ''
        const email = data.emailSender.address || ''
        setFromName(name)
        setFromEmail(email)
        initialValues.current = { fromName: name, fromEmail: email }
      }
    } finally {
      setLoading(false)
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSave = async () => {
    if (!fromName.trim()) {
      message.error('Please enter the sender name')
      return
    }
    if (!fromEmail.trim()) {
      message.error('Please enter the sender email')
      return
    }
    if (!isValidEmail(fromEmail.trim())) {
      message.error('Please enter a valid email address')
      return
    }

    setSaving(true)
    try {
      const [, error] = await saveEmailSenderSetupReq({
        name: fromName,
        address: fromEmail
      })
      if (error) {
        message.error(`Failed to save: ${error.message}`)
        return
      }
      message.success('Global settings saved successfully')
      initialValues.current = { fromName, fromEmail }
      onDirtyChange?.(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="global-settings-container">
      <div className="settings-section">
        <div className="section-header">
          <Text strong className="section-title">Sender Information</Text>
          <Text type="secondary" className="section-description">
            Configure default parameters for all outgoing emails
          </Text>
        </div>

        <div className="form-row">
          <div className="form-field">
            <Text className="field-label">Default From Name</Text>
            <Input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="UniBee"
              disabled={loading}
            />
            <Text type="secondary" className="field-hint">
              The name that appears in the "From" field
            </Text>
          </div>

          <div className="form-field">
            <Text className="field-label">Default From Email</Text>
            <Input
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@unibee.com"
              disabled={loading}
            />
            <Text type="secondary" className="field-hint">
              The email address used as the sender
            </Text>
          </div>
        </div>
      </div>

      <div 
        className="settings-footer"
        style={{
          position: 'fixed',
          bottom: 0,
          left: sidebarCollapsed ? '80px' : '230px',
          right: 0,
          backgroundColor: '#FFFFFF',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          borderTop: '1px solid #e8e8e8',
          zIndex: 100,
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'left 0.2s'
        }}
      >
        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          className="primary-btn"
        >
          Save Global Settings
        </Button>
      </div>
    </div>
  )
}

export default GlobalSettings
