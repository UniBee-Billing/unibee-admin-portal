import { InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Popover,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  message
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { CURRENCY } from '../../constants'
import {
  currencyDecimalValidate,
  numBoolConvert,
  showAmount,
  toFixedNumber
} from '../../helpers'
import {
  createDiscountCodeReq,
  deleteDiscountCodeReq,
  getDiscountCodeDetailWithMore,
  getPlanList,
  toggleDiscountCodeActivateReq,
  updateDiscountCodeReq
} from '../../requests'
import { DiscountCode, DiscountCodeStatus, IPlan } from '../../shared.types'
import { useMerchantInfoStore } from '../../stores'
import { title } from '../../utils'
import { getDiscountCodeStatusTagById } from '../ui/statusTag'
import { formatQuantity } from './helpers'
import { UpdateDiscountCodeQuantityModal } from './updateDiscountCodeQuantityModal'

const { RangePicker } = DatePicker

const DEFAULT_CODE: DiscountCode = {
  merchantId: useMerchantInfoStore.getState().id,
  name: '',
  code: '',
  billingType: 1,
  discountType: 1,
  discountAmount: 0,
  discountPercentage: 0,
  currency: 'EUR',
  cycleLimit: 1,
  startTime: 0,
  endTime: 0,
  validityRange: [null, null],
  planIds: [],
  quantity: 0,
  advance: false,
  userScope: 0,
  userLimit: true,
  upgradeOnly: false,
  upgradeLongerOnly: false
}

const CAN_EDIT_ITEM_STATUSES = [
  DiscountCodeStatus.EDITING,
  DiscountCodeStatus.ACTIVE,
  DiscountCodeStatus.DEACTIVATE
]

const canActiveItemEdit = (status?: DiscountCodeStatus) =>
  status ? CAN_EDIT_ITEM_STATUSES.includes(status) : true

const Index = () => {
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const discountCopyData = location.state?.copyDiscountCode
  const isCopy = !!discountCopyData
  const codeId = params.discountCodeId
  const isNew = !codeId || isCopy
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState<DiscountCode | null>(
    !codeId && !isCopy ? DEFAULT_CODE : null
  )
  const [planList, setPlanList] = useState<IPlan[]>([])
  const planListRef = useRef<IPlan[]>([])
  const [
    isOpenUpdateDiscountCodeQuantityModal,
    setIsOpenUpdateDiscountCodeQuantityModal
  ] = useState(false)
  const [form] = Form.useForm()
  const watchDiscountType = Form.useWatch('discountType', form)
  const watchBillingType = Form.useWatch('billingType', form)
  const watchCurrency = Form.useWatch('currency', form)
  const watchPlanIds = Form.useWatch('planIds', form)
  const watchAdvancedConfig = Form.useWatch('advance', form)

  const RENDERED_QUANTITY_ITEMS_MAP: Record<number, ReactNode> = useMemo(
    () => ({
      [DiscountCodeStatus.ACTIVE]: (
        <div>
          <span className="mr-2">{formatQuantity(code?.quantity ?? 0)}</span>
          <Button
            disabled={!code?.id}
            onClick={() => setIsOpenUpdateDiscountCodeQuantityModal(true)}
          >
            Update
          </Button>
        </div>
      ),
      [DiscountCodeStatus.EXPIRED]: (
        <InputNumber
          style={{ width: 180 }}
          defaultValue={code?.quantity}
          disabled
        />
      )
    }),
    [code?.quantity, code?.id]
  )

  const renderedQuantityItems = useMemo(
    () =>
      RENDERED_QUANTITY_ITEMS_MAP[code?.status ?? -1] ?? (
        <InputNumber
          min="0"
          style={{ width: 180 }}
          defaultValue={code?.quantity.toString()}
        />
      ),
    [code?.status, code?.quantity]
  )

  const SubForm = ({ children }: PropsWithChildren) => (
    <div className="my-5 ml-[180px] rounded-xl bg-[#FAFAFA] px-4 py-6">
      {children}
    </div>
  )

  const goBack = () => navigate(`/discount-code/list`)
  const goToUsageDetail = () =>
    navigate(`/discount-code/${codeId}/usage-detail`)

  const fetchDiscountCodeByQuery = async () => {
    const pathName = window.location.pathname.split('/')
    const codeId = pathName.pop()
    const codeNum = Number(codeId)
    if (codeId == null || isNaN(codeNum)) {
      message.error('Invalid discount code')
      return
    }
    setLoading(true)
    const [res, err] = await getDiscountCodeDetailWithMore(codeNum, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    return res
  }

  // for editing code, need to fetch code detail and planList
  const fetchData = async (data?: DiscountCode) => {
    const res = data ?? (await fetchDiscountCodeByQuery())
    const { discount, planList } = res

    if (data) {
      discount.status = undefined
    }

    // if discount.currency is EUR, and discountType == 2(fixed amt), then filter the planList to contain only euro plans
    let plans =
      planList.plans == null ? [] : planList.plans.map((p: IPlan) => p.plan)
    if (discount.discountType == 2) {
      // fixed amt
      plans = plans.filter((p: IPlan) => p.currency == discount.currency)
    }
    setPlanList(plans)
    planListRef.current =
      planList.plans == null ? [] : planList.plans.map((p: IPlan) => p.plan)

    discount.validityRange = [
      dayjs(discount.startTime * 1000),
      dayjs(discount.endTime * 1000)
    ]
    if (discount.discountType == 2) {
      // fixed amount
      discount.discountAmount /= CURRENCY[discount.currency].stripe_factor
    } else if (discount.discountType == 1) {
      // percentage
      discount.discountPercentage /= 100
    }

    discount.userLimit = numBoolConvert(discount.userLimit)

    setCode(discount)
  }

  // for creating new code, there is no codeDetail to fetch.
  const fetchPlans = async () => {
    setLoading(true)
    const [res, err] = await getPlanList(
      {
        type: [1], // main plan
        status: [2], // active
        page: 0,
        count: 200
      },
      fetchPlans
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { plans } = res
    // if NEW_CODE.currency is EUR, and discountType == 2(fixed amt), then filter the planList to contain only euro plans
    let planList = plans == null ? [] : plans.map((p: IPlan) => p.plan)
    if (DEFAULT_CODE.discountType == 2) {
      // fixed amt
      planList = planList.filter(
        (p: IPlan) => p.currency == DEFAULT_CODE.currency
      )
    }
    setPlanList(planList)
    planListRef.current = plans == null ? [] : plans.map((p: IPlan) => p.plan)
  }

  const onSave = async () => {
    const body = form.getFieldsValue()
    const code = JSON.parse(JSON.stringify(body))
    const r = form.getFieldValue('validityRange') as [Dayjs, Dayjs]
    code.startTime = r[0].unix()
    code.endTime = r[1].unix()
    code.cycleLimit = Number(code.cycleLimit)
    code.discountAmount = Number(code.discountAmount)
    code.discountPercentage = Number(code.discountPercentage) * 100
    delete code.validityRange
    code.userLimit = numBoolConvert(code.userLimit)

    if (code.discountType == 1) {
      // percentage
      delete code.currency
      delete code.discountAmount
    } else {
      // fixed amount
      delete code.discountPercentage
      code.discountAmount *= CURRENCY[code.currency].stripe_factor
      code.discountAmount = toFixedNumber(code.discountAmount, 2)
    }

    // console.log('on save: ', code)
    // return
    const method = isNew ? createDiscountCodeReq : updateDiscountCodeReq

    setLoading(true)

    const [data, err] = await method(code)

    setLoading(false)

    if (err) {
      message.error(err.message)
      return
    }

    message.success(`Discount code ${isNew ? 'created' : 'updated'}`)

    if (isNew) {
      navigate(`/discount-code/${data.discount.id}`)
      return
    }

    goBack()
  }

  const onDelete = async () => {
    if (code == null || code.id == null) {
      return
    }
    setLoading(true)
    const [_, err] = await deleteDiscountCodeReq(code.id)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Discount code (${code.code}) archived successfully`)
    goBack()
  }

  const toggleActivate = async () => {
    if (!code?.id) {
      return
    }

    setLoading(true)
    const [_, err] = await toggleDiscountCodeActivateReq(
      code.id,
      toggleActiveButtonAction
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Discount code (${code.code}) ${toggleActiveButtonAction}d`)
    goBack()
  }

  const formEditable = isNew || code?.status === DiscountCodeStatus.EDITING

  const toggleActiveButtonAction =
    code?.status === DiscountCodeStatus.ACTIVE ? 'deactivate' : 'activate'

  const getPlanLabel = (planId: number) => {
    const p = planListRef.current.find((p) => p.id == planId)
    if (null == p) {
      return ''
    }
    return `${p.planName} (${showAmount(p.amount, p.currency)}/${p.intervalCount == 1 ? '' : p.intervalCount}${p.intervalUnit})`
  }

  useEffect(() => {
    // Copy the code from discount code list
    if (location.state?.copyDiscountCode) {
      fetchData(location.state.copyDiscountCode)
      return
    }

    if (isNew) {
      fetchPlans()
    } else {
      fetchData()
    }
  }, [isNew])

  useEffect(() => {
    if (watchBillingType == 1) {
      //  one-time use: you can only use this code once, aka: cycleLimit is always 1
      form.setFieldValue('cycleLimit', 1)
    }
  }, [watchBillingType])

  useEffect(() => {
    if (watchDiscountType == 2) {
      // fixed amt
      setPlanList(
        planListRef.current.filter((p) => p.currency == watchCurrency)
      )
    }
  }, [watchDiscountType, watchCurrency])

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      {code?.id && (
        <UpdateDiscountCodeQuantityModal
          discountId={code?.id}
          close={() => setIsOpenUpdateDiscountCodeQuantityModal(false)}
          onSuccess={(delta) => (code.quantity += delta)}
          open={isOpenUpdateDiscountCodeQuantityModal}
        />
      )}
      {code && (
        <Form
          form={form}
          onFinish={onSave}
          labelCol={{ flex: '180px' }}
          wrapperCol={{ flex: 1 }}
          colon={false}
          initialValues={code}
          disabled={!formEditable}
        >
          <div className="flex">
            <div className="w-1/2">
              <div className="mb-6 flex items-center">
                <Divider
                  type="vertical"
                  style={{
                    backgroundColor: '#1677FF',
                    width: '3px',
                    height: '28px'
                  }}
                />
                <div className="text-lg">General configuration</div>
              </div>
              {!isNew && (
                <Form.Item label="ID" name="id" hidden>
                  <Input disabled />
                </Form.Item>
              )}
              <Form.Item label="merchant Id" name="merchantId" hidden>
                <Input disabled />
              </Form.Item>
              <Form.Item
                label="Name"
                name="name"
                rules={[
                  {
                    required: true,
                    message: 'Please input your discount code name!'
                  }
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Code"
                name="code"
                rules={[
                  {
                    required: true,
                    message: 'Please input your discount code!'
                  }
                ]}
              >
                <Input disabled={!isNew} />
              </Form.Item>
              {!isNew && (
                <Form.Item label="Status">
                  {getDiscountCodeStatusTagById(code.status as number)}
                </Form.Item>
              )}
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[
                  {
                    required: true,
                    message: 'Please input valid quantity'
                  }
                ]}
                extra={'If quantity is 0, it means the quantity is unlimited.'}
              >
                {renderedQuantityItems}
              </Form.Item>
              <Form.Item
                label="Discount Type"
                name="discountType"
                className="mb-0"
                rules={[
                  {
                    required: true,
                    message: 'Please choose your discountType type!'
                  }
                ]}
              >
                <Select
                  style={{ width: 180 }}
                  options={[
                    { value: 1, label: 'Percentage' },
                    { value: 2, label: 'Fixed amount' }
                  ]}
                />
              </Form.Item>
              <SubForm>
                <Form.Item
                  label="Discount percentage"
                  name="discountPercentage"
                  rules={[
                    {
                      required: watchDiscountType == 1,
                      message: 'Please choose your discount percentage!'
                    },
                    () => ({
                      validator(_, value) {
                        if (watchDiscountType == 2) {
                          // 2: fixed amount
                          return Promise.resolve()
                        }
                        const num = Number(value)
                        if (isNaN(num) || num <= 0 || num > 100) {
                          return Promise.reject(
                            'Please input a valid percentage number between 0 ~ 100.'
                          )
                        }
                        return Promise.resolve()
                      }
                    })
                  ]}
                >
                  <Input
                    style={{ width: 180 }}
                    disabled={watchDiscountType == 2 || !formEditable}
                    suffix="%"
                  />
                </Form.Item>
                <Form.Item
                  label="Currency"
                  name="currency"
                  rules={[
                    {
                      required: watchDiscountType != 1,
                      message: 'Please select your currency!'
                    }
                  ]}
                >
                  <Select
                    disabled={watchDiscountType == 1 || !formEditable}
                    style={{ width: 180 }}
                    options={[
                      { value: 'EUR', label: 'EUR' },
                      { value: 'USD', label: 'USD' },
                      { value: 'JPY', label: 'JPY' }
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  label="Discount Amount"
                  name="discountAmount"
                  dependencies={['currency']}
                  className="mb-0"
                  rules={[
                    {
                      required: watchDiscountType != 1, // 1: percentage, 2: fixed-amt
                      message: 'Please choose your discount amount!'
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (watchDiscountType == 1) {
                          return Promise.resolve()
                        }
                        const num = Number(value)
                        if (isNaN(num) || num <= 0) {
                          return Promise.reject(
                            'Please input a valid amount (> 0).'
                          )
                        }
                        if (
                          !currencyDecimalValidate(
                            num,
                            getFieldValue('currency')
                          )
                        ) {
                          return Promise.reject('Please input a valid amount')
                        }
                        return Promise.resolve()
                      }
                    })
                  ]}
                >
                  <Input
                    style={{ width: 180 }}
                    prefix={
                      watchCurrency == null || watchCurrency == ''
                        ? ''
                        : CURRENCY[watchCurrency].symbol
                    }
                    disabled={watchDiscountType == 1 || !formEditable}
                  />
                </Form.Item>
              </SubForm>
              <Form.Item
                label="One-time or recurring"
                name="billingType"
                className=""
                rules={[
                  {
                    required: true,
                    message: 'Please choose your billing type!'
                  }
                ]}
              >
                <Select
                  style={{ width: 180 }}
                  options={[
                    { value: 1, label: 'One time use' },
                    { value: 2, label: 'Recurring' }
                  ]}
                />
              </Form.Item>
              <SubForm>
                <Form.Item
                  label="Recurring cycle"
                  extra="How many billing cycles this discount code can be applied on a
              recurring subscription (0 means no-limit)."
                >
                  <Form.Item
                    noStyle
                    name="cycleLimit"
                    rules={[
                      {
                        required: watchBillingType != 1,
                        message: 'Please input your cycleLimit!'
                      },
                      () => ({
                        validator(_, value) {
                          const num = Number(value)
                          if (!Number.isInteger(num)) {
                            return Promise.reject(
                              'Please input a valid cycle limit number between 0 ~ 1000.'
                            )
                          }
                          if (isNaN(num) || num < 0 || num > 999) {
                            return Promise.reject(
                              'Please input a valid cycle limit number between 0 ~ 1000.'
                            )
                          }
                          return Promise.resolve()
                        }
                      })
                    ]}
                  >
                    <Input
                      style={{ width: 180 }}
                      disabled={watchBillingType == 1 || !formEditable}
                    />
                    {/* 1: one-time use */}
                  </Form.Item>
                </Form.Item>
              </SubForm>

              <Form.Item
                label="Code Apply Date Range"
                name="validityRange"
                rules={[
                  {
                    required: true,
                    message: 'Please choose your validity range!'
                  },
                  () => ({
                    validator(_, value) {
                      if (value[0] == null || value[1] == null) {
                        return Promise.reject(
                          'Please select a valid date range.'
                        )
                      }
                      const d = new Date()
                      const sec = Math.round(d.getTime() / 1000)
                      if (value[1].unix() < sec) {
                        return Promise.reject(
                          'End date must be greater than now.'
                        )
                      }
                      return Promise.resolve()
                    }
                  })
                ]}
              >
                <RangePicker
                  showTime
                  disabled={!canActiveItemEdit(code?.status)}
                />
              </Form.Item>
              <Form.Item
                label="Apply to which plans"
                name="planIds"
                rules={[
                  {
                    required: watchPlanIds != null && watchPlanIds.length > 0
                  },
                  () => ({
                    validator(_, plans) {
                      if (plans == null || plans.length == 0) {
                        return Promise.resolve()
                      }
                      for (let i = 0; i < plans.length; i++) {
                        if (planList.findIndex((p) => p.id == plans[i]) == -1) {
                          return Promise.reject(
                            `${getPlanLabel(plans[i])} doesn't exist in plan list, please remove it.`
                          )
                        }
                      }
                      return Promise.resolve()
                    }
                  })
                ]}
                extra="If no plan is selected, the discount code will be applied to all plans."
              >
                <Select
                  mode="multiple"
                  disabled={!canActiveItemEdit(code?.status)}
                  allowClear
                  style={{ width: '100%' }}
                  options={planList.map((p) => ({
                    label: getPlanLabel(p.id),
                    value: p.id
                  }))}
                />
              </Form.Item>
            </div>
            <div className="w-1/2 pl-10">
              <div className="mb-6 flex items-center">
                <Divider
                  type="vertical"
                  style={{
                    backgroundColor: '#1677FF',
                    width: '3px',
                    height: '28px',
                    marginLeft: 0
                  }}
                />
                <div className="text-lg">Advanced configuration</div>
              </div>
              <Row
                className="border-1 mb-3 flex h-16 items-center rounded-lg border-solid border-[#D9D9D9] bg-[#FAFAFA]"
                gutter={[8, 8]}
              >
                <Col span={20}>
                  <div className="ml-2">
                    Enable advanced configuration with one click
                  </div>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  {' '}
                  <Form.Item name="advance" noStyle={true}>
                    <Switch disabled={!canActiveItemEdit(code?.status)} />
                  </Form.Item>
                </Col>
              </Row>
              <div className="mb-2 mt-6">Discount Code Applicable Scope</div>
              <Form.Item name="userScope">
                <Radio.Group
                  disabled={
                    !watchAdvancedConfig || !canActiveItemEdit(code?.status)
                  }
                >
                  <Space direction="vertical">
                    <Radio value={0}>Apply for all</Radio>
                    <Radio value={1}>Apply only for new users </Radio>
                    <Radio value={2}>Apply only for renewals</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
              <Divider style={{ margin: '24px 0' }} />{' '}
              <Row>
                <Col span={20} className="flex items-center">
                  Apply only for upgrades&nbsp;{' '}
                  <Popover
                    overlayStyle={{ maxWidth: '250px' }}
                    content={
                      'A plan which costs more per month, switching from Silver yearly (500/year) to Gold monthly (300/month) is not an upgrade.'
                    }
                  >
                    <InfoCircleOutlined className="cursor-pointer" />
                  </Popover>
                </Col>
                <Col span={4} className="flex items-center justify-end">
                  <Form.Item name="upgradeOnly" noStyle={true}>
                    <Switch
                      disabled={
                        !watchAdvancedConfig || !canActiveItemEdit(code?.status)
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider style={{ margin: '24px 0' }} />{' '}
              <Row>
                <Col span={20} className="flex items-center">
                  Apply only for switching to longer subscriptions&nbsp;{' '}
                  <Popover
                    overlayStyle={{ maxWidth: '250px' }}
                    content={
                      'Example: switching from a Team monthly plan to a Team yearly plan.'
                    }
                  >
                    <InfoCircleOutlined className="cursor-pointer" />
                  </Popover>
                </Col>
                <Col span={4} className="flex items-center justify-end">
                  <Form.Item name="upgradeLongerOnly" noStyle={true}>
                    <Switch
                      disabled={
                        !watchAdvancedConfig || !canActiveItemEdit(code?.status)
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider style={{ margin: '24px 0' }} />{' '}
              <Row>
                <Col span={20} className="flex items-center">
                  Same user cannot use the same discount code again
                </Col>
                <Col span={4} className="flex items-center justify-end">
                  <Form.Item name="userLimit" noStyle={true}>
                    <Switch
                      disabled={
                        !watchAdvancedConfig || !canActiveItemEdit(code?.status)
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>
        </Form>
      )}
      <div className={`flex ${isNew ? 'justify-end' : 'justify-between'}`}>
        {!isNew && (
          <Popconfirm
            title="Archive Confirm"
            description="Are you sure to archive this discount code?"
            onConfirm={onDelete}
            showCancel={false}
            okText="Yes"
          >
            <Button danger>Archive</Button>
          </Popconfirm>
        )}

        <div className="flex justify-center gap-4">
          <Button onClick={goBack}>Go back</Button>
          {!isNew && (
            <Button onClick={goToUsageDetail} disabled={code?.status == 1}>
              View usage detail
            </Button>
          )}
          {!isNew && (
            <Button onClick={toggleActivate}>
              {title(toggleActiveButtonAction)}
            </Button>
          )}

          {(code?.status !== DiscountCodeStatus.EXPIRED || isNew) && (
            <Button onClick={form.submit} type="primary">
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Index
