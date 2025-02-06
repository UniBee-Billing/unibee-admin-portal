import { Button, Form, Input, message } from 'antd'
import { useState } from 'react'
import { passwordSchema } from '../../helpers'
import { forgetPassVerifyReq } from '../../requests'

const Index = ({
  resend,
  closeModal,
  email,
  counting,
  countVal,
  logout
}: {
  resend: () => void
  closeModal?: () => void
  email: string
  counting: boolean
  countVal: number
  logout?: () => void
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    setLoading(true)
    const [_, err] = await forgetPassVerifyReq(
      form.getFieldValue('email'),
      form.getFieldValue('verificationCode'),
      form.getFieldValue('newPassword')
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
        name="forget-password-with-OTP"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        className="my-6"
        // this component is used in My-Account -> password manager -> Reset password Modal
        // and /login, forgot password Modal
        // without position: 'relative', resend button will not align with 'Verificaton code' field in latter use case
        style={{ position: 'relative' }}
        initialValues={{
          email
          /*
          verificationCode: '',
          newPassword: '',
          newPassword2: ''
          */
        }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your email!'
            }
          ]}
        >
          <Input disabled />
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
          <Input style={{ width: 200 }} />
        </Form.Item>
        <Button
          onClick={resend}
          disabled={counting}
          style={{ position: 'absolute', top: '56px', right: 0 }}
        >
          {counting ? `Resend in ${countVal} seconds` : 'Send code'}
        </Button>

        <Form.Item
          label="New Password"
          name="newPassword"
          dependencies={['newPassword2']}
          rules={[
            {
              required: true,
              message: 'Please input your new password!'
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

      <div className="my-6 flex items-center justify-between">
        <div className="flex max-w-52 items-center justify-center">
          {/*
          <Button onClick={resend} disabled={counting}>
            Send code
          </Button>
          {counting && (
            <span style={{ marginLeft: '6px' }}>in {countVal} seconds</span>
          )}
          */}
        </div>
        <div>
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
      </div>
    </>
  )
}

export default Index
