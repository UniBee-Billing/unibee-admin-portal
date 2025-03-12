import { isValidMap, showAmount, toFixedNumber } from '@/helpers'
import {
  activatePlan,
  deletePlanReq,
  getPlanDetailWithMore,
  savePlan
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
import { LoadingOutlined } from '@ant-design/icons'
import { Button, Form, Popconfirm, Spin, Tabs, message } from 'antd'
import { Currency } from 'dinero.js'
import React, { useEffect, useRef, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom'
import AdvancedConfig from './advancedConfig'
import BasicConfig from './basicConfig'
import { MetricData } from './billableMetric/types'
import { DEFAULT_NEW_PLAN } from './constants'
import {
  MetricValidationError,
  secondsToUnit,
  transformMetricData,
  unitToSeconds,
  validateMetricData
} from './helpers'
import { MetricDataContext } from './metricDataContext'
import Summary from './summary'
import { TIME_UNITS, TNewPlan, TrialSummary } from './types'

const Index = () => {
  const [metricData, setMetricData] = useState<MetricData>({
    // metricData is too complicated to be controlled by antd form, so we use context to manage it.
    metricLimits: [],
    metricMeteredCharge: [],
    metricRecurringCharge: []
  })
  const [metricError, setMetricError] = useState<MetricValidationError | null>(
    null
  )
  const [form] = Form.useForm()
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
  const navigate = useNavigate()
  const planId = params.planId // http://localhost:5174/plan/270?productId=0, planId is 270
  const isNew = planId == null
  const [searchParams, setSearchParams] = useSearchParams()
  const productId = useRef(parseInt(searchParams.get('productId') ?? '0'))
  const [productDetail, setProductDetail] = useState<IProduct | null>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'basic')
  const onTabChange = (key: string) => {
    searchParams.set('tab', key)
    setSearchParams(searchParams)
    setActiveTab(key)
  }
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)
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

  const [trialLengthUnit, setTrialLengthUnit] = useState(
    TIME_UNITS.find((u) => u.label == 'days')?.value
  ) // default unit is days

  const itvCountValue = Form.useWatch('intervalCount', form)
  const itvCountUnit = Form.useWatch('intervalUnit', form)
  const watchCurrency = Form.useWatch('currency', form)
  const watchPlanType = Form.useWatch('type', form)
  const watchAmount = Form.useWatch('amount', form)
  const watchPlanName = Form.useWatch('planName', form)
  const watchPlanDescription = Form.useWatch('description', form)
  const watchAddons = Form.useWatch('addonIds', form)
  const watchOnetimeAddons = Form.useWatch('onetimeAddonIds', form)
  // trial related
  const enableTrialWatch = Form.useWatch('enableTrial', form)
  const watchTrialAmount = Form.useWatch('trialAmount', form)
  const watchTrialDurationTime = Form.useWatch('trialDurationTime', form)
  const watchTrialDemand = Form.useWatch('trialDemand', form)
  const watchCancelAtTrialEnd = Form.useWatch('cancelAtTrialEnd', form)

  //currency changed, trial amt also changed.
  const [trialSummary, setTrialSummary] = useState<TrialSummary>({
    trialEnabled: enableTrialWatch,
    price: undefined, // watchTrialAmount,
    durationTime: undefined, //  watchTrialDurationTime,
    requireBankInfo: undefined,
    AutoRenew: undefined
  })

  useEffect(() => {
    let durationTime =
      enableTrialWatch &&
      Number.isInteger(watchTrialDurationTime) &&
      watchTrialDurationTime > 0
        ? watchTrialDurationTime
        : undefined

    if (durationTime != undefined) {
      const unitLabel = TIME_UNITS.find(
        (u) => u.value == trialLengthUnit
      )?.label
      durationTime = `${durationTime} ${unitLabel}`
    }

    setTrialSummary({
      trialEnabled: enableTrialWatch,
      price: enableTrialWatch
        ? showAmount(watchTrialAmount, watchCurrency, true)
        : undefined,
      durationTime: durationTime,
      requireBankInfo: enableTrialWatch ? watchTrialDemand : undefined,
      AutoRenew: enableTrialWatch ? watchCancelAtTrialEnd : undefined
    })
  }, [
    enableTrialWatch,
    watchTrialAmount,
    watchTrialDurationTime,
    watchTrialDemand,
    watchCancelAtTrialEnd,
    watchCurrency,
    trialLengthUnit
  ])

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

  const getCurrency = () =>
    useAppConfigStore.getState().currency[watchCurrency as Currency]!

  const getAmount = (amt: number, currency: Currency) => {
    const CURRENCY = useAppConfigStore.getState().currency[currency]
    if (CURRENCY == undefined) {
      return 0
    }
    return amt / CURRENCY.Scale
  }

  const getPlanPrice = () => {
    if (
      watchCurrency == undefined ||
      watchAmount == undefined ||
      !Number.isInteger(itvCountValue)
    ) {
      return undefined
    }
    const result = showAmount(watchAmount, watchCurrency, true)
    if (watchPlanType == PlanType.ONE_TIME_ADD_ON) {
      return result
    }
    const itv = `/${itvCountValue == 1 ? '' : itvCountValue + ' '}${itvCountValue == 1 ? itvCountUnit : itvCountUnit + 's'}`
    return result + itv
  }

  useEffect(() => {
    if (!isNew && plan?.status != PlanStatus.EDITING) {
      // even we can edit active plan, but these 3 keys fields in [dep array] are not editable.
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
        a.currency == watchCurrency
    )
    setSelectAddons(newAddons)

    if (isNew) {
      setSelectOnetime(addons.filter((a) => a.currency === watchCurrency))
    }
  }, [itvCountUnit, itvCountValue, watchCurrency])

  useEffect(() => {
    // user chose PlanType.MAIN, then select several addons/onetimeAddons,
    // then switch to PlanType.Addon, which is not allowed to have addons,
    // so we need to clear the addonIds/onetimeAddonIds
    if (watchPlanType != PlanType.MAIN) {
      form.setFieldsValue({ addonIds: [], onetimeAddonIds: [] })
    }
  }, [watchPlanType])

  const onSave = async () => {
    if (productDetail === null) {
      return
    }
    const CURRENCY = getCurrency()
    if (CURRENCY == undefined) {
      return
    }

    const f = JSON.parse(JSON.stringify(form.getFieldsValue()))

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
    if (watchPlanType == PlanType.ONE_TIME_ADD_ON) {
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
      setLoading(false)
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

    const metricError = validateMetricData({
      metricLimits: metricData.metricLimits,
      metricMeteredCharge: metricData.metricMeteredCharge,
      metricRecurringCharge: metricData.metricRecurringCharge
    })
    if (metricError != null) {
      setMetricError(metricError)
      return
    } else {
      setMetricError(null)
    }

    const metric = transformMetricData(metricData, getCurrency(), 'upward')
    f.metricLimits = metric.metricLimitsLocal
    f.metricMeteredCharge = metric.metricMeteredChargeLocal
    f.metricRecurringCharge = metric.metricRecurringChargeLocal

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

    const { metricLimits, metricMeteredCharge, metricRecurringCharge } =
      planDetail.plan as IPlan

    // we cannot use appConfig.currency to get the currency object in the following call, because appConfig.currency is just an obj, it will not be updated.
    // in case of session expired, and user refresh the page, at this moment, appConfig.currency is empty.
    // after user enter the password in LoginModal, although the whole appConfig obj will be updated(including currency obj)
    // but fetchData still referenced the old, empty appConfig.currency.
    // so we need to use useAppConfigStore.getState().currency to get the latest currency object.
    const {
      metricLimitsLocal,
      metricMeteredChargeLocal,
      metricRecurringChargeLocal
    } = transformMetricData(
      {
        metricLimits,
        metricMeteredCharge,
        metricRecurringCharge
      } as MetricData,
      useAppConfigStore.getState().currency[
        planDetail.plan.currency as Currency
      ]!,
      'downward'
    )

    setMetricData({
      metricLimits: metricLimitsLocal,
      metricMeteredCharge: metricMeteredChargeLocal,
      metricRecurringCharge: metricRecurringChargeLocal
    })

    setPlan(planDetail.plan)
    form.setFieldsValue(planDetail.plan)

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

  useEffect(() => {
    fetchData()
  }, [planId]) // when creating new plan, url is: /plan/new?productId=0, planId is null,
  // when editing plan, url is: /plan/270?productId=0, planId is 270, after creating, url would become /plan/270?productId=0
  // I need to rerun fetchData to get the newly created plan detail, otherwise, planId is missing in form

  return (
    <MetricDataContext.Provider
      value={{
        metricData,
        setMetricData,
        metricError,
        setMetricError
      }}
    >
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      {plan && (
        <>
          <Form
            form={form}
            onFinish={onSave}
            labelCol={{ flex: '186px' }}
            wrapperCol={{ flex: 1 }}
            colon={false}
            style={{ height: 'calc(100vh - 272px)', overflowY: 'auto' }}
            disabled={formDisabled}
            initialValues={plan}
          >
            <div className="flex gap-4">
              <Tabs
                activeKey={activeTab}
                onChange={onTabChange}
                className="w-3/4"
                items={[
                  {
                    key: 'basic',
                    label: 'Basic Setup',
                    forceRender: true,
                    children: (
                      <BasicConfig
                        refresh={fetchData}
                        isNew={isNew}
                        getCurrency={getCurrency}
                        loading={loading}
                        productDetail={productDetail}
                        plan={plan}
                        watchPlanType={watchPlanType}
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
                        selectAddons={selectAddons}
                        selectOnetime={selectOnetime}
                        trialLengthUnit={trialLengthUnit}
                        setTrialLengthUnit={setTrialLengthUnit}
                        getCurrency={getCurrency}
                        form={form}
                        formDisabled={formDisabled}
                        watchPlanType={watchPlanType}
                        metricsList={metricsList}
                      />
                    )
                  }
                ]}
              />
              <div className="w-1/4">
                <Summary
                  name={watchPlanName}
                  description={watchPlanDescription}
                  watchPlanType={watchPlanType}
                  getPlanPrice={getPlanPrice}
                  planStatus={plan.status}
                  trialSummary={trialSummary}
                  selectAddons={selectAddons}
                  selectOnetime={selectOnetime}
                  watchAddons={watchAddons}
                  watchOnetimeAddons={watchOnetimeAddons}
                />
              </div>
            </div>
          </Form>
          <div
            className="h-15 relative flex h-16 items-center justify-center gap-5"
            style={{ boxShadow: '0 -5px 5px -5px #DDD', bottom: '-24px' }}
          >
            <div className="flex w-2/3 justify-between">
              {!isNew && plan.status == PlanStatus.EDITING ? (
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
              ) : (
                <span></span>
              )}{' '}
              {/* this span is a placeholder for the delete button, I want the go-back/save/active buttons always on the right side */}
              <div className="flex justify-center gap-5">
                <Button
                  onClick={goBackToPlanList}
                  disabled={loading || activating}
                >
                  Go Back
                </Button>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={form.submit}
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
                      plan.status != PlanStatus.EDITING ||
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
    </MetricDataContext.Provider>
  )
}

export default Index
