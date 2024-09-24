import { Button, Form, Input, message } from 'antd'
import { useState } from 'react'
import OtpInput from 'react-otp-input'
import { useNavigate } from 'react-router-dom'
import { emailValidate } from '../../helpers'
import { useCountdown } from '../../hooks'
import {
  initializeReq,
  loginWithOTPReq,
  loginWithOTPVerifyReq
} from '../../requests'
import {
  useAppConfigStore,
  useMerchantInfoStore,
  usePermissionStore,
  useProductListStore,
  useProfileStore,
  useSessionStore
} from '../../stores'

const APP_PATH = import.meta.env.BASE_URL

const Index = ({
  email,
  onEmailChange,
  triggeredByExpired,
  setLogging
}: {
  email: string
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  triggeredByExpired: boolean
  setLogging: (val: boolean) => void
}) => {
  const [currentStep, setCurrentStep] = useState(0) // 0: input email, 1: input code
  const [errMailMsg, setErrMailMsg] = useState('')
  const [_, setSendingMailaddr] = useState(false) // TODO: when submitting email-address, disable its button.
  const [countVal, counting, startCount, stopCounter] = useCountdown(60)

  const goBackForward = () => setCurrentStep((currentStep + 1) % 2)

  const sendMailaddress = async () => {
    if (email.trim() == '' || !emailValidate(email)) {
      setErrMailMsg('Invalid email adderss!')
      return Promise.reject(new Error('Invalid email address'))
    }

    setSendingMailaddr(true)
    setErrMailMsg('')
    const [_, err] = await loginWithOTPReq(email)
    setSendingMailaddr(false)
    if (err != null) {
      setErrMailMsg(err.message)
      return
    }
    stopCounter()
    startCount()
    message.success('Code sent, please check your email')
  }

  return (
    <div>
      {currentStep == 0 ? (
        <MailForm
          email={email}
          onEmailChange={onEmailChange}
          sendMailaddress={sendMailaddress}
          goForward={goBackForward}
          setLogging={setLogging}
        />
      ) : (
        <OTPForm
          email={email}
          errMailMsg={errMailMsg}
          sendMailaddress={sendMailaddress}
          goBack={goBackForward}
          counting={counting}
          countVal={countVal}
          triggeredByExpired={triggeredByExpired}
          setLogging={setLogging}
        />
      )}
    </div>
  )
}

export default Index

interface IMailFormProps {
  email: string
  onEmailChange: (evt: React.ChangeEvent<HTMLInputElement>) => void
  goForward: () => void
  sendMailaddress: () => Promise<unknown>
  setLogging: (val: boolean) => void
}
const MailForm = ({
  email,
  onEmailChange,
  goForward,
  sendMailaddress,
  setLogging
}: IMailFormProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const submit = async () => {
    try {
      setSubmitting(true)
      setLogging(true)
      await sendMailaddress()
      setSubmitting(false)
      setLogging(false)
      goForward()
    } catch (err) {
      setSubmitting(false)
      setLogging(false)
      if (err instanceof Error) {
        console.log('err sending mailaddress: ', err.message)
        setErrMsg(err.message)
      } else {
        setErrMsg('Unknown error')
      }
    }
  }

  return (
    <Form
      // form={form}
      // onFinish={sendMail}
      name="login_OTP_email"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ maxWidth: 640, width: 360 }}
    >
      <Form.Item
        label="Email"
        // name="email"
        rules={[
          {
            required: true,
            message: 'Please input your email!'
          }
        ]}
      >
        <Input value={email} onChange={onEmailChange} onPressEnter={submit} />
      </Form.Item>
      <div className="mb-4 flex justify-center text-red-500">{errMsg}</div>
      <div className="flex w-full justify-center">
        <Button
          type="primary"
          onClick={submit}
          loading={submitting}
          disabled={submitting}
        >
          Submit
        </Button>
      </div>
    </Form>
  )
}

// ---------------------------------------------------

interface IOtpFormProps {
  email: string
  errMailMsg: string
  counting: boolean
  countVal: number
  sendMailaddress: () => Promise<unknown>
  goBack: () => void
  triggeredByExpired: boolean
  setLogging: (val: boolean) => void
}

const NUM_INPUTS = 6

const OTPForm = ({
  email,
  errMailMsg,
  counting,
  countVal,
  sendMailaddress,
  goBack,
  triggeredByExpired,
  setLogging
}: IOtpFormProps) => {
  const navigate = useNavigate()
  const appConfigStore = useAppConfigStore()
  const productsStore = useProductListStore()
  const profileStore = useProfileStore()
  const sessionStore = useSessionStore()
  const merchantStore = useMerchantInfoStore()
  const permStore = usePermissionStore()
  const [submitting, setSubmitting] = useState(false)
  const [otp, setOtp] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase())
  }

  const sendCode = async () => {
    if (otp.length != NUM_INPUTS) {
      setErrMsg('Invalid code')
      return
    }
    setSubmitting(true)
    setLogging(true)
    const [loginRes, errVerify] = await loginWithOTPVerifyReq(email, otp)
    if (null != errVerify) {
      setSubmitting(false)
      setLogging(false)
      setErrMsg(errVerify.message)
      return
    }

    const { token, merchantMember } = loginRes
    localStorage.setItem('merchantToken', token)
    merchantMember.token = token
    profileStore.setProfile(merchantMember)
    // sessionStore.setSession({ expired: false, refresh: null })

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
      role: merchantInfo.merchantMember.role,
      permissions: merchantInfo.merchantMember.permissions
    })

    if (triggeredByExpired) {
      sessionStore.refresh?.()
      sessionStore.setSession({ expired: false, refresh: null })
      message.success('Login succeeded')
    } else {
      sessionStore.setSession({ expired: false, refresh: null })
      navigate(`${APP_PATH}`)
    }
  }

  const resend = () => {
    sendMailaddress()
    setOtp('')
  }

  return (
    <Form
      // form={form}
      // onFinish={submit}
      name="login_OTP_code"
      labelCol={{
        span: 6
      }}
      wrapperCol={{
        span: 18
      }}
      style={{
        maxWidth: 600
      }}
      autoComplete="off"
    >
      <div className="flex h-24 items-center justify-center">
        <h3>Enter verification code for {email}</h3>
      </div>
      <OtpInput
        value={otp}
        onChange={onOTPchange}
        numInputs={NUM_INPUTS}
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
      <div className="mt-8 flex flex-col items-center justify-center">
        <span className="mb-4 text-red-500">{errMailMsg || errMsg}</span>
        <Button
          type="primary"
          block
          htmlType="submit"
          onClick={sendCode}
          loading={submitting}
          disabled={submitting}
        >
          OK
        </Button>
        <div className="mt-2 flex">
          <Button type="link" block onClick={goBack}>
            Go back
          </Button>

          <div className="flex max-w-44 items-center justify-center">
            <Button type="link" onClick={resend} disabled={counting}>
              Resend
            </Button>
            {counting && (
              <div style={{ width: '100px' }}> in {countVal} seconds</div>
            )}
          </div>
        </div>
      </div>
    </Form>
  )
}
