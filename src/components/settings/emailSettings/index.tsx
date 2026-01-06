import { Tabs, Typography, Modal } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useState, useCallback, useRef } from 'react'
import GlobalSettings from './GlobalSettings'
import EmailChannels from './EmailChannels'
import EmailRecords from './EmailRecords'
import EmailTemplates from '../emailTemplates'
import './index.css'

const { Title, Text } = Typography

const EmailSettings = () => {
  const [activeTab, setActiveTab] = useState('globalSettings')
  const dirtyStates = useRef<Record<string, boolean>>({})
  
  const handleGlobalSettingsDirtyChange = useCallback((isDirty: boolean) => {
    dirtyStates.current['globalSettings'] = isDirty
  }, [])
  
  const handleEmailChannelsDirtyChange = useCallback((isDirty: boolean) => {
    dirtyStates.current['emailChannels'] = isDirty
  }, [])
  
  const handleTabChange = (key: string) => {
    if (dirtyStates.current[activeTab]) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
        okText: 'Leave',
        cancelText: 'Stay',
        okButtonProps: { className: 'primary-btn' },
        cancelButtonProps: { className: 'secondary-btn-dark' },
        onOk: () => {
          dirtyStates.current[activeTab] = false
          setActiveTab(key)
        }
      })
    } else {
      setActiveTab(key)
    }
  }

  const tabItems = [
    {
      key: 'globalSettings',
      label: 'Global Settings',
      children: <GlobalSettings onDirtyChange={handleGlobalSettingsDirtyChange} />
    },
    {
      key: 'emailChannels',
      label: 'Email Channels',
      children: <EmailChannels onDirtyChange={handleEmailChannelsDirtyChange} />
    },
    {
      key: 'emailRecords',
      label: 'Email Records',
      children: <EmailRecords />
    },
    {
      key: 'templateSetup',
      label: 'Template Setup',
      children: <EmailTemplates />
    }
  ]

  return (
    <div className="email-settings-container">
      <div className="email-settings-header">
        <Title level={4} style={{ margin: 0 }}>Email Settings</Title>
        <Text type="secondary">Configure email channels, templates, and delivery settings</Text>
      </div>

      <div className="email-settings-guide">
        <InfoCircleOutlined style={{ marginRight: 8 }} />
        <Text strong>Setup Guide</Text>
        <Text type="secondary" style={{ marginLeft: 16 }}>
          1. Configure Global Settings &nbsp; 2. Set up Email Channels &nbsp; 3. Activate Channel &nbsp; 4. Test Connection &nbsp; 5. Monitor Email Records
        </Text>
      </div>

      <div className="email-settings-content">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="email-settings-tabs"
        />
      </div>
    </div>
  )
}

export default EmailSettings
