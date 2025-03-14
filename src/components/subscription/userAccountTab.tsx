import { METRICS_AGGREGATE_TYPE, METRICS_TYPE } from '@/constants'
import { randomString } from '@/helpers'
import {
  getCountryListReq,
  getMetricsListReq,
  saveUserProfileReq,
  sendMetricEventReq
} from '@/requests'
import {
  AccountType,
  Country,
  IBillableMetrics,
  IProfile,
  MetricAggregationType,
  UserStatus
} from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Spin,
  message
} from 'antd'
import { ReactElement, useEffect, useState } from 'react'
import PaymentSelector from '../ui/paymentSelector'
import { UserStatusTag } from '../ui/statusTag'
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
  user: IProfile | undefined
  setUserProfile: (u: IProfile) => void
  refresh: null | (() => void)
  extraButton?: ReactElement
  setRefreshSub?: (val: boolean) => void
}) => {
  const appConfigStore = useAppConfigStore()
  const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([])
  const [selectedMetricCode, setSelectedMetricCode] = useState<string>('')
  const [form] = Form.useForm()
  const [countryList, setCountryList] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const toggleSuspend = () => setSuspendModalOpen(!suspendModalOpen)
  const [gatewayId, setGatewayId] = useState<number | undefined>(undefined)
  const onGatewayChange = (gatewayId: number) => setGatewayId(gatewayId) // React.ChangeEventHandler<HTMLInputElement> = (evt) =>
  const [gatewayPaymentType, setGatewayPaymentType] = useState<
    string | undefined
  >(undefined)

  const [externalEventId, setExternalEventId] = useState(randomString(8))
  const [aggregationValue, setAggregationValue] = useState<number | null>(100)

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  const onSave = async () => {
    const body = JSON.parse(JSON.stringify(form.getFieldsValue()))
    if (gatewayId != undefined) {
      body.gatewayId = gatewayId
      body.gatewayPaymentType = gatewayPaymentType
    }

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

  const sendMetricEvent = async () => {
    const metric = metricsList.find((m) => m.code == selectedMetricCode)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      metricCode: selectedMetricCode,
      userId: user!.id as number,
      productId: 0,
      externalEventId
    }
    if (
      metric?.aggregationProperty != '' &&
      metric?.aggregationProperty != null
    ) {
      body.metricProperties = {
        [metric.aggregationProperty]: 100
      }
    }

    if (metric?.aggregationType != MetricAggregationType.COUNT) {
      body.aggregationValue = aggregationValue
    }

    const [res, err] = await sendMetricEventReq(body)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`Metric event sent.`)
    setExternalEventId(randomString(8))
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
        list.map((c: IProfile) => ({
          code: c.countryCode,
          name: c.countryName
        }))
      )
    }

    const fetchMetricList = async () => {
      const [res, err] = await getMetricsListReq({})
      if (err != null) {
        message.error(err.message)
        return
      }
      const metricsList = res.merchantMetrics ?? []
      setMetricsList(metricsList)
    }
    fetchData()
    fetchMetricList()
  }, [])

  useEffect(() => {
    if (user != null) {
      form.setFieldsValue(user)
      setGatewayId(user.gatewayId)
      setGatewayPaymentType(user.gatewayPaymentType)
    }
  }, [user])

  const userType = Form.useWatch('type', form)
  const countryCode = Form.useWatch('countryCode', form)
  useEffect(() => {
    if (countryCode && countryList.length > 0) {
      form.setFieldValue(
        'countryName',
        countryList.find((c) => c.code == countryCode)!.name
      )
    }
  }, [countryCode])

  const isCardPaymentSelected =
    appConfigStore.gateway.find(
      (g) => g.gatewayId == gatewayId && g.gatewayName == 'stripe'
    ) != null

  return (
    user != null && (
      <>
        <Spin
          spinning={loading}
          indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
        >
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
            disabled={loading || user.status == UserStatus.SUSPENDED}
          >
            <Form.Item label="id" name="id" hidden>
              <Input disabled />
            </Form.Item>
            <Divider orientation="left" style={{ margin: '16px 0' }}>
              Billing Info
            </Divider>
            <Row>
              <Col span={12}>
                <Form.Item label="User Id / External Id" name="id">
                  <div>
                    <span className="text-gray-500">{`${user?.id} / ${user?.externalUserId == '' ? '―' : user?.externalUserId}`}</span>
                    &nbsp;&nbsp;
                    {UserStatusTag(user.status)}
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Account Type" name="type">
                  <Radio.Group>
                    <Radio value={1}>Individual</Radio>
                    <Radio value={2}>Business</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Form.Item label="First name" name="firstName">
                  <Input style={{ width: '300px' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Last name" name="lastName">
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
                <Form.Item
                  label="City"
                  name="city"
                  rules={[
                    {
                      required: userType === AccountType.BUSINESS,
                      message: 'Please input your city!'
                    }
                  ]}
                >
                  <Input style={{ width: '300px' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Zip code"
                  name="zipCode"
                  rules={[
                    {
                      required: userType === AccountType.BUSINESS,
                      message: 'Please input your ZIP code!'
                    }
                  ]}
                >
                  <Input style={{ width: '300px' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Form.Item
                  label="Billing address"
                  name="address"
                  rules={[
                    {
                      required: userType === AccountType.BUSINESS,
                      message: 'Please input your billing address!'
                    }
                  ]}
                >
                  <Input.TextArea rows={4} style={{ width: '300px' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Company name"
                  name="companyName"
                  rules={[
                    {
                      required: userType === AccountType.BUSINESS,
                      message: 'Please input your company name!'
                    }
                  ]}
                >
                  <Input style={{ width: '300px' }} />
                </Form.Item>

                <Form.Item
                  label="Registration number"
                  name="registrationNumber"
                >
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
                <Form.Item label="Phone number" name="phone">
                  <Input style={{ width: '300px' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                <Form.Item label="Payment method">
                  <PaymentSelector
                    selected={gatewayId}
                    selectedPaymentType={gatewayPaymentType}
                    onSelect={onGatewayChange}
                    onSelectPaymentType={setGatewayPaymentType}
                    disabled={loading || user.status == UserStatus.SUSPENDED}
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
                  {/* <div className="triangle-left" /> */}
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
                      readonly={false}
                      userId={user.id as number}
                      gatewayId={gatewayId}
                      refreshUserProfile={refresh}
                      defaultPaymentId={user.paymentMethod}
                    />
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Form.Item label="Preferred language" name="language">
                  <Select
                    style={{ width: '300px' }}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'ru', label: 'Russian' },
                      { value: 'cn', label: 'Chinese' },
                      { value: 'vi', label: 'Vietnamese' },
                      { value: 'pt', label: 'Portuguese' }
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Divider orientation="left" style={{ margin: '16px 0' }}>
              Social Media Contact
            </Divider>
            {SocialMediaContact.map((item, idx) => (
              <Row key={item.label}>
                <Col span={12}>
                  {idx * 2 < SocialMediaContact.length && (
                    <Form.Item
                      label={SocialMediaContact[idx * 2].label}
                      name={SocialMediaContact[idx * 2].name}
                    >
                      <Input />
                    </Form.Item>
                  )}
                </Col>
                <Col span={12}>
                  {idx * 2 + 1 < SocialMediaContact.length && (
                    <Form.Item
                      label={SocialMediaContact[idx * 2 + 1].label}
                      name={SocialMediaContact[idx * 2 + 1].name}
                    >
                      <Input />
                    </Form.Item>
                  )}
                </Col>
              </Row>
            ))}
          </Form>
          <div className="mx-9 my-9 flex justify-around gap-6">
            <Button
              danger
              onClick={toggleSuspend}
              disabled={
                loading || null == user || user.status == UserStatus.SUSPENDED
              }
            >
              Suspend
            </Button>
            <div className="flex gap-6">
              {extraButton}
              <Button
                type="primary"
                onClick={form.submit}
                disabled={
                  loading || null == user || user.status == UserStatus.SUSPENDED
                }
                loading={loading}
              >
                Save
              </Button>
            </div>
          </div>
        </Spin>
        <div className="fixed bottom-14 mr-10 flex-col gap-4 rounded-md bg-gray-100 p-4">
          <div className="flex gap-4">
            <Select
              style={{ width: 300 }}
              value={selectedMetricCode}
              onChange={(val) => setSelectedMetricCode(val)}
              options={metricsList.map((m) => ({
                label: (
                  <div>
                    {m.metricName}&nbsp;
                    <span className="text-xs text-gray-500">({m.code})</span>
                  </div>
                ),
                value: m.code
              }))}
            />
            <InputNumber
              style={{ width: 100 }}
              value={aggregationValue}
              onChange={(val) => setAggregationValue(val)}
            />
            <Button onClick={sendMetricEvent}>Send metric event</Button>
          </div>
          <div>
            metric type:{' '}
            {selectedMetricCode != '' &&
              METRICS_TYPE[
                metricsList.find((m) => m.code == selectedMetricCode)!.type!
              ]?.label}
          </div>
          <div>
            aggre property:{' '}
            {selectedMetricCode != '' &&
              METRICS_AGGREGATE_TYPE[
                metricsList.find((m) => m.code == selectedMetricCode)!
                  .aggregationType
              ].label}
          </div>
          <div>
            aggre props:{' '}
            {selectedMetricCode != '' &&
              metricsList.find((m) => m.code == selectedMetricCode)!
                .aggregationProperty}
          </div>
        </div>
      </>
    )
  )
}

export default UserAccountTab

const SocialMediaContact = [
  {
    label: 'Telegram',
    name: 'telegram'
  },
  {
    label: 'WhatsApp',
    name: 'whatsAPP'
  },
  {
    label: 'WeChat',
    name: 'weChat'
  },
  {
    label: 'LinkedIn',
    name: 'linkedIn'
  },
  {
    label: 'Facebook',
    name: 'facebook'
  },
  {
    label: 'TikTok',
    name: 'tikTok'
  },
  {
    label: 'Other social info',
    name: 'otherSocialInfo'
  }
]
