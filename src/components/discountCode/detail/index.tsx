import { numBoolConvert, showAmount, toFixedNumber } from '@/helpers'
import { useSkipFirstRender } from '@/hooks'
import {
  createDiscountCodeReq,
  deleteDiscountCodeReq,
  getDiscountCodeDetailWithMore,
  getPlanList,
  toggleDiscountCodeActivateReq,
  updateDiscountCodeReq
} from '@/requests/index'
import {
  DiscountCode,
  DiscountCodeApplyType,
  DiscountCodeBillingType,
  DiscountCodeStatus,
  DiscountType,
  IPlan,
  PlanStatus,
  PlanType
} from '@/shared.types'
import { useAppConfigStore, useMerchantInfoStore } from '@/stores'
import { title } from '@/utils'
import { LoadingOutlined } from '@ant-design/icons'
import { Button, Form, Popconfirm, Spin, Tabs, message } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { Currency } from 'dinero.js'
import update from 'immutability-helper'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { DISCOUNT_CODE_UPGRADE_SCOPE } from '../helpers'
import { UpdateDiscountCodeQuantityModal } from '../updateDiscountCodeQuantityModal'
import AdvancedConfig from './advancedConfig'
import GeneralConfig from './generalConfig'
import Summary, { NotSetPlaceholder } from './summary'
import { nanoid } from 'nanoid'

type BillingPeriod = {
  intervalUnit: 'month' | 'year'
  intervalCount: number
  localId: string
}

const DEFAULT_NEW_CODE: DiscountCode = {
  merchantId: useMerchantInfoStore.getState().id,
  name: '',
  code: '',
  status: DiscountCodeStatus.EDITING,
  billingType: DiscountCodeBillingType.RECURRING,
  discountType: DiscountType.AMOUNT,
  discountAmount: 0,
  discountPercentage: 0,
  currency: 'EUR',
  cycleLimit: 1,
  startTime: 0,
  endTime: 0,
  validityRange: [null, null],
  planApplyType: DiscountCodeApplyType.ALL,
  planIds: [],
  planApplyGroup: {
    groupPlanIntervalSelector: []
  },
  quantity: 0,
  liveQuantity: 0,
  quantityUsed: 0,
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
  DiscountCodeStatus.INACTIVE
]

const canActiveItemEdit = (status?: DiscountCodeStatus) =>
  status ? CAN_EDIT_ITEM_STATUSES.includes(status) : true

