import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Select,
  message
} from 'antd'
import { ReactElement, useEffect, useState } from 'react'
import { getCountryListReq, saveUserProfileReq } from '../../requests'
import { Country, IProfile } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'
import PaymentSelector from '../ui/paymentSelector'
import { UserStatus } from '../ui/statusTag'
import PaymentCardList from '../user/paymentCards'
import SuspendModal from '../user/suspendModal'
import './userAccountTab.css'

const UserAccountTab = ({
  user,
  setUserProfile,
  refresh,
  extraButton,
  setRefreshSub
}: {
  user: IProfile | null
  setUserProfile: (u: IProfile) => void
  refresh: null | (() => void)
  setRefreshSub: (val: boolean) => void
  extraButton?: ReactElement
}) => {
  const appConfigStore = useAppConfigStore()
  const [form] = Form.useForm()
  const [countryList, setCountryList] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const toggleSuspend = () => setSuspendModalOpen(!suspendModalOpen)
  const [gatewayId, setGatewayId] = useState<number | undefined>(undefined)
  const onGatewayChange: React.ChangeEventHandler<HTMLInputElement> = (evt) =>
    setGatewayId(Number(evt.target.value))

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  const onSave = async () => {
    const body = JSON.parse(JSON.stringify(form.getFieldsValue()))
    if (gatewayId != undefined) {
      body.gatewayId = gatewayId
    }
    // return
    setLoading(true)
    const [res, err] = await saveUserProfileReq(body)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { user } = res
    message.success('User Info Saved')
    setUserProfile(user)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [list, err] = await getCountryListReq()
      setLoading(false)
      if (err != null) {
        message.error(err.message)
        return
      }
      setCountryList(
        list.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName
        }))
      )
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (user != null) setGatewayId(user.gatewayId)
  }, [user])

  const countryCode = Form.useWatch('countryCode', form)
  useEffect(() => {
    countryCode &&
      countryList.length > 0 &&
      form.setFieldValue(
        'countryName',
        countryList.find((c) => c.code == countryCode)!.name
      )
  }, [countryCode])

  const isCardPaymentSelected =
    appConfigStore.gateway.find(
      (g) => g.gatewayId == gatewayId && g.gatewayName == 'stripe'
    ) != null

  return (
    user != null && (
      <>
        {suspendModalOpen && (
          <SuspendModal
            user={user}
            closeModal={toggleSuspend}
            refresh={refresh}
            setRefreshSub={setRefreshSub}
          />
        )}

        <Form
          form={form}
          labelCol={{ span: 7 }}
          onFinish={onSave}
          initialValues={user}
          disabled={loading || user.status == 2} // suspended
        >
          <Form.Item label="id" name="id" hidden>
            <Input disabled />
          </Form.Item>
          <Form.Item label="countryName" name="countryName" hidden>
            <Input disabled />
          </Form.Item>
          <Form.Item label="Country Name" name="countryName" hidden>
            <Input />
          </Form.Item>
          <Divider orientation="left" style={{ margin: '16px 0' }}>
            Billing Info
          </Divider>
          <Row>
            <Col span={12}>
              <Form.Item label="Status" name="status">
                <div>{user && UserStatus(user.status)}</div>{' '}
              </Form.Item>
            </Col>
            <Col span={12}></Col>
          </Row>
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
                <Input style={{ width: '300px' }} />
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
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input disabled style={{ width: '300px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Company name" name="companyName">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item label="VAT number" name="vATNumber">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Country"
                name="countryCode"
                rules={[
                  {
                    required: true,
                    message: 'Please select your country!'
                  }
                ]}
              >
                <Select
                  showSearch
                  style={{ width: '300px' }}
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
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item label="City" name="city">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Post code" name="postCode">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item
                label="Address"
                name="address"
                rules={[
                  {
                    required: true,
                    message: 'Please input your billing address!'
                  }
                ]}
              >
                <Input.TextArea rows={4} style={{ width: '300px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone number" name="mobile">
                <Input style={{ width: '300px' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item label="Account Type" name="type">
                <Radio.Group>
                  <Radio value={1}>Individual</Radio>
                  <Radio value={2}>Business</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}></Col>
          </Row>
          {/* <Divider orientation="left" style={{ margin: '16px 0' }}>
            Payment method
              </Divider> */}
          <Row>
            <Col span={12}>
              <Form.Item label="Payment method">
                <PaymentSelector
                  selected={gatewayId}
                  onSelect={onGatewayChange}
                  disabled={loading || user.status == 2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div
                style={{
                  visibility: isCardPaymentSelected ? 'visible' : 'hidden',
                  position: 'relative',
                  display: 'flex',
                  width: '100%',
                  height: '100%'
                }}
              >
                <div className="triangle-left" />
                <div
                  style={{
                    left: '6px',
                    width: '90%',
                    borderRadius: '6px',
                    padding: '8px',
                    background: '#f5f5f5',
                    position: 'relative'
                    // border: '1px solid #eee',
                  }}
                >
                  <PaymentCardList
                    userId={user.id as number}
                    gatewayId={gatewayId}
                    defaultPaymentId={user.paymentMethod}
                  />
                </div>
              </div>
            </Col>
          </Row>
          <Divider orientation="left" style={{ margin: '16px 0' }}>
            Social Media Contact
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
        </Form>
        <div className="mx-9 my-9 flex justify-around gap-6">
          <Button
            danger
            onClick={toggleSuspend}
            disabled={loading || null == user || user.status == 2}
          >
            Suspend
          </Button>
          <div className="flex gap-6">
            {extraButton}
            <Button
              type="primary"
              onClick={form.submit}
              disabled={loading || null == user || user.status == 2}
            >
              Save
            </Button>
          </div>
        </div>
      </>
    )
  )
}

export default UserAccountTab
