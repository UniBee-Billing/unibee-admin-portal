import { UnorderedListOutlined } from '@ant-design/icons'
import { Button, Layout, theme } from 'antd'
import { useCallback, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppSearch from './components/appSearch'
import Login from './components/login'
import { LoginModal } from './components/login/LoginModal'
import { Sidebar } from './components/sidebar/sidebar'
import Signup from './components/signup'
import TaskList from './components/taskList'
import { useAppInitialize } from './hooks/useAppInitialize'
import { useAppRoutes } from './routes'
import {
  useAppConfigStore,
  useMerchantMemberProfileStore,
  useSessionStore
} from './stores'

const { Header, Content, Footer } = Layout

const APP_PATH = import.meta.env.BASE_URL
const noSiderRoutes = [`${APP_PATH}login`, `${APP_PATH}signup`]

const App: React.FC = () => {
  const appInitialize = useAppInitialize()
  const sessionStore = useSessionStore()
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const appConfigStore = useAppConfigStore()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()
  const appRoutes = useAppRoutes()

  const toggleTaskListOpen = useCallback(
    () => appConfigStore.setTaskListOpen(!appConfigStore.taskListOpen),
    [appConfigStore]
  )

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
                <Button
                  onClick={toggleTaskListOpen}
                  icon={<UnorderedListOutlined />}
                >
                  Tasks
                </Button>
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
            <Footer style={{ textAlign: 'center' }}>Copyright © 2025</Footer>
          </Layout>
        </Layout>
      )}
    </>
  )
}

export default App
