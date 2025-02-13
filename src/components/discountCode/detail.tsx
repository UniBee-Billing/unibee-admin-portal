import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
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
import { useSkipFirstRender } from '../../hooks'
import {
  createDiscountCodeReq,
  deleteDiscountCodeReq,
  getDiscountCodeDetailWithMore,
  getPlanList,
  toggleDiscountCodeActivateReq,
  updateDiscountCodeReq
} from '../../requests'
import {
  DiscountCode,
  DiscountCodeApplyType,
  DiscountCodeBillingType,
  DiscountCodeStatus,
  DiscountType,
  IPlan,
  PlanStatus,
  PlanType
} from '../../shared.types'
import { useAppConfigStore, useMerchantInfoStore } from '../../stores'
import { title } from '../../utils'
import { getDiscountCodeStatusTagById } from '../ui/statusTag'
import { DISCOUNT_CODE_UPGRADE_SCOPE, formatQuantity } from './helpers'
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
  planApplyType: DiscountCodeApplyType.ALL,
  planIds: [],
  quantity: 0,
  advance: false,
  userScope: 0,
  userLimit: true,
  upgradeScope: DISCOUNT_CODE_UPGRADE_SCOPE.ALL,
  upgradeOnly: false,
  upgradeLongerOnly: false
}

