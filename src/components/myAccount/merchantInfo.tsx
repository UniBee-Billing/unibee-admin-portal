import { LoadingOutlined } from '@ant-design/icons'
import { Form, Input, Spin, message } from 'antd'
import update from 'immutability-helper'
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import {
  emailValidate,
  formatBytes,
  randomString,
  uploadFile
} from '../../helpers'
import { getMerchantInfoReq, updateMerchantInfoReq } from '../../requests'
import { TMerchantInfo } from '../../shared.types'
import {
  useMerchantInfoStore,
  useMerchantMemberProfileStore
} from '../../stores'

import type { GetProp, UploadFile, UploadProps } from 'antd'
import { Image, Upload } from 'antd'
import TextArea from 'antd/es/input/TextArea'
// import ImgCrop from 'ant-img-crop'
// this tool has a bug, when cropping transparent bg png, the bg will become white after cropping
/* <ImgCrop
      rotationSlider
      quality={0.8}
      minAspect={0.5}
      maxAspect={3}
      showGrid={true}
      modalTitle="Crop Image"
      zoomSlider
      showReset
      aspectSlider
      resetText="Reset"
    > */

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]
const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 4 * 1024 * 1024,
  MAX_FILE_COUNT: 1,
  ALLOWED_FILE_TYPES: ['.png', '.jpg', '.jpeg', '.svg']
} as const

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

const Index = forwardRef((_props, ref) => {
  const merchantInfoStore = useMerchantInfoStore()
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const [form] = Form.useForm()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [loading, setLoading] = useState(false) // page loading
  const [_uploading, setUploading] = useState(false) // logo upload
  const [_submitting, setSubmitting] = useState(false)
  const [merchantInfo, setMerchantInfo] = useState<TMerchantInfo | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      form.submit()
    }
  }))

  // removing file also trigger this fn
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
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType)
    }

    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
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

  const onFileUpload = uploadFile(
    FILE_CONSTRAINTS.MAX_FILE_SIZE,
    (logoUrl) => {
      const newFile: UploadFile = {
        uid: randomString(8),
        url: logoUrl,
        status: 'done',
        name: 'companyLogo.png'
      }
      const newFileList = update(fileList, {
        [0]: { $set: newFile }
      })
      setFileList(newFileList) // fileList need to preview the uploaded img file
      form.setFieldValue('companyLogo', logoUrl) // update the form field value, ready for submit
    },
    (err) => {
      message.error(err.message)
    },
    setUploading
  )

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
              maxWidth: 700
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
                <Upload
                  maxCount={FILE_CONSTRAINTS.MAX_FILE_COUNT}
                  accept={FILE_CONSTRAINTS.ALLOWED_FILE_TYPES.join(', ')}
                  listType="picture-card"
                  customRequest={onFileUpload}
                  fileList={fileList}
                  onChange={onUploadFileChange}
                  onPreview={onPreview}
                >
                  {fileList.length == 0 && '+ Upload'}
                </Upload>{' '}
                {previewImage && (
                  <Image
                    wrapperStyle={{ display: 'none' }}
                    preview={{
                      visible: previewOpen,
                      onVisibleChange: (visible) => setPreviewOpen(visible),
                      afterOpenChange: (visible) =>
                        !visible && setPreviewImage('')
                    }}
                    src={previewImage}
                  />
                )}
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
              <TextArea rows={4} />
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
          </Form>
        )
      )}
    </div>
  )
})

export default Index