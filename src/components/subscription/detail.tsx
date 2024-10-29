import type { TabsProps } from 'antd'
import { Button, Divider, Tabs, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile } from '../../requests'
import { IProfile } from '../../shared.types'
import UserInfoSection from '../shared/userInfo'
import AdminNote from './adminNote'
import './detail.css'
import InvoiceTab from './invoicesTab'
import PaymentTab from './paymentTab'
import SubscriptionTab from './subscription'
// import SubscriptionList from './subscriptionList'
import UserAccount from './userAccountTab'

const Index = () => {
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<IProfile | undefined>(
    undefined
  )
  const [userId, setUserId] = useState<number | null>(null) // subscription obj has user account data, and admin can update it in AccountTab.
  // and the user data on subscription obj might be obsolete,
  // so I use userId from subscription Obj, use this userId to run getUserProfile(userId), even after admin update the user info in AccontTab, re-call getUserProfile

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
      // children: <SubscriptionList />
      children: (
        <SubscriptionTab
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
          refresh={fetchUserProfile} // this is to refresh the user profle page
          setRefreshSub={setRefreshSub} // after admin suspended a user, subscriptin tab also need to refresh, just call setRefreshSub(true)
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

  useEffect(() => {
    if (userId == null) {
      return
    }
    fetchUserProfile()
  }, [userId])

  const togglePush = () => setAdminNotePushed(!adminNotePushed)

  return (
    <div className="flex" style={{ position: 'relative', overflowX: 'hidden' }}>
      <div
        style={{ width: adminNotePushed ? '100%' : '79%' }}
        id="subscription-main-content"
      >
        <Divider orientation="left" style={{ margin: '16px 0' }}>
          User Info
        </Divider>
        <UserInfoSection user={userProfile} />
        <Tabs
          defaultActiveKey={'subscription'}
          items={tabItems}
          onChange={() => {}}
        />
        <div className="mt-4 flex items-center justify-center">
          <Button onClick={() => navigate(`/subscription/list`)}>
            Go Back
          </Button>
        </div>
      </div>
      <AdminNote pushed={adminNotePushed} togglePush={togglePush} />
    </div>
  )
}

export default Index
