import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  message
} from 'antd'
import React, { useEffect, useState } from 'react'
import { TWebhook } from '../../../@types/shared.types'
import { ramdonString } from '../../../helpers'
import {
  deleteWebhookReq,
  getEventListReq,
  saveWebhookReq
} from '../../../requests'

const Index = ({
  closeModal,
  detail,
  refresh
}: {
  closeModal: () => void
  detail: TWebhook | null
  refresh: () => void
}) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [eventList, setEventList] = useState<string[]>([]) // this is to populate the event <Select />, not used for update.

  const onConfirm = async () => {
    // console.log('form v: ', form.getFieldsValue())
    setSubmitting(true)
    const [res, err] = await saveWebhookReq(form.getFieldsValue())
    if (err != null) {
      setSubmitting(false)
      message.error(err.message)
      return
    }
    message.success('Webhook saved')
    refresh()
    closeModal()
  }

  const onDelete = async () => {
    if (detail == null) {
      return
    }
    setSubmitting(true)
    const [res, err] = await deleteWebhookReq(detail?.id)
    if (err != null) {
      setSubmitting(false)
      message.error(err.message)
      return
    }
    message.success('Webhook deleted')
    refresh()
    setTimeout(closeModal, 1500)
  }

  const fetchEventList = async () => {
    setSubmitting(true)
    const [eventList, err] = await getEventListReq()
    setSubmitting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    setEventList(eventList)
  }

  const isEvtSelected = (evt: string) =>
    form.getFieldValue('events').findIndex((e: string) => e == evt) != -1

  useEffect(() => {
    fetchEventList()
  }, [])

  return (
    <Modal open={true} footer={null} title="Webhook Detail" closeIcon={null}>
      <Form
        form={form}
        onFinish={onConfirm}
        initialValues={{
          endpointId: detail == null ? null : detail.id,
          url: detail == null ? '' : detail.webhookUrl,
          events: detail == null ? [''] : detail.webhookEvents
        }}
        name="web-hook-detail"
        style={{ maxWidth: 640, width: 480 }}
      >
        {detail != null && (
          <Form.Item name="endpointId" hidden>
            <Input />
          </Form.Item>
        )}
        <Row style={{ marginTop: '32px' }}>
          <Col span={4}>URL</Col>
          <Col span={18}>
            <Form.Item
              // label="Url"
              name="url"
              rules={[
                {
                  required: true,
                  message: 'Please input your endpoint URL!'
                },
                () => ({
                  validator(value) {
                    // if (urlRegx.test(value)) {
                    // return Promise.resolve()
                    // }
                    const lowCase = value.toLowerCase()
                    if (
                      lowCase.startsWith('http://') ||
                      lowCase.startsWith('https://')
                    ) {
                      return Promise.resolve()
                    }
                    return Promise.reject('Please input a valid URL')
                  }
                })
              ]}
            >
              <Input placeholder="Starts with http:// or https://" />
            </Form.Item>
          </Col>
          <Col span={2}></Col>
        </Row>

        <Row style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <Col span={4}>Events</Col>
          <Col span={18}>
            <Form.List name="events">
              {(fields, { add, remove }) => {
                return (
                  <>
                    {fields &&
                      fields.map((field, index) => {
                        return (
                          <div
                            key={ramdonString(8)}
                            className="flex items-center"
                            style={{ marginBottom: '12px' }}
                          >
                            <Form.Item
                              name={field.name}
                              label={`Event - ${index + 1}`}
                              noStyle={true}
                              rules={[{ required: true }]}
                            >
                              <Select
                                style={{ width: 360, margin: '8px 0' }}
                                options={eventList.map((e) => ({
                                  label: e,
                                  value: e,
                                  disabled: isEvtSelected(e)
                                }))}
                              />
                            </Form.Item>
                            &nbsp;&nbsp;&nbsp;&nbsp;
                            <div
                              onClick={() => {
                                if (fields.length == 1) {
                                  return
                                }
                                remove(field.name)
                              }}
                              style={{
                                fontWeight: 'bold',
                                width: '32px',
                                cursor: `${fields.length == 1 ? 'not-allowed' : 'pointer'}`
                              }}
                            >
                              <MinusOutlined />
                            </div>
                          </div>
                        )
                      })}
                    <Form.Item>
                      <Button
                        type="dashed"
                        block
                        style={{ width: '100%' }}
                        icon={<PlusOutlined />}
                        onClick={() => add()}
                      >
                        Add an event
                      </Button>
                    </Form.Item>
                  </>
                )
              }}
            </Form.List>
          </Col>
        </Row>
      </Form>
      <div className="my-6 flex items-center justify-between">
        {detail == null ? (
          <span></span>
        ) : (
          <Popconfirm
            title="Deletion Confirm"
            description="Are you sure to delete this webhook?"
            onConfirm={onDelete}
            showCancel={false}
            okText="Yes"
          >
            <Button danger disabled={submitting}>
              Delete
            </Button>
          </Popconfirm>
        )}
        <div>
          <Button onClick={closeModal} disabled={submitting}>
            Cancel
          </Button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <Button
            type="primary"
            onClick={form.submit}
            loading={submitting}
            disabled={submitting}
          >
            OK
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Index
