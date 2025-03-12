import { getUserProfile } from '@/requests'
import { IProfile } from '@/shared.types'
import type { TabsProps } from 'antd'
import { Button, Divider, Tabs, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import UserInfoSection from '../shared/userInfo'
import AdminNote from './adminNote'
import InvoiceTab from './invoicesTab'
import PaymentTab from './paymentTab'
import SubscriptionTab from './subscription'
// import SubscriptionList from './subscriptionList'
import UserAccount from './userAccountTab'

const Index = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [userProfile, setUserProfile] = useState<IProfile | undefined>(
    undefined
  )
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? 'subscription'
  )
  const [userId, setUserId] = useState<number | null>(null) // subscription obj has user account data, and admin can update it in AccountTab.
  // and the user data on subscription obj might be obsolete,
  // so I use userId from subscription Obj, use this userId to run getUserProfile(userId), even after admin update the user info in AccountTab, re-call getUserProfile

  // when user account is suspended, subscription tab need to be refreshed
  // current component is their parent, so after fetchUserProfile finish running, it setRefreshSub(true)
  // <SubscriptionTab /> will get {refreshSub: true}, in its useEffect, do the refresh.
  const [refreshSub, setRefreshSub] = useState(false)
  const [adminNotePushed, setAdminNotePushed] = useState(true)

  const fetchUserProfile = async () => {
    const [user, err] = await getUserProfile(userId as number, fetchUserProfile)
    if (err != null) {
      message.error(err.message)
      return
    }
    setUserProfile(user)
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'subscription',
      label: 'Subscription',
      forceRender: true, // user might click link to go directly to <InvoiceTab />, which need to have userId ready to getInvoiceList.
      // but userId is fetched inside subscription tab. If subscription tab is not active, userid is null.
      // forceRender can fix this.
      children: (
        <SubscriptionTab
          userProfile={userProfile}
          setUserId={setUserId}
          setRefreshSub={setRefreshSub}
          refreshSub={refreshSub} // in its useEffect, if (refreshSub == true), do the refresh by fetching the subDetail, then setRefreshSub(false)
        />
      )
    },
    {
      key: 'account',
      label: 'Account',
      children: (
        <UserAccount
          user={userProfile}
          setUserProfile={setUserProfile}
          refresh={fetchUserProfile} // this is to refresh the user profile page
          setRefreshSub={setRefreshSub} // after admin suspended a user, subscription tab also need to refresh, just call setRefreshSub(true)
        />
      )
    },
    {
      key: 'invoices',
      label: 'Invoices',
      children: (
        <InvoiceTab
          user={userProfile}
          embeddingMode={true}
          embeddedIn="subscriptionDetailPage"
          enableSearch={false}
        />
      )
    },
    {
      key: 'payment',
      label: 'Transactions',
      children: <PaymentTab user={userProfile} embeddingMode={true} />
    }
  ]

  const onTabChange = (key: string) => {
    setActiveTab(key)
    searchParams.set('tab', key)
    setSearchParams(searchParams)
  }

  useEffect(() => {
    if (userId == null) {
      return
    }
    fetchUserProfile()
  }, [userId])

  const togglePush = () => setAdminNotePushed(!adminNotePushed)

  return (
    <div
      className="flex"
      style={{
        position: 'relative',
        overflowX: 'hidden',
        height: 'calc(100vh - 210px)'
      }}
    >
      <div
        style={{
          marginTop: '24px',
          overflowY: 'auto',
          paddingRight: '18px',
          width: adminNotePushed ? '100%' : '69%',
          transition: 'width 0.2s ease-in-out'
        }}
      >
        <Divider orientation="left" style={{ margin: '16px 0' }}>
          User Info
        </Divider>
        <UserInfoSection user={userProfile} />
        <Tabs activeKey={activeTab} items={tabItems} onChange={onTabChange} />
        <div className="mt-4 flex items-center justify-center">
          <Button onClick={() => navigate(`/subscription/list`)}>
            Go Back to Subscription List
          </Button>
        </div>
      </div>
      <AdminNote pushed={adminNotePushed} togglePush={togglePush} />
    </div>
  )
}

export default Index