const Index = () => {
  const params = useParams()
  const appConfig = useAppConfigStore()
  const navigate = useNavigate()
  const location = useLocation()
  const discountCopyData = location.state?.copyDiscountCode
  const isCopy = !!discountCopyData
  const codeId = params.discountCodeId
  const isNew = !codeId || isCopy
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState<DiscountCode | null>(
    !codeId && !isCopy ? DEFAULT_NEW_CODE : null
  )
  const [planList, setPlanList] = useState<IPlan[]>([])
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([
    { intervalUnit: 'month', intervalCount: 1, localId: nanoid() }
  ])
  const planListRef = useRef<IPlan[]>([])
  const [
    isOpenUpdateDiscountCodeQuantityModal,
    setIsOpenUpdateDiscountCodeQuantityModal
  ] = useState(false)
  const [form] = Form.useForm()
  const watchDiscountName = Form.useWatch('name', form)
  const watchDiscountCode = Form.useWatch('code', form)
  const watchDiscountQuantity = Form.useWatch('quantity', form)
  const watchDiscountType = Form.useWatch('discountType', form)
  const watchBillingType = Form.useWatch('billingType', form)
  const watchCurrency = Form.useWatch('currency', form)
  const watchCycleLimit = Form.useWatch('cycleLimit', form)
  const watchValidityRange = Form.useWatch('validityRange', form)
  const watchPlanIds = Form.useWatch('planIds', form)
  const watchAdvancedConfig = Form.useWatch('advance', form)
  const watchUpgradeOnly = Form.useWatch('upgradeOnly', form)
  const watchLongerUpgradeOnly = Form.useWatch('upgradeLongerOnly', form)
  const watchApplyType = Form.useWatch('planApplyType', form)
  const watchUserScope = Form.useWatch('userScope', form)
  const watchUpgradeScope = Form.useWatch('upgradeScope', form)
  const watchUserLimit = Form.useWatch('userLimit', form)
  const watchDiscountAmount = Form.useWatch('discountAmount', form)
  const watchDiscountPercentage = Form.useWatch('discountPercentage', form)

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

    if (res.discount.planApplyGroup?.groupPlanIntervalSelector) {
      setBillingPeriods(
        res.discount.planApplyGroup.groupPlanIntervalSelector.map(
          (p: { intervalUnit: 'month' | 'year'; intervalCount: number }) => ({
            ...p,
            localId: nanoid()
          })
        )
      )
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
      discount.discountAmount /=
        appConfig.currency[discount.currency as Currency]!.Scale
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
    form.setFieldsValue(discount)
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
    if (DEFAULT_NEW_CODE.discountType == DiscountType.AMOUNT) {
      planList = planList.filter(
        (p: IPlan) => p.currency == DEFAULT_NEW_CODE.currency
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

    if (
      code.planApplyType ===
        DiscountCodeApplyType.APPLY_TO_PLANS_BY_BILLING_PERIOD ||
      code.planApplyType ===
        DiscountCodeApplyType.APPLY_TO_PLANS_EXCEPT_BY_BILLING_PERIOD
    ) {
      code.planApplyGroup = {
        groupPlanIntervalSelector: billingPeriods.map(
          ({ intervalUnit, intervalCount }) => ({
            intervalUnit,
            intervalCount: Number(intervalCount)
          })
        )
      }
    } else {
      delete code.planApplyGroup
    }

    if (code.discountType == DiscountType.PERCENTAGE) {
      delete code.currency
      delete code.discountAmount
    } else {
      delete code.discountPercentage
      code.discountAmount *=
        appConfig.currency[code.currency as Currency]!.Scale
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

  const getPlanLabel = (planId: number, compact: boolean = false) => {
    const p = planListRef.current.find((p) => p.id == planId)
    if (null == p) {
      return ''
    }
    return compact ? (
      p.planName
    ) : (
      <>
        {p.planName}&nbsp;(
        <span className="text-xs text-gray-500">
          {showAmount(p.amount, p.currency)}/
          {p.intervalCount == 1 ? '' : p.intervalCount}
          {p.intervalUnit})
        </span>
      </>
    )
  }

  // regardless of discount Type, just return the fixed amt or percentage
  const getDiscountedValue = () => {
    if (watchDiscountType == DiscountType.AMOUNT) {
      if (
        watchDiscountAmount == null ||
        watchDiscountAmount == '' ||
        isNaN(Number(watchDiscountAmount)) ||
        watchCurrency == null ||
        watchCurrency == ''
      ) {
        return <NotSetPlaceholder />
      } else {
        return showAmount(watchDiscountAmount, watchCurrency, true)
      }
    } else {
      if (
        watchDiscountPercentage == null ||
        watchDiscountPercentage == '' ||
        isNaN(Number(watchDiscountPercentage))
      ) {
        return <NotSetPlaceholder />
      } else {
        return `${watchDiscountPercentage}%`
      }
    }
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
          onSuccess={(delta) => {
            const newQuantity = form.getFieldValue('quantity') + delta
            setCode(update(code, { quantity: { $set: newQuantity } }))
            form.setFieldValue('quantity', newQuantity)
          }}
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
                  forceRender: true,
                  children: (
                    <GeneralConfig
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
                      canActiveItemEdit={canActiveItemEdit}
                      billingPeriods={billingPeriods}
                      setBillingPeriods={setBillingPeriods}
                    />
                  )
                },
                {
                  key: 'advanced',
                  label: 'Advanced Configuration',
                  forceRender: true,
                  children: (
                    <AdvancedConfig
                      code={code}
                      watchAdvancedConfig={watchAdvancedConfig}
                      canActiveItemEdit={canActiveItemEdit}
                    />
                  )
                }
              ]}
            />
            <div className="w-1/3">
              <Summary
                name={watchDiscountName}
                code={watchDiscountCode}
                status={code?.status}
                quantity={watchDiscountQuantity}
                discountType={watchDiscountType}
                billingType={watchBillingType}
                cycleLimit={watchCycleLimit}
                validityRange={watchValidityRange}
                applyType={watchApplyType}
                planIds={watchPlanIds}
                getPlanLabel={getPlanLabel}
                userScope={watchUserScope}
                upgradeScope={watchUpgradeScope}
                userLimit={watchUserLimit}
                getDiscountedValue={getDiscountedValue}
              />
            </div>
          </div>
        </Form>
      )}
      <div
        className={`mt-10 flex ${isNew ? 'justify-end' : 'justify-between'}`}
      >
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
