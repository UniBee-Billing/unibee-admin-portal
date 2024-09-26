import { LoadingOutlined } from '@ant-design/icons'
import { Button, Form, Input, Skeleton, Spin, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { emailValidate } from '../../helpers'
import {
  getMerchantInfoReq,
  updateMerchantInfoReq,
  uploadLogoReq
} from '../../requests'
import { TMerchantInfo } from '../../shared.types'
import { useMerchantInfoStore, useProfileStore } from '../../stores'

const Index = () => {
  const merchantInfoStore = useMerchantInfoStore()
  const profileStore = useProfileStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false) // page loading
  const [uploading, setUploading] = useState(false) // logo upload
  const [submitting, setSubmitting] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [merchantInfo, setMerchantInfo] = useState<TMerchantInfo | null>(null)

  const getInfo = async () => {
    setLoading(true)
    const [merchantInfo, err] = await getMerchantInfoReq(getInfo)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    setMerchantInfo(merchantInfo.merchant)
    setLogoUrl(merchantInfo.merchant.companyLogo)
  }

  const onFileUplaod = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file
    if (event.target.files && event.target.files.length > 0) {
      file = event.target.files[0]
    }
    if (file == null) {
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      message.error('Max logo file size: 4M.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    const [logoUrl, err] = await uploadLogoReq(formData)

    setUploading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    form.setFieldValue('companyLogo', logoUrl)
    setLogoUrl(logoUrl)
  }

  const onSubmit = async () => {
    const info = form.getFieldsValue()
    setSubmitting(true)
    const [merchantInfo, err] = await updateMerchantInfoReq(info)
    setSubmitting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success('Info Updated')
    merchantInfoStore.setMerchantInfo(merchantInfo)
  }

  useEffect(() => {
    getInfo()
  }, [])

  return (
    <div>
      {loading ? (
        <Spin
          spinning={loading}
          indicator={
            <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
          }
          fullscreen
        />
      ) : (
        merchantInfo && (
          <Form
            form={form}
            onFinish={onSubmit}
            disabled={!profileStore.isOwner}
            name="company-info-form"
            labelCol={{
              span: 10
            }}
            wrapperCol={{
              span: 16
            }}
            style={{
              maxWidth: 600
            }}
            initialValues={merchantInfo}
            autoComplete="off"
          >
            <Form.Item
              label="Company Name"
              name="companyName"
              rules={[
                {
                  required: true,
                  message: 'Please input your company name!'
                }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Company Logo (< 4M)"
              name="companyLogo"
              rules={[
                {
                  required: true,
                  message: 'Please upload your company logo! (Max size: 4M)'
                },
                () => ({
                  validator(_, value) {
                    if (value != '') {
                      return Promise.resolve()
                    }
                    return Promise.reject()
                  }
                })
              ]}
            >
              <label htmlFor="companyLogoURL" style={{ cursor: 'pointer' }}>
                {logoUrl == '' ? (
                  <div style={{ width: '48px', height: '48px' }}>
                    <Skeleton.Image
                      active={uploading}
                      style={{ width: '48px', height: '48px' }}
                    />
                  </div>
                ) : (
                  <img src={logoUrl} style={{ maxWidth: '64px' }} />
                )}
              </label>
            </Form.Item>
            <input
              type="file"
              accept="image/png, image/gif, image/jpeg"
              onChange={onFileUplaod}
              id="companyLogoURL"
              name="companyLogoURL"
              style={{ display: 'none' }}
            />

            <Form.Item
              label="Physical Address"
              name="address"
              rules={[
                {
                  required: true,
                  message: 'Please input your company address!'
                }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Company Email"
              name="email"
              rules={[
                {
                  required: true,
                  message: 'Please input your Email!'
                },
                () => ({
                  validator(_, value) {
                    if (emailValidate(value)) {
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
              label="Company Phone"
              name="phone"
              rules={[
                {
                  required: true,
                  message: 'Please input company phone!'
                }
              ]}
            >
              <Input />
            </Form.Item>

            <div className="mx-8 my-8 flex justify-center">
              {profileStore.isOwner && (
                <Button
                  type="primary"
                  onClick={form.submit}
                  loading={submitting || uploading}
                  disabled={submitting || uploading}
                >
                  {uploading ? 'Uploading' : submitting ? 'Submiting' : 'Save'}
                </Button>
              )}
            </div>
          </Form>
        )
      )}
    </div>
  )
}

export default Index
