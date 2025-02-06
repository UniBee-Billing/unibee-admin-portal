import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tabs,
  TabsProps,
  Tag,
  message
} from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { passwordSchema } from '../../helpers'
import { useCountdown } from '../../hooks'
import {
  forgetPassReq,
  getMemberProfileReq,
  logoutReq,
  resetPassReq
} from '../../requests'
import { IMerchantMemberProfile, TRole } from '../../shared.types'
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useMerchantMemberProfileStore,
  usePermissionStore,
  useSessionStore
} from '../../stores'
import ResetPasswordWithOTP from '../login/forgetPasswordForm'

const Index = () => {
  const merchantProfile = useMerchantMemberProfileStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false) // page loading
  const [submitting] = useState(false)
  const [resetPasswordModal, setResetPasswordModal] = useState(false)
  const togglePasswordModal = () => setResetPasswordModal(!resetPasswordModal)
  const [_, setMyInfo] = useState<IMerchantMemberProfile | null>(null)

  const getInfo = async () => {
    setLoading(true)
    const [res, err] = await getMemberProfileReq(getInfo)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    setMyInfo(res.merchantMember)
    form.setFieldsValue(res.merchantMember)
  }

  useEffect(() => {
    getInfo()
  }, [])

  return (
    <div>
      {
        <ResetPasswordModal
          open={resetPasswordModal}
          closeModal={togglePasswordModal}
          email={merchantProfile.email}
        />
      }
      {loading && (
        <Spin
          spinning={loading}
          indicator={
            <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
          }
          fullscreen
        />
      )}
      <Form
        form={form}
        // onFinish={onSubmit}
        name="merchant-user-profile"
        // labelAlign="left"
        labelCol={{
          flex: '130px'
        }}
        wrapperCol={{
          span: 16
        }}
        autoComplete="off"
      >
        <Form.Item label="user Id" name="id" hidden>
          <Input disabled />
        </Form.Item>
        <Form.Item label="Merchant Id" name="merchantId" hidden>
          <Input disabled />
        </Form.Item>
        <Row>
          <Col span={12}>
            <Form.Item
              label="First name"
              name="firstName"
              rules={[
                {
                  required: true,
                  message: 'Please input your first name!'
                }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last name"
              name="lastName"
              rules={[
                {
                  required: true,
                  message: 'Please input your last name!'
                }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Mobile" name="mobile">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label="Roles">
              {merchantProfile.isOwner ? (
                <Tag>Owner</Tag>
              ) : (
                <Space size={[0, 8]} wrap>
                  {form
                    .getFieldValue('MemberRoles')
                    ?.map((role: TRole) => (
                      <Tag key={role.id as number}>{role.role}</Tag>
                    ))}
                </Space>
              )}
            </Form.Item>
          </Col>
        </Row>

        <div className="mx-8 my-8 flex justify-center">
          <Button onClick={togglePasswordModal} disabled={submitting}>
            Password Management
          </Button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          {/* <Button
            type="primary"
            onClick={form.submit}
            loading={submitting}
            disabled={submitting}
          >
            Save
          </Button> */}
        </div>
      </Form>
    </div>
  )
}

export default Index

interface IResetPassProps {
  open: boolean
  email: string
  closeModal: () => void
}
const ResetPasswordModal = ({ email, closeModal, open }: IResetPassProps) => {
  const navigate = useNavigate()
  const [countVal, counting, startCount, stopCounter] = useCountdown(60)
  const merchantInfoStore = useMerchantInfoStore()
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const sessionStore = useSessionStore()
  const permStore = usePermissionStore()
  const appConfig = useAppConfigStore()

  const [activeTab, setActiveTab] = useState('withOldPassword')
  const onTabChange = (key: string) => {
    setActiveTab(key)
  }

  const logout = async () => {
    const [_, err] = await logoutReq()
    if (null != err) {
      message.error(err.message)
      return
    }
    sessionStore.reset()
    merchantMemberProfile.reset()
    merchantInfoStore.reset()
    appConfig.reset()
    permStore.reset()

    localStorage.removeItem('merchantToken')
    localStorage.removeItem('appConfig')
    localStorage.removeItem('merchantInfo')
    localStorage.removeItem('session')
    localStorage.removeItem('profile')
    localStorage.removeItem('permissions')
    navigate('/login', {
      state: { msg: 'Password reset succeeded, please relogin.' }
    })
  }

  const sendCode = async () => {
    stopCounter()
    startCount()
    // setSubmittingForgetPass(true)
    const [_, err] = await forgetPassReq(email)
    // setSubmittingForgetPass(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success('Code sent, please check your email!')
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'withOldPassword',
      label: 'Change password',
      children: (
        <ResetPassWithOldPass
          email={email}
          closeModal={closeModal}
          logout={logout}
        />
      )
    },
    {
      key: 'OTP',
      label: 'Reset password',
      children: (
        <ResetPasswordWithOTP
          email={email}
          resend={sendCode}
          countVal={countVal}
          counting={counting}
          closeModal={closeModal}
          logout={logout}
        />
      )
    }
  ]

  return (
    <Modal title="" open={open} width={'640px'} footer={null} closeIcon={null}>
      <Tabs activeKey={activeTab} items={tabItems} onChange={onTabChange} />
    </Modal>
  )
}

const ResetPassWithOldPass = ({
  email,
  closeModal,
  logout
}: {
  email: string
  logout?: () => void
  closeModal?: () => void
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const onConfirm = async () => {
    const formValues = form.getFieldsValue()
    setLoading(true)
    const [_, err] = await resetPassReq(
      formValues.oldPassword,
      formValues.newPassword
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    if (closeModal != null) {
      closeModal()
    }
    if (logout != null) {
      logout()
    }
  }
  return (
    <>
      <Form
        form={form}
        onFinish={onConfirm}
        name="reset-password-with-oldpass"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        className="my-6"
        initialValues={{
          email
          /*
          oldPassword: '',
          newPassword: '',
          newPassword2: ''
          */
        }}
      >
        <Form.Item
          label="Old Password"
          name="oldPassword"
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: 'Please input your old password!'
            }
          ]}
        >
          <Input.Password />
        </Form.Item>

        {/* <div className="mb-4 flex justify-center text-red-500">{errMsg}</div> */}

        <Form.Item
          label="New Password"
          name="newPassword"
          dependencies={['newPassword2', 'oldPassword']}
          rules={[
            {
              required: true,
              message: 'Please input your new password!'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('oldPassword') == value) {
                  return Promise.reject(
                    'New password should not be the same as old password.'
                  )
                }
                if (!passwordSchema.validate(value)) {
                  return Promise.reject(
                    'At least 8 characters containing lowercase, uppercase, number and special character.'
                  )
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="New Password Confirm"
          name="newPassword2"
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: 'Please retype your new password!'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value == getFieldValue('newPassword')) {
                  return Promise.resolve()
                }
                return Promise.reject('Please retype the same password')
              }
            })
          ]}
        >
          <Input.Password onPressEnter={onConfirm} />
        </Form.Item>
      </Form>

      <div className="my-6 flex items-center justify-end">
        {closeModal != null && (
          <Button onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
        )}
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </>
  )
}
