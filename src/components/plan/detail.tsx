import {
  CheckCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Spin,
  Switch,
  Tag,
  message
} from 'antd'
import { Currency } from 'dinero.js'
import update from 'immutability-helper'
import React, { useEffect, useRef, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom'
import {
  currencyDecimalValidate,
  isValidMap,
  randomString,
  showAmount,
  toFixedNumber
} from '../../helpers'
import {
  activatePlan,
  deletePlanReq,
  getPlanDetailWithMore,
  savePlan,
  togglePublishReq
} from '../../requests'
import {
  IBillableMetrics,
  IPlan,
  IProduct,
  PlanPublishStatus,
  PlanStatus,
  PlanType
} from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import { PlanStatusTag } from '../ui/statusTag'

interface Metric {
  metricId: number
  metricLimit: number
}

type TMetricsItem = {
  localId: string
  metricId?: number
  metricLimit?: number | string
}
type TNewPlan = Omit<
  IPlan,
  | 'id'
  | 'amount'
  | 'createTime'
  | 'companyId'
  | 'merchantId'
  | 'productId'
  | 'product'
>

const DEFAULT_NEW_PLAN: TNewPlan = {
  currency: 'EUR',
  planName: '',
  description: '',
  intervalUnit: 'month',
  intervalCount: 1,
  status: PlanStatus.EDITING,
  publishStatus: PlanPublishStatus.UNPUBLISHED,
  type: PlanType.MAIN,
  addonIds: [],
  metadata: '',
  enableTrial: false,
  trialAmount: 0,
  trialDurationTime: 0,
  trialDemand: false, // 'paymentMethod' | '' | boolean, backend requires this field to be a fixed string of 'paymentMethod' to represent true or empty string '' to represent false, but to ease the UI/UX, front-end use <Switch />
  cancelAtTrialEnd: true //  0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UI, front-end use <Switch />
} as const // mark every props readonly

const TIME_UNITS = [
  { label: 'hours', value: 60 * 60 },
  { label: 'days', value: 60 * 60 * 24 },
  { label: 'weeks', value: 60 * 60 * 24 * 7 },
  { label: 'months(30days)', value: 60 * 60 * 24 * 30 }
]
const secondsToUnit = (sec: number) => {
  const units = [...TIME_UNITS].sort((a, b) => b.value - a.value)
  for (let i = 0; i < units.length; i++) {
    if (sec % units[i].value === 0) {
      return [sec / units[i].value, units[i].value] // if sec is 60 * 60 * 24 * 30 * 3, then return [3, 60 * 60 * 24 * 30 * 3]
    }
  }
  throw Error('Invalid time unit')
}

const unitToSeconds = (value: number, unit: number) => {
  return value * unit
}

const { Option } = Select

const Index = () => {
  const appConfig = useAppConfigStore()
  const location = useLocation()
  const goBackToPlanList = () => {
    // when user navigate from planList to current planDetail, planList will pass a state.from url string which might contain filters like planStatus/planType/sorting .
    // going back to this url will have those filters applied.
    if (location.state?.from) {
      navigate(location.state.from)
    } else {
      navigate(
        `/plan/list?productId=${productDetail != null ? productDetail.id : 0}`
      )
    }
  }
  const params = useParams()
  const planId = params.planId // http://localhost:5174/plan/270?productId=0, planId is 270
  const isNew = planId == null
  const [searchParams, _] = useSearchParams()
  const productId = useRef(parseInt(searchParams.get('productId') ?? '0'))
  const [productDetail, setProductDetail] = useState<IProduct | null>(null)
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [publishing, setPublishing] = useState(false) // when toggling publish/unpublish
  const [plan, setPlan] = useState<IPlan | TNewPlan | null>(
    isNew ? DEFAULT_NEW_PLAN : null
  ) // plan obj is used for Form's initialValue, any changes is handled by Form itself, not updated here.
  // it's better to use useRef to save plan obj.
  const [addons, setAddons] = useState<IPlan[]>([]) // all the active addons we have (addon has the same structure as Plan).
  // selectAddons is used for options in "addon <Select />"", its option items will change based on other props(currency, intervalUnit/Count, etc)
  // addons variable is all the active addons we have, use this do some filtering, then save the result in selectAddons
  const [selectAddons, setSelectAddons] = useState<IPlan[]>([]) // addon list in <Select /> for the current main plan, this list will change based on different plan props(interval count/unit/currency)
  const [selectOnetime, setSelectOnetime] = useState<IPlan[]>([]) // one-time payment addon list in <Select /> for the current main plan, this list will change based on different plan currency
  // one plan can have many regular addons, but only ONE one-time payment addon, but backend support multiple.
  const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([]) // all the billable metrics, not used for edit, but used in <Select /> for user to choose.
  const [selectedMetrics, setSelectedMetrics] = useState<TMetricsItem[]>([
    // metrics are hard to let form handle change, I have to manually handle it
    { localId: randomString(8) }
  ])
  const [trialLengthUnit, setTrialLengthUnit] = useState(
    TIME_UNITS.find((u) => u.label == 'days')?.value
  ) // default unit is days
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const itvCountValue = Form.useWatch('intervalCount', form)
  const itvCountUnit = Form.useWatch('intervalUnit', form)
  const currencyWatch = Form.useWatch('currency', form)
  const planTypeWatch = Form.useWatch('type', form)
  const enableTrialWatch = Form.useWatch('enableTrial', form)

  const onTrialLengthUnitChange = (val: number) => setTrialLengthUnit(val)

  // disable editing for 4 keys fields after activate(currency, price, intervalUnit/Count)
  const disableAfterActive = useRef(
    plan?.status == PlanStatus.ACTIVE &&
      plan.publishStatus == PlanPublishStatus.UNPUBLISHED
  )
  let savable =
    isNew ||
    plan?.status == PlanStatus.EDITING ||
    (plan?.status == PlanStatus.ACTIVE &&
      plan.publishStatus == PlanPublishStatus.UNPUBLISHED)

  let formDisabled =
    (plan?.status == PlanStatus.ACTIVE &&
      plan.publishStatus == PlanPublishStatus.PUBLISHED) ||
    plan?.status == PlanStatus.HARD_ARCHIVED ||
    plan?.status == PlanStatus.SOFT_ARCHIVED ||
    productDetail === null // (plan active && published) or productId is invalid(productDetail is null)

  const selectAfter = (
    <Select
      value={trialLengthUnit}
      style={{ width: 150 }}
      onChange={onTrialLengthUnitChange}
      disabled={!enableTrialWatch || formDisabled}
    >
      {TIME_UNITS.map((u) => (
        <Option key={u.label} value={u.value}>
          {u.label}
        </Option>
      ))}
    </Select>
  )

  const getCurrency = () => appConfig.currency[currencyWatch as Currency]

  const getAmount = (amt: number, currency: Currency) => {
    const CURRENCY = appConfig.currency[currency]
    if (CURRENCY == undefined) {
      return 0
    }
    return amt / CURRENCY.Scale
  }

  useEffect(() => {
    if (!isNew && plan?.status != PlanStatus.EDITING) {
      // even we can edit active plan, but these 3 keys fields are not editable.
      // editing existing plan && not editing
      return
    }
    if (
      !isNew &&
      (plan?.type == PlanType.ADD_ON || plan?.type == PlanType.ONE_TIME_ADD_ON)
    ) {
      return
    }
    // main plan's currency/intervalUnit-Count must match its addons currency/*** */
    const newAddons = addons.filter(
      (a) =>
        a.intervalCount == itvCountValue &&
        a.intervalUnit == itvCountUnit &&
        a.currency == currencyWatch
    )
    setSelectAddons(newAddons)

    if (isNew) {
      setSelectOnetime(addons.filter((a) => a.currency === currencyWatch))
    }
  }, [itvCountUnit, itvCountValue, currencyWatch])

  const onSave = async (values: unknown) => {
    if (productDetail === null) {
      return
    }
    const CURRENCY = getCurrency()
    if (CURRENCY == undefined) {
      return
    }
    const f = JSON.parse(JSON.stringify(values))
    f.amount = Number(f.amount)
    f.amount *= CURRENCY.Scale
    f.amount = toFixedNumber(f.amount, 2)
    f.intervalCount = Number(f.intervalCount)

    if (!f.enableTrial) {
      f.trialAmount = 0 // if trialEnabled is false, these 4 field values have no meaning, ....
      f.trialDurationTime = 0 // but I still need to reset them to default, ...
      f.trialDemand = f.trialDemand ? 'paymentMethod' : '' // 'paymentMethod' | '' | boolean, backend requires this field to be a fixed string of 'paymentMethod' or '', but to ease the UX, front-end use <Switch />
      f.cancelAtTrialEnd = f.cancelAtTrialEnd ? 0 : 1 // backend requires this field to be a number of 1 | 0, but to ease the UX, front-end use <Switch />
    } else {
      f.trialAmount = Number(f.trialAmount)
      f.trialAmount *= CURRENCY.Scale
      f.trialAmount = toFixedNumber(f.trialAmount, 2)
      f.trialDurationTime = Number(f.trialDurationTime)
      f.trialDurationTime = unitToSeconds(
        f.trialDurationTime,
        trialLengthUnit as number
      )
      f.trialDemand = f.trialDemand ? 'paymentMethod' : ''
      f.cancelAtTrialEnd = f.cancelAtTrialEnd ? 0 : 1
    }
    delete f.enableTrial

    if (!isNew) {
      f.planId = f.id
      delete f.id
      delete f.status
      delete f.publishStatus
      delete f.type // once plan created, you cannot change its type(main plan, addon)
    }
    if (planTypeWatch == PlanType.ONE_TIME_ADD_ON) {
      // one-time payment plans don't have these props
      delete f.intervalCount
      delete f.intervalUnit
      delete f.metricLimits
      delete f.onetimeAddonIds
    }

    if (isNew) {
      f.productId = Number(productId.current)
    }

    if (!isValidMap(f.metadata)) {
      message.error('Invalid custom data')
      return
    }

    if (plan?.status == PlanStatus.ACTIVE) {
      // when in active, these fields are not editable. Although disabled, but backend will complain if included in body
      delete f.intervalCount
      delete f.intervalUnit
      delete f.amount
      delete f.currency
    }

    let m = JSON.parse(JSON.stringify(selectedMetrics)) // selectedMetrics.map(metric => ({metricLimit: Number(metric.metricLimit)}))
    m = m.map((metrics: Metric) => ({
      metricId: metrics.metricId,
      metricLimit: Number(metrics.metricLimit)
    }))
    m = m.filter((metric: Metric) => !isNaN(metric.metricLimit))
    f.metricLimits = m

    setLoading(true)
    const [updatedPlan, err] = await savePlan(f, isNew)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    message.success(`Plan ${isNew ? 'created' : 'saved'}`)
    productId.current = updatedPlan.productId
    if (isNew) {
      navigate(`/plan/${updatedPlan.id}?productId=${updatedPlan.productId}`, {
        replace: true
      })
    }
  }

  const onActivate = async () => {
    const planId = Number(params.planId)
    if (isNaN(planId)) {
      message.error('Invalid planId')
      return
    }
    setActivating(true)
    const [_, err] = await activatePlan(planId)
    setActivating(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Plan activated')
    fetchData()
  }

  const onDelete = async () => {
    const planId = Number(params.planId)
    if (isNaN(planId)) {
      message.error('Invalid planId')
      return
    }
    if (isNew) {
      return
    }
    if (plan?.status !== PlanStatus.EDITING) {
      return
    }
    setLoading(true)
    const [_, err] = await deletePlanReq(planId)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Plan deleted')
    navigate(
      `/plan/list?productId=${productDetail != null ? productDetail.id : 0}`
    )
  }

  const fetchData = async () => {
    const planId = Number(params.planId)
    setLoading(true)
    const [detailRes, err] = await getPlanDetailWithMore(
      isNew ? null : planId,
      fetchData
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    const { planDetail, addonList, metricsList, productList } = detailRes
    if (productList.products != null) {
      const productDetail = productList.products.find(
        (p: IProduct) => p.id == productId.current
      )
      if (productDetail != undefined) {
        setProductDetail(productDetail)
      }
    }
    const addons =
      addonList.plans == null
        ? []
        : addonList.plans
            .map(({ plan }: IPlan) => plan)
            .filter((plan: IPlan) => plan.productId === productId.current)
    const regularAddons = addons.filter((p: IPlan) => p.type == PlanType.ADD_ON)
    const onetimeAddons = addons.filter(
      (p: IPlan) => p.type == PlanType.ONE_TIME_ADD_ON
    )
    setAddons(regularAddons)
    setMetricsList(
      metricsList.merchantMetrics == null ? [] : metricsList.merchantMetrics
    )
    if (isNew) {
      setSelectAddons(
        regularAddons.filter(
          (a: IPlan) =>
            a.currency == DEFAULT_NEW_PLAN.currency &&
            a.intervalUnit == DEFAULT_NEW_PLAN.intervalUnit &&
            a.intervalCount == DEFAULT_NEW_PLAN.intervalCount
        )
      )
      setSelectOnetime(
        onetimeAddons.filter(
          (a: IPlan) => a.currency == DEFAULT_NEW_PLAN.currency
        )
      )
      return
    }
    // for editing existing plan, we continue with planDetailRes

    disableAfterActive.current =
      planDetail.plan.status == PlanStatus.ACTIVE &&
      planDetail.plan.publishStatus == PlanPublishStatus.UNPUBLISHED

    savable =
      planDetail.plan.status == PlanStatus.EDITING ||
      (planDetail.plan.status == PlanStatus.ACTIVE &&
        planDetail.plan.publishStatus == PlanPublishStatus.UNPUBLISHED)

    formDisabled =
      planDetail.plan.status == PlanStatus.ACTIVE &&
      planDetail.plan.publishStatus == PlanPublishStatus.PUBLISHED

    // plan obj and addon obj are at the same level in planDetailRes.data.data obj
    // but I want to put addonIds obj as a props of the local plan obj.
    planDetail.plan.amount = getAmount(
      planDetail.plan.amount,
      planDetail.plan.currency
    ) // /= 100; // TODO: addon also need to do the same, use a fn to do this

    planDetail.plan.addonIds =
      planDetail.addonIds == null ? [] : planDetail.addonIds
    planDetail.plan.onetimeAddonIds =
      planDetail.onetimeAddonIds == null ? [] : planDetail.onetimeAddonIds

    let metadata = planDetail.plan.metadata
    if (metadata != null && metadata != '') {
      try {
        metadata = JSON.stringify(metadata)
      } catch {
        metadata = ''
      }
    }
    planDetail.plan.metadata = metadata

    const trialAmount = Number(planDetail.plan.trialAmount)
    const trialDurationTime = Number(planDetail.plan.trialDurationTime)
    if (!isNaN(trialDurationTime) && trialDurationTime > 0) {
      planDetail.plan.enableTrial = true
      planDetail.plan.trialAmount = getAmount(
        trialAmount,
        planDetail.plan.currency
      )
      const [val, unit] = secondsToUnit(planDetail.plan.trialDurationTime)
      planDetail.plan.trialDurationTime = val
      setTrialLengthUnit(unit)
      //  trialDemand?: 'paymentMethod' | '' | boolean // back
      planDetail.plan.trialDemand =
        planDetail.plan.trialDemand == 'paymentMethod' ? true : false
      //   cancelAtTrialEnd?: 0 | 1 | boolean // backend requires this field to be a number of 1 | 0, but to ease the UX, front-end use <Switch />
      planDetail.plan.cancelAtTrialEnd =
        planDetail.plan.cancelAtTrialEnd == 1 ? false : true
    } else {
      planDetail.plan.enableTrial = false
      planDetail.plan.trialAmount = 0
      planDetail.plan.trialDurationTime = 0
      planDetail.plan.trialDemand =
        planDetail.plan.trialDemand == 'paymentMethod' ? true : false
      planDetail.plan.cancelAtTrialEnd =
        planDetail.plan.cancelAtTrialEnd == 1 ? false : true
    }

    setPlan(planDetail.plan)
    form.setFieldsValue(planDetail.plan)

    // if empty, insert an placeholder item.
    const metrics =
      null == planDetail.metricPlanLimits ||
      planDetail.metricPlanLimits.length == 0
        ? [{ localId: randomString(8) }]
        : planDetail.metricPlanLimits.map((m: Metric) => ({
            localId: randomString(8),
            metricId: m.metricId,
            metricLimit: m.metricLimit
          }))
    setSelectedMetrics(metrics)

    setSelectAddons(
      regularAddons.filter(
        (a: IPlan) =>
          a.intervalCount == planDetail.plan.intervalCount &&
          a.intervalUnit == planDetail.plan.intervalUnit &&
          a.currency == planDetail.plan.currency
      )
    )
    setSelectOnetime(
      onetimeAddons.filter((a: IPlan) => a.currency == planDetail.plan.currency)
    )
  }

  // used only when editing an active plan
  const togglePublish = async () => {
    setPublishing(true)
    const [_, err] = await togglePublishReq({
      planId: (plan as IPlan).id,
      publishAction:
        plan!.publishStatus == PlanPublishStatus.UNPUBLISHED
          ? 'PUBLISH'
          : 'UNPUBLISH'
    })
    if (null != err) {
      message.error(err.message)
      return
    }
    setPublishing(false)
    fetchData()
  }

  // it just adds an empty metrics item
  const addMetrics = () => {
    if (formDisabled) {
      return
    }
    const m: TMetricsItem = { localId: randomString(8) }
    setSelectedMetrics(update(selectedMetrics, { $push: [m] }))
  }

  const removeMetrics = (localId: string) => {
    if (formDisabled) {
      return
    }
    const idx = selectedMetrics.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      setSelectedMetrics(update(selectedMetrics, { $splice: [[idx, 1]] }))
    }
  }

  const updateMetrics =
    (localId: string) => (evt: React.ChangeEvent<HTMLInputElement>) => {
      const idx = selectedMetrics.findIndex((m) => m.localId == localId)
      if (idx != -1) {
        setSelectedMetrics(
          update(selectedMetrics, {
            [idx]: { metricLimit: { $set: evt.target.value } }
          })
        )
      }
    }

  const onMetricSelectChange = (localId: string) => (val: number) => {
    const idx = selectedMetrics.findIndex((m) => m.localId == localId)
    if (idx != -1) {
      const newMetrics = update(selectedMetrics, {
        [idx]: { metricId: { $set: val } }
      })
      setSelectedMetrics(newMetrics)
    }
  }

  const prettifyJSON = () => {
    const metadata = form.getFieldValue('metadata')
    if (metadata == '' || metadata == null) {
      return
    }
    try {
      const obj = JSON.parse(metadata)
      form.setFieldValue('metadata', JSON.stringify(obj, null, 4))
    } catch {
      message.error('Invalid custom data.')
      return
    }
  }

  useEffect(() => {
    fetchData()
  }, [planId]) // when creating new plan, url is: /plan/new?productId=0, planId is null,
  // when editing plan, url is: /plan/270?productId=0, planId is 270, after creating, url would become /plan/270?productId=0
  // I need to rerun fetchData to get the newly created plan detail, otherwise, planId is missing in form

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      {plan && (
        <Form
          form={form}
          onFinish={onSave}
          labelCol={{ flex: '186px' }}
          wrapperCol={{ flex: 1 }}
          colon={false}
          disabled={formDisabled}
          initialValues={plan}
        >
          {!isNew && (
            <Form.Item label="ID" name="id" hidden>
              <Input disabled />
            </Form.Item>
          )}

          <Form.Item label="Product name">
            <span>
              {productDetail != null ? (
                productDetail?.productName
              ) : (
                <Tag color="red">Invalid product</Tag>
              )}
            </span>
          </Form.Item>

          <Form.Item
            label="Plan Name"
            name="planName"
            rules={[
              {
                required: true,
                message: 'Please input your plan name!'
              }
            ]}
          >
            <Input.TextArea
              rows={2}
              style={{ width: '640px' }}
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Plan Description"
            name="description"
            rules={[
              {
                required: true,
                message: 'Please input your plan description!'
              }
            ]}
          >
            <Input.TextArea
              rows={4}
              style={{ width: '640px' }}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="External Plan Id" name="externalPlanId">
            <Input style={{ width: '180px' }} />
          </Form.Item>

          <Form.Item label="Status" name="status">
            {PlanStatusTag(plan.status)}
          </Form.Item>

          <Form.Item label="Is Published" name="publishStatus">
            <div>
              <span>
                {plan.publishStatus == PlanPublishStatus.PUBLISHED ? (
                  <CheckCircleOutlined
                    style={{ color: 'green', fontSize: '18px' }}
                  />
                ) : (
                  <MinusOutlined style={{ color: 'red', fontSize: '18px' }} />
                )}{' '}
              </span>
              <Button
                style={{ marginLeft: '12px' }}
                onClick={togglePublish}
                loading={publishing}
                disabled={
                  plan.status != PlanStatus.ACTIVE || publishing || loading
                }
              >
                {/* you can only publish/unpublish an active plan */}
                {plan.publishStatus == PlanPublishStatus.PUBLISHED
                  ? 'Unpublish'
                  : 'Publish'}
              </Button>
            </div>
          </Form.Item>
          {plan.status == PlanStatus.ACTIVE &&
            plan.publishStatus == PlanPublishStatus.PUBLISHED && (
              <div
                className="relative ml-2 text-xs text-gray-400"
                style={{ top: '-45px', left: '336px', width: '340px' }}
              >
                Unpublish to enable plan editing after activation.
              </div>
            )}

          <Form.Item
            label="Currency"
            name="currency"
            rules={[
              {
                required: true,
                message: 'Please select your plan currency!'
              }
            ]}
          >
            <Select
              disabled={disableAfterActive.current || formDisabled}
              style={{ width: 180 }}
              options={appConfig.supportCurrency.map((c) => ({
                value: c.Currency,
                label: c.Currency
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Price"
            name="amount"
            dependencies={['currency']}
            rules={[
              {
                required: true,
                message: 'Please input your plan price!'
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const num = Number(value)

                  if (isNaN(num) || num <= 0) {
                    return Promise.reject(`Please input a valid price (> 0).`)
                  }
                  if (
                    !currencyDecimalValidate(num, getFieldValue('currency'))
                  ) {
                    return Promise.reject('Please input a valid price')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <InputNumber
              disabled={disableAfterActive.current || formDisabled}
              style={{ width: 180 }}
              prefix={getCurrency()?.Symbol}
            />
          </Form.Item>

          <div>
            <Form.Item
              label="Interval Unit"
              name="intervalUnit"
              rules={[
                {
                  required: planTypeWatch != PlanType.ONE_TIME_ADD_ON,
                  message: 'Please select interval unit!'
                }
              ]}
            >
              <Select
                style={{ width: 180 }}
                disabled={
                  planTypeWatch == PlanType.ONE_TIME_ADD_ON ||
                  disableAfterActive.current ||
                  formDisabled
                } // one-time payment has no interval unit/count
                options={[
                  { value: 'day', label: 'day' },
                  { value: 'week', label: 'week' },
                  { value: 'month', label: 'month' },
                  { value: 'year', label: 'year' }
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Interval Count"
            name="intervalCount"
            rules={[
              {
                required: true,
                message: 'Please input interval count!'
              }
            ]}
          >
            <Input
              disabled={
                planTypeWatch == PlanType.ONE_TIME_ADD_ON ||
                disableAfterActive.current ||
                formDisabled
              }
              style={{ width: 180 }}
            />
            {/* one-time payment has no interval unit/count */}
          </Form.Item>

          <Form.Item label="Plan Type" name="type">
            <Select
              style={{ width: 180 }}
              disabled={!isNew || plan.status != PlanStatus.EDITING}
              options={[
                { value: PlanType.MAIN, label: 'Main plan' },
                { value: PlanType.ADD_ON, label: 'Addon' },
                { value: PlanType.ONE_TIME_ADD_ON, label: 'One time payment' }
              ]}
            />
          </Form.Item>

          {plan.type == PlanType.MAIN && (
            <Form.Item
              label="Add-ons"
              name="addonIds"
              dependencies={['currency', 'intervalCount', 'intervalUnit']}
              rules={[
                {
                  required: false,
                  message: ''
                },
                () => ({
                  validator(_, value) {
                    if (value == null || value.length == 0) {
                      return Promise.resolve()
                    }
                    for (const addonId of value) {
                      if (
                        selectAddons.findIndex((a) => a.id == addonId) == -1
                      ) {
                        return Promise.reject('Addon not found!')
                      }
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                disabled={
                  planTypeWatch == PlanType.ADD_ON ||
                  planTypeWatch == PlanType.ONE_TIME_ADD_ON ||
                  formDisabled
                } // you cannot add addon to another addon (or another one time payment)
                style={{ width: '100%' }}
                options={selectAddons.map((a) => ({
                  label: `${a.planName} (${showAmount(a.amount, a.currency)}/${a.intervalCount == 1 ? '' : a.intervalCount}${a.intervalUnit})`,
                  value: a.id
                }))}
              />
            </Form.Item>
          )}

          {plan.type == PlanType.MAIN && (
            <Form.Item
              label="One-time-payment add-on"
              name="onetimeAddonIds"
              dependencies={['currency']}
              rules={[
                {
                  required: false,
                  message: ''
                },
                () => ({
                  validator(_, value) {
                    if (value == null || value.length == 0) {
                      return Promise.resolve()
                    }
                    for (const addonId of value) {
                      if (
                        selectOnetime.findIndex((a) => a.id == addonId) == -1
                      ) {
                        return Promise.reject('Addon not found!')
                      }
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                disabled={
                  planTypeWatch == PlanType.ADD_ON ||
                  planTypeWatch == PlanType.ONE_TIME_ADD_ON ||
                  formDisabled
                } // you cannot add one-time payment addon to another addon (or another one time payment)
                style={{ width: '100%' }}
                options={selectOnetime.map((a) => ({
                  label: `${a.planName} (${showAmount(a.amount, a.currency)})`,
                  value: a.id
                }))}
              />
            </Form.Item>
          )}

          <Form.Item label="Allow Trial" name="enableTrial">
            <Switch />
          </Form.Item>

          <Form.Item label="Trial Price">
            <Form.Item
              name="trialAmount"
              noStyle
              dependencies={['amount', 'currency']}
              rules={[
                {
                  required: enableTrialWatch,
                  message: 'Please input your trial price!'
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!enableTrialWatch) {
                      return Promise.resolve()
                    }
                    const num = Number(value)
                    const planPrice = Number(getFieldValue('amount'))
                    if (isNaN(planPrice)) {
                      return Promise.reject('Invalid plan price')
                    }
                    if (isNaN(num) || num < 0 || num >= planPrice) {
                      return Promise.reject(
                        `Please input a valid price (>= 0 and < plan price ${getFieldValue('amount')}).`
                      )
                    }
                    if (
                      !currencyDecimalValidate(num, getFieldValue('currency'))
                    ) {
                      return Promise.reject('Please input a valid price')
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <Input
                disabled={!enableTrialWatch || formDisabled}
                style={{ width: 180 }}
                prefix={getCurrency()?.Symbol}
              />
            </Form.Item>
            <span className="ml-2 text-xs text-gray-400">
              For free trial, input 0.
            </span>
          </Form.Item>

          <Form.Item
            label="Trial length"
            name="trialDurationTime"
            rules={[
              {
                required: enableTrialWatch,
                message: 'Please input your trial length!'
              },
              () => ({
                validator(_, value) {
                  if (!enableTrialWatch) {
                    return Promise.resolve()
                  }
                  const num = Number(value)
                  if (isNaN(num) || num <= 0) {
                    return Promise.reject('Invalid trial length (>0)')
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input
              style={{ width: 220 }}
              addonAfter={selectAfter}
              disabled={!enableTrialWatch || formDisabled}
            />
          </Form.Item>

          <Form.Item label="Trial requires bank card info">
            <Form.Item name="trialDemand" noStyle>
              <Switch disabled={!enableTrialWatch || formDisabled} />
            </Form.Item>
            <span
              className="ml-2 text-xs text-gray-400"
              // style={{ top: '-45px', left: '240px', width: '600px' }}
            >
              When enabled, users can only use bank card payment (no Crypto or
              wire transfer) for their first purchase.
            </span>
          </Form.Item>

          <Form.Item label="Auto renew after trial end" name="cancelAtTrialEnd">
            <Switch disabled={!enableTrialWatch || formDisabled} />
          </Form.Item>

          <Form.Item label="Billable Metrics">
            <Row
              gutter={[8, 8]}
              style={{ marginTop: '0px' }}
              className="font-bold text-gray-500"
            >
              <Col span={5}>Name</Col>
              <Col span={3}>Code</Col>
              <Col span={6}>Description</Col>
              <Col span={5}>Aggregation Property</Col>
              <Col span={3}>Limit Value</Col>
              <Col span={2}>
                <div
                  onClick={addMetrics}
                  className={`w-16 font-bold ${planTypeWatch == PlanType.ONE_TIME_ADD_ON || formDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <PlusOutlined />
                </div>
              </Col>
            </Row>
            {selectedMetrics.map((m) => (
              <Row key={m.localId} gutter={[8, 8]} className="my-4">
                <Col span={5}>
                  <Select
                    disabled={
                      planTypeWatch == PlanType.ONE_TIME_ADD_ON || formDisabled
                    }
                    value={m.metricId}
                    onChange={onMetricSelectChange(m.localId)}
                    style={{ width: 180 }}
                    options={metricsList.map((m) => ({
                      label: m.metricName,
                      value: m.id
                    }))}
                  />
                </Col>
                <Col span={3}>
                  {metricsList.find((metric) => metric.id == m.metricId)?.code}
                </Col>
                <Col span={6}>
                  {
                    metricsList.find((metric) => metric.id == m.metricId)
                      ?.metricDescription
                  }
                </Col>
                <Col span={5}>
                  {
                    metricsList.find((metric) => metric.id == m.metricId)
                      ?.aggregationProperty
                  }
                </Col>
                <Col span={3}>
                  <Input
                    disabled={
                      planTypeWatch == PlanType.ONE_TIME_ADD_ON || formDisabled
                    }
                    value={m.metricLimit}
                    onChange={updateMetrics(m.localId)}
                  />
                </Col>
                <Col span={2}>
                  <div
                    onClick={() => removeMetrics(m.localId)}
                    className={`w-16 font-bold ${planTypeWatch == PlanType.ONE_TIME_ADD_ON || formDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <MinusOutlined />
                  </div>
                </Col>
              </Row>
            ))}
          </Form.Item>

          <Form.Item
            label="Custom data (JSON string)"
            name="metadata"
            rules={[
              {
                required: false,
                message: 'Please input a valid object JSON string!'
              },
              () => ({
                validator(_, value) {
                  return isValidMap(value)
                    ? Promise.resolve()
                    : Promise.reject('Invalid JSON object string')
                }
              })
            ]}
            extra={`JSON object must be a key-value paired object, like {"a": 1, "b": 2, "c": [1,2,3]}.`}
          >
            <Input.TextArea rows={6} style={{ width: '640px' }} />
          </Form.Item>

          <div
            className="relative ml-2 text-xs text-gray-400"
            style={{ top: '-165px', left: '830px', width: '100px' }}
          >
            {' '}
            <Button onClick={prettifyJSON}>Prettify</Button>
          </div>

          <Form.Item label="Product Name" name="productName" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Product Description"
            name="productDescription"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item label="imageUrl" name="imageUrl" hidden>
            <Input disabled />
          </Form.Item>

          <Form.Item label="homeUrl" name="homeUrl" hidden>
            <Input disabled />
          </Form.Item>

          <div className="my-6 flex justify-center gap-5">
            <div className="flex w-full justify-evenly">
              {!isNew && plan.status == PlanStatus.EDITING && (
                <Popconfirm
                  title="Deletion Confirm"
                  description="Are you sure to delete this plan?"
                  onConfirm={onDelete}
                  showCancel={false}
                  okText="Yes"
                >
                  <Button
                    danger
                    disabled={loading || activating || productDetail === null}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              )}
              <div className="flex justify-center gap-5">
                <Button
                  onClick={goBackToPlanList}
                  disabled={loading || activating}
                >
                  Go Back
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={
                    loading || activating || !savable || productDetail === null
                  }
                >
                  Save
                </Button>
                {!isNew && (
                  <Button
                    onClick={onActivate}
                    loading={activating}
                    disabled={
                      isNew ||
                      plan.status != 1 ||
                      activating ||
                      loading ||
                      productDetail === null
                    }
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Form>
      )}
    </div>
  )
}

export default Index
