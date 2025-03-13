import GraduationIcon from '@/assets/graduation.svg?react'
import { METRIC_CHARGE_TYPE, METRICS_AGGREGATE_TYPE } from '@/constants'
import { showAmount } from '@/helpers'
import { getMetricUsageBySubIdReq, getSubDetailInProductReq } from '@/requests'
import {
  ChargedMetricUsage,
  LimitMetricUsage,
  MetricAggregationType,
  MetricChargeType,
  MetricGraduatedAmount
} from '@/shared.types'
import { LoadingOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Col, Divider, message, Popover, Row, Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useEffect, useRef, useState } from 'react'

const Index = ({
  userId,
  productId
}: {
  userId: number
  productId: number
  refreshSub?: boolean
  refreshUserProfile?: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const subCurrencyRef = useRef<string>('')
  const [limitMetricUsage, setLimitMetricUsage] = useState<LimitMetricUsage[]>(
    []
  )
  const [chargedMetricUsage, setChargedMetricUsage] = useState<
    ChargedMetricUsage[]
  >([])

  const getSubInProduct = async () => {
    if (loading) {
      return
    }
    setLoading(true)
    const [res, err] = await getSubDetailInProductReq({
      userId,
      productId,
      refreshCb: getSubInProduct
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    if (res.subscription == null) {
      // not all product have active subscription
      return
    }
    const [res2, err2] = await getMetricUsageBySubIdReq(
      res.subscription.subscriptionId
    )
    if (err2 != null) {
      message.error(err.message)
      return
    }
    console.log('get metric usage by subId', res2)
    subCurrencyRef.current = res2.subscription.currency
    setLimitMetricUsage(res2.limitStats ?? [])

    const chargedMetricUsage = res2.meteredChargeStats ?? []
    const recurringChargedMetricUsage =
      res2.recurringChargeStats == null
        ? []
        : res2.recurringChargeStats.map((r: ChargedMetricUsage) => ({
            ...r,
            isRecurring: true
          }))

    setChargedMetricUsage([
      ...chargedMetricUsage,
      ...recurringChargedMetricUsage
    ])
  }

  const limitMetricUsageColumns: ColumnsType<LimitMetricUsage> = [
    {
      title: 'Name',
      dataIndex: ['metricLimit', 'metricName'],
      key: 'metricName'
    },
    {
      title: 'Code',
      dataIndex: ['metricLimit', 'code'],
      key: 'code'
    },
    {
      title: 'Aggregate Type',
      dataIndex: ['metricLimit', 'aggregationType'],
      key: 'aggregationType',
      render: (_, metricLimit) =>
        METRICS_AGGREGATE_TYPE[metricLimit.metricLimit.aggregationType].label
    },
    {
      title: 'Aggregate Property',
      dataIndex: ['metricLimit', 'aggregationProperty'],
      key: 'aggregationProperty',
      render: (value, metricLimit) => {
        return metricLimit.metricLimit.aggregationType ==
          MetricAggregationType.COUNT
          ? 'N/A'
          : value
      }
    },
    {
      title: 'Limit Value',
      dataIndex: ['metricLimit', 'TotalLimit'],
      key: 'TotalLimit'
    },
    {
      title: 'Consumed',
      dataIndex: 'CurrentUsedValue',
      key: 'CurrentUsedValue'
    }
  ]

  const chargedMetricUsageColumns: ColumnsType<ChargedMetricUsage> = [
    {
      title: 'Name',
      dataIndex: ['merchantMetric', 'metricName'],
      key: 'metricName'
    },
    /* {
      title: 'Code',
      dataIndex: ['merchantMetric', 'code'],
      key: 'code'
    }, */
    {
      title: 'Is Recurring',
      dataIndex: 'isRecurring',
      key: 'isRecurring',
      render: (isRecurring) => (isRecurring ? 'Yes' : 'No')
    },
    {
      title: 'Aggregate Type',
      dataIndex: ['merchantMetric', 'aggregationType'],
      key: 'aggregationType',
      render: (_, record) =>
        METRICS_AGGREGATE_TYPE[record.merchantMetric.aggregationType].label
    },
    {
      title: 'Aggregate Property',
      dataIndex: ['merchantMetric', 'aggregationProperty'],
      key: 'aggregationProperty'
    },
    {
      title: 'Pricing Type',
      dataIndex: ['chargePricing', 'chargeType'],
      key: 'chargeType',
      render: (chargeType, record) => (
        <div className="flex items-center gap-2">
          {METRIC_CHARGE_TYPE[chargeType as MetricChargeType].label}{' '}
          {chargeType == MetricChargeType.GRADUATED && (
            <Popover
              overlayStyle={{ width: '360px' }}
              // open={true}
              content={
                <GraudatedPricingInfo
                  amt={record.chargePricing.graduatedAmounts}
                  currency={subCurrencyRef.current}
                />
              }
            >
              <GraduationIcon />
            </Popover>
          )}
        </div>
      )
    },
    {
      title: 'Price(Start Value)',
      dataIndex: ['chargePricing', 'chargeType'],
      key: 'price',
      render: (chargeType, record) => {
        if (chargeType == MetricChargeType.STANDARD) {
          return (
            showAmount(
              record.chargePricing.standardAmount ?? 0,
              subCurrencyRef.current
            ) + `(${record.chargePricing.standardStartValue})`
          )
        }
        return 'N/A'
      }
    },
    {
      title: 'Consumed',
      dataIndex: 'CurrentUsedValue',
      key: 'CurrentUsedValue'
    },
    {
      title: 'Cost',
      dataIndex: 'totalChargeAmount',
      key: 'totalChargeAmount',
      render: (amt) => showAmount(amt, subCurrencyRef.current)
    }
  ]

  const getTotalCost = () => {
    return chargedMetricUsage.reduce(
      (acc, curr) => acc + (curr.totalChargeAmount ?? 0),
      0
    )
  }

  useEffect(() => {
    getSubInProduct()
  }, [userId, productId])

  return (
    <div>
      <div className="my-6 text-lg text-gray-600">Limit Metered Usage</div>
      <Table
        // rowKey={'id'}
        columns={limitMetricUsageColumns}
        dataSource={limitMetricUsage}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        pagination={false}
      />
      <div className="my-6 text-lg text-gray-600">Charged Metered Usage</div>
      <Table
        // rowKey={'id'}
        columns={chargedMetricUsageColumns}
        dataSource={chargedMetricUsage}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        pagination={false}
        footer={() => (
          <div className="flex justify-end text-lg text-gray-600">
            Total: {showAmount(getTotalCost(), subCurrencyRef.current)}
          </div>
        )}
      />
      <div className="my-4 flex justify-end">
        <Button onClick={getSubInProduct} icon={<SyncOutlined />}>
          Refresh
        </Button>
      </div>
    </div>
  )
}

export default Index

const headerStyle = 'text-gray-500'
const GraudatedPricingInfo = ({
  amt,
  currency
}: {
  amt: MetricGraduatedAmount[]
  currency: string
}) => {
  return (
    <>
      <Row>
        <Col span={6} className={headerStyle}>
          First Unit
        </Col>
        <Col span={6} className={headerStyle}>
          Last Unit
        </Col>
        <Col span={6} className={headerStyle}>
          Per Price
        </Col>
        <Col span={6} className={headerStyle}>
          Flat Fee
        </Col>
      </Row>
      <Divider style={{ margin: '8px 0' }} />
      {amt.map((a) => (
        <Row>
          <Col span={6}>{a.startValue}</Col>
          <Col span={6}>{a.endValue == -1 ? '∞' : a.endValue}</Col>
          <Col span={6}>{showAmount(a.perAmount ?? 0, currency)}</Col>
          <Col span={6}>{showAmount(a.flatAmount ?? 0, currency)}</Col>
        </Row>
      ))}
    </>
  )
}
