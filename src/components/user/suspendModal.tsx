import { Button, message, Modal } from 'antd'
import React, { useState } from 'react'
import { suspendUserReq } from '../../requests'
import { IProfile } from '../../shared.types.d'
import UserInfo from '../shared/userInfo'

interface Props {
  user: IProfile
  refresh: null | (() => void)
  closeModal: () => void
  setRefreshSub?: (val: boolean) => void
}

const Index = ({ user, closeModal, refresh, setRefreshSub }: Props) => {
  const [loading, setLoading] = useState(false)

  const onSuspend = async () => {
    if (null == user) {
      return
    }
    setLoading(true)
    const [_, err] = await suspendUserReq(user.id as number)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    if (setRefreshSub != null) {
      setRefreshSub(true)
    } // pass (refreshSub: true) to grandparent, so it can be passed to <subscriptionTab />
    message.success(`User has been suspended.`)
    if (null != refresh) {
      refresh() // refresh the parent or grandparent
    }
    closeModal()
  }

  return (
    <Modal
      title="Suspend user confirm"
      open={true}
      width={'860px'}
      footer={null}
      closeIcon={null}
    >
      <div className="my-5">
        Are you sure you want to suspend the following user? User's active or
        pending subscription will be cancelled immediately.
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
          danger
          onClick={onSuspend}
          loading={loading}
          disabled={loading}
        >
          Suspend
        </Button>
      </div>
    </Modal>
  )
}

export default Index
