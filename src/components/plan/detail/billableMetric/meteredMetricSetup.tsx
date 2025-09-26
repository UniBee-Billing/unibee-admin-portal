import GraduationIcon from '@/assets/graduation.svg?react'
import { METRIC_CHARGE_TYPE, METRICS_AGGREGATE_TYPE } from '@/constants'
import {
  CURRENCY,
  IBillableMetrics,
  MetricChargeType,
  MetricMeteredCharge
} from '@/shared.types'
import {
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Col,
  InputNumber,
  Popover,
  Row,
  Select,
  Typography,
  Card,
  Spin
} from 'antd'
import { MouseEventHandler, PropsWithChildren, useState, useEffect } from 'react'
import { amountMultiCurrenciesExchangeReq, getMerchantInfoReq } from '@/requests'
import GraduationSetup from './graduationSetup'
import { MetricData } from './types'

interface MultiCurrencyExchange {
  currency: string
  autoExchange: boolean
  exchangeRate: number
  amount: number
  disable: boolean
}

interface MultiCurrencyData {
  [localId: string]: {
    exchanges: MultiCurrencyExchange[]
    lastUpdated: string
    loading: boolean
  }
}

interface CurrencyInfo {
  Currency: string
  Symbol: string
  Scale: number
}

type ChargeSetupProps = {
  metricData: MetricMeteredCharge[]
  metricDataType: keyof MetricData
  metricsList: IBillableMetrics[]
  isRecurring: boolean
  getCurrency: () => CURRENCY
  addMetricData: (type: keyof MetricData) => void
  removeMetricData: (type: keyof MetricData, localId: string) => void
  onMetricFieldChange: (
    type: keyof MetricData,
    localId: string,
    field: keyof MetricMeteredCharge
  ) => (val: number | null | MouseEventHandler<HTMLElement>) => void
  formDisabled: boolean
}
const rowHeaderStyle = 'text-gray-400'
const colSpan = [6, 7, 4, 5, 2]

