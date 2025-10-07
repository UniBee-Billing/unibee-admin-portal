import type { InputRef } from 'antd'
import { Button, Form, Input, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { emailValidate } from '../../helpers'
import { useAppInitialize } from '../../hooks/useAppInitialize'
import { loginWithPasswordReq } from '../../requests'
import { useMerchantMemberProfileStore, useSessionStore } from '../../stores'

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
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const sessionStore = useSessionStore()
  const [errMsg, setErrMsg] = useState('')
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false) // login submit
  const [form] = Form.useForm()
  const watchEmail = Form.useWatch('email', form)
  const passwordRef = useRef<InputRef>(null)
  const emailRef = useRef<InputRef>(null)

  const onForgetPass = () => {
    // Navigate to the forgot password page
    navigate('/forgot-password')
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
    merchantMemberProfile.setProfile(merchantMember)

    const defaultPage = await appInitialize()
    if (triggeredByExpired) {
      sessionStore.refreshCallbacks?.forEach((cb) => cb && cb())
      sessionStore.setSession({
        expired: false,
        refreshCallbacks: []
      })
      message.success('Login successful')
    } else {
      sessionStore.setSession({
        expired: false,
        refreshCallbacks: []
      })
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
      <Form
        form={form}
        onFinish={onSubmit}
        disabled={submitting}
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
