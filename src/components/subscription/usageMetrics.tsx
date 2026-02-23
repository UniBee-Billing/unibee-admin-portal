import { getMetricQueryableInvoicesReq } from '@/requests'
import { ISubscriptionType, LimitMetricUsage, SubscriptionStatus } from '@/shared.types'
import { ReloadOutlined } from '@ant-design/icons'
import { Button, Select, Spin, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ViewTotalLimitModal from '../user/metricLimitModals/viewTotalLimitModal'

// Progress bar color thresholds
const USAGE_THRESHOLD = {
  NORMAL: 60,
  HIGH: 80
}

// Get progress bar color based on usage percentage
const getProgressColor = (percentage: number): string => {
  if (percentage >= USAGE_THRESHOLD.HIGH) {
    return '#f5222d' // Red - Critical
  } else if (percentage >= USAGE_THRESHOLD.NORMAL) {
    return '#fa8c16' // Orange - High
  }
  return '#52c41a' // Green - Normal
}

// Format billing cycle display
const formatBillingCycle = (startTime: number, endTime: number): string => {
  const start = dayjs(startTime * 1000).format('YYYY-MMM-DD')
  const end = dayjs(endTime * 1000).format('YYYY-MMM-DD')
  return `${start} to ${end}`
}

interface UsageMetric {
  key: string
  metricId: number
  name: string
  code: string
  usage: number
  limit: number | null // null means unlimited
  billingCycleStart: number
  billingCycleEnd: number
  invoiceId?: string // Invoice ID for querying events
  metricLimitData?: LimitMetricUsage['metricLimit']
}

interface InvoiceOption {
  value: string
  label: string
  invoiceId: string
  periodStart: number
  periodEnd: number
}

interface Props {
  subInfo: ISubscriptionType | null
}

// Extract metrics from an invoice's lines and userMetricChargeForInvoice
const extractMetricsFromInvoice = (inv: any): UsageMetric[] => {
  const usageMetrics: UsageMetric[] = []
  const periodStart = inv.periodStart || inv.createTime || 0
  const periodEnd = inv.periodEnd || inv.createTime || 0

  // Aggregate limit metrics across all lines (plan + addons, with quantity)
  if (inv.lines && inv.lines.length > 0) {
    const limitMap = new Map<number, { name: string; code: string; type: number; totalLimit: number }>()

    inv.lines.forEach((line: any) => {
      const qty = (line.quantity ?? 1) < 1 ? 1 : (line.quantity ?? 1)
      if (line.planMetricLimitConfigs && line.planMetricLimitConfigs.length > 0) {
        line.planMetricLimitConfigs.forEach((cfg: any) => {
          const existing = limitMap.get(cfg.metricId)
          const cfgLimit = (cfg.metricLimit ?? 0) * qty
          if (existing) {
            existing.totalLimit += cfgLimit
          } else {
            limitMap.set(cfg.metricId, {
              name: cfg.metricName || '',
              code: cfg.metricCode || '',
              type: cfg.metricType ?? 0,
              totalLimit: cfgLimit
            })
          }
        })
      }
    })

    limitMap.forEach((val, metricId) => {
      usageMetrics.push({
        key: `limit-${metricId}`,
        metricId,
        name: val.name,
        code: val.code,
        usage: 0,
        limit: val.totalLimit,
        billingCycleStart: periodStart,
        billingCycleEnd: periodEnd,
        invoiceId: inv.invoiceId,
        metricLimitData: {
          id: metricId,
          MetricId: metricId,
          merchantId: 0,
          metricId: metricId,
          metricName: val.name,
          code: val.code,
          TotalLimit: val.totalLimit,
          metricDescription: '',
          type: val.type,
          aggregationType: 1,
          aggregationProperty: '',
          gmtModify: '',
          createTime: ''
        } as LimitMetricUsage['metricLimit']
      })
    })
  }

  // Extract metered/recurring charge metrics from userMetricChargeForInvoice
  const chargeData = inv.userMetricChargeForInvoice
  if (chargeData) {
    if (chargeData.meteredChargeStats && chargeData.meteredChargeStats.length > 0) {
      chargeData.meteredChargeStats.forEach((item: any) => {
        const metricId = item.metricId || item.MetricId || 0
        usageMetrics.push({
          key: `metered-${metricId}`,
          metricId,
          name: item.name || '',
          code: '',
          usage: item.CurrentUsedValue || 0,
          limit: null,
          billingCycleStart: periodStart,
          billingCycleEnd: periodEnd,
          invoiceId: inv.invoiceId
        })
      })
    }

    if (chargeData.recurringChargeStats && chargeData.recurringChargeStats.length > 0) {
      chargeData.recurringChargeStats.forEach((item: any) => {
        const metricId = item.metricId || item.MetricId || 0
        usageMetrics.push({
          key: `recurring-${metricId}`,
          metricId,
          name: item.name || '',
          code: '',
          usage: item.CurrentUsedValue || 0,
          limit: null,
          billingCycleStart: periodStart,
          billingCycleEnd: periodEnd,
          invoiceId: inv.invoiceId
        })
      })
    }
  }

  return usageMetrics
}

const UsageMetrics = ({ subInfo }: Props) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<UsageMetric[]>([])
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceOption[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<string>('current')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [viewLimitModal, setViewLimitModal] = useState<{
    open: boolean
    metricLimit: LimitMetricUsage['metricLimit'] | null
    snapshotTotalLimit?: number
  }>({ open: false, metricLimit: null })

  // Cache raw invoice data from API
  const invoiceDataRef = useRef<Map<string, any>>(new Map())

  // Extract metrics from cached invoice data for a given invoiceId
  const showMetricsForInvoice = (invoiceId: string) => {
    const inv = invoiceDataRef.current.get(invoiceId)
    if (inv) {
      setMetrics(extractMetricsFromInvoice(inv))
    } else {
      setMetrics([])
    }
    setLastRefreshed(new Date())
  }

  // Fetch all queryable invoices (contains metrics data already)
  const fetchInvoices = async () => {
    if (!subInfo?.user?.id) return

    setLoading(true)
    const [res, err] = await getMetricQueryableInvoicesReq({
      userId: Number(subInfo.user.id),
      subscriptionId: subInfo.subscriptionId,
      page: 0,
      count: 50
    })
    setLoading(false)

    if (err || !res?.invoices) return

    // Cache all invoice data
    const dataMap = new Map<string, any>()
    res.invoices.forEach((inv: any) => {
      dataMap.set(inv.invoiceId, inv)
    })
    invoiceDataRef.current = dataMap

    // Build dropdown options (exclude latestInvoice since it's shown as "Current Period")
    const options: InvoiceOption[] = res.invoices
      .filter((inv: any) => inv.invoiceId !== subInfo.latestInvoice?.invoiceId)
      .map((inv: any) => {
        const startDate = inv.periodStart ? dayjs(inv.periodStart * 1000).format('YYYY-MMM-DD') : dayjs(inv.createTime * 1000).format('YYYY-MMM-DD')
        const endDate = inv.periodEnd ? dayjs(inv.periodEnd * 1000).format('YYYY-MMM-DD') : 'N/A'
        const dateRange = inv.periodStart && inv.periodEnd ? `${startDate} to ${endDate}` : startDate

        return {
          value: inv.invoiceId,
          label: `${inv.invoiceName || 'Invoice'} (${inv.invoiceId}) - ${dateRange} - ${inv.currency}${(inv.totalAmount / 100).toFixed(2)}`,
          invoiceId: inv.invoiceId,
          periodStart: inv.periodStart || inv.createTime,
          periodEnd: inv.periodEnd || inv.createTime
        }
      })

    setInvoiceOptions(options)

    const isActive = subInfo.status === SubscriptionStatus.ACTIVE
    if (isActive) {
      // Show current period metrics
      const currentInvoiceId = subInfo.latestInvoice?.invoiceId || ''
      if (currentInvoiceId) {
        showMetricsForInvoice(currentInvoiceId)
      }
    } else if (options.length > 0) {
      // Non-active: default to most recent paid invoice
      setSelectedInvoice(options[0].value)
      showMetricsForInvoice(options[0].invoiceId)
    }
  }

  // Handle invoice filter change
  const onInvoiceChange = (value: string) => {
    setSelectedInvoice(value)
    const invoiceId = value === 'current' ? (subInfo?.latestInvoice?.invoiceId || '') : value
    showMetricsForInvoice(invoiceId)
  }

  // Handle refresh - re-fetch all data from API
  const onRefresh = () => {
    fetchInvoices()
  }

  // Handle view records click - navigate to usage events page
  const onViewRecords = (metric: UsageMetric) => {
    const params = new URLSearchParams({
      subscriptionId: subInfo?.subscriptionId || '',
      metricId: String(metric.metricId),
      metricName: metric.name,
      metricCode: metric.code,
      invoiceId: metric.invoiceId || ''
    })
    navigate(`/subscription/usage-events?${params.toString()}`)
  }

  const isActive = subInfo?.status === SubscriptionStatus.ACTIVE

  useEffect(() => {
    if (subInfo) {
      fetchInvoices()
    }
  }, [subInfo?.subscriptionId])

  // Table columns
  const columns: ColumnsType<UsageMetric> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => (
        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-blue-600">
          {code}
        </span>
      )
    },
    {
      title: 'Usage',
      dataIndex: 'usage',
      key: 'usage',
      width: 100,
      render: (usage: number) => usage.toLocaleString()
    },
    {
      title: 'Limit',
      dataIndex: 'limit',
      key: 'limit',
      width: 100,
      render: (limit: number | null, record) =>
        limit === null ? (
          'Unlimited'
        ) : record.metricLimitData ? (
          <a
            onClick={() =>
              setViewLimitModal({ open: true, metricLimit: record.metricLimitData!, snapshotTotalLimit: record.limit ?? undefined })
            }
          >
            {limit.toLocaleString()}
          </a>
        ) : (
          limit.toLocaleString()
        )
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 180,
      render: (_, record) => {
        if (record.limit === null) {
          return <span className="text-gray-400">No limit</span>
        }

        const percentage = record.limit > 0
          ? Math.min((record.usage / record.limit) * 100, 100)
          : 0
        const color = getProgressColor(percentage)

        return (
          <div className="flex items-center gap-2">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200"
              style={{ minWidth: '80px' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              />
            </div>
            <span
              className="text-xs font-medium"
              style={{ color, minWidth: '45px' }}
            >
              {percentage.toFixed(1)}%
            </span>
          </div>
        )
      }
    },
    {
      title: 'Billing Cycle',
      key: 'billingCycle',
      width: 200,
      render: (_, record) => formatBillingCycle(record.billingCycleStart, record.billingCycleEnd)
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => onViewRecords(record)}
        >
          View Records
        </Button>
      )
    }
  ]

  // Don't render if no subscription
  if (!subInfo) return null

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      {viewLimitModal.open && viewLimitModal.metricLimit && (
        <ViewTotalLimitModal
          userId={subInfo.user?.id ?? 0}
          productId={subInfo.productId}
          metricLimit={viewLimitModal.metricLimit}
          snapshotTotalLimit={viewLimitModal.snapshotTotalLimit}
          onClose={() => setViewLimitModal({ open: false, metricLimit: null })}
        />
      )}
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Subscription Usage Metrics</h3>
        <div className="flex items-center gap-3">
          <span className="text-gray-500">Filter by Invoice:</span>
          <Select
            value={selectedInvoice}
            onChange={onInvoiceChange}
            style={{ minWidth: 500 }}
            options={[
              ...(isActive
                ? [
                    {
                      value: 'current',
                      label: subInfo?.latestInvoice
                        ? `Current Period (${subInfo.latestInvoice.invoiceId}) - ${dayjs(subInfo.currentPeriodStart * 1000).format('YYYY-MMM-DD')} to ${dayjs(subInfo.currentPeriodEnd * 1000).format('YYYY-MMM-DD')} - ${subInfo.latestInvoice.currency}${(subInfo.latestInvoice.totalAmount / 100).toFixed(2)}`
                        : 'Current Period'
                    }
                  ]
                : []),
              ...invoiceOptions
            ]}
          />
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Table */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={metrics}
          pagination={false}
          size="middle"
          locale={{ emptyText: 'No usage metrics available' }}
        />
      </Spin>

      {/* Legend and Last Refreshed */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: '#52c41a' }}
            />
            <span className="text-gray-600">Normal Usage</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: '#fa8c16' }}
            />
            <span className="text-gray-600">High Usage (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: '#f5222d' }}
            />
            <span className="text-gray-600">Critical (80%+)</span>
          </div>
        </div>
        {lastRefreshed && (
          <span className="text-gray-400">
            Last refreshed: {dayjs(lastRefreshed).format('h:mm:ss A')}
          </span>
        )}
      </div>

    </div>
  )
}

export default UsageMetrics