const Index = ({
  metricData,
  metricDataType,
  metricsList,
  isRecurring,
  getCurrency,
  addMetricData,
  removeMetricData,
  onMetricFieldChange,
  formDisabled
}: ChargeSetupProps) => {
  const [multiCurrencyData, setMultiCurrencyData] = useState<MultiCurrencyData>({})
  const [currencyList, setCurrencyList] = useState<CurrencyInfo[]>([])
  const [multiCurrencyCollapsed, setMultiCurrencyCollapsed] = useState<{[localId: string]: boolean}>({})

  // Fetch currency list from merchant info
  useEffect(() => {
    const fetchCurrencyList = async () => {
      try {
        const [merchantInfo, error] = await getMerchantInfoReq()
        if (error) {
          // console.error('Failed to fetch merchant info:', error)
          return
        }
        
        if (merchantInfo?.Currency && Array.isArray(merchantInfo.Currency)) {
          setCurrencyList(merchantInfo.Currency)
        }
      } catch (_error) {
        // console.error('Error fetching merchant info:', _error)
      }
    }

    fetchCurrencyList()
  }, [])

  // Fetch multi-currency exchange rates when price changes
  const fetchMultiCurrencyExchange = async (localId: string, amount: number, currency: string) => {
    if (!amount || amount <= 0) {
      setMultiCurrencyData(prev => ({
        ...prev,
        [localId]: {
          exchanges: [],
          lastUpdated: '',
          loading: false
        }
      }))
      return
    }

    setMultiCurrencyData(prev => ({
      ...prev,
      [localId]: {
        ...prev[localId],
        loading: true
      }
    }))

    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const apiPromise = amountMultiCurrenciesExchangeReq(amount, currency)
      const [data, error] = await Promise.race([apiPromise, timeoutPromise]) as [unknown, unknown]
      
      if (error) {
        // console.error('Failed to fetch multi-currency exchange:', error)
        setMultiCurrencyData(prev => ({
          ...prev,
          [localId]: {
            exchanges: [],
            lastUpdated: '',
            loading: false
          }
        }))
        return
      }

      if (data && (data as any).data && (data as any).data.multiCurrencyConfigs) {
        // Store the complete exchange data including calculated amounts
        const exchangeData = (data as any).data.multiCurrencyConfigs.map((config: { currency: string; autoExchange: boolean; exchangeRate: number; amount: number; disable: boolean }) => ({
          currency: config.currency,
          autoExchange: config.autoExchange,
          exchangeRate: config.exchangeRate,
          amount: config.amount,
          disable: config.disable
        }))
        
        setMultiCurrencyData(prev => ({
          ...prev,
          [localId]: {
            exchanges: exchangeData,
            lastUpdated: new Date().toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            loading: false
          }
        }))
      } else {
        setMultiCurrencyData(prev => ({
          ...prev,
          [localId]: {
            exchanges: [],
            lastUpdated: '',
            loading: false
          }
        }))
      }
    } catch (_error) {
      // console.error('Error fetching multi-currency exchange:', _error)
      setMultiCurrencyData(prev => ({
        ...prev,
        [localId]: {
          exchanges: [],
          lastUpdated: '',
          loading: false
        }
      }))
    }
  }

  // Handle Multi-Currency collapse/expand (only when no data available)
  const handleMultiCurrencyToggle = (localId: string) => {
    const hasData = multiCurrencyData[localId]?.exchanges && multiCurrencyData[localId].exchanges.length > 0
    
    // Don't allow collapse if there is data
    if (hasData) {
      return
    }
    
    const isCurrentlyCollapsed = multiCurrencyCollapsed[localId] !== false
    
    setMultiCurrencyCollapsed(prev => ({
      ...prev,
      [localId]: !isCurrentlyCollapsed
    }))
    
    // If expanding and no data exists, try to fetch it
    if (isCurrentlyCollapsed) {
      const metricItem = metricData.find(m => m.localId === localId)
      if (metricItem && metricItem.standardAmount && metricItem.standardAmount > 0) {
        const currency = getCurrency()?.Currency || 'EUR'
        const amountInCents = Math.round(metricItem.standardAmount * 100)
        fetchMultiCurrencyExchange(localId, amountInCents, currency)
      }
    }
  }

  // Handle price change with debounced API call
  const handlePriceChange = (localId: string, value: number | null) => {
    // Call the original onChange handler
    onMetricFieldChange(metricDataType, localId, 'standardAmount')(value)
    
    // Auto-expand when price is set, collapse when price is cleared
    if (value && value > 0) {
      setMultiCurrencyCollapsed(prev => ({
        ...prev,
        [localId]: false // Always expand when price is set
      }))
      
      const currency = getCurrency()?.Currency || 'EUR'
      // Convert to smallest currency unit (multiply by 100)
      const amountInCents = Math.round(value * 100)
      fetchMultiCurrencyExchange(localId, amountInCents, currency)
    } else {
      // Reset to collapsed state when price is cleared
      setMultiCurrencyCollapsed(prev => ({
        ...prev,
        [localId]: true
      }))
      
      // Clear data if value is invalid
      setMultiCurrencyData(prev => ({
        ...prev,
        [localId]: {
          exchanges: [],
          lastUpdated: '',
          loading: false
        }
      }))
    }
  }

  const metricSelected = (metricId: number) =>
    metricData.find((m) => m.metricId === metricId) != undefined

  const getMetricInfo = (metricId: number) => {
    const metric = metricsList.find((m) => m.id === metricId)
    if (metric == undefined) {
      return null
    }
    const content = [
      {
        label: 'Code',
        value: metric?.code
      },
      {
        label: 'Props',
        value: metric?.aggregationProperty
      },
      {
        label: 'AggreType',
        value: METRICS_AGGREGATE_TYPE[metric.aggregationType].label
      }
    ]
    return (
      <>
        {content.map((c) => (
          <Row key={c.label} gutter={[16, 16]}>
            <Col span={8} className="font-sm text-gray-500">
              {c.label}
            </Col>
            <Col span={16} className="font-sm text-gray-800">
              {c.value}
            </Col>
          </Row>
        ))}
      </>
    )
  }
  const header = [
    { label: 'Name' },
    { label: 'Pricing type' },
    { label: 'Price' },
    { label: 'Start value' },
    {
      label: (
        <Button
          icon={<PlusOutlined />}
          size="small"
          style={{ border: 'none' }}
          variant="outlined"
          onClick={() => addMetricData(metricDataType)}
        />
      )
    }
  ]
  return (
    <div className="my-4 rounded-md bg-gray-100 p-4">
      <Typography.Title level={5}>
        Charge Metered{isRecurring ? ' (recurring)' : ''}
        <Popover
          content={
            <div className="max-w-96">
              {`${isRecurring ? 'Calculated value is cumulative, NOT reset to 0 at each sub-period start.' : 'Calculated value is reset to 0 at each sub-period start.'}`}
            </div>
          }
        >
          <InfoCircleOutlined className="ml-2 text-gray-400" />
        </Popover>
      </Typography.Title>
      <Row>
        {header.map((h, i) => (
          <Col key={i} span={colSpan[i]} className={rowHeaderStyle}>
            {h.label}
          </Col>
        ))}
      </Row>
      {metricData.map((m: MetricMeteredCharge) => (
        <div key={m.localId}>
          <Row key={m.localId} className="my-2">
            <Col span={colSpan[0]}>
              <div>
                <Select
                  style={{ width: '80%' }}
                  value={m.metricId}
                  onChange={onMetricFieldChange(
                    metricDataType,
                    m.localId,
                    'metricId'
                  )}
                  options={metricsList.map((m) => ({
                    label: m.metricName,
                    value: m.id,
                    disabled: metricSelected(m.id)
                  }))}
                />
                &nbsp;&nbsp;
                {m.metricId && (
                  <Popover
                    content={getMetricInfo(m.metricId)}
                    overlayStyle={{ maxWidth: '360px', minWidth: '280px' }}
                  >
                    <InfoCircleOutlined />
                  </Popover>
                )}
              </div>
            </Col>
            <Col span={colSpan[1]}>
              <div className="flex items-center">
                <Select
                  style={{ width: '80%' }}
                  value={m.chargeType}
                  onChange={onMetricFieldChange(
                    metricDataType,
                    m.localId,
                    'chargeType'
                  )}
                  options={[
                    {
                      label:
                        METRIC_CHARGE_TYPE[MetricChargeType.STANDARD].label,
                      value: MetricChargeType.STANDARD
                    },
                    {
                      label:
                        METRIC_CHARGE_TYPE[MetricChargeType.GRADUATED].label,
                      value: MetricChargeType.GRADUATED
                    }
                  ]}
                />
                &nbsp;&nbsp;
                {m.chargeType == MetricChargeType.GRADUATED && (
                  <BadgedButton
                    showBadge={m.graduatedAmounts.length > 0}
                    count={m.graduatedAmounts.length}
                  >
                    <Button
                      onClick={(evt) =>
                        onMetricFieldChange(
                          metricDataType,
                          m.localId,
                          'expanded'
                        )(evt as unknown as MouseEventHandler<HTMLElement>)
                      }
                      disabled={false} // this button is to toggle the show/hide of graduated amounts, no need to be disabled after plan activated
                      size="small"
                      style={{ border: 'none' }}
                      icon={
                        <GraduationIcon
                          style={{ color: m.expanded ? 'blue' : 'gray' }}
                        />
                      }
                    />
                  </BadgedButton>
                )}
              </div>
            </Col>
            <Col span={colSpan[2]}>
              <InputNumber
                style={{ width: '80%' }}
                prefix={getCurrency()?.Symbol}
                min={0}
                value={m.standardAmount}
                onChange={(value) => handlePriceChange(m.localId, value)}
                disabled={m.chargeType == MetricChargeType.GRADUATED}
              />
            </Col>
            <Col span={colSpan[3]}>
              <InputNumber
                style={{ width: '80%' }}
                min={0}
                value={m.standardStartValue}
                onChange={onMetricFieldChange(
                  metricDataType,
                  m.localId,
                  'standardStartValue'
                )}
                disabled={m.chargeType == MetricChargeType.GRADUATED}
              />
            </Col>
            <Col span={2}>
              <Button
                icon={<MinusOutlined />}
                size="small"
                style={{ border: 'none' }}
                onClick={() => removeMetricData(metricDataType, m.localId)}
              />
            </Col>
          </Row>

          {/* Multi-Currency Pricing Section */}
          {m.standardAmount && m.standardAmount > 0 && (
            <div className="mt-4 mb-4">
              <div className="bg-gray-50 rounded-md">
                {(() => {
                  const hasData = multiCurrencyData[m.localId]?.exchanges && multiCurrencyData[m.localId].exchanges.length > 0
                  const isExpanded = multiCurrencyCollapsed[m.localId] === false
                  const showCollapseButton = !hasData && !multiCurrencyData[m.localId]?.loading
                  
                  return (
                    <>
                      <div 
                        className={`flex items-center justify-between p-3 ${showCollapseButton ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                        onClick={showCollapseButton ? () => handleMultiCurrencyToggle(m.localId) : undefined}
                      >
                        <div className="flex items-center">
                          <Typography.Title level={5} className="mb-0 mr-2">
                            Multi-Currency Pricing
                          </Typography.Title>
                          <Popover
                            content={
                              <div className="max-w-96">
                                Real-time currency conversion based on current exchange rates
                                {showCollapseButton && '. Click to expand/collapse'}
                              </div>
                            }
                          >
                            <InfoCircleOutlined className="text-gray-400" />
                          </Popover>
                        </div>
                        <div className="flex items-center space-x-2">
                          {multiCurrencyData[m.localId]?.lastUpdated && hasData && (
                            <span className="text-sm text-gray-500">
                              Last updated: {multiCurrencyData[m.localId].lastUpdated}
                            </span>
                          )}
                          {showCollapseButton && (
                            isExpanded ? 
                              <UpOutlined className="text-gray-400" /> : 
                              <DownOutlined className="text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {(hasData || isExpanded || multiCurrencyData[m.localId]?.loading) && (
                        <div className="px-4 pb-4">
                          <Spin spinning={multiCurrencyData[m.localId]?.loading || false}>
                            <div className="flex gap-4 flex-wrap">
                              {multiCurrencyData[m.localId]?.exchanges?.map((exchange, index) => {
                                // Get currency symbol from merchant info
                                const getCurrencySymbol = (currency: string) => {
                                  const currencyInfo = currencyList.find(c => c.Currency === currency)
                                  return currencyInfo?.Symbol || currency
                                }

                                // Use the amount directly from API response (already calculated)
                                // Convert from cents to display format
                                const displayAmount = exchange.amount / 100

                                return (
                                  <Card key={index} size="small" className="flex-1 min-w-[120px]">
                                    <div className="text-center">
                                      <div className="text-sm text-gray-600 mb-1">
                                        {getCurrencySymbol(exchange.currency)} {exchange.currency}
                                      </div>
                                      <div className="text-lg font-bold text-gray-800">
                                        {getCurrencySymbol(exchange.currency)}{displayAmount.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Rate: {exchange.exchangeRate.toFixed(4)}
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })}
                              {(!multiCurrencyData[m.localId]?.exchanges || multiCurrencyData[m.localId].exchanges.length === 0) && !multiCurrencyData[m.localId]?.loading && (
                                <div className="text-center text-gray-500 py-4 w-full">
                                  No multi-currency data available
                                </div>
                              )}
                            </div>
                          </Spin>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          <div className={`flex w-full justify-end drop-shadow-lg`}>
            <div
              style={{
                width: '85%',
                marginRight: '8%',
                scrollbarGutter: 'stable both-edges'
              }}
              className={`relative overflow-hidden rounded-md bg-white transition-all duration-200 ${m.expanded && m.chargeType == MetricChargeType.GRADUATED ? 'max-h-96' : 'max-h-0'}`}
            >
              <GraduationSetup
                data={m.graduatedAmounts}
                metricDataType={metricDataType}
                metricLocalId={m.localId}
                getCurrency={getCurrency}
                formDisabled={formDisabled}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface BadgedButtonProps extends PropsWithChildren<object> {
  showBadge: boolean
  count: number
}

const BadgedButton: React.FC<BadgedButtonProps> = ({
  showBadge,
  count,
  children
}) =>
  showBadge ? (
    <Badge count={count} color="gray">
      {children}
    </Badge>
  ) : (
    children
  )

export default Index
