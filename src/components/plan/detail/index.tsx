import { PlanStatusTag } from '@/components/ui/statusTag'
import {
  currencyDecimalValidate,
  isValidMap,
  randomString,
  showAmount,
  toFixedNumber
} from '@/helpers'
import {
  activatePlan,
  deletePlanReq,
  getPlanDetailWithMore,
  savePlan,
  togglePublishReq
} from '@/requests'
import {
  IBillableMetrics,
  IPlan,
  IProduct,
  PlanPublishStatus,
  PlanStatus,
  PlanType
} from '@/shared.types'
import { useAppConfigStore } from '@/stores'
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
  Tabs,
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
import AdvancedConfig from './advancedConfig'
import BasicConfig from './basicConfig'
import Summary from './summary'

interface Metric {
  metricId: number
  metricLimit: number
}

type TMetricsItem = {
  localId: string
  metricId?: number
  metricLimit?: number | string
}
export type TNewPlan = Omit<
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
  // in seconds
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
  const amountWatch = Form.useWatch('amount', form)

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

  const getCurrency = () => appConfig.currency[currencyWatch as Currency]!

  const getAmount = (amt: number, currency: Currency) => {
    const CURRENCY = appConfig.currency[currency]
    if (CURRENCY == undefined) {
      return 0
    }
    return amt / CURRENCY.Scale
  }

  const getPlanPrice = () => {
    if (currencyWatch == undefined) {
      return ''
    }
    const itv = `/${itvCountValue == 1 ? '' : itvCountValue + ' '}${itvCountValue == 1 ? itvCountUnit : itvCountUnit + 's'}`
    return showAmount(amountWatch, currencyWatch, true) + itv
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
    } else {
      // navigate(`/plan/list`)
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
        <>
          {' '}
          <Form
            form={form}
            onFinish={onSave}
            labelCol={{ flex: '186px' }}
            wrapperCol={{ flex: 1 }}
            colon={false}
            disabled={formDisabled}
            initialValues={plan}
          >
            <div className="flex gap-4">
              <Tabs
                defaultActiveKey="general"
                className="w-2/3"
                items={[
                  {
                    key: 'general',
                    label: 'Basic Plan Setup',
                    forceRender: true,
                    children: (
                      <BasicConfig
                        refresh={fetchData}
                        selectAddons={selectAddons}
                        selectOnetime={selectOnetime}
                        isNew={isNew}
                        getCurrency={getCurrency}
                        loading={loading}
                        productDetail={productDetail}
                        plan={plan}
                        planTypeWatch={planTypeWatch}
                        formDisabled={formDisabled}
                        disableAfterActive={disableAfterActive}
                      />
                    )
                  },
                  {
                    key: 'advanced',
                    label: 'Advanced Setup',
                    forceRender: true,
                    children: (
                      <AdvancedConfig
                        enableTrialWatch={enableTrialWatch}
                        formDisabled={formDisabled}
                        getCurrency={getCurrency}
                        form={form}
                        planTypeWatch={planTypeWatch}
                        metricsList={metricsList}
                      />
                    )
                  }
                ]}
              />
              <div className="w-1/3">
                <Summary
                  name={plan.planName}
                  description={plan.description}
                  enableTrialWatch={enableTrialWatch}
                  planTypeWatch={planTypeWatch}
                  getPlanPrice={getPlanPrice}
                />
              </div>
            </div>
          </Form>
          <div className="my-6 flex justify-between gap-5">
            <div className="flex w-full justify-between">
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
          </div>{' '}
        </>
      )}
    </div>
  )
}

export default Index