const CAN_EDIT_ITEM_STATUSES = [
  DiscountCodeStatus.EDITING,
  DiscountCodeStatus.ACTIVE,
  DiscountCodeStatus.DEACTIVE
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
  // const watchPlanIds = Form.useWatch('planIds', form)
  const watchAdvancedConfig = Form.useWatch('advance', form)
  const watchUpgradeOnly = Form.useWatch('upgradeOnly', form)
  const watchLongerUpgradeOnly = Form.useWatch('upgradeLongerOnly', form)
  const watchApplyType = Form.useWatch('planApplyType', form)

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

    // if discount.currency is EUR, and discountType == fixed-amt, then filter the planList to contain only euro plans
    let plans =
      planList.plans == null ? [] : planList.plans.map((p: IPlan) => p.plan)
    if (discount.discountType == DiscountType.AMOUNT) {
      plans = plans.filter((p: IPlan) => p.currency == discount.currency)
    }
    setPlanList(plans)
    planListRef.current =
      planList.plans == null ? [] : planList.plans.map((p: IPlan) => p.plan)

    discount.validityRange = [
      dayjs(discount.startTime * 1000),
      dayjs(discount.endTime * 1000)
    ]
    if (discount.discountType == DiscountType.AMOUNT) {
      discount.discountAmount /= CURRENCY[discount.currency].stripe_factor
    } else if (discount.discountType == DiscountType.PERCENTAGE) {
      discount.discountPercentage /= 100
    }

    if (discount.upgradeOnly) {
      discount.upgradeScope = DISCOUNT_CODE_UPGRADE_SCOPE.UPGRADE_ONLY
    } else if (discount.upgradeLongerOnly) {
      discount.upgradeScope = DISCOUNT_CODE_UPGRADE_SCOPE.LONGER_ONLY
    } else {
      discount.upgradeScope = DISCOUNT_CODE_UPGRADE_SCOPE.ALL
    }

    discount.userLimit = numBoolConvert(discount.userLimit)
    setCode(discount)
  }

  // for creating new code, there is no codeDetail to fetch.
  const fetchPlans = async () => {
    setLoading(true)
    const [res, err] = await getPlanList(
      {
        type: [PlanType.MAIN],
        status: [PlanStatus.ACTIVE],
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
    // if NEW_CODE.currency is EUR, and discountType == fixed-amt, then filter the planList to contain only euro plans
    let planList = plans == null ? [] : plans.map((p: IPlan) => p.plan)
    if (DEFAULT_CODE.discountType == DiscountType.AMOUNT) {
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

    if (code.discountType == DiscountType.PERCENTAGE) {
      delete code.currency
      delete code.discountAmount
    } else {
      delete code.discountPercentage
      code.discountAmount *= CURRENCY[code.currency].stripe_factor
      code.discountAmount = toFixedNumber(code.discountAmount, 2)
    }

    if (code.upgradeScope == DISCOUNT_CODE_UPGRADE_SCOPE.ALL) {
      code.upgradeOnly = false
      code.upgradeLongerOnly = false
    } else if (code.upgradeScope == DISCOUNT_CODE_UPGRADE_SCOPE.LONGER_ONLY) {
      code.upgradeOnly = false
      code.upgradeLongerOnly = true
    } else {
      code.upgradeOnly = true
      code.upgradeLongerOnly = false
    }
    delete code.upgradeScope

    if (code.planApplyType == DiscountCodeApplyType.ALL) {
      code.planIds = []
    }

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
    if (watchBillingType == DiscountCodeBillingType.ONE_TIME) {
      //  one-time use: you can only use this code once, aka: cycleLimit is always 1
      form.setFieldValue('cycleLimit', 1)
    }
  }, [watchBillingType])

  useEffect(() => {
    if (watchDiscountType == DiscountType.AMOUNT) {
      setPlanList(
        planListRef.current.filter((p) => p.currency == watchCurrency)
      )
    }
  }, [watchDiscountType, watchCurrency])

  // this hook is to prevent the running in initial render, useEffect() will cause infinite running due to these 2 value's circular dependencies
  useSkipFirstRender(() => {
    form.setFieldValue('upgradeLongerOnly', !watchUpgradeOnly)
  }, [watchUpgradeOnly])

  useSkipFirstRender(() => {
    form.setFieldValue('upgradeOnly', !watchLongerUpgradeOnly)
  }, [watchLongerUpgradeOnly])

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
          <div className="flex gap-4">
            <Tabs
              defaultActiveKey="general"
              className="w-2/3"
              items={[
                {
                  key: 'general',
                  label: 'General Configuration',
                  children: (
                    <GeneralConfigTab
                      form={form}
                      code={code}
                      planList={planList}
                      getPlanLabel={getPlanLabel}
                      setIsOpenUpdateDiscountCodeQuantityModal={
                        setIsOpenUpdateDiscountCodeQuantityModal
                      }
                      formEditable={formEditable}
                      watchApplyType={watchApplyType}
                      watchBillingType={watchBillingType}
                      isNew={isNew}
                      watchDiscountType={watchDiscountType}
                      watchCurrency={watchCurrency}
                    />
                  )
                },
                {
                  key: 'advanced',
                  label: 'Advanced Configuration',
                  children: (
                    <AdvancedConfigTab
                      form={form}
                      code={code}
                      formEditable={formEditable}
                      isNew={isNew}
                      watchAdvancedConfig={watchAdvancedConfig}
                    />
                  )
                }
              ]}
            />
            <div className="w-1/3">
              <SummaryTab />
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
            <Button
              onClick={goToUsageDetail}
              disabled={code?.status == DiscountCodeStatus.EDITING}
            >
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

const GeneralConfigTab = ({
  form,
  code,
  isNew,
  formEditable,
  watchApplyType,
  watchBillingType,
  watchDiscountType,
  watchCurrency,
  planList,
  getPlanLabel,
  setIsOpenUpdateDiscountCodeQuantityModal
}: {
  form: FormInstance<any>
  code: DiscountCode
  isNew: boolean
  formEditable: boolean
  watchApplyType: number
  watchBillingType: number
  watchDiscountType: number
  watchCurrency: string
  planList: IPlan[]
  getPlanLabel: (planId: number) => string
  setIsOpenUpdateDiscountCodeQuantityModal: Dispatch<SetStateAction<boolean>>
}) => {
  const appStore = useAppConfigStore()
  const SubForm = ({ children }: PropsWithChildren) => (
    <div className="my-5 ml-[180px] rounded-xl bg-[#FAFAFA] px-4 py-6">
      {children}
    </div>
  )
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
  return (
    <div>
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
              required: watchDiscountType == DiscountType.PERCENTAGE,
              message: 'Please choose your discount percentage!'
            },
            () => ({
              validator(_, value) {
                if (watchDiscountType == DiscountType.AMOUNT) {
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
            disabled={watchDiscountType == DiscountType.AMOUNT || !formEditable}
            suffix="%"
          />
        </Form.Item>
        <Form.Item
          label="Currency"
          name="currency"
          rules={[
            {
              required: watchDiscountType != DiscountType.PERCENTAGE,
              message: 'Please select your currency!'
            }
          ]}
        >
          <Select
            disabled={
              watchDiscountType == DiscountType.PERCENTAGE || !formEditable
            }
            style={{ width: 180 }}
            options={appStore.supportCurrency.map((c) => ({
              label: c.Currency,
              value: c.Currency
            }))}
          />
        </Form.Item>
        <Form.Item
          label="Discount Amount"
          name="discountAmount"
          dependencies={['currency']}
          className="mb-0"
          rules={[
            {
              required: watchDiscountType != DiscountType.PERCENTAGE,
              message: 'Please input your discount amount!'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (watchDiscountType == DiscountType.PERCENTAGE) {
                  return Promise.resolve()
                }
                const num = Number(value)
                if (isNaN(num) || num <= 0) {
                  return Promise.reject('Please input a valid amount (> 0).')
                }
                if (!currencyDecimalValidate(num, getFieldValue('currency'))) {
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
            disabled={
              watchDiscountType == DiscountType.PERCENTAGE || !formEditable
            }
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
                required: watchBillingType != DiscountCodeBillingType.ONE_TIME,
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
              disabled={
                watchBillingType == DiscountCodeBillingType.ONE_TIME ||
                !formEditable
              }
            />
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
                return Promise.reject('Please select a valid date range.')
              }
              const d = new Date()
              const sec = Math.round(d.getTime() / 1000)
              if (value[1].unix() < sec) {
                return Promise.reject('End date must be greater than now.')
              }
              return Promise.resolve()
            }
          })
        ]}
      >
        <RangePicker showTime disabled={!canActiveItemEdit(code?.status)} />
      </Form.Item>
      <Form.Item label="Apply Discount Code To" name="planApplyType">
        <Radio.Group disabled={!canActiveItemEdit(code?.status)}>
          <Space direction="vertical">
            <Radio value={DiscountCodeApplyType.ALL}>All plans</Radio>
            <Radio value={DiscountCodeApplyType.SELECTED}>Selected plans</Radio>
            <Radio value={DiscountCodeApplyType.NOT_SELECTED}>
              All plans except selected plans
            </Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        hidden={watchApplyType == DiscountCodeApplyType.ALL}
        name="planIds"
        rules={[
          {
            // required: watchPlanIds != null && watchPlanIds.length > 0
            required: watchApplyType != DiscountCodeApplyType.ALL,
            message: 'Plan list should not be empty.'
          },
          () => ({
            validator(_, plans) {
              if (
                watchApplyType !== DiscountCodeApplyType.ALL &&
                (plans == null || plans.length == 0)
              ) {
                return Promise.reject(
                  `Please select the plans you ${watchApplyType == DiscountCodeApplyType.SELECTED ? 'want to apply' : "don't want to apply"}.`
                )
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
        extra={
          watchApplyType == DiscountCodeApplyType.SELECTED
            ? 'The discount code will be applied to selected plans'
            : 'The discount code will be applied to all plans except selected plans'
        }
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
  )
}

const AdvancedConfigTab = ({
  form,
  code,
  isNew,
  watchAdvancedConfig,
  formEditable
}: {
  form: FormInstance<any>
  code: DiscountCode
  isNew: boolean
  watchAdvancedConfig: boolean
  formEditable: boolean
}) => {
  return (
    <div>
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
          disabled={!watchAdvancedConfig || !canActiveItemEdit(code?.status)}
        >
          <Space direction="vertical">
            <Radio value={0}>Apply for all</Radio>
            <Radio value={1}>Apply only for new users </Radio>
            <Radio value={2}>Apply only for renewals</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
      <Divider style={{ margin: '24px 0' }} />{' '}
      <div className="mb-2 mt-6">Applicable Subscription Limits</div>
      <Form.Item name="upgradeScope">
        <Radio.Group
          disabled={!watchAdvancedConfig || !canActiveItemEdit(code?.status)}
        >
          <Space direction="vertical">
            <Radio value={DISCOUNT_CODE_UPGRADE_SCOPE.ALL}>Apply for all</Radio>
            <Radio value={DISCOUNT_CODE_UPGRADE_SCOPE.UPGRADE_ONLY}>
              Apply only for upgrades (same recurring cycle)
            </Radio>
            <Radio value={DISCOUNT_CODE_UPGRADE_SCOPE.LONGER_ONLY}>
              Apply only for switching to any long subscriptions
            </Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
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
  )
}

const SummaryTab = () => {
  return (
    <div className="px-4">
      <div className="flex h-12 items-center text-lg">Summary</div>
      <Divider className="my-6" />
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
      general content herer
      <div className="mb-6 flex items-center">
        <Divider
          type="vertical"
          style={{
            backgroundColor: '#1677FF',
            width: '3px',
            height: '28px'
          }}
        />
        <div className="text-lg">Advanced configuration</div>
      </div>
      advanced content here
    </div>
  )
}
