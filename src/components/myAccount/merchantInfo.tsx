import { LoadingOutlined } from '@ant-design/icons'
import { Button, Form, Input, Spin, message } from 'antd'
import update from 'immutability-helper'
import React, { useEffect, useState } from 'react'
import { emailValidate, formatBytes, randomString } from '../../helpers'
import {
  getMerchantInfoReq,
  updateMerchantInfoReq,
  uploadLogoReq
} from '../../requests'
import { TMerchantInfo } from '../../shared.types'
import {
  useMerchantInfoStore,
  useMerchantMemberProfileStore
} from '../../stores'

import type { GetProp, UploadFile, UploadProps } from 'antd'
import { Upload } from 'antd'
//import ImgCrop from 'antd-img-crop'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]
const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 4 * 1024 * 1024,
  MAX_FILE_COUNT: 1,
  ALLOWED_FILE_TYPES: ['.png', '.jpg', '.jpeg']
}

// const API_URL = import.meta.env.VITE_API_URL

const Index = () => {
  const merchantInfoStore = useMerchantInfoStore()
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false) // page loading
  const [uploading, setUploading] = useState(false) // logo upload
  const [submitting, setSubmitting] = useState(false)
  // const [logoUrl, setLogoUrl] = useState('')
  const [merchantInfo, setMerchantInfo] = useState<TMerchantInfo | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const onUploadFileChange: UploadProps['onChange'] = ({
    fileList: newFileList
  }) => {
    if (
      newFileList.length > 0 &&
      newFileList[0].size != undefined &&
      newFileList[0].size > FILE_CONSTRAINTS.MAX_FILE_SIZE
    ) {
      message.error(
        'Max logo file size: ' + formatBytes(FILE_CONSTRAINTS.MAX_FILE_SIZE)
      )
      return
    }
    setFileList(newFileList)
  }

  const onPreview = async (file: UploadFile) => {
    let src = file.url as string
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file.originFileObj as FileType)
        reader.onload = () => resolve(reader.result as string)
      })
    }
    const image = new Image()
    image.src = src
    const imgWindow = window.open(src)
    imgWindow?.document.write(image.outerHTML)
  }

  const getInfo = async () => {
    setLoading(true)
    const [merchantInfo, err] = await getMerchantInfoReq(getInfo)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    setMerchantInfo(merchantInfo.merchant)
    // setLogoUrl(merchantInfo.merchant.companyLogo)
    const { companyLogo } = merchantInfo.merchant
    if (companyLogo !== '' && companyLogo != null) {
      setFileList([
        {
          uid: '-1',
          name: 'companyLogo.png',
          status: 'done',
          url: merchantInfo.merchant.companyLogo
        }
      ])
    }
  }

  /* const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  } */

  const onFileUpload = async () => {
    const formData = new FormData()
    const file = fileList[fileList.length - 1].originFileObj
    if (file == undefined) {
      return
    }
    if (file.size > FILE_CONSTRAINTS.MAX_FILE_SIZE) {
      message.error(
        'Max logo file size: ' + formatBytes(FILE_CONSTRAINTS.MAX_FILE_SIZE)
      )
    }
    const buf = await file.arrayBuffer()
    const blob = new Blob([buf])
    formData.append('file', blob)
    setUploading(true)
    const [logoUrl, err] = await uploadLogoReq(formData)
    setUploading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    const newFile: UploadFile = {
      uid: randomString(8),
      url: logoUrl,
      status: 'done',
      name: 'companyLogo.png'
    }
    const newFileList = update(fileList, {
      [0]: { $set: newFile }
    })
    setFileList(newFileList) // fileList need to show the uploaded img file preview
    form.setFieldValue('companyLogo', logoUrl) // update the form field value, ready for submit
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
            disabled={!merchantMemberProfile.isOwner}
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
              label="Company Logo"
              name="companyLogo"
              extra={`Max size: ${formatBytes(FILE_CONSTRAINTS.MAX_FILE_SIZE)}, allowed file types: ${FILE_CONSTRAINTS.ALLOWED_FILE_TYPES.join(', ')}`}
            >
              <div style={{ height: '102px' }}>
                {/* <ImgCrop rotationSlider> */}
                <Upload
                  /*
                    action={`${API_URL}/merchant/oss/file`}
                    headers={{
                      'Content-Type': 'multipart/form-data',
                      Authorization: `${localStorage.getItem('merchantToken')}`
                    }}
                      */
                  maxCount={FILE_CONSTRAINTS.MAX_FILE_COUNT}
                  accept={FILE_CONSTRAINTS.ALLOWED_FILE_TYPES.join(', ')}
                  listType="picture-card"
                  customRequest={onFileUpload}
                  fileList={fileList}
                  onChange={onUploadFileChange}
                  onPreview={onPreview}
                >
                  {fileList.length == 0 && '+ Upload'}
                </Upload>
                {/* </ImgCrop> */}
              </div>
            </Form.Item>

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
              {merchantMemberProfile.isOwner && (
                <Button
                  type="primary"
                  onClick={form.submit}
                  loading={submitting}
                  disabled={submitting || uploading}
                >
                  {uploading ? 'Uploading' : submitting ? 'Submitting' : 'Save'}
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
