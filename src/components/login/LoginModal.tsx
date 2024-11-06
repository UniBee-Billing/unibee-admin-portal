import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore, useSessionStore } from '../../stores'
import LoginContainer from './loginContainer'

interface LoginModalProps {
  email: string
  isOpen: boolean
}

export const LoginModal = ({ email, isOpen }: LoginModalProps) => {
  return (
    <Modal
      title="Session expired"
      width={680}
      open={isOpen}
      footer={false}
      closeIcon={null}
      zIndex={2000}
    >
      <LoginContainer triggeredByExpired={true} initialEmail={email} />
    </Modal>
  )
}

export const useLoginModal = () => {
  const sessionStore = useSessionStore()
  const profileStore = useProfileStore()
  const navigate = useNavigate()
  const [isOpenLoginModal, setIsOpenLoginModal] = useState(false)

  useEffect(() => {
    if (!sessionStore.expired) {
      return setIsOpenLoginModal(false)
    }

    if (null == profileStore.id || window.redirectToLogin) {
      // is it better to use email?
      return navigate('login')
    }

    setIsOpenLoginModal(true)
  }, [sessionStore.expired, profileStore.id])

  return { isOpenLoginModal, setIsOpenLoginModal }
}
