import { message } from 'antd'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppFooter from '../appFooter'
import AppHeader from '../appHeader'
import LoginContainer from './loginContainer'

const Index = () => {
  // when user roles/permissions have been changed, any further req will receive code: 62,
  // user will be redirected to /login, not be prompted with a LoginModal
  // so in /login page, I need to remove this global variable
  delete window.redirectToLogin
  const location = useLocation()
  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg)
    }
  }, [])

  return (
    <div
      style={{
        height: 'calc(100vh - 142px)',
        overflowY: 'auto'
      }}
    >
      <AppHeader />
      <LoginContainer triggeredByExpired={false} initialEmail="" />
      <AppFooter />
    </div>
  )
}

export default Index
