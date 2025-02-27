import { Button, Form, Input, message, Modal } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import React, { useState } from 'react'
import { saveProductReq } from '../../requests'
import { IProduct } from '../../shared.types'

interface Props {
  refresh: (p: IProduct) => void
  closeModal: () => void
  isNew: boolean
  detail: IProduct | undefined // if not passed, we are creating new product. if passed, we are editing this product
}

const Index = ({ closeModal, isNew, refresh, detail }: Props) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    const body = form.getFieldsValue()

    body.productId = body.id
    // return
    setLoading(true)
    const [res, err] = await saveProductReq(body)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    refresh(res.product)
    message.success('Product saved')
    closeModal()
  }

  return (
    <Modal
      title="Product detail"
      open={true}
      width={'720px'}
      footer={null}
      closeIcon={null}
    >
      <div>
        <Form
          form={form}
          onFinish={onSave}
          labelCol={{ flex: '186px' }}
          wrapperCol={{ flex: 1 }}
          colon={false}
          disabled={loading}
          initialValues={isNew ? {} : detail}
        >
          {!isNew && (
            <Form.Item label="ID" name="id">
              <Input disabled />
            </Form.Item>
          )}

          <Form.Item
            label="Name"
            name="productName"
            rules={[
              {
                required: true,
                message: 'Please input your product name!'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              {
                required: true,
                message: 'Please input your product description!'
              }
            ]}
          >
            <TextArea />
          </Form.Item>
        </Form>
        <div
          className="flex items-center justify-end gap-4"
          style={{
            marginTop: '24px'
          }}
        >
          <Button onClick={closeModal} disabled={loading}>
            Cancel
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
      </div>
    </Modal>
  )
}

export default Index
