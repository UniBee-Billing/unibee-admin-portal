import React, { useEffect, useState } from 'react'
import { IProfile } from '../../shared.types'

const Index = () => {
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<IProfile | null>(null)

  /*
  const fetchUserProfile = async () => {
    const userId = Number(params.adminId)
    if (isNaN(userId) || userId < 0) {
      message.error('User not found')
      return
    }
    setLoading(true)
    const [user, err] = await getUserProfile(userId, fetchUserProfile)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    setUserProfile(user)
  }
  */

  useEffect(() => {
    // fetchUserProfile()
  }, [])

  return (
    <div>
      admin user detail
      {/* <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      <UserAccountTab
        user={userProfile}
        setUserProfile={setUserProfile}
        extraButton={
          <Button onClick={() => navigate(`${APP_PATH}admin/list`)}>
            Go Back
          </Button>
        }
      />*/}
    </div>
  )
}

export default Index
