import { resumeUserReq } from '@/requests'
import { IProfile } from '@/shared.types'
import { Button, message, Modal } from 'antd'
import React, { useState } from 'react'
import UserInfo from '../shared/userInfo'

interface Props {
  user: IProfile
  refresh: null | (() => void)
  closeModal: () => void
}

const Index = ({ user, closeModal, refresh }: Props) => {
  const [loading, setLoading] = useState(false)

  const onResume = async () => {
    if (null == user) {
      return
    }
    setLoading(true)
    const [_, err] = await resumeUserReq(user.id as number)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`User has been resumed.`)
    if (null != refresh) {
      refresh()
    }
    closeModal()
  }

  return (
    <Modal
      title="Resume user confirm"
      open={true}
      width={'860px'}
      footer={null}
      closeIcon={null}
    >
      <div className="my-5">
        Are you sure you want to resume the following user?
      </div>
      <UserInfo user={user} />
      <div
        className="flex items-center justify-end gap-4"
        style={{
          marginTop: '24px'
        }}
      >
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onResume}
          loading={loading}
          disabled={loading}
        >
          Resume
        </Button>
      </div>
    </Modal>
  )
}

export default Index
