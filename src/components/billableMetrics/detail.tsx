import CopyToClipboard from '@/components/ui/copyToClipboard'
import { METRICS_AGGREGATE_TYPE, METRICS_TYPE } from '@/constants'
import { getMetricDetailReq, saveMetricsReq, getUserListReq, getProductListReq } from '@/requests/index'
import { IBillableMetrics, MetricAggregationType, MetricType } from '@/shared.types'
import { LoadingOutlined, ApiOutlined, ThunderboltOutlined, ClockCircleOutlined, DatabaseOutlined, MailOutlined, UserOutlined, FileTextOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Spin,
  message,
  Card,
  Tooltip,
  Modal,
  InputNumber,
  Alert
} from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus'
const { TextArea } = Input

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('json', json)

// Template type definition
interface MetricTemplate {
  id: string
  name: string
  code: string
  description: string
  type: MetricType
  unit: string
  aggregationType: MetricAggregationType
  valueProperty?: string
  icon: React.ReactNode
  subtitle: string
}

// Quick Templates
const METRIC_TEMPLATES: MetricTemplate[] = [
  {
    id: 'api_requests',
    name: 'API Requests',
    code: 'api_requests',
    description: 'Total number of API requests made by users',
    type: MetricType.CHARGE_METERED,
    unit: 'request',
    aggregationType: MetricAggregationType.COUNT,
    icon: <ApiOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
    subtitle: 'Track API calls'
  },
  {
    id: 'llm_tokens',
    name: 'LLM Tokens',
    code: 'llm_tokens',
    description: 'Total tokens consumed by language model API calls',
    type: MetricType.CHARGE_METERED,
    unit: 'token_count',
    aggregationType: MetricAggregationType.SUM,
    valueProperty: 'tokens',
    icon: <ThunderboltOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
    subtitle: 'Track token usage'
  },
  {
    id: 'worker_duration',
    name: 'Worker Duration',
    code: 'worker_duration',
    description: 'Total processing time for background workers',
    type: MetricType.CHARGE_METERED,
    unit: 'seconds',
    aggregationType: MetricAggregationType.SUM,
    valueProperty: 'duration',
    icon: <ClockCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
    subtitle: 'Track processing time'
  },
  {
    id: 'storage_gb',
    name: 'Storage GB',
    code: 'storage_gb',
    description: 'Storage space used in gigabytes',
    type: MetricType.CHARGE_METERED,
    unit: 'GB',
    aggregationType: MetricAggregationType.MAX,
    valueProperty: 'storage_size',
    icon: <DatabaseOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
    subtitle: 'Track storage usage'
  },
  {
    id: 'emails_sent',
    name: 'Emails Sent',
    code: 'emails_sent',
    description: 'Total number of emails sent to users',
    type: MetricType.CHARGE_METERED,
    unit: 'emails',
    aggregationType: MetricAggregationType.COUNT,
    icon: <MailOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
    subtitle: 'Track email delivery'
  },
  {
    id: 'unique_users',
    name: 'Unique Users',
    code: 'unique_users',
    description: 'Number of unique active users',
    type: MetricType.LIMIT_METERED,
    unit: 'users',
    aggregationType: MetricAggregationType.COUNT_UNIQUE,
    valueProperty: 'user_id',
    icon: <UserOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
    subtitle: 'Track active users'
  },
  {
    id: 'custom',
    name: 'Custom',
    code: '',
    description: '',
    type: MetricType.CHARGE_METERED,
    unit: '',
    aggregationType: MetricAggregationType.COUNT,
    icon: <FileTextOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />,
    subtitle: 'Fully blank configuration'
  }
]

