import {
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Col, Empty, Popover, Row, Spin, Tooltip, message } from 'antd'
import dayjs from 'dayjs'
import React, { CSSProperties, ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IProfile, ISubscriptionType } from '../../@types/shared.types'
import { normalizeSub, showAmount } from '../../helpers'
import { getSubDetailInProductReq } from '../../requests'
import { SubscriptionStatus } from '../ui/statusTag'
import ModalAssignSub from './assignSubModal'

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }
//   extraButton?: ReactElement

const Index = ({
  userId,
  userProfile,
  productId,
  refreshSub,
  extraButton
}: {
  userId: number
  userProfile: IProfile | undefined
  productId: number
  refreshSub: boolean
  extraButton?: ReactElement
}) => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [subInfo, setSubInfo] = useState<ISubscriptionType | null>(null) // null: when page is loading, or no active sub.

  const [assignSubModalOpen, setAssignSubModalOpen] = useState(false)
  const toggleAssignSub = () => setAssignSubModalOpen(!assignSubModalOpen)

  const goToSubDetail = (subId: string) => () =>
    navigate(`/subscription/${subId}`)

  // it's better to call setRefresh(false) here, coz I've finished refresh
  const getSubInProduct = async () => {
    if (loading) {
      return
    }
    setLoading(true)
    const [res, err] = await getSubDetailInProductReq({
      userId,
      productId
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const sub = normalizeSub(res)
    setSubInfo(sub)
  }

  useEffect(() => {
    getSubInProduct()
  }, [productId])

  useEffect(() => {
    if (refreshSub) {
      getSubInProduct()
    }
  }, [refreshSub])

  return (
    <div>
      {assignSubModalOpen && userProfile != null && (
        <ModalAssignSub
          user={userProfile}
          productId={productId}
          closeModal={toggleAssignSub}
          refresh={getSubInProduct}
        />
      )}
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
      >
        {subInfo == null ? (
          <Empty
            description="No Subscription"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <Row style={rowStyle}>
              <Col span={4} style={colStyle}>
                Plan
              </Col>
              <Col span={6}>{subInfo?.plan?.planName}</Col>
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
                {SubscriptionStatus(subInfo.status)}
                <Tooltip title="Refresh">
                  <span
                    style={{ cursor: 'pointer', marginLeft: '8px' }}
                    onClick={getSubInProduct}
                  >
                    <SyncOutlined />
                  </span>
                </Tooltip>
              </Col>
              <Col span={4} style={colStyle}>
                Subscription Id
              </Col>
              <Col span={6}>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  onClick={goToSubDetail(subInfo?.subscriptionId)}
                >
                  {subInfo?.subscriptionId}
                </Button>
              </Col>
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
                        {
                          quantity,
                          amount
                        }: { quantity: number; amount: number }
                      ) => sum + quantity * amount,
                      0
                    ),
                    subInfo!.currency
                  )}

                {subInfo.addons && subInfo.addons.length > 0 && (
                  <Popover
                    placement="top"
                    title="Addon breakdown"
                    content={
                      <div style={{ width: '280px' }}>
                        {subInfo?.addons.map((a, idx) => (
                          <Row key={idx}>
                            <Col span={10}>{a.planName}</Col>
                            <Col span={14}>
                              {showAmount(a.amount, a.currency)} × {a.quantity}{' '}
                              = {showAmount(a.amount * a.quantity, a.currency)}
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
                Total Amount
              </Col>
              <Col span={6}>
                {subInfo?.amount &&
                  showAmount(subInfo.amount, subInfo.currency)}
                {subInfo &&
                subInfo.taxPercentage &&
                subInfo.taxPercentage != 0 ? (
                  <span className="text-xs text-gray-500">
                    {` (${subInfo.taxPercentage / 100}% tax incl)`}
                  </span>
                ) : null}
              </Col>

              <Col span={4} style={colStyle}>
                Bill Period
              </Col>
              <Col span={6}>
                {subInfo != null && subInfo.plan != null
                  ? `${subInfo.plan.intervalCount} ${subInfo.plan.intervalUnit}`
                  : ''}
              </Col>
            </Row>
            <Row style={rowStyle}>
              <Col span={4} style={colStyle}>
                First pay
              </Col>
              <Col span={6}>
                {subInfo && (
                  <span>
                    {subInfo.firstPaidTime == 0 || subInfo.firstPaidTime == null
                      ? 'N/A'
                      : dayjs(new Date(subInfo.firstPaidTime * 1000)).format(
                          'YYYY-MMM-DD'
                        )}
                  </span>
                )}
              </Col>
              <Col span={4} style={colStyle}>
                Next due date
              </Col>
              <Col span={10}>
                {subInfo &&
                  dayjs(new Date(subInfo.currentPeriodEnd * 1000)).format(
                    'YYYY-MMM-DD'
                  )}
              </Col>
            </Row>
          </>
        )}
      </Spin>

      <Button
        onClick={toggleAssignSub}
        disabled={
          loading ||
          subInfo != null ||
          userProfile == null ||
          userProfile?.status == 2
        } // user has active sub || user not exist || user is suspended
        className="my-4"
      >
        Assign Subscription
      </Button>
      <div className="mt-6 flex items-center justify-center">{extraButton}</div>
    </div>
  )
}

export default Index
