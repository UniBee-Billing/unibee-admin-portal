import { Button, Form, Input, message } from 'antd'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import OtpInput from 'react-otp-input'
import { useNavigate } from 'react-router-dom'
import { emailValidate, passwordSchema } from '../helpers'
import { getAppConfigReq, signUpReq } from '../requests'
import { useAppConfigStore } from '../stores'
import AppFooter from './appFooter'
import AppHeader from './appHeader'

const APP_PATH = import.meta.env.BASE_URL
const API_URL = import.meta.env.VITE_API_URL

const Index = () => {
  const navigate = useNavigate()
  const appConfigStore = useAppConfigStore()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0) // [0, 1]
  const [errMsg, setErrMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const [otp, setOtp] = useState('')
  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase())
  }

  const goLogin = () => navigate(`${APP_PATH}login`)

  // submit basic signup ingo
  const onSubmitBasicInfo = async () => {
    setErrMsg('')
    // return
    setSubmitting(true)
    setResending(true)
    const [_, err] = await signUpReq(form.getFieldsValue())
    setSubmitting(false)
    setResending(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Verification code sent.')
    setCurrentStep(1)
    // stopCounter()
    // startCountdown()
  }

  // submit verification code
  const onSubmitCode = () => {
    setErrMsg('')
    setSubmitting(true)
    // const user_name = "ewo" + Math.random();
    axios
      .post(`${API_URL}/merchant/auth/sso/registerVerify`, {
        email: form.getFieldValue('email'),
        verificationCode: otp
      })
      .then((res) => {
        setSubmitting(false)
        if (res.data.code != 0) {
          throw new Error(res.data.message)
        }
        navigate(`${APP_PATH}login`, {
          state: { msg: 'Thanks for your sign-up.' }
        })
      })
      .catch((err) => {
        setSubmitting(false)
        setErrMsg(err.message)
      })
  }

  useEffect(() => {
    const fetchAppConfig = async () => {
      setSubmitting(true)
      const [appConfig, err] = await getAppConfigReq()
      setSubmitting(false)
      if (err != null) {
        message.error(err.message)
        return
      }
      appConfigStore.setAppConfig(appConfig)
    }

    fetchAppConfig()
  }, [])

  return (
    <div
      style={{
        height: 'calc(100vh - 164px)',
        overflowY: 'auto'
      }}
    >
      {' '}
      <AppHeader />
      <div
        className="flex flex-col items-center justify-center"
        style={{
          marginTop: '100px'
        }}
      >
        <h1 className="mb-6 mt-9">Merchant Signup</h1>
        <>
          <div
            className="flex flex-col justify-center"
            style={{
              display: currentStep == 0 ? 'unset' : 'none',
              width: '640px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: '#FFF',
              paddingTop: '24px'
            }}
          >
            <Form
              name="basic"
              form={form}
              onFinish={onSubmitBasicInfo}
              labelCol={{
                span: 10
              }}
              wrapperCol={{
                span: 18
              }}
              style={{
                maxWidth: 600
              }}
              initialValues={{
                remember: true
              }}
              autoComplete="off"
            >
              <Form.Item
                label="First Name"
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

              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[
                  {
                    required: true,
                    message: 'Please input yourn last name!'
                  }
                ]}
              >
                <Input />
              </Form.Item>

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
                      if (
                        value != null &&
                        value != '' &&
                        emailValidate(value)
                      ) {
                        return Promise.resolve()
                      }
                      return Promise.reject('Invalid email address')
                    }
                  })
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Phone"
                name="phone"
                rules={[
                  {
                    required: false
                  }
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                dependencies={['password2']}
                rules={[
                  {
                    required: true,
                    message: 'Please input your password!'
                  },
                  () => ({
                    validator(_, value) {
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
                label="Password Confirm"
                name="password2"
                dependencies={['password']}
                rules={[
                  {
                    required: true,
                    message: 'Please retype your password!'
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value == getFieldValue('password')) {
                        return Promise.resolve()
                      }
                      return Promise.reject('Please retype the same password')
                    }
                  })
                ]}
              >
                <Input.Password onPressEnter={form.submit} />
              </Form.Item>

              <Form.Item
                name="errMsg"
                wrapperCol={{
                  offset: 8,
                  span: 16
                }}
              >
                <span style={{ color: 'red' }}>{errMsg}</span>
              </Form.Item>

              <Form.Item
                wrapperCol={{
                  offset: 11,
                  span: 8
                }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  onClick={form.submit}
                  loading={submitting}
                  disabled={submitting}
                >
                  Submit
                </Button>
              </Form.Item>
            </Form>
            <div
              style={{
                display: 'flex',
                color: '#757575',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '-12px 0 18px 0'
              }}
            >
              Already have an account?
              <Button type="link" onClick={goLogin}>
                Login
              </Button>
            </div>
          </div>
        </>

        <div
          style={{
            flexDirection: 'column',
            display: currentStep == 0 ? 'none' : 'flex'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '78px'
            }}
          >
            <h3>Enter verification code for {form.getFieldValue('email')}</h3>
          </div>
          <OtpInput
            value={otp}
            onChange={onOTPchange}
            numInputs={6}
            shouldAutoFocus={true}
            skipDefaultStyles={true}
            inputStyle={{
              height: '80px',
              width: '60px',
              border: '1px solid gray',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '36px'
            }}
            renderSeparator={<span style={{ width: '36px' }}></span>}
            renderInput={(props) => <input {...props} />}
          />
          <div
            style={{
              height: '64px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'red'
            }}
          >
            {errMsg}
          </div>
          <div>
            <Button
              type="primary"
              block
              onClick={onSubmitCode}
              loading={submitting}
              disabled={submitting}
            >
              Submit
            </Button>
            <Button
              type="link"
              block
              onClick={onSubmitBasicInfo}
              loading={resending}
              disabled={resending}
            >
              Resend
            </Button>
            {/* <Button
              type="link"
              block
              onClick={() => {
                setCurrentStep(0);
                setOtp("");
                setErrMsg("");
              }}
            >
              Go back
            </Button>*/}
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  )
}

export default Index
