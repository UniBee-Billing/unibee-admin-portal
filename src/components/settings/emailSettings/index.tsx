import { Tabs, Typography } from 'antd'
import { useState } from 'react'
import EmailRecords from './EmailRecords'
import EmailTemplates from '../emailTemplates'
import './index.css'

const { Title, Text } = Typography

const EmailSettings = () => {
  const [activeTab, setActiveTab] = useState('emailRecords')

  const tabItems = [
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

      <div className="email-settings-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="email-settings-tabs"
        />
      </div>
    </div>
  )
}

export default EmailSettings