const AGGR_TYPE_SELECT_OPT = Object.keys(METRICS_AGGREGATE_TYPE)
  .map((s) => ({
    label: METRICS_AGGREGATE_TYPE[Number(s) as MetricAggregationType].label,
    value: Number(s)
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1))

const Index = () => {
  const params = useParams()
  const metricsId = params.metricsId
  const isNew = metricsId == null || metricsId === 'new'

  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [testForm] = Form.useForm()
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [metricProperties, setMetricProperties] = useState<Array<{ key: string; value: string }>>([])
  const [userList, setUserList] = useState<any[]>([])
  const [userListLoading, setUserListLoading] = useState(false)
  const [userSearchValue, setUserSearchValue] = useState('')
  const [productList, setProductList] = useState<any[]>([])
  const [productListLoading, setProductListLoading] = useState(false)
  
  const watchTestCode = Form.useWatch('metricCode', testForm)
  const watchTestEventId = Form.useWatch('externalEventId', testForm)
  const watchTestUserIdentifierType = Form.useWatch('userIdentifierType', testForm)
  const watchTestUserIdentifierValue = Form.useWatch('userIdentifierValue', testForm)
  const watchTestAggrValue = Form.useWatch('aggregationValue', testForm)
  const watchTestAggrUniqueId = Form.useWatch('aggregationUniqueId', testForm)
  const watchTestProductId = Form.useWatch('productId', testForm)

  const watchAggreType = Form.useWatch('aggregationType', form)
  const watchCode = Form.useWatch('code', form)
  const watchAggreProps = Form.useWatch('aggregationProperty', form)
  const watchName = Form.useWatch('metricName', form)
  const watchUnit = Form.useWatch('unit', form)
  const watchLabels = Form.useWatch('labels', form)

  const aggrePropRequired = watchAggreType === MetricAggregationType.SUM || 
                            watchAggreType === MetricAggregationType.MAX || 
                            watchAggreType === MetricAggregationType.LATEST ||
                            watchAggreType === MetricAggregationType.COUNT_UNIQUE

  // Template selection handler
  const handleTemplateSelect = (template: MetricTemplate) => {
    setSelectedTemplate(template.id)
    
    if (template.id === 'custom') {
      // Clear form for custom
      form.setFieldsValue({
        metricName: '',
        code: '',
        metricDescription: '',
        type: MetricType.CHARGE_METERED,
        unit: '',
        aggregationType: MetricAggregationType.COUNT,
        aggregationProperty: '',
        labels: ''
      })
    } else {
      // Auto-fill from template
      form.setFieldsValue({
        metricName: template.name,
        code: template.code,
        metricDescription: template.description,
        type: template.type,
        unit: template.unit,
        aggregationType: template.aggregationType,
        aggregationProperty: template.valueProperty || '',
        labels: ''
      })
    }
  }

  const onSave = async () => {
    let m
    if (isNew) {
      m = JSON.parse(JSON.stringify(form.getFieldsValue()))
      if (m.aggregationType == MetricAggregationType.COUNT) {
        delete m.aggregationProperty
      }
      // Remove labels field as backend might not support it yet
      delete m.labels
    } else {
      m = {
        metricId: Number(metricsId),
        type: form.getFieldValue('type'),
        metricName: form.getFieldValue('metricName'),
        metricDescription: form.getFieldValue('metricDescription'),
        unit: form.getFieldValue('unit')
      }
    }

    setLoading(true)
    const [data, err] = await saveMetricsReq(m, isNew)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Metrics ${isNew ? 'created' : 'updated'}.`)
    
    // If creating new metric, navigate to edit page with the new ID
    if (isNew && data && data.merchantMetric && data.merchantMetric.id) {
      setTimeout(() => {
        navigate(`/billable-metric/${data.merchantMetric.id}`, { replace: true })
      }, 500)
    }
  }

  // Debounce timer
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUserList = async (searchTerm: string = '') => {
    setUserListLoading(true)
    const merchantInfo = JSON.parse(localStorage.getItem('merchantInfo') || '{}')
    
    const searchParams: any = {
      merchantId: merchantInfo.id,
      page: 0,
      count: 50 // Load fewer users since we're using search
    }
    
    // Add search based on identifier type
    if (searchTerm) {
      if (watchTestUserIdentifierType === 'email') {
        searchParams.email = searchTerm
      } else if (watchTestUserIdentifierType === 'externalUserId') {
        searchParams.externalUserId = searchTerm
      } else if (watchTestUserIdentifierType === 'userId') {
        // For userId, search by id if it's a number
        const userId = parseInt(searchTerm)
        if (!isNaN(userId)) {
          searchParams.userId = userId
        } else {
          // If not a number, might want to search by email instead
          searchParams.email = searchTerm
        }
      }
    }
    
    const [data, err] = await getUserListReq(searchParams)
    setUserListLoading(false)
    
    if (err != null) {
      message.error('Failed to fetch user list')
      return
    }
    
    if (data && data.userAccounts) {
      setUserList(data.userAccounts)
    }
  }

  const handleUserSearch = (value: string) => {
    setUserSearchValue(value)
    
    // Clear existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    
    // Debounce search - wait 500ms after user stops typing
    searchTimerRef.current = setTimeout(() => {
      fetchUserList(value)
    }, 500)
  }

  const fetchProductList = async () => {
    setProductListLoading(true)
    const [res, err] = await getProductListReq({})
    setProductListLoading(false)
    
    if (err != null) {
      message.error('Failed to fetch product list')
      return
    }
    
    if (res && res.products) {
      setProductList(res.products)
    }
  }

  const onTest = async () => {
    if (!watchCode) {
      message.warning('Please save the metric first to test it')
      return
    }
    
    // Open modal and pre-fill with default values
    const defaultValues: any = {
      metricCode: watchCode,
      userIdentifierType: 'email'
    }
    
    // Pre-fill aggregation fields based on type
    if (watchAggreType === MetricAggregationType.COUNT_UNIQUE && watchAggreProps) {
      defaultValues.aggregationUniqueId = 'unique_id_123'
    } else if (watchAggreType === MetricAggregationType.SUM || 
               watchAggreType === MetricAggregationType.MAX || 
               watchAggreType === MetricAggregationType.LATEST) {
      defaultValues.aggregationValue = 123
    }
    
    testForm.setFieldsValue(defaultValues)
    setTestResult(null)
    setMetricProperties([])
    setUserList([]) // Clear user list
    setUserSearchValue('') // Clear search value
    setTestModalVisible(true)
    
    // Fetch product list for dropdown
    fetchProductList()
  }

  const buildRequestBody = () => {
    const requestBody: any = {
      metricCode: watchTestCode || '',
      externalEventId: watchTestEventId || ''
    }

    // Add user identification based on selected type
    if (watchTestUserIdentifierType && watchTestUserIdentifierValue) {
      if (watchTestUserIdentifierType === 'email') {
        requestBody.email = watchTestUserIdentifierValue
      } else if (watchTestUserIdentifierType === 'externalUserId') {
        requestBody.externalUserId = watchTestUserIdentifierValue
      } else if (watchTestUserIdentifierType === 'userId') {
        requestBody.userId = Number(watchTestUserIdentifierValue)
      }
    }

    // Add aggregation fields
    if (watchTestAggrUniqueId) {
      requestBody.aggregationUniqueId = watchTestAggrUniqueId
    }
    if (watchTestAggrValue !== undefined && watchTestAggrValue !== null && watchTestAggrValue !== '') {
      requestBody.aggregationValue = Number(watchTestAggrValue)
    }

    // Add metric properties
    if (metricProperties.length > 0) {
      const propsObj: any = {}
      metricProperties.forEach(prop => {
        if (prop.key && prop.value) {
          propsObj[prop.key] = prop.value
        }
      })
      if (Object.keys(propsObj).length > 0) {
        requestBody.metricProperties = propsObj
      }
    }

    // Add product ID
    if (watchTestProductId) {
      requestBody.productId = watchTestProductId
    }

    return requestBody
  }

  const onSendTestEvent = async () => {
    Modal.confirm({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ 
            fontSize: '24px', 
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center'
          }}>⚠️</span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Confirm Send Event</span>
        </div>
      ),
      icon: null,
      content: (
        <div style={{ paddingLeft: '36px' }}>
          <Alert
            message="This is a production billing API"
            description="Real charges may be created. Are you sure you want to send this test event?"
            type="warning"
            showIcon={false}
            style={{ marginTop: '16px', marginBottom: '8px' }}
          />
        </div>
      ),
      okText: 'Yes, Send Event',
      cancelText: 'Cancel',
      okButtonProps: {
        danger: true,
        size: 'large'
      },
      cancelButtonProps: {
        size: 'large'
      },
      width: 520,
      onOk: async () => {
        setTestLoading(true)
        setTestResult(null)
        
        try {
          const requestBody = buildRequestBody()
          const apiUrl = import.meta.env.VITE_API_URL || ''
          
          // Make API request
          const response = await fetch(`${apiUrl}/merchant/metric/event/new`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('merchantToken') || ''}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          })

          const result = await response.json()
          setTestLoading(false)

          if (result.code === 0) {
            message.success('Test event sent successfully')
            setTestResult({ success: true, data: result })
          } else {
            message.error(result.message || 'Failed to send test event')
            setTestResult({ success: false, data: result })
          }
        } catch (error: any) {
          setTestLoading(false)
          message.error(error.message || 'Failed to send test event')
          setTestResult({ success: false, error: error.message })
        }
      }
    })
  }

  const addMetricProperty = () => {
    setMetricProperties([...metricProperties, { key: '', value: '' }])
  }

  const removeMetricProperty = (index: number) => {
    const newProps = metricProperties.filter((_, i) => i !== index)
    setMetricProperties(newProps)
  }

  const updateMetricProperty = (index: number, field: 'key' | 'value', value: string) => {
    const newProps = [...metricProperties]
    newProps[index][field] = value
    setMetricProperties(newProps)
  }

  const fetchMetrics = async () => {
    setLoading(true)
    const [merchantMetric, err] = await getMetricDetailReq(
      Number(metricsId),
      fetchMetrics
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const metricData = merchantMetric as IBillableMetrics
    form.setFieldsValue({
      ...metricData,
      labels: '' // Backend doesn't have this field yet, use empty string
    })
    
    // Find matching template to highlight
    const matchingTemplate = METRIC_TEMPLATES.find(
      t => t.name === metricData.metricName || t.code === metricData.code
    )
    if (matchingTemplate) {
      setSelectedTemplate(matchingTemplate.id)
    }
  }

  // Generate example event JSON
  const generateExampleEvent = () => {
    const event: any = {
      metricCode: watchCode || 'YOUR_CODE',
      externalUserId: '__EXTERNAL_USER_ID__',
      externalEventId: '__EVENT_ID__'
    }
    
    if (aggrePropRequired && watchAggreProps) {
      event.metricProperties = {
        [watchAggreProps || 'YOUR_AGGREGATION_PROPERTY']: '__PROPERTY_VALUE__'
      }
    }
    
    return JSON.stringify(event, null, 2)
  }

  // Generate aggregation preview
  const generateAggregationPreview = () => {
    if (!watchAggreType) {
      return 'Select aggregation method to see preview'
    }
    
    const aggrLabel = METRICS_AGGREGATE_TYPE[watchAggreType as MetricAggregationType]?.label || 'Unknown'
    
    switch (watchAggreType) {
      case MetricAggregationType.COUNT:
        return 'Sample calculation:\nEvents: 4 events\nResult: COUNT = 4'
      case MetricAggregationType.SUM:
        return `Sample calculation:\nEvents: [100, 50, 75, 25]\nResult: SUM = 250 ${watchUnit || 'units'}`
      case MetricAggregationType.MAX:
        return `Sample calculation:\nEvents: [150, 75, 200, 125]\nResult: MAX = 200 ${watchUnit || 'units'}`
      case MetricAggregationType.COUNT_UNIQUE:
        return `Sample calculation:\nEvents: [user_1, user_2, user_1, user_3]\nResult: UNIQUE COUNT = 3 users`
      case MetricAggregationType.LATEST:
        return `Sample calculation:\nEvents: [10, 20, 30, 40]\nResult: LATEST = 40 ${watchUnit || 'units'}`
      default:
        return `Aggregation: ${aggrLabel}`
    }
  }

  const getPropsArg = () => {
    if (watchAggreType == MetricAggregationType.COUNT) {
      return ''
    }
    
    const propName = watchAggreProps || 'YOUR_AGGREGATION_PROPERTY'
    return `
    "metricProperties": { 
      "${propName}": "__PROPERTY_VALUE__"
    }`
  }

  useEffect(() => {
    if (!isNew) {
      fetchMetrics()
    }
    
    // Cleanup timer on unmount
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [metricsId])

  // Clear user identifier value when type changes
  useEffect(() => {
    if (watchTestUserIdentifierType) {
      testForm.setFieldsValue({ userIdentifierValue: undefined })
      setUserList([]) // Clear user list when changing identifier type
      setUserSearchValue('') // Clear search value
    }
  }, [watchTestUserIdentifierType])

  const curlCmd = `curl --location --request POST "${import.meta.env.VITE_API_URL || ''}/merchant/metric/event/new" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "metricCode": "${watchCode || 'YOUR_CODE'}",
    "externalUserId": "__EXTERNAL_USER_ID__",
    "externalEventId": "__EVENT_ID__",${getPropsArg()}    
  }'`
  
  const curlCmdWithComments = `${curlCmd}

# To use the snippet, don't forget to edit your
# __YOUR_API_KEY__,
# __EXTERNAL_USER_ID__,
# __EVENT_ID__,
${watchAggreType == MetricAggregationType.COUNT ? '' : '# __PROPERTY_VALUE__'}`

  return (
    <div className="h-full bg-gray-50 p-6 pb-24">
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />

      <div className="mb-4">
        <h2 className="text-2xl font-semibold">{isNew ? 'Create New Metric' : 'Edit Metric'}</h2>
      </div>

      <div className="flex gap-6">
        {/* Left Column - Template + Form */}
        <div className="flex-1" style={{ maxWidth: '45%' }}>
          {/* Quick Templates - Always show */}
          <div className="mb-6 rounded-lg bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-base font-semibold">Quick Template</h3>
            <p className="mb-4 text-sm text-gray-500">
              {isNew ? 'Please choose a template or create custom configuration' : 'Selected template'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {METRIC_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  size="small"
                  hoverable={isNew}
                  className={`${isNew ? 'cursor-pointer' : 'cursor-default'} ${
                    selectedTemplate === template.id
                      ? 'border-2 border-blue-500'
                      : 'border border-gray-200'
                  }`}
                  onClick={() => isNew && handleTemplateSelect(template)}
                  bodyStyle={{ padding: '12px' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.subtitle}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Basic Information Form */}
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold">Basic Information</h3>
            <Form
              form={form}
              onFinish={onSave}
              layout="vertical"
              initialValues={{ 
                type: MetricType.CHARGE_METERED,
                aggregationType: MetricAggregationType.COUNT
              }}
            >
              <Form.Item
                label="Name"
                name="metricName"
                rules={[{ required: true, message: 'Please input metric name!' }]}
              >
                <Input placeholder="e.g., API Requests" />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Code/Slug{' '}
                    <Tooltip title="Auto-generated from name, must be unique">
                      <span className="text-gray-400">ⓘ</span>
                    </Tooltip>
                  </span>
                }
                name="code"
                rules={[{ required: true, message: 'Please input metric code!' }]}
              >
                <Input 
                  placeholder="e.g., api_requests" 
                  disabled={!isNew}
                />
              </Form.Item>

              <Form.Item
                label="Description"
                name="metricDescription"
                help={`${form.getFieldValue('metricDescription')?.length || 0}/500 characters`}
              >
                <TextArea 
                  rows={3} 
                  maxLength={500} 
                  placeholder="Describe what this metric tracks..."
                />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Metric Type{' '}
                    <Tooltip title="Limit Metered: quota resets each billing cycle; Limit Recurring: quota accumulates across cycles; Charge Metered: usage-based billing; Charge Recurring: fixed recurring charge">
                      <span className="text-gray-400">ⓘ</span>
                    </Tooltip>
                  </span>
                }
                name="type"
              >
                <Select disabled={!isNew}>
                  <Select.Option value={MetricType.LIMIT_METERED}>Limit Metered</Select.Option>
                  <Select.Option value={MetricType.LIMIT_RECURRING}>Limit Recurring</Select.Option>
                  <Select.Option value={MetricType.CHARGE_METERED}>Charge Metered</Select.Option>
                  <Select.Option value={MetricType.CHARGE_RECURRING}>Charge Recurring</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Unit"
                name="unit"
              >
                <Input placeholder="e.g., requests, tokens, GB, emails" />
              </Form.Item>

              <div className="mt-6">
                <h3 className="mb-4 text-base font-semibold">Event & Aggregation</h3>

                <Form.Item
                  label={
                    <span>
                      Aggregation{' '}
                      <Tooltip title="How to calculate metric value from events">
                        <span className="text-gray-400">ⓘ</span>
                      </Tooltip>
                    </span>
                  }
                  name="aggregationType"
                  rules={[{ required: true, message: 'Please select aggregation type!' }]}
                >
                  <Select
                    disabled={!isNew}
                    options={AGGR_TYPE_SELECT_OPT}
                  />
                </Form.Item>

                {aggrePropRequired && (
                  <Form.Item
                    label={
                      watchAggreType === MetricAggregationType.COUNT_UNIQUE 
                        ? "Distinct By" 
                        : "Value Property"
                    }
                    name="aggregationProperty"
                    rules={[
                      {
                        required: true,
                        message: watchAggreType === MetricAggregationType.COUNT_UNIQUE
                          ? 'Please input field for unique count!'
                          : 'Please input property to aggregate!'
                      }
                    ]}
                  >
                    <Input 
                      placeholder={
                        watchAggreType === MetricAggregationType.COUNT_UNIQUE
                          ? 'e.g., user_id, subject'
                          : 'e.g., tokens, duration, storage_size'
                      }
                      disabled={!isNew}
                    />
                  </Form.Item>
                )}

                {/* <Form.Item
                  label={
                    <span>
                      Labels to Group By{' '}
                      <Tooltip title="Add labels for grouping and pricing (e.g., region, plan_type). Comma separated.">
                        <span className="text-gray-400">ⓘ</span>
                      </Tooltip>
                    </span>
                  }
                  name="labels"
                >
                  <Input placeholder="e.g., region, plan_type (comma separated)" />
                </Form.Item> */}
              </div>
            </Form>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="flex-1" style={{ maxWidth: '55%' }}>
          {/* Event Example */}
          <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">Event Example</h3>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(generateExampleEvent())
                  message.success('Copied to clipboard')
                }}
              >
                Copy
              </Button>
            </div>
            <div className="overflow-hidden rounded-md">
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '12px',
                  fontSize: '13px',
                  backgroundColor: '#1e1e1e'
                }}
              >
                {generateExampleEvent()}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Aggregation Preview */}
          <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-base font-semibold">Aggregation Preview</h3>
            <div className="rounded-md bg-gray-100 p-4">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {generateAggregationPreview()}
              </div>
            </div>
          </div>

          {/* Quick Snippet */}
          <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">Quick Snippet</h3>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(curlCmd)
                  message.success('Copied to clipboard')
                }}
              >
                Copy
              </Button>
            </div>
            <div className="overflow-hidden rounded-md">
              <SyntaxHighlighter
                language="bash"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '12px',
                  fontSize: '13px',
                  backgroundColor: '#1e1e1e'
                }}
                wrapLines={true}
                showLineNumbers={true}
              >
                {curlCmdWithComments}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Test Button */}
          <div>
            <Button
              block
              size="large"
              loading={testLoading}
              disabled={isNew || !watchCode}
              onClick={onTest}
              style={{
                backgroundColor: isNew || !watchCode ? '#d9d9d9' : '#1890ff',
                borderColor: isNew || !watchCode ? '#d9d9d9' : '#1890ff',
                color: '#fff',
                fontWeight: 500
              }}
            >
              ▶ Test
            </Button>
            <div className="mt-2 text-center text-sm text-gray-400">
              Create is required before testing
            </div>
          </div>

        </div>
      </div>

      {/* Test Event Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal">New Merchant Metric Event</span>
          </div>
        }
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        width={1200}
        footer={null}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ maxHeight: '80vh', overflow: 'auto' }}>
          {/* Header with endpoint and Send button */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
            <div className="flex flex-1 items-center gap-2">
              <span className="rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white">POST</span>
              <div className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 font-mono text-sm">
                <span className="text-gray-500">{import.meta.env.VITE_API_URL || ''}</span>
                <span className="font-semibold text-gray-800">/merchant/metric/event/new</span>
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              loading={testLoading}
              onClick={onSendTestEvent}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                color: '#fff',
                marginLeft: '12px'
              }}
            >
              Send ▶
            </Button>
          </div>

          <div className="flex" style={{ minHeight: '500px' }}>
            {/* Left Panel - Parameters */}
            <div className="w-1/2 border-r border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="mb-3 text-base font-semibold">Authorization</h3>
                <div className="mb-2">
                  <div className="mb-1 text-sm">
                    Authorization <span className="ml-1 text-xs text-gray-500">string&lt;bearer&gt;</span>{' '}
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">required</span>
                  </div>
                  <Input
                    placeholder="enter bearer token"
                    value={`Bearer ${localStorage.getItem('merchantToken') || ''}`}
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Bearer authentication header of the form <span className="font-mono">Bearer &lt;token&gt;</span>, where <span className="font-mono">&lt;token&gt;</span> is your auth token.
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-3 text-base font-semibold">Body</h3>
                
                <Form form={testForm} layout="vertical">
                  {/* externalEventId */}
                  <div className="mb-4">
                    <div className="mb-1 text-sm font-medium">
                      externalEventId <span className="ml-1 text-xs text-gray-500">string&lt;string&gt;</span>{' '}
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">required</span>
                    </div>
                    <Form.Item name="externalEventId" noStyle>
                      <Input placeholder="enter externalEventId" />
                    </Form.Item>
                    <div className="mt-1 text-xs text-gray-500">ExternalEventId, unique identifier you define (alphanumeric characters supported)</div>
                  </div>

                  {/* metricCode */}
                  <div className="mb-4">
                    <div className="mb-1 text-sm font-medium">
                      metricCode <span className="ml-1 text-xs text-gray-500">string&lt;string&gt;</span>{' '}
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">required</span>
                    </div>
                    <Form.Item name="metricCode" noStyle>
                      <Input placeholder="enter metricCode" disabled />
                    </Form.Item>
                    <div className="mt-1 text-xs text-gray-500">MetricCode</div>
                  </div>

                  {/* User Identifier */}
                  <div className="mb-4">
                    <div className="mb-1 text-sm font-medium">
                      User Identifier{' '}
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">required</span>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <Form.Item name="userIdentifierType" noStyle>
                        <Radio.Group style={{ width: '100%' }}>
                          <div className="space-y-2">
                            <Radio value="email" style={{ display: 'block' }}>
                              email <span className="ml-1 text-xs text-gray-400">string&lt;string&gt;</span>
                            </Radio>
                            <Radio value="userId" style={{ display: 'block' }}>
                              userId <span className="ml-1 text-xs text-gray-400">integer&lt;uint64&gt;</span>
                            </Radio>
                            <Radio value="externalUserId" style={{ display: 'block' }}>
                              externalUserId <span className="ml-1 text-xs text-gray-400">string&lt;string&gt;</span>
                            </Radio>
                          </div>
                        </Radio.Group>
                      </Form.Item>
                      <Form.Item name="userIdentifierValue" noStyle>
                        <Select
                          placeholder={
                            watchTestUserIdentifierType === 'email' 
                              ? 'Type to search by email...'
                              : watchTestUserIdentifierType === 'userId'
                              ? 'Type to search by user ID or email...'
                              : 'Type to search by external user ID...'
                          }
                          loading={userListLoading}
                          showSearch
                          filterOption={false} // Disable local filter, use server-side search
                          onSearch={handleUserSearch}
                          notFoundContent={
                            userListLoading ? (
                              <div style={{ textAlign: 'center', padding: '20px' }}>
                                <Spin size="small" />
                              </div>
                            ) : userSearchValue ? (
                              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                No users found
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Type to search users...
                              </div>
                            )
                          }
                          style={{ marginTop: '12px', width: '100%' }}
                          popupMatchSelectWidth={false}
                          listHeight={300}
                          dropdownStyle={{ minWidth: '400px' }}
                          options={
                            watchTestUserIdentifierType === 'email'
                              ? userList
                                  .filter(u => u.email)
                                  .map(u => ({ label: u.email, value: u.email }))
                              : watchTestUserIdentifierType === 'userId'
                              ? userList
                                  .map(u => ({ 
                                    label: `${u.id} (${u.email || 'No email'})`, 
                                    value: u.id 
                                  }))
                              : userList
                                  .filter(u => u.externalUserId)
                                  .map(u => ({ 
                                    label: `${u.externalUserId} (${u.email || 'No email'})`, 
                                    value: u.externalUserId 
                                  }))
                          }
                        />
                      </Form.Item>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      UserId, ExternalUserId, or Email provides one of three options
                    </div>
                  </div>

                  {/* productId */}
                  <div className="mb-4">
                    <div className="mb-1 text-sm font-medium">
                      productId <span className="ml-1 text-xs text-gray-500">integer &lt;int64&gt;</span>
                    </div>
                    <Form.Item name="productId" noStyle>
                      <Select
                        placeholder="Select a product"
                        loading={productListLoading}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        style={{ width: '100%' }}
                        options={productList.map(p => ({
                          label: `#${p.id} ${p.productName}`,
                          value: p.id
                        }))}
                      />
                    </Form.Item>
                    <div className="mt-1 text-xs text-gray-500">
                      default product will use if productId not specified and subscriptionId is blank
                    </div>
                  </div>

                  {/* aggregationUniqueId */}
                  <div className="mb-4">
                    <div className="mb-1 text-sm font-medium">
                      aggregationUniqueId <span className="ml-1 text-xs text-gray-500">string&lt;string&gt;</span>
                    </div>
                    <Form.Item name="aggregationUniqueId" noStyle>
                      <Input placeholder="enter aggregationUniqueId" />
                    </Form.Item>
                    <div className="mt-1 text-xs text-gray-500">
                      AggregationUniqueId, valid when AggregationType is count unique
                    </div>
                  </div>

                  {/* aggregationValue */}
                  <div className="mb-4">
                    <div className="mb-1 text-sm font-medium">
                      aggregationValue <span className="ml-1 text-xs text-gray-500">integer</span>
                    </div>
                    <Form.Item name="aggregationValue" noStyle>
                      <InputNumber placeholder="enter aggregationValue" style={{ width: '100%' }} />
                    </Form.Item>
                    <div className="mt-1 text-xs text-gray-500">
                      AggregationValue, valid when AggregationType latest, max or sum
                    </div>
                  </div>

                  {/* metricProperties */}
                  <div className="mb-4">
                    <div className="mb-1 text-sm font-medium">
                      metricProperties <span className="ml-1 text-xs text-gray-500">object</span>
                    </div>
                    <div className="space-y-2">
                      {metricProperties.map((prop, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="key"
                            value={prop.key}
                            onChange={(e) => updateMetricProperty(index, 'key', e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <Input
                            placeholder="value"
                            value={prop.value}
                            onChange={(e) => updateMetricProperty(index, 'value', e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <Button
                            danger
                            onClick={() => removeMetricProperty(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        onClick={addMetricProperty}
                        block
                        style={{ marginTop: '8px' }}
                      >
                        + Add new property
                      </Button>
                    </div>
                  </div>

                </Form>
              </div>
            </div>

            {/* Right Panel - CURL & Response */}
            <div className="w-1/2 bg-white p-6" style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 60px)' }}>
              <div className="space-y-4">
                {/* CURL Command Section */}
                <div className="rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">New Merchant Metric Event</span>
                      <button className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-300">
                        cURL
                      </button>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const requestBody = buildRequestBody()
                        const apiUrl = import.meta.env.VITE_API_URL || ''
                        const curlCommand = `curl --request POST \\
  --url ${apiUrl}/merchant/metric/event/new \\
  --header "Authorization: Bearer ${localStorage.getItem('merchantToken') || ''}" \\
  --header 'Content-Type: application/json' \\
  --data '${JSON.stringify(requestBody)}'`
                        navigator.clipboard.writeText(curlCommand)
                        message.success('Copied to clipboard')
                      }}
                    />
                  </div>
                  <div className="overflow-hidden">
                    <SyntaxHighlighter
                      language="bash"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '16px',
                        fontSize: '12px',
                        backgroundColor: '#1e1e1e',
                        maxHeight: '350px'
                      }}
                      wrapLines={true}
                    >
                      {(() => {
                        const requestBody = buildRequestBody()
                        const apiUrl = import.meta.env.VITE_API_URL || ''
                        return `curl --request POST \\
  --url ${apiUrl}/merchant/metric/event/new \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
${Object.entries(requestBody).map(([key, value]) => {
  if (typeof value === 'object' && value !== null) {
    return `  "${key}": ${JSON.stringify(value, null, 2).split('\n').join('\n  ')}`
  }
  return `  "${key}": ${JSON.stringify(value)}`
}).join(',\n')}
}'`
                      })()}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Response Section */}
                {testResult && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-sm font-semibold ${
                            testResult.success ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {testResult.success ? '200' : 'Error'}
                        </span>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(testResult.data || { error: testResult.error }, null, 2)
                          )
                          message.success('Copied to clipboard')
                        }}
                      />
                    </div>
                    <div className="overflow-hidden">
                      <SyntaxHighlighter
                        language="json"
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '16px',
                          fontSize: '12px',
                          backgroundColor: '#1e1e1e',
                          maxHeight: '400px'
                        }}
                      >
                        {JSON.stringify(testResult.data || { error: testResult.error }, null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bottom Action Bar - Fixed */}
      <div 
        className="fixed bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 shadow-lg"
        style={{ 
          zIndex: 100,
          left: 'var(--sidebar-width, 240px)',
          right: 0
        }}
      >
        <Button
          size="large"
          onClick={() => navigate('/billable-metric/list')}
          disabled={loading}
        >
          Go back
        </Button>
        <Button
          size="large"
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
          style={{ 
            backgroundColor: '#1890ff', 
            borderColor: '#1890ff', 
            color: '#fff',
            minWidth: '120px',
            fontWeight: 500
          }}
        >
          {isNew ? 'Create' : 'Update'}
        </Button>
      </div>
    </div>
  )
}

export default Index
