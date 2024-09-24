import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Popover,
  Row,
  Spin,
  Tooltip,
  message
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import update from 'immutability-helper'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnClickOutside } from 'usehooks-ts'
import { daysBetweenDate, showAmount } from '../../helpers'
import {
  createPreviewReq,
  extendDueDateReq,
  getAppConfigReq,
  getSubDetailWithMore,
  resumeSubReq,
  setSimDateReq,
  terminateSubReq,
  updateSubscription
} from '../../requests'
import '../../shared.css'
import {
  DiscountCode,
  IPlan,
  IPreview,
  ISubscriptionType
} from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import { DiscountCodeStatus, SubscriptionStatus } from '../ui/statusTag'
import CancelPendingSubModal from './modals/cancelPendingSub'
import ChangePlanModal from './modals/changePlan'
import ChangeSubStatusModal from './modals/changeSubStatus'
import ExtendSubModal from './modals/extendSub'
import ResumeSubModal from './modals/resumeSub'
import TerminateSubModal from './modals/terminateSub'
import UpdateSubPreviewModal from './modals/updateSubPreview'

const APP_PATH = import.meta.env.BASE_URL // import.meta.env.VITE_APP_PATH;

const Index = ({
  setUserId,
  setRefreshSub,
  refreshSub
}: {
  setUserId: (userId: number) => void
  setRefreshSub: React.Dispatch<React.SetStateAction<boolean>>
  refreshSub: boolean
}) => {
  const [plans, setPlans] = useState<IPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<null | number>(null) // null: not selected
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [confirmming, setConfirming] = useState(false)
  const [dueDateModal, setDueDateModal] = useState(false)
  const [newDueDate, setNewDueDate] = useState('')
  const [changePlanModal, setChangePlanModal] = useState(false)
  const [cancelSubModalOpen, setCancelSubModalOpen] = useState(false) // newly created sub has status == pending if user hasn't paid yet, user(or admin) can cancel this sub.
  const [changeSubStatusModal, setChangeSubStatusModal] = useState(false) // admin can mark subStatus from pending to incomplete
  const [preview, setPreview] = useState<IPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [terminateModal, setTerminateModal] = useState(false)
  const [resumeModal, setResumeModal] = useState(false)
  const [activeSub, setActiveSub] = useState<ISubscriptionType | null>(null) // null: when page is loading, no data is ready yet.
  const [endSubMode, setEndSubMode] = useState<1 | 2 | null>(null) // 1: immediate, 2: end of this billing cycole, null: not selected
  const [isProduction, setIsProduction] = useState(false)
  const [simDateOpen, setSimDateOpen] = useState(false)
  const simDateContainerRef = useRef(null)
  const hideSimDate = () => setSimDateOpen(false)
  useOnClickOutside(simDateContainerRef, hideSimDate)

  const toggleTerminateModal = () => setTerminateModal(!terminateModal)
  const toggleResumeSubModal = () => setResumeModal(!resumeModal)
  const toggleSetDueDateModal = () => setDueDateModal(!dueDateModal)
  const toggleChangPlanModal = () => setChangePlanModal(!changePlanModal)
  const toggleCancelSubModal = () => setCancelSubModalOpen(!cancelSubModalOpen)
  const toggleChangeSubStatusModal = () =>
    setChangeSubStatusModal(!changeSubStatusModal)

  const onSimDateChange = async (date: Dayjs | null, dateString: string) => {
    if (isProduction) {
      return
    }
    setLoading(true)
    const [_, err] = await setSimDateReq(
      activeSub?.subscriptionId as string,
      dayjs(new Date(dateString as string)).unix()
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('New simulation date set.')
    toggleSimDateOpen()
    fetchData()
  }
  const toggleSimDateOpen = () => setSimDateOpen(!simDateOpen)

  const showSimDatePicker = () => {
    if (
      activeSub == null ||
      activeSub.testClock == null ||
      activeSub.testClock < 0
    ) {
      return false
    }
    return true
  }

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value. I don't want to define 2 fn to do similar jobs.
    checked: boolean | null // ditto
  ) => {
    const planIdx = plans.findIndex((p) => p.id == selectedPlan)
    if (planIdx == -1) {
      return
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId)
    if (addonIdx == -1) {
      return
    }

    let newPlans = plans
    if (quantity == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { checked: { $set: checked as boolean } } }
        }
      })
    } else if (checked == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { quantity: { $set: quantity as number } } }
        }
      })
    }
    setPlans(newPlans)
  }

  const togglePreviewModal = () => setPreviewModalOpen(!previewModalOpen)
  const openPreviewModal = async () => {
    const plan = plans.find((p) => p.id == selectedPlan)
    let isValid = true
    if (plan?.addons != null && plan.addons.length > 0) {
      for (let i = 0; i < plan.addons.length; i++) {
        if (plan.addons[i].checked) {
          const q = Number(plan.addons[i].quantity)
          console.log('q: ', q)
          if (!Number.isInteger(q) || q <= 0) {
            isValid = false
            break
          }
        }
      }
    }

    if (!isValid) {
      message.error('Addon quantity must be greater than 0.')
      return
    }
    setConfirming(true)
    const err = await createPreview()
    setConfirming(false)
    if (err != null) {
      return
    }
    togglePreviewModal()
  }

  const createPreview = async () => {
    setPreview(null) // clear the last preview, otherwise, users might see the old value before the new value return
    const plan = plans.find((p) => p.id == selectedPlan)
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : []
    console.log('active sub addon bfr preview: ', addons)
    const [previewRes, err] = await createPreviewReq(
      activeSub!.subscriptionId,
      selectedPlan as number,
      addons.map((a) => ({
        quantity: a.quantity as number,
        addonPlanId: a.id
      }))
    )
    if (null != err) {
      message.error(err.message)
      return err
    }
    // setPreviewModalOpen(false);
    setPreview(previewRes)
    return null
  }

  // confirm the changed plan
  const onConfirm = async () => {
    const plan = plans.find((p) => p.id == selectedPlan)
    const addons =
      plan != null && plan.addons != null
        ? plan.addons.filter((a) => a.checked)
        : []

    setConfirming(true)
    const [updateSubRes, err] = await updateSubscription(
      activeSub?.subscriptionId as string,
      selectedPlan as number,
      addons.map((a) => ({
        quantity: a.quantity as number,
        addonPlanId: a.id
      })),
      preview?.totalAmount as number,
      preview?.currency as string,
      preview?.prorationDate as number
    )
    setConfirming(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    if (updateSubRes.paid) {
      message.success('Plan updated')
    } else {
      message.success('Plan updated, but not paid')
    }
    togglePreviewModal()
    toggleChangPlanModal()
    fetchData()
  }

  const onTerminateSub = async () => {
    if (endSubMode == null) {
      message.error('Please choose when to end this subscription')
      return
    }
    setLoading(true)
    const [_, err] = await terminateSubReq(
      activeSub?.subscriptionId as string,
      endSubMode == 1
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    toggleTerminateModal()
    message.success(
      endSubMode == 1
        ? 'Subscription ended'
        : 'Subscription will end on the end of this billing cycle'
    )
    setEndSubMode(null) // force users to choose a endMode before submitting.
    fetchData()
  }

  const onResumeSub = async () => {
    setLoading(true)
    const [_, err] = await resumeSubReq(activeSub?.subscriptionId as string)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    toggleResumeSubModal()
    message.success('Subscription resumed.')
    fetchData()
  }

  // fetch current subscription detail, and all active plans.
  const fetchData = async () => {
    const pathName = window.location.pathname.split('/')
    const subId = pathName.pop()
    if (subId == null) {
      message.error("Subscription didn't exist")
      return
    }

    setLoading(true)
    const [detailRes, err] = await getSubDetailWithMore(subId, fetchData)
    setLoading(false)
    if (refreshSub) {
      console.log('refreshing sub triggered by parent')
      setRefreshSub(false)
    }

    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('detailRes: ', detailRes)
    const { subDetail, planList } = detailRes
    const {
      user,
      addons,
      unfinishedSubscriptionPendingUpdate,
      subscription,
      latestInvoice
    } = subDetail
    const localActiveSub: ISubscriptionType = { ...subscription }
    localActiveSub.latestInvoice = latestInvoice
    localActiveSub.addons = addons?.map((a: any) => ({
      ...a.addonPlan,
      quantity: a.quantity,
      addonPlanId: a.addonPlan.id
    }))
    localActiveSub.user = user
    localActiveSub.unfinishedSubscriptionPendingUpdate =
      unfinishedSubscriptionPendingUpdate
    if (localActiveSub.unfinishedSubscriptionPendingUpdate != null) {
      if (
        localActiveSub.unfinishedSubscriptionPendingUpdate.updateAddons != null
      ) {
        localActiveSub.unfinishedSubscriptionPendingUpdate.updateAddons =
          localActiveSub.unfinishedSubscriptionPendingUpdate.updateAddons.map(
            (a: any) => ({
              ...a.addonPlan,
              quantity: a.quantity,
              addonPlanId: a.addonPlan.id
            })
          )
      }
    }

    console.log('active sub: ', localActiveSub, '//user: ', user)
    setSelectedPlan(subDetail.plan.id)
    setUserId(user.id)

    let plans: IPlan[] =
      planList.plans == null
        ? []
        : planList.plans.map((p: any) => ({
            ...p.plan,
            addons: p.addons
          }))

    plans = plans.filter((p) => p != null)
    const planIdx = plans.findIndex((p) => p.id == subDetail.plan.id)
    // let's say we have planA(which has addonA1, addonA2, addonA3), planB, planC, user has subscribed to planA, and selected addonA1, addonA3
    // I need to find the index of addonA1,3 in planA.addons array,
    // then set their {quantity, checked: true} props on planA.addons, these props value are from subscription.addons array.
    if (planIdx != -1 && plans[planIdx].addons != null) {
      for (let i = 0; i < plans[planIdx].addons!.length; i++) {
        const addonIdx =
          localActiveSub.addons == null
            ? -1
            : localActiveSub.addons.findIndex(
                (subAddon) =>
                  subAddon.addonPlanId == plans[planIdx].addons![i].id
              )
        if (addonIdx != -1) {
          plans[planIdx].addons![i].checked = true
          plans[planIdx].addons![i].quantity =
            localActiveSub.addons[addonIdx].quantity
        }
      }
    }
    setPlans(plans)
    localActiveSub.plan = plans.find((p) => p.id == localActiveSub.planId)
    setActiveSub(localActiveSub)
  }

  const onDueDateChange = (date: Dayjs | null, dateStr: string) => {
    setNewDueDate(dateStr as string)
    toggleSetDueDateModal()
  }

  const onExtendDueDate = async () => {
    setLoading(true)
    const hours =
      daysBetweenDate(activeSub!.currentPeriodEnd * 1000, newDueDate) * 24
    const [_, err] = await extendDueDateReq(activeSub!.subscriptionId, hours)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    toggleSetDueDateModal()
    message.success('Due date extended')
    fetchData() // better to call message.success in fetchData cb(add a cb parameter to fetchData)
  }

  const getAppConfig = async () => {
    const [res, err] = await getAppConfigReq()
    if (null != err) {
      return
    }
    setIsProduction(res.isProd)
  }
  useEffect(() => {
    fetchData()
    getAppConfig()
  }, [])

  useEffect(() => {
    if (!changePlanModal && activeSub != null) {
      setSelectedPlan(activeSub?.planId)
    }
  }, [changePlanModal])

  useEffect(() => {
    refreshSub && fetchData()
  }, [refreshSub])

  return (
    <>
      {!isProduction && (
        <div
          style={{
            display: showSimDatePicker() ? 'flex' : 'none',
            width: '568px',
            zIndex: 999
          }}
          className="fixed right-8 top-2 flex h-12 items-center justify-between rounded-md bg-indigo-500 px-2 py-2 text-white"
        >
          <div>
            <div className="flex flex-col" style={{ fontSize: '11px' }}>
              {activeSub?.testClock != null && activeSub?.testClock <= 0 ? (
                <>
                  <div>No simulation time running.</div>
                  <div>
                    Only works on pending, active, incomplete, cancelled,
                    expired subscription.
                  </div>
                </>
              ) : (
                'current simulation time: '
              )}
            </div>
            <span>
              {activeSub?.testClock && activeSub?.testClock > 0
                ? dayjs(new Date(activeSub?.testClock * 1000)).format(
                    'YYYY-MMM-DD HH:mm:ss'
                  )
                : ''}
            </span>
          </div>
          <div ref={simDateContainerRef}>
            <Button
              onClick={toggleSimDateOpen}
              disabled={
                ![1, 2, 4, 5, 7, 8].includes(
                  null != activeSub ? activeSub.status : -1
                )
              }
            >
              Advance Time
            </Button>
            <DatePicker
              value={dayjs(
                activeSub == null || activeSub.testClock === 0
                  ? new Date()
                  : new Date(activeSub!.testClock! * 1000)
              )}
              onChange={onSimDateChange}
              open={simDateOpen}
              onBlur={toggleSimDateOpen}
              disabledDate={(d) =>
                d.isBefore(
                  null == activeSub ||
                    null == activeSub.testClock ||
                    activeSub.testClock <= 0
                    ? new Date()
                    : new Date(activeSub!.testClock! * 1000)
                )
              }
              // disabledTime={disabledSimTime}
              showTime
              showNow={false}
              getPopupContainer={(trigger: HTMLElement) =>
                trigger.parentNode as HTMLElement
              }
              style={{ visibility: 'hidden', width: 0, height: 0 }}
              format={'YYYY-MMM-DD HH:mm:ss'}
            />
          </div>
        </div>
      )}
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />{' '}
      <TerminateSubModal
        isOpen={terminateModal}
        loading={loading}
        terminateMode={endSubMode}
        setTerminateMode={setEndSubMode}
        subInfo={activeSub}
        onCancel={toggleTerminateModal}
        onConfirm={onTerminateSub}
      />
      <ResumeSubModal
        isOpen={resumeModal}
        loading={loading}
        subInfo={activeSub}
        onCancel={toggleResumeSubModal}
        onConfirm={onResumeSub}
      />
      <ExtendSubModal
        isOpen={dueDateModal}
        loading={loading}
        subInfo={activeSub}
        newDueDate={newDueDate}
        onCancel={toggleSetDueDateModal}
        onConfirm={onExtendDueDate}
        // setDueDate={setDueDate}
      />
      <ChangePlanModal
        isOpen={changePlanModal}
        subInfo={activeSub}
        selectedPlanId={selectedPlan}
        plans={plans}
        setSelectedPlan={setSelectedPlan}
        onAddonChange={onAddonChange}
        onCancel={toggleChangPlanModal}
        onConfirm={openPreviewModal}
        loading={confirmming}
      />
      <UpdateSubPreviewModal
        isOpen={previewModalOpen}
        loading={confirmming}
        previewInfo={preview}
        onCancel={togglePreviewModal}
        onConfirm={onConfirm}
      />
      {cancelSubModalOpen && (
        <CancelPendingSubModal
          subInfo={activeSub}
          closeModal={toggleCancelSubModal}
          refresh={fetchData}
        />
      )}
      {changeSubStatusModal && (
        <ChangeSubStatusModal
          subInfo={activeSub}
          closeModal={toggleChangeSubStatusModal}
          refresh={fetchData}
        />
      )}
      {/* <UserInfoSection user={activeSub?.user || null} /> */}
      <SubscriptionInfoSection
        subInfo={activeSub}
        plans={plans}
        onDueDateChange={onDueDateChange}
        refresh={fetchData}
        toggleTerminateModal={toggleTerminateModal}
        toggleResumeSubModal={toggleResumeSubModal}
        toggleChangPlanModal={toggleChangPlanModal}
        toggleCancelSubModal={toggleCancelSubModal}
        toggleChangeSubStatusModal={toggleChangeSubStatusModal}
      />
    </>
  )
}

export default Index

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

interface ISubSectionProps {
  subInfo: ISubscriptionType | null
  plans: IPlan[]
  onDueDateChange: (date: Dayjs | null, dateStr: string) => void
  refresh: () => void
  toggleTerminateModal: () => void
  toggleResumeSubModal: () => void
  toggleChangPlanModal: () => void
  toggleCancelSubModal: () => void
  toggleChangeSubStatusModal: () => void
}
const SubscriptionInfoSection = ({
  subInfo,
  onDueDateChange,
  refresh,
  toggleTerminateModal,
  toggleResumeSubModal,
  toggleChangPlanModal,
  toggleCancelSubModal,
  toggleChangeSubStatusModal
}: ISubSectionProps) => {
  const navigate = useNavigate()
  const appConfigStore = useAppConfigStore()
  const goToPlan = (planId: number) => navigate(`${APP_PATH}plan/${planId}`)
  const goToDiscount = (codeId: number) =>
    navigate(`${APP_PATH}discount-code/${codeId}`)
  const discountAmt = (code: DiscountCode) => {
    if (code.discountType == 1) {
      // percentage
      return `${code.discountPercentage / 100} %`
    } else if (code.discountType == 2) {
      // fixed amt
      return showAmount(code.discountAmount, code.currency)
    } else {
      return ''
    }
  }
  return (
    <>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>
          {subInfo && (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => goToPlan(subInfo.planId)}
            >
              {subInfo?.plan?.planName}
            </Button>
          )}
        </Col>
        <Col span={4} style={colStyle}>
          Plan Description
        </Col>
        <Col span={6}>{subInfo?.plan?.description}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {subInfo && SubscriptionStatus(subInfo.status)}
          {subInfo && (
            <Tooltip title="Refresh">
              <span
                style={{ cursor: 'pointer', margin: '0 8px' }}
                onClick={refresh}
              >
                <SyncOutlined />
              </span>
            </Tooltip>
          )}
          {/* == 1: payment is pending (wait for user to finishe the payment), 7: incomplete */}
          {subInfo && (subInfo.status == 1 || subInfo.status == 7) && (
            <Tooltip title="Cancel">
              <span
                style={{ cursor: 'pointer', margin: '0 8px' }}
                onClick={toggleCancelSubModal}
              >
                <CloseCircleOutlined />
              </span>
            </Tooltip>
          )}
        </Col>
        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>{subInfo?.subscriptionId}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan Price
        </Col>
        <Col span={6}>
          {subInfo?.plan?.amount &&
            showAmount(subInfo?.plan?.amount, subInfo?.plan?.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Addons Price
        </Col>
        <Col span={6}>
          {subInfo &&
            subInfo.addons &&
            showAmount(
              subInfo!.addons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number }
                ) => sum + quantity * amount,
                0
              ),
              subInfo!.currency
            )}

          {subInfo && subInfo.addons && subInfo.addons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: '280px' }}>
                  {subInfo?.addons.map((a, idx) => (
                    <Row key={idx}>
                      <Col span={10} className="font-bold text-gray-500">
                        {a.planName}
                      </Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={' '}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Discount Amount
        </Col>
        <Col span={6}>
          {subInfo &&
            subInfo.latestInvoice &&
            showAmount(
              subInfo.latestInvoice.discountAmount as number,
              subInfo.latestInvoice.currency
            )}

          {subInfo &&
            subInfo.latestInvoice &&
            subInfo.latestInvoice.discount && (
              <Popover
                placement="top"
                title="Discount code info"
                content={
                  <div style={{ width: '320px' }}>
                    <Row>
                      <Col span={10} className="font-bold text-gray-500">
                        Code
                      </Col>
                      <Col span={14}>
                        <Button
                          type="link"
                          size="small"
                          style={{ padding: 0 }}
                          onClick={() =>
                            goToDiscount(
                              subInfo.latestInvoice?.discount?.id as number
                            )
                          }
                        >
                          {subInfo.latestInvoice.discount.code}
                        </Button>{' '}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className="font-bold text-gray-500">
                        Name
                      </Col>
                      <Col span={14}>{subInfo.latestInvoice.discount.name}</Col>
                    </Row>
                    <Row>
                      <Col span={10} className="font-bold text-gray-500">
                        Status
                      </Col>
                      <Col span={14}>
                        {DiscountCodeStatus(
                          subInfo.latestInvoice.discount.status as number
                        )}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className="font-bold text-gray-500">
                        Billing Type
                      </Col>
                      <Col span={14}>
                        {subInfo.latestInvoice.discount.billingType === 1
                          ? 'One-time use'
                          : 'Recurring'}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className="font-bold text-gray-500">
                        Discount Amt
                      </Col>
                      <Col span={14}>
                        {discountAmt(subInfo.latestInvoice.discount)}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className="font-bold text-gray-500">
                        Cycle limit
                      </Col>
                      <Col span={14}>
                        {subInfo.latestInvoice.discount.cycleLimit}
                      </Col>
                    </Row>
                    <Row>
                      <Col span={10} className="font-bold text-gray-500">
                        Valid range
                      </Col>
                      <Col span={14}>
                        {`${dayjs(
                          subInfo.latestInvoice.discount.startTime * 1000
                        ).format(
                          'YYYY-MMM-DD'
                        )} ~ ${dayjs(subInfo.latestInvoice.discount.endTime * 1000).format('YYYY-MMM-DD')} `}
                      </Col>
                    </Row>
                  </div>
                }
              >
                <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                  <InfoCircleOutlined />
                </span>
              </Popover>
            )}
        </Col>

        <Col span={4} style={colStyle}>
          Total Amount
        </Col>
        <Col span={6}>
          {subInfo?.amount && showAmount(subInfo.amount, subInfo.currency)}
          {subInfo && subInfo.taxPercentage && subInfo.taxPercentage != 0 ? (
            <span className="text-xs text-gray-500">
              {` (${subInfo.taxPercentage / 100}% tax incl)`}
            </span>
          ) : null}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Bill Period
        </Col>
        <Col span={6}>
          {' '}
          {subInfo != null && subInfo.plan != null
            ? `${subInfo.plan.intervalCount} ${subInfo.plan.intervalUnit}`
            : ''}
        </Col>
        <Col span={4} style={colStyle}>
          Next due date
        </Col>
        <Col span={10}>
          {subInfo && (
            <DatePicker
              format="YYYY-MMM-DD"
              allowClear={false}
              onChange={onDueDateChange}
              value={dayjs(new Date(subInfo.currentPeriodEnd * 1000))}
              disabledDate={(d) =>
                d.isBefore(
                  new Date(
                    subInfo?.currentPeriodEnd * 1000 + 1000 * 60 * 60 * 24
                  )
                )
              }
            />
          )}
          {subInfo != null &&
            subInfo.trialEnd != 0 &&
            subInfo.trialEnd > subInfo.currentPeriodEnd && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#f44336',
                  marginLeft: '6px'
                }}
              >
                +
                {daysBetweenDate(
                  subInfo.currentPeriodEnd * 1000,
                  subInfo.trialEnd * 1000
                )}{' '}
                days →{' '}
                {dayjs(new Date(subInfo.trialEnd * 1000)).format('YYYY-MMM-DD')}
              </span>
            )}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          First Pay
        </Col>
        <Col span={6}>
          {' '}
          {subInfo && subInfo.firstPaidTime != null && (
            <span>
              {subInfo.firstPaidTime == 0
                ? 'N/A'
                : dayjs(new Date(subInfo.firstPaidTime * 1000)).format(
                    'YYYY-MMM-DD'
                  )}
            </span>
          )}
        </Col>
        <Col span={4} style={colStyle}>
          Payment Gateway
        </Col>
        <Col span={10}>
          {' '}
          {subInfo &&
            appConfigStore.gateway.find(
              (g) => g.gatewayId == subInfo?.gatewayId
            )?.gatewayName}
        </Col>
      </Row>

      {subInfo && (subInfo.status == 1 || subInfo.status == 8) && (
        <div className="mx-0 my-6 flex items-center justify-start gap-9">
          <Button onClick={toggleChangeSubStatusModal}>
            Mark as Incomplete
          </Button>
        </div>
      )}

      {subInfo && subInfo.status == 2 && (
        <div className="mx-0 my-6 flex items-center justify-start gap-9">
          <Button onClick={toggleChangPlanModal}>Change Plan</Button>
          {subInfo.cancelAtPeriodEnd == 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button onClick={toggleTerminateModal}>End Subscription</Button>
            </div>
          ) : (
            <div>
              <span>Subscription will end on </span>
              <span style={{ color: 'red', marginRight: '8px' }}>
                {subInfo &&
                  dayjs(new Date(subInfo!.currentPeriodEnd * 1000)).format(
                    'YYYY-MMM-DD HH:mm:ss'
                  )}
              </span>
              <Button onClick={toggleResumeSubModal}>Resume</Button>
            </div>
          )}
        </div>
      )}
      {subInfo?.unfinishedSubscriptionPendingUpdate && (
        <PendingUpdateSection subInfo={subInfo} />
      )}
    </>
  )
}

