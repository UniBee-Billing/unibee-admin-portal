import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMerchantMemberProfileStore, useSessionStore } from '../../stores'
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
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const navigate = useNavigate()
  const [isOpenLoginModal, setIsOpenLoginModal] = useState(false)

  useEffect(() => {
    if (!sessionStore.expired) {
      return setIsOpenLoginModal(false)
    }

    if (merchantMemberProfile.id == -1 || window.redirectToLogin) {
      // == -1: new users, never used our system before, their initial id is -1 (set in store)
      return navigate('login')
    }

    setIsOpenLoginModal(true)
  }, [sessionStore.expired, merchantMemberProfile.id])

  return { isOpenLoginModal, setIsOpenLoginModal }
}
