import { Button, Input, Select, Checkbox, Tag, Typography, message, Modal } from 'antd'
import { MailOutlined, ApiOutlined, InfoCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import { 
  getMerchantEmailConfigReq, 
  saveEmailGatewaySetupReq, 
  sendTestEmailToUserReq,
  setDefaultEmailGatewayReq,
  TSMTPApiCredential,
  TSendGridApiCredential
} from '@/requests/emailService'
import { uiConfigStore } from '@/stores'

const { Text } = Typography

type ChannelType = 'sendgrid' | 'smtp'
type AuthType = 'plain' | 'cram-md5' | 'xoauth2' | 'none'

interface EmailChannelsProps {
  onDirtyChange?: (isDirty: boolean) => void
}

const EmailChannels = ({ onDirtyChange }: EmailChannelsProps) => {
  const { sidebarCollapsed } = uiConfigStore()
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [channelStatus, setChannelStatus] = useState<'Verified' | 'Not Verified'>('Not Verified')
  
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('sendgrid')
  
  // SendGrid config
  const [sendGridApiKey, setSendGridApiKey] = useState('')
  
  // SMTP config
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [useTls, setUseTls] = useState(true)
  const [skipTlsVerify, setSkipTlsVerify] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [authType, setAuthType] = useState<AuthType>('plain')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [oauth2Token, setOauth2Token] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [activating, setActivating] = useState(false)
  const [sendgridConfigSaved, setSendgridConfigSaved] = useState(false)
  const [smtpConfigSaved, setSmtpConfigSaved] = useState(false)
  
  const initialValues = useRef({
    sendGridApiKey: '',
    smtpHost: '',
    smtpPort: '587',
    useTls: true,
    skipTlsVerify: false,
    authType: 'plain' as AuthType,
    username: '',
    password: '',
    oauth2Token: ''
  })

  useEffect(() => {
    fetchGatewaySetup()
  }, [])
  
  useEffect(() => {
    const isDirty = 
      sendGridApiKey !== initialValues.current.sendGridApiKey ||
      smtpHost !== initialValues.current.smtpHost ||
      smtpPort !== initialValues.current.smtpPort ||
      useTls !== initialValues.current.useTls ||
      skipTlsVerify !== initialValues.current.skipTlsVerify ||
      authType !== initialValues.current.authType ||
      username !== initialValues.current.username ||
      password !== initialValues.current.password ||
      oauth2Token !== initialValues.current.oauth2Token
    onDirtyChange?.(isDirty)
  }, [sendGridApiKey, smtpHost, smtpPort, useTls, skipTlsVerify, authType, username, password, oauth2Token, onDirtyChange])

  const fetchGatewaySetup = async () => {
    setLoading(true)
    try {
      const [data, error] = await getMerchantEmailConfigReq()
      if (error) {
        return
      }
      if (data) {
        const defaultGateway = data.defaultEmailGateway
        if (defaultGateway) {
          setActiveChannel(defaultGateway === 'smtp' ? 'SMTP' : 'SendGrid')
          setSelectedChannel(defaultGateway === 'smtp' ? 'smtp' : 'sendgrid')
          setChannelStatus('Verified')
        }
        
        const sendgridConfig = data.emailGateways?.sendgrid
        if (sendgridConfig?.apiKey) {
          setSendGridApiKey(sendgridConfig.apiKey)
          setSendgridConfigSaved(true)
          initialValues.current.sendGridApiKey = sendgridConfig.apiKey
        }
        
        const smtpConfig = data.emailGateways?.smtp
        if (smtpConfig) {
          if (smtpConfig.smtpHost) {
            setSmtpHost(smtpConfig.smtpHost)
            setSmtpConfigSaved(true)
            initialValues.current.smtpHost = smtpConfig.smtpHost
          }
          if (smtpConfig.smtpPort) {
            const port = String(smtpConfig.smtpPort)
            setSmtpPort(port)
            initialValues.current.smtpPort = port
          }
          if (smtpConfig.useTLS !== undefined) {
            setUseTls(smtpConfig.useTLS)
            initialValues.current.useTls = smtpConfig.useTLS
          }
          if (smtpConfig.skipTLSVerify !== undefined) {
            setSkipTlsVerify(smtpConfig.skipTLSVerify)
            initialValues.current.skipTlsVerify = smtpConfig.skipTLSVerify
          }
          if (smtpConfig.authType) {
            setAuthType(smtpConfig.authType as AuthType)
            initialValues.current.authType = smtpConfig.authType as AuthType
          }
          if (smtpConfig.username) {
            setUsername(smtpConfig.username)
            initialValues.current.username = smtpConfig.username
          }
          if (smtpConfig.password && smtpConfig.password !== '******') {
            setPassword(smtpConfig.password)
            initialValues.current.password = smtpConfig.password
          }
          if (smtpConfig.oauthToken) {
            setOauth2Token(smtpConfig.oauthToken)
            initialValues.current.oauth2Token = smtpConfig.oauthToken
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const isMaskedValue = (value: string) => value.includes('*')

  const handleSave = async () => {
    setSaving(true)
    try {
      if (selectedChannel === 'sendgrid') {
        if (!sendGridApiKey.trim()) {
          message.error('Please enter the SendGrid API Key')
          setSaving(false)
          return
        }
        const apiCredential: TSendGridApiCredential = {}
        if (!isMaskedValue(sendGridApiKey)) {
          apiCredential.apiKey = sendGridApiKey
        }
        const [, error] = await saveEmailGatewaySetupReq({
          gatewayName: 'sendgrid',
          apiCredential,
          isDefault: true
        })
        if (error) {
          message.error(`Failed to save: ${error.message}`)
          return
        }
      } else {
        if (!smtpHost.trim()) {
          message.error('Please enter the SMTP Host')
          setSaving(false)
          return
        }
        
        const apiCredential: TSMTPApiCredential = {
          smtpHost: smtpHost,
          smtpPort: parseInt(smtpPort, 10) || (useTls ? 465 : 587),
          useTLS: useTls,
          skipTLSVerify: skipTlsVerify,
          authType: authType
        }
        
        if (authType === 'plain' || authType === 'cram-md5') {
          if (!username.trim()) {
            message.error('Please enter the username')
            setSaving(false)
            return
          }
          apiCredential.username = username
          if (!isMaskedValue(password)) {
            apiCredential.password = password
          }
        } else if (authType === 'xoauth2') {
          if (!oauth2Token.trim()) {
            message.error('Please enter the OAuth2 Token')
            setSaving(false)
            return
          }
          if (!isMaskedValue(oauth2Token)) {
            apiCredential.oauthToken = oauth2Token
          }
        }

        const [, error] = await saveEmailGatewaySetupReq({
          gatewayName: 'smtp',
          apiCredential,
          isDefault: true
        })
        if (error) {
          message.error(`Failed to save: ${error.message}`)
          return
        }
      }

      message.success('Configuration saved and validated successfully')
      if (selectedChannel === 'sendgrid') {
        setSendgridConfigSaved(true)
        initialValues.current.sendGridApiKey = sendGridApiKey
      } else {
        setSmtpConfigSaved(true)
        initialValues.current = {
          ...initialValues.current,
          smtpHost,
          smtpPort,
          useTls,
          skipTlsVerify,
          authType,
          username,
          password,
          oauth2Token
        }
      }
      onDirtyChange?.(false)
      await fetchGatewaySetup()
    } finally {
      setSaving(false)
    }
  }

  const [testEmail, setTestEmail] = useState('')
  const [showTestEmailModal, setShowTestEmailModal] = useState(false)

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleTestConnection = async () => {
    if (!testEmail.trim()) {
      message.error('Please enter an email address')
      return
    }
    
    if (!isValidEmail(testEmail.trim())) {
      message.error('Please enter a valid email address')
      return
    }
    
    setTesting(true)
    try {
      const [, error] = await sendTestEmailToUserReq({
        email: testEmail,
        subject: 'UniBee Email Gateway Test',
        content: '<h2>Test Email</h2><p>This is a test email to verify your email gateway configuration.</p><p>If you received this email, your configuration is working correctly.</p>',
        gatewayName: selectedChannel
      })
      if (error) {
        message.error(`Connection test failed: ${error.message}`)
        setChannelStatus('Not Verified')
        return
      }
      message.success(`Test email sent successfully to ${testEmail}`)
      setChannelStatus('Verified')
      setShowTestEmailModal(false)
    } finally {
      setTesting(false)
    }
  }

  const handleActivate = async () => {
    setActivating(true)
    try {
      const [, error] = await setDefaultEmailGatewayReq({
        gatewayName: selectedChannel
      })
      if (error) {
        message.error(`Failed to activate: ${error.message}`)
        return
      }
      message.success('Channel activated successfully')
      setActiveChannel(selectedChannel === 'sendgrid' ? 'SendGrid' : 'SMTP')
      await fetchGatewaySetup()
    } finally {
      setActivating(false)
    }
  }

  const isCurrentChannelActive = () => {
    return (selectedChannel === 'sendgrid' && activeChannel === 'SendGrid') ||
           (selectedChannel === 'smtp' && activeChannel === 'SMTP')
  }

  const renderAuthFields = () => {
    switch (authType) {
      case 'plain':
      case 'cram-md5':
        return (
          <>
            <div className="form-row">
              <div className="form-field">
                <Text className="field-label">Username (required)</Text>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="user@example.com"
                  disabled={loading}
                />
                <Text type="secondary" className="field-hint">
                  SMTP authentication username (required when authType="{authType}")
                </Text>
              </div>
              <div className="form-field">
                <Text className="field-label">Password (required)</Text>
                <Input.Password
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <Text type="secondary" className="field-hint">
                  SMTP authentication password (required when authType="{authType}")
                </Text>
              </div>
            </div>
          </>
        )
      case 'xoauth2':
        return (
          <div className="form-field full-width">
            <Text className="field-label">OAuth2 Token (required)</Text>
            <Input
              value={oauth2Token}
              onChange={(e) => setOauth2Token(e.target.value)}
              placeholder="Enter OAuth2 Token"
              disabled={loading}
            />
            <Text type="secondary" className="field-hint">
              Sender email address used when sending emails, must be a valid email format
            </Text>
          </div>
        )
      case 'none':
        return (
          <div className="no-auth-notice">
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            <div>
              <Text strong>No Authentication Required</Text>
              <br />
              <Text type="secondary">When authType="none", username and password are not required</Text>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="email-channels-container">
      <div className="channel-status-card">
        <Text strong className="status-title">Current Channel Status</Text>
        <div className="status-info">
          <div className="status-item">
            <Text type="secondary">Active Channel:</Text>
            <Text>{activeChannel ?? 'Not Configured'}</Text>
          </div>
          <div className="status-item">
            <Text type="secondary">Status:</Text>
            <Tag color={channelStatus === 'Verified' ? 'success' : 'default'}>
              {channelStatus}
            </Tag>
          </div>
        </div>
      </div>

      <div className="channel-selection">
        <Text strong className="section-title">Select Channel Type</Text>
        <Text type="secondary" className="section-description">
          Please choose a template or create custom configuration
        </Text>
        
        <div className="channel-cards">
          <div 
            className={`channel-card ${selectedChannel === 'sendgrid' ? 'selected' : ''}`}
            onClick={() => setSelectedChannel('sendgrid')}
          >
            <MailOutlined className="channel-icon" />
            <div className="channel-info">
              <Text strong>SendGrid</Text>
              {activeChannel === 'SendGrid' && <Tag color="success" className="active-tag">Active</Tag>}
            </div>
            <Text type="secondary" className="channel-desc">
              Cloud-based email delivery service with high deliverability
            </Text>
          </div>
          
          <div 
            className={`channel-card ${selectedChannel === 'smtp' ? 'selected' : ''}`}
            onClick={() => setSelectedChannel('smtp')}
          >
            <ApiOutlined className="channel-icon" />
            <div className="channel-info">
              <Text strong>SMTP</Text>
              {activeChannel === 'SMTP' && <Tag color="success" className="active-tag">Active</Tag>}
            </div>
            <Text type="secondary" className="channel-desc">
              Custom SMTP server for full control over email delivery
            </Text>
          </div>
        </div>
      </div>

      {selectedChannel === 'sendgrid' && (
        <div className="config-section">
          <div className="form-field full-width">
            <Text className="field-label">API Key (required)</Text>
            <Input.Password
              value={sendGridApiKey}
              onChange={(e) => setSendGridApiKey(e.target.value)}
              placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={loading}
              autoComplete="new-password"
            />
            <Text type="secondary" className="field-hint">
              The name that appears in the "From" field
            </Text>
          </div>
        </div>
      )}

      {selectedChannel === 'smtp' && (
        <div className="config-section">
          <Text strong className="config-title">Connection Settings</Text>
          
          <div className="form-row">
            <div className="form-field">
              <Text className="field-label">SMTP Host (required)</Text>
              <Input
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                disabled={loading}
              />
              <Text type="secondary" className="field-hint">
                Example: smtp.gmail.com
              </Text>
            </div>
            <div className="form-field">
              <Text className="field-label">SMTP Port (required)</Text>
              <Input
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                disabled={loading}
              />
              <Text type="secondary" className="field-hint">
                Recommended 587 with TLS
              </Text>
            </div>
          </div>

          <div className="tls-option">
            <Checkbox
              checked={useTls}
              onChange={(e) => setUseTls(e.target.checked)}
              disabled={loading}
            >
              Use TLS Encryption
            </Checkbox>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              (true: Implicit TLS (SMTPS))
            </Text>
          </div>

          <div 
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <UpOutlined /> : <DownOutlined />}
            <Text type="warning" style={{ marginLeft: 8 }}>
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Text>
          </div>

          {showAdvanced && (
            <div className="advanced-section">
              <div className="skip-tls-option">
                <Checkbox
                  checked={skipTlsVerify}
                  onChange={(e) => setSkipTlsVerify(e.target.checked)}
                  disabled={loading}
                >
                  Skip TLS Certificate Verification
                </Checkbox>
                <Text type="secondary" style={{ display: 'block', marginLeft: 24 }}>
                  false: Verify certificate (only for self-signed certificates or test environments)
                </Text>
                <div className="warning-notice">
                  <InfoCircleOutlined style={{ color: '#FFD700', marginRight: 8 }} />
                  <Text type="warning">Not recommended for production environments</Text>
                </div>
              </div>
            </div>
          )}

          <Text strong className="config-title" style={{ marginTop: 24 }}>Authentication Settings</Text>
          
          <div className="form-field full-width">
            <Text className="field-label">Authentication Type (required)</Text>
            <Select
              value={authType}
              onChange={(value) => setAuthType(value)}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <Select.Option value="plain">PLAIN (Plain text authentication)</Select.Option>
              <Select.Option value="cram-md5">CRAM-MD5 (Encrypted authentication)</Select.Option>
              <Select.Option value="xoauth2">XOAUTH2 (OAuth2 authentication)</Select.Option>
              <Select.Option value="none">NONE (No authentication)</Select.Option>
            </Select>
            <Text type="secondary" className="field-hint">
              Available values: "plain" / "cram-md5" / "xoauth2" / "none"
            </Text>
          </div>

          {renderAuthFields()}
        </div>
      )}

      <div 
        className="channels-footer"
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
        {isCurrentChannelActive() ? (
          <Text type="success" className="current-active-text">Current Active Channel</Text>
        ) : (
          <Button onClick={handleActivate} loading={activating} className="secondary-btn">
            Set as Active Channel
          </Button>
        )}
        <Button 
          onClick={() => setShowTestEmailModal(true)} 
          loading={testing} 
          disabled={selectedChannel === 'sendgrid' ? !sendgridConfigSaved : !smtpConfigSaved} 
          className="secondary-btn"
        >
          Test Connection
        </Button>
        <Button type="primary" onClick={handleSave} loading={saving} className="primary-btn">
          Save Configuration
        </Button>
      </div>

      <Modal
        title="Send Test Email"
        open={showTestEmailModal}
        onCancel={() => setShowTestEmailModal(false)}
        onOk={handleTestConnection}
        okText="Send Test Email"
        confirmLoading={testing}
        okButtonProps={{ className: 'primary-btn' }}
        cancelButtonProps={{ className: 'secondary-btn' }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Enter the email address to receive the test email:</Text>
        </div>
        <Input
          placeholder="test@example.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          onPressEnter={handleTestConnection}
        />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
            A test email will be sent to verify your email gateway configuration.
          </Text>
        </div>
      </Modal>
    </div>
  )
}

export default EmailChannels
