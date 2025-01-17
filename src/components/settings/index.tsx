import type { TabsProps } from 'antd'
import { Tabs } from 'antd'
import React, { useState } from 'react'
import 'react-quill/dist/quill.snow.css'
import { useSearchParams } from 'react-router-dom'
import '../../shared.css'
import AppConfig from './appConfig'
import CreditConfig from './creditConfig'
import EmailTemplates from './emailTemplates'
import AppIntegrationServices from './integrations'
import PaymentGatewayConfig from './paymentGateways'
import Permissions from './permissions'
import { SubscriptionConfig } from './subscriptionConfig'
import WebhookList from './webHooks/list'

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? 'appConfig'
  )
  const tabItems: TabsProps['items'] = [
    {
      key: 'paymentGateways',
      label: (
        <span className="text-red-500">Payment Gateways(NOT FINISHED)</span>
      ),
      children: <PaymentGatewayConfig />
    },
    {
      key: 'integrations',
      label: <span className="text-red-500">Integrations(NOT FINISHED)</span>,
      children: <AppIntegrationServices />
    },
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
    },
    {
      key: 'Subscription Config',
      label: 'Subscription Config',
      children: <SubscriptionConfig />
    },
    {
      key: 'creditConfig',
      label: 'Credit System Config',
      children: <CreditConfig />
    }
  ]
  const onTabChange = (key: string) => {
    setActiveTab(key)
    searchParams.set('tab', key)
    setSearchParams(searchParams)
  }

  return (
    <div className="w-full">
      <Tabs activeKey={activeTab} items={tabItems} onChange={onTabChange} />
    </div>
  )
}

export default Index
