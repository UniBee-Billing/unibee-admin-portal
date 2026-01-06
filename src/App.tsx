import { UnorderedListOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Layout, theme, Modal } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import AppSearch from './components/appSearch'
import Login from './components/login'
import { LoginModal } from './components/login/LoginModal'
import ForgetPasswordPage from './components/login/forgetPasswordPage'
import { Sidebar } from './components/sidebar/sidebar'
import Signup from './components/signup'
import TaskList from './components/taskList'
import { TwoFactorSetup, TwoFactorVerify } from './components/twoFactor'
import { useAppInitialize } from './hooks/useAppInitialize'
import { useAppRoutes } from './routes'
import { getLicenseReq, getMerchantInfoReq } from './requests'
import {
  useAppConfigStore,
  useMerchantMemberProfileStore,
  useSessionStore
} from './stores'
import UnibeeAnalyticSvg from './assets/navIcons/analytics.svg?react'

const { Header, Content, Footer } = Layout

const APP_PATH = import.meta.env.BASE_URL
const noSiderRoutes = [
  `${APP_PATH}login`,
  `${APP_PATH}signup`,
  `${APP_PATH}forgot-password`,
  `${APP_PATH}two-factorsetup`,
  `${APP_PATH}two-factorverify`
]

const App: React.FC = () => {
  const appInitialize = useAppInitialize()
  const sessionStore = useSessionStore()
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const appConfigStore = useAppConfigStore()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()
  const appRoutes = useAppRoutes()
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false)

  const toggleTaskListOpen = useCallback(
    () => appConfigStore.setTaskListOpen(!appConfigStore.taskListOpen),
    [appConfigStore]
  )

  const handleAnalyticsClick = async () => {
    try {
      const [[merchantData, merchantErr], [licenseData, licenseErr]] =
        await Promise.all([getMerchantInfoReq(), getLicenseReq()])
      if (merchantErr || licenseErr) {
        setAnalyticsModalVisible(true)
        return
      }

      
      //new json structure
      const licenseInfo = licenseData?.license
      const version = licenseInfo?.version
      
      // check premium status
      const isActivePremium = 
        (licenseInfo?.isPaid || version?.isPaid) && !version?.expired
      const isExpiredPremium = 
        (licenseInfo?.isPaid || version?.isPaid) && !!version?.expired
        
      if (!isActivePremium || isExpiredPremium || !merchantData.analyticsHost) {
        setAnalyticsModalVisible(true)
      } else {
        window.open(merchantData.analyticsHost, '_blank')
      }
    } catch (_error) {
      setAnalyticsModalVisible(true)
    }
  }

  const handleCloseAnalyticsModal = () => {
    setAnalyticsModalVisible(false)
  }

  useEffect(() => {
    appInitialize()
  }, [])

  return (
    <>
      {noSiderRoutes.find((r) => r === location.pathname) ? (
        <Layout style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/login" Component={Login} />
            <Route path="/signup" Component={Signup} />
            <Route path="/forgot-password" Component={ForgetPasswordPage} />
            <Route path="/two-factorsetup" Component={TwoFactorSetup} />
            <Route path="/two-factorverify" Component={TwoFactorVerify} />
          </Routes>
        </Layout>
      ) : (
        <Layout style={{ minHeight: '100vh' }}>
          {sessionStore.getSession().expired && (
            <LoginModal isOpen={true} email={merchantMemberProfile.email} />
          )}
          <Sidebar />
          {appConfigStore.taskListOpen && (
            <TaskList onClose={toggleTaskListOpen} />
          )}
          <Layout>
            <Header style={{ background: colorBgContainer }}>
              <div className="flex h-full items-center justify-between">
                <AppSearch />
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleAnalyticsClick}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      background: '#FEE076',
                      border: '1px solid #FEE076',
                      borderRadius: '8px',
                      padding: '0 16px',
                      width: '247px',
                      height: '37px',
                      color: '#ffcd29'
                    }}
                    icon={<UnibeeAnalyticSvg style={{ marginRight: '8px', height: '20px' }} />}
                  >
                    <span style={{ marginRight: '8px', color: '#000', fontSize: '14px' }}>Go to UniBee Analytics</span>
                    <RightOutlined style={{ color: '#000' }}/>
                  </Button>
                  <Button
                    onClick={toggleTaskListOpen}
                    icon={<UnorderedListOutlined />}
                  >
                    Tasks
                  </Button>
                </div>
              </div>
            </Header>
            <Content
              style={{
                padding: '16px',
                height: 'calc(100vh - 180px)',
                overflowY: 'auto',
                position: 'relative'
              }}
            >
              <div
                style={{
                  padding: 24,
                  minHeight: '100%',
                  // height: '100%',
                  // minHeight: 360,
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG
                }}
              >
                {appRoutes}
              </div>
            </Content>
            {/* {!location.pathname.includes('configuration') || !location.search.includes('tab=multiCurrencyConfig') ? (
              <Footer style={{ textAlign: 'center' }}>Copyright © 2025</Footer>
            ) : null} */}
          </Layout>
        </Layout>
      )}

      <Modal
        title="Premium Analytics"
        open={analyticsModalVisible}
        onCancel={handleCloseAnalyticsModal}
        footer={[
          <Button key="cancel" onClick={handleCloseAnalyticsModal}>
            Cancel
          </Button>,
          <Button 
            key="ok" 
            type="primary" 
            onClick={handleCloseAnalyticsModal}
            // style={{ backgroundColor: 'blue', borderColor: 'blue' }}
          >
            Ok
          </Button>
        ]}
      >
        <div className="py-4">
          <p>This is a Premium plan feature, <a href="https://unibee.dev/pricing" target="_blank" className="text-[#ffcd29] cursor-pointer hover:underline">upgrade</a> and unlock Analytics insights</p>
        </div>
      </Modal>
    </>
  )
}

export default App