const PendingUpdateSection = ({ subInfo }: { subInfo: ISubscriptionType }) => {
  const i = subInfo.unfinishedSubscriptionPendingUpdate
  return (
    <>
      <Divider orientation="left" style={{ margin: '32px 0' }}>
        Pending Update
      </Divider>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan
        </Col>
        <Col span={6}>{i!.updatePlan.planName}</Col>
        <Col span={4} style={colStyle}>
          Plan Description
        </Col>
        <Col span={6}>{i!.updatePlan.description}</Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Plan Price
        </Col>
        <Col span={6}>
          {showAmount(i!.updatePlan.amount, i!.updatePlan.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Addons Price
        </Col>
        <Col span={6}>
          {i?.updateAddons &&
            showAmount(
              i.updateAddons!.reduce(
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number }
                ) => sum + quantity * amount,
                0
              ),
              i.updateCurrency
            )}

          {i?.updateAddons && i.updateAddons.length > 0 && (
            <Popover
              placement="top"
              title="Addon breakdown"
              content={
                <div style={{ width: '280px' }}>
                  {i?.updateAddons.map((a) => (
                    <Row key={a.id}>
                      <Col span={10}>{a.planName}</Col>
                      <Col span={14}>
                        {showAmount(a.amount, a.currency)} × {a.quantity} ={' '}
                        {showAmount(a.amount * a.quantity, a.currency)}
                      </Col>
                    </Row>
                  ))}
                </div>
              }
            >
              <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
                <InfoCircleOutlined />
              </span>
            </Popover>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Proration Amount
        </Col>
        <Col span={6}>{showAmount(i!.prorationAmount, i!.updateCurrency)}</Col>
        <Col span={4} style={colStyle}>
          <span>Paid</span>
        </Col>
        <Col span={6}>
          {i!.paid == 1 ? (
            <CheckCircleOutlined style={{ color: 'green' }} />
          ) : (
            <MinusOutlined style={{ color: 'red' }} />
          )}
          {i!.link != '' && (
            <a
              href={i!.link}
              target="_blank"
              style={{ marginLeft: '8px', fontSize: '11px' }}
              rel="noreferrer"
            >
              Payment Link
            </a>
          )}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Total Amount
        </Col>
        <Col span={6}>
          {' '}
          {showAmount(i!.updateAmount, i!.updatePlan.currency)}
        </Col>
        <Col span={4} style={colStyle}>
          Bill Period
        </Col>
        <Col span={6}>
          {`${i!.updatePlan.intervalCount} ${i!.updatePlan.intervalUnit}`}
        </Col>
      </Row>

      <Row style={rowStyle}>
        <Col span={4} style={colStyle}>
          Effective Date
        </Col>
        <Col span={6}>
          {dayjs(new Date(i!.effectTime * 1000)).format('YYYY-MMM-DD HH:mm:ss')}
        </Col>
        <Col span={4} style={colStyle}>
          Note
        </Col>
        <Col span={6}>{i?.note}</Col>
      </Row>
    </>
  )
}
