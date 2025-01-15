import type { InputRef } from 'antd'
import { Button, Form, Input, Modal, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { emailValidate } from '../../helpers'
import { useCountdown } from '../../hooks'
import { useAppInitialize } from '../../hooks/useAppInitialize'
// import { useInitData } from '../../hooks/useInitData'
import { forgetPassReq, loginWithPasswordReq } from '../../requests'
import { useProfileStore, useSessionStore } from '../../stores'
import ForgetPasswordForm from './forgetPasswordForm'

const Index = ({
  email,
  onEmailChange,
  triggeredByExpired,
  setLogging
}: {
  email: string
  onEmailChange: (value: string) => void
  triggeredByExpired: boolean
  setLogging: (val: boolean) => void
}) => {
  const appInitialize = useAppInitialize()
  const profileStore = useProfileStore()
  const sessionStore = useSessionStore()
  const [errMsg, setErrMsg] = useState('')
  const [countVal, counting, startCount, stopCounter] = useCountdown(60)
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false) // login submit
  const [submittingForgetPass, setSubmittingForgetPass] = useState(false) // click 'forget password'
  const [forgetPassModalOpen, setForgetPassModalOpen] = useState(false)
  const toggleForgetPassModal = () =>
    setForgetPassModalOpen(!forgetPassModalOpen)
  const [form] = Form.useForm()
  const watchEmail = Form.useWatch('email', form)
  const passwordRef = useRef<InputRef>(null)
  const emailRef = useRef<InputRef>(null)

  const onForgetPass = async () => {
    const isValid = form.getFieldError('email').length == 0
    if (!isValid) {
      return
    }

    stopCounter()
    startCount()
    setSubmittingForgetPass(true)
    const [_, err] = await forgetPassReq(form.getFieldValue('email'))
    setSubmittingForgetPass(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    setForgetPassModalOpen(true)
    message.success('Code sent, please check your email!')
  }

  const onSubmit = async () => {
    setErrMsg('')
    setSubmitting(true)
    setLogging(true)
    const [loginRes, err] = await loginWithPasswordReq(form.getFieldsValue())
    if (err != null) {
      setSubmitting(false)
      setLogging(false)
      setErrMsg(err.message)
      return
    }

    const { merchantMember, token } = loginRes
    localStorage.setItem('merchantToken', token)
    merchantMember.token = token
    profileStore.setProfile(merchantMember)
    // sessionStore.setSession({ expired: false, refresh: null })
    // useInitData()

    /*
    const [initRes, errInit] = await initializeReq()
    setSubmitting(false)
    setLogging(false)
    if (null != errInit) {
      setErrMsg(errInit.message)
      return
    }
    
    const { appConfig, gateways, merchantInfo, products } = initRes
    appConfigStore.setAppConfig(appConfig)
    appConfigStore.setGateway(gateways)
    productsStore.setProductList({ list: products.products })
    merchantStore.setMerchantInfo(merchantInfo.merchant)
    permStore.setPerm({
      roles: merchantInfo.merchantMember.roles,
      permissions: merchantInfo.merchantMember.permissions
    })

    */
    const defaultPage = await appInitialize()
    console.log('defaultPage: ', defaultPage)
    if (triggeredByExpired) {
      sessionStore.refresh?.()
      sessionStore.setSession({ expired: false, refresh: null })
      message.success('Login succeeded')
    } else {
      sessionStore.setSession({ expired: false, refresh: null })
      navigate(defaultPage)
    }
  }

  useEffect(() => {
    if (watchEmail != null) {
      onEmailChange(watchEmail) // pass the email value to parent
    }
  }, [watchEmail])

  useEffect(() => {
    if (triggeredByExpired) {
      passwordRef.current?.focus()
    } else {
      emailRef.current?.focus()
    }
  }, [])

  return (
    <>
      {forgetPassModalOpen && (
        <ForgetPasswordModal
          email={form.getFieldValue('email')}
          closeModal={toggleForgetPassModal}
          resend={onForgetPass}
          countVal={countVal}
          counting={counting}
        />
      )}

      <Form
        form={form}
        onFinish={onSubmit}
        name="login-password"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        style={{ maxWidth: 640, width: 360, position: 'relative' }}
        initialValues={{ email, password: '' }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your Email!'
            },
            () => ({
              validator(_, value) {
                if (value != null && value != '' && emailValidate(value)) {
                  return Promise.resolve()
                }
                return Promise.reject('Please input valid email address.')
              }
            })
          ]}
        >
          <Input onPressEnter={form.submit} ref={emailRef} />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: 'Please input your password!'
            }
          ]}
        >
          <Input.Password onPressEnter={form.submit} ref={passwordRef} />
        </Form.Item>

        <div style={{ position: 'absolute', right: '-130px', top: '56px' }}>
          <Button
            onClick={onForgetPass}
            loading={submittingForgetPass}
            disabled={submittingForgetPass}
            type="link"
            style={{ fontSize: '11px' }}
          >
            Forgot Password?
          </Button>
        </div>

        <div className="mb-4 flex justify-center text-red-500">{errMsg}</div>
        <div className="flex w-full justify-center">
          <Button
            type="primary"
            onClick={form.submit}
            loading={submitting}
            disabled={submitting}
          >
            Submit
          </Button>
        </div>
      </Form>
    </>
  )
}

export default Index

const ForgetPasswordModal = ({
  email,
  closeModal,
  resend,
  countVal,
  counting
}: {
  email: string
  closeModal: () => void
  resend: () => void
  countVal: number
  counting: boolean
}) => {
  // we're already on /login, there is no need to logout,
  // this is to show a success toast.
  const logout = () => {
    message.success('Password reset succeeded.')
  }
  return (
    <Modal
      title="Forgot Password"
      open={true}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <ForgetPasswordForm
        resend={resend}
        closeModal={closeModal}
        email={email}
        counting={counting}
        countVal={countVal}
        logout={logout}
      />
    </Modal>
  )
}
