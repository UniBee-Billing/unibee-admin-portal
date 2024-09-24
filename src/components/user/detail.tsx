import { Button, Divider, Empty, Tabs, TabsProps, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { IProfile } from '../../@types/shared.types'
import { getUserProfile } from '../../requests'
import UserInfo from '../shared/userInfo'
import InvoiceTab from '../subscription/invoicesTab'
import TransactionTab from '../subscription/paymentTab'
import UserAccountTab from '../subscription/userAccountTab'
import ProductList from './productList'

const APP_PATH = import.meta.env.BASE_URL

const GoBackBtn = () => {
  const navigate = useNavigate()
  const goBack = () => navigate(`${APP_PATH}user/list`)
  return <Button onClick={goBack}>Go back</Button>
}

const TAB_KEYS = ['account', 'subscription', 'invoice', 'transaction']

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
    setSearchParams({ tab: key })
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

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
          extraButton={<GoBackBtn />}
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
        />
      )
    },
    {
      key: TAB_KEYS[2],
      label: 'Invoices',
      children: (
        <InvoiceTab
          user={userProfile}
          embeddingMode={true}
          extraButton={<GoBackBtn />}
          enableSearch={false}
        />
      )
    },
    {
      key: TAB_KEYS[3],
      label: 'Transactions',
      children: (
        <TransactionTab
          user={userProfile}
          extraButton={<GoBackBtn />}
          embeddingMode={true}
        />
      )
    }
  ]

  return (
    <div>
      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Brief Info
      </Divider>
      <UserInfo user={userProfile} />
      <Tabs activeKey={activeTab} items={tabItems} onChange={onTabChange} />
    </div>
  )
}

export default Index
