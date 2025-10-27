import { Button, Form, Input, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type { InputRef } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { emailValidate, passwordSchema } from '../../helpers'
import { useCountdown } from '../../hooks'
import { forgetPassReq, forgetPassVerifyReq } from '../../requests'
import AppFooter from '../appFooter'
import AppHeader from '../appHeader'

const ForgetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countVal, counting, startCount, stopCounter] = useCountdown(60)
  const emailRef = useRef<InputRef>(null)
  const watchEmail = Form.useWatch('email', form)
  const [emailFromUrl, setEmailFromUrl] = useState<string | null>(null)
  const [autoSendTriggered, setAutoSendTriggered] = useState(false)

  useEffect(() => {
    // Get email from URL parameter
    const encodedEmail = searchParams.get('email')
    if (encodedEmail) {
      const decodedEmail = decodeURIComponent(encodedEmail)
      setEmailFromUrl(decodedEmail)
      form.setFieldsValue({ email: decodedEmail })
    } else {
      // Focus on email input when page loads without email param
      emailRef.current?.focus()
    }
  }, [])

  // Auto send verification code when email is from URL
  useEffect(() => {
    if (emailFromUrl && !autoSendTriggered) {
      setAutoSendTriggered(true)
      // Delay auto send to ensure form is ready
      setTimeout(() => {
        onSendCode()
      }, 300)
    }
  }, [emailFromUrl])

  // Function to send verification code
  const onSendCode = async () => {
    // Validate email field first
    try {
      await form.validateFields(['email'])
    } catch (error) {
      return
    }

    const email = form.getFieldValue('email')
    if (!email || !emailValidate(email)) {
      message.error('Please enter a valid email address')
      return
    }

    stopCounter()
    startCount()
    setSendingCode(true)
    const [_, err] = await forgetPassReq(email)
    setSendingCode(false)

    if (err != null) {
      message.error(err.message)
      return
    }

    message.success('Verification code sent, please check your email!')
  }

  // Function to submit the form
  const onSubmit = async () => {
    setLoading(true)
    const values = form.getFieldsValue()
    const [_, err] = await forgetPassVerifyReq(
      values.email,
      values.verificationCode,
      values.newPassword
    )
    setLoading(false)

    if (err != null) {
      message.error(err.message)
      return
    }

    message.success('Password reset successfully!')
    // Navigate back to login page after successful reset
    navigate('/login')
  }

  // Function to go back to login page
  const onGoBack = () => {
    navigate('/login')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f0f2f5'
      }}
    >
      <AppHeader />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 20px 80px',
          paddingTop: '40px'
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 500,
            marginBottom: '28px',
            marginTop: '30px',
            color: '#000',
            textAlign: 'center'
          }}
        >
          Forgot password ?
        </h1>

        <Form
          form={form}
          onFinish={onSubmit}
          disabled={loading}
          name="forget-password"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{
            maxWidth: 580,
            width: '90%',
            position: 'relative',
            background: '#fff',
            padding: '36px 40px 28px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          initialValues={{
            email: '',
            newPassword: '',
            confirmPassword: '',
            verificationCode: ''
          }}
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
            <Input 
              ref={emailRef} 
              placeholder="unibeelogin1234@gmail.com" 
              disabled={!!emailFromUrl}
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            dependencies={['confirmPassword']}
            rules={[
              {
                required: true,
                message: 'Please input your new password!'
              },
              () => ({
                validator(_, value) {
                  if (!value) {
                    return Promise.resolve()
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
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              {
                required: true,
                message: 'Please retype your new password!'
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject('Please retype the same password')
                }
              })
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Verification Code"
            name="verificationCode"
            rules={[
              {
                required: true,
                message: 'Please input your verification code!'
              }
            ]}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Input style={{ width: '200px' }} />
              <Button
                onClick={onSendCode}
                disabled={counting || sendingCode}
                loading={sendingCode}
              >
                {counting ? `Resend in ${countVal} seconds` : 'Send code'}
              </Button>
            </div>
          </Form.Item>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '28px'
            }}
          >
            <Button onClick={onGoBack} disabled={loading}>
              Go back
            </Button>
            <Button
              type="primary"
              onClick={form.submit}
              loading={loading}
              disabled={loading}
            >
              OK
            </Button>
          </div>
        </Form>

        <div
          style={{
            marginTop: '28px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}
        >
          Don't have an account?{' '}
          <a
            href="/signup"
            style={{
              color: '#1890ff',
              textDecoration: 'none'
            }}
          >
            Sign up
          </a>{' '}
          for a UniBee cloud-based billing admin account for free.
        </div>
      </div>
      <AppFooter />
    </div>
  )
}

export default ForgetPasswordPage

