import type { TabsProps } from 'antd'
import { Tabs } from 'antd'
import React, { useState } from 'react'
import 'react-quill/dist/quill.snow.css'
import { useSearchParams } from 'react-router-dom'
import '../../shared.css'
import AppConfig from './appConfig'
import EmailTemplates from './emailTemplates'
import Permissions from './permissions'
import WebhookList from './webHooks/list'

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? 'appConfig'
  )
  const tabItems: TabsProps['items'] = [
    {
      key: 'appConfig',
      label: 'App Config',
      children: <AppConfig />
    },
    {
      key: 'emailTemplate',
      label: 'Email Templates',
      children: <EmailTemplates />
    },
    /* {
      key: 'invoiceTemplate',
      label: 'Invoice Templates',
      children: 'invoice template'
    }, */
    {
      key: 'permission',
      label: 'Admin Permission',
      children: <Permissions />
    },
    {
      key: 'webhook',
      label: 'Webhook',
      children: <WebhookList />
    }
  ]
  const onTabChange = (key: string) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
  }

  return (
    <div style={{ width: '100%' }}>
      <Tabs activeKey={activeTab} items={tabItems} onChange={onTabChange} />
    </div>
  )
}

export default Index
