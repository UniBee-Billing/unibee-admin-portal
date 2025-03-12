import { getUserProfile } from '@/requests'
import { IProfile } from '@/shared.types'
import { Divider, Empty, Tabs, TabsProps, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import UserInfo from '../shared/userInfo'
import InvoiceTab from '../subscription/invoicesTab'
import TransactionTab from '../subscription/paymentTab'
import UserAccountTab from '../subscription/userAccountTab'
import ProductList from './productList'
import PromoCredit from './promoCreditTab'
import UserNote from './userNote'

const TAB_KEYS = [
  'account',
  'subscription',
  'promoCredits',
  'invoice',
  'transaction'
]

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [refreshSub, setRefreshSub] = useState(false) // when user account is suspended, all its subscription will also get cancelled, but the sub tab need to be auto refreshed to reflect this.
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? 'account'
  )
  const params = useParams()
  const userId = Number(params.userId)
  if (isNaN(userId)) {
    return (
      <Empty
        description="User not found"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }
  const [userProfile, setUserProfile] = useState<IProfile | undefined>(
    undefined
  )
  const [userNotePushed, setUserNotePushed] = useState(true)
  const togglePush = () => setUserNotePushed(!userNotePushed)

  const fetchUserProfile = async () => {
    const [user, err] = await getUserProfile(userId as number, fetchUserProfile)
    if (err != null) {
      message.error(err.message)
      return
    }
    setUserProfile(user)
  }

  const onTabChange = (key: string) => {
    setActiveTab(key)
    searchParams.set('tab', key)
    setSearchParams(searchParams)
  }

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const tabItems: TabsProps['items'] = [
    {
      key: TAB_KEYS[0],
      label: 'Account Info',
      children: (
        <UserAccountTab
          user={userProfile}
          setUserProfile={setUserProfile}
          setRefreshSub={setRefreshSub}
          refresh={fetchUserProfile}
        />
      )
    },
    {
      key: TAB_KEYS[1],
      label: 'Subscription',
      children: (
        <ProductList // deep inside this component there is a <Subscription />, which will receive refreshSub props, when it's true in its useEffect cb, it'll re-fetch sub detail info
          userId={userId} // setRefreshSub fn is triggered by the above <UserAccountTab /> which will pass this fn to <SuspendModal />
          userProfile={userProfile}
          refreshSub={refreshSub}
          refreshUserProfile={fetchUserProfile}
        />
      )
    },
    {
      key: TAB_KEYS[2],
      label: 'Promo Credits',
      children: (
        <PromoCredit userDetail={userProfile} refreshUser={fetchUserProfile} />
      )
    },
    {
      key: TAB_KEYS[3],
      label: 'Invoices',
      children: (
        <InvoiceTab
          user={userProfile}
          embeddingMode={true}
          embeddedIn="userInvoicePage"
          enableSearch={false}
        />
      )
    },
    {
      key: TAB_KEYS[4],
      label: 'Transactions',
      children: <TransactionTab user={userProfile} embeddingMode={true} />
    }
  ]

  return (
    <div
      className="flex"
      style={{
        position: 'relative',
        height: 'calc(100vh - 208px)',
        overflowX: 'hidden'
      }}
    >
      <div
        style={{
          marginTop: '24px',
          overflowY: 'auto',
          width: userNotePushed ? '100%' : '69%',
          transition: 'width 0.2s ease-in-out',
          paddingRight: '18px'
        }}
      >
        <Divider orientation="left" style={{ margin: '16px 0' }}>
          Brief Info
        </Divider>
        <UserInfo user={userProfile} />
        <Tabs activeKey={activeTab} items={tabItems} onChange={onTabChange} />
      </div>

      <UserNote pushed={userNotePushed} togglePush={togglePush} />
    </div>
  )
}

export default Index
