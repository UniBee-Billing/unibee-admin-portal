import { Button, Col, Form, Input, Modal, Row, message } from 'antd'
import { useState } from 'react'
import { emailValidate } from '../../helpers'
import { createNewUserReq } from '../../requests'
// import { Country, IProfile } from '../../shared.types'

const Index = ({
  closeModal,
  refresh
}: {
  closeModal: () => void
  refresh: () => void
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    const newUser = JSON.parse(JSON.stringify(form.getFieldsValue()))
    delete newUser.password2
    setLoading(true)
    const [_, err] = await createNewUserReq(newUser)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success('User account created')
    closeModal()
    refresh()
  }

  return (
    <Modal
      title="New User"
      width={'820px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Form
        form={form}
        labelCol={{ span: 8 }}
        onFinish={onSave}
        colon={false}
        disabled={loading}
        // initialValues={}
      >
        <Row>
          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  message: "Please input new user's valid email!"
                },
                () => ({
                  validator(_, value) {
                    if (value != null && value != '' && emailValidate(value)) {
                      return Promise.resolve()
                    }
                    return Promise.reject('Invalid email address')
                  }
                })
              ]}
            >
              <Input style={{ width: '220px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="External UserId" name="externalUserId">
              <Input style={{ width: '220px' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item
              label="First name"
              name="firstName"
              /*
              rules={[
                {
                  required: true,
                  message: 'Please input your first name!'
                }
              ]}
              */
            >
              <Input style={{ width: '220px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last name"
              name="lastName"
              /*
              rules={[
                {
                  required: true,
                  message: 'Please input your last name!'
                }
              ]}
              */
            >
              <Input style={{ width: '220px' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item label="Phone" name="phone">
              <Input style={{ width: '220px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Address" name="address">
              <Input style={{ width: '220px' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <div className="mt-6 flex items-center justify-end gap-4">
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
    </Modal>
  )
}
export default Index

/*

      
      <Form.Item label="Country Name" name="countryName" hidden>
        <Input />
      </Form.Item>

      <Divider orientation="left" style={{ margin: '16px 0' }}>
        General
      </Divider>
      <Row>
        <Col span={12}>
          <Form.Item
            label="First name"
            name="firstName"
            rules={[
              {
                required: true,
                message: 'Please input your first name!'
              }
            ]}
          >
            <Input style={{ width: '240px' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Last name"
            name="lastName"
            rules={[
              {
                required: true,
                message: 'Please input your last name!'
              }
            ]}
          >
            <Input style={{ width: '240px' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item label="Email" name="email">
            <Input disabled style={{ width: '240px' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Company name" name="companyName">
            <Input style={{ width: '240px' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item label="VAT number" name="vATNumber">
            <Input style={{ width: '240px' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Payment" name="paymentMethod">
            <Radio.Group>
              <Radio value="CreditCard">Credit Card</Radio>
              <Radio value="Crypto">Crypto</Radio>
              <Radio value="PayPal">PayPal</Radio>
              <Radio value="WireTransfer">Wire Transfer</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Contact Info
      </Divider>

      <Row>
        <Col span={12}>
          <Form.Item
            label="Country"
            name="countryCode"
            rules={[
              {
                required: true,
                message: 'Please select your first country!'
              }
            ]}
          >
            <Select
              showSearch
              placeholder="Type to search"
              optionFilterProp="children"
              // value={country}
              // onChange={onCountryChange}
              // onSearch={onSearch}
              filterOption={filterOption}
              options={countryList.map((c) => ({
                label: c.name,
                value: c.code
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Billing address"
            name="address"
            rules={[
              {
                required: true,
                message: 'Please input your billing address!'
              }
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item label="Phone number" name="phone">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" style={{ margin: '16px 0' }}>
        Social Info
      </Divider>

      <Row>
        <Col span={12}>
          <Form.Item label="Telegram" name="telegram">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="WhatsApp" name="whatsAPP">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item label="WeChat" name="weChat">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="LinkedIn" name="linkedIn">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item label="Facebook" name="facebook">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="TikTok" name="tikTok">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item label="Other social info" name="otherSocialInfo">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <div className="mx-9 my-9 flex justify-center gap-6">
        {extraButton}
        <Button danger>Suspend</Button>
        <Button type="primary" onClick={form.submit} disabled={loading}>
          Save
        </Button>
      </div>
*/
