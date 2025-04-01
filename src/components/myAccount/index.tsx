import { Button, Divider } from 'antd'
import MerchantInfo from './merchantInfo'
import MyProfile from './profile'
import { useRef } from 'react'

const Index = () => {
  const merchantInfoRef = useRef<{ submitForm: () => void } | null>(null)
  const profileRef = useRef<{ submitForm: () => void } | null>(null)

  const handleSaveAll = () => {
    // Submit both forms
    merchantInfoRef.current?.submitForm()
    profileRef.current?.submitForm()
  }

  return (
    <>
      <Divider
        orientation="left"
        style={{ color: '#757575', fontSize: '14px' }}
      >
        Company profile
      </Divider>
      <MerchantInfo ref={merchantInfoRef} />
      <Divider
        orientation="left"
        style={{ color: '#757575', fontSize: '14px' }}
      >
        My profile
      </Divider>
      <MyProfile ref={profileRef} />
      
      <div className="flex justify-center mt-8">
        <Button
          type="primary"
          onClick={handleSaveAll}
          style={{ backgroundColor: '#286ede', color: '#FFFFFF' }}
        >
          Save
        </Button>
      </div>
    </>
  )
}

export default Index