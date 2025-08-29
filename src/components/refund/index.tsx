import React, { useState } from 'react'
import { Tabs } from 'antd'
import RefundList from './refundList'
import BulkSearch from './bulkSearch'

const { TabPane } = Tabs

const RefundModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('refund-list')

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        className="bg-white rounded-lg shadow-sm"
        tabBarStyle={{ margin: 0, padding: '0 24px' }}
      >
        <TabPane 
          tab="Refund List" 
          key="refund-list"
          className="p-6"
        >
          <RefundList />
        </TabPane>
        <TabPane 
          tab="Bulk Search" 
          key="bulk-search"
          className="p-6"
        >
          <BulkSearch />
        </TabPane>
      </Tabs>
    </div>
  )
}

export default RefundModule 