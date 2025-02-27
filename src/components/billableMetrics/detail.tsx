import CopyToClipboard from '@/components/ui/copyToClipboard'
import { METRICS_AGGREGATE_TYPE } from '@/constants'
import { getMetricDetailReq, saveMetricsReq } from '@/requests/index'
import { MetricAggregationType, MetricType } from '@/shared.types'
import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Spin,
  message
} from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism'
const { TextArea } = Input

SyntaxHighlighter.registerLanguage('bash', bash)
const AGGR_TYPE_SELECT_OPT = Object.keys(METRICS_AGGREGATE_TYPE)
  .map((s) => ({
    label: METRICS_AGGREGATE_TYPE[Number(s) as MetricAggregationType].label,
    value: Number(s)
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1))

const Index = () => {
  const params = useParams()
  const metricsId = params.metricsId
  const isNew = metricsId == null

  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [aggrePropDisabled, setAggrePropDisabled] = useState(true)
  const watchAggreType = Form.useWatch('aggregationType', form)
  useEffect(() => {
    setAggrePropDisabled(watchAggreType == MetricAggregationType.COUNT)
  }, [watchAggreType])

  const watchCode = Form.useWatch('code', form)
  const watchAggreProps = Form.useWatch('aggregationProperty', form)

  const onSave = async () => {
    let m
    if (isNew) {
      m = JSON.parse(JSON.stringify(form.getFieldsValue()))
      if (m.aggregationType == MetricAggregationType.COUNT) {
        delete m.aggregationProperty
      }
    } else {
      m = {
        metricId: Number(metricsId),
        metricName: form.getFieldValue('metricName'),
        metricDescription: form.getFieldValue('metricDescription')
      }
    }

    setLoading(true)
    const [_, err] = await saveMetricsReq(m, isNew)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Metrics ${isNew ? 'created' : 'updated'}.`)
    setTimeout(() => {
      navigate(`/billable-metric/list`)
    }, 1500)
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
    form.setFieldsValue(merchantMetric)
  }

  const getPropsArg = () =>
    watchAggreType == MetricAggregationType.COUNT
      ? ''
      : `
    "metricProperties": { 
      "${watchAggreProps || 'YOUR_AGGREGATION_PROPERTY'}": "__PROPERTY_VALUE__"
    }`

  useEffect(() => {
    if (!isNew) {
      fetchMetrics()
    }
  }, [])

  const curlCmd = `curl --location --request POST "${location.origin}/merchant/metric/event/new" \\
  --header "Authorization: Bearer $__YOUR_API_KEY__" \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "metricCode": "${watchCode || 'YOUR_CODE'}",
    "externalUserId": "__EXTERNAL_USER_ID__",
    "externalEventId": "__EVENT_ID__", ${getPropsArg()}    
  }'`

  return (
    <div className="h-full">
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      <div className="flex gap-8">
        <div className="w-3/5">
          <Form
            form={form}
            onFinish={onSave}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 24 }}
            layout="horizontal"
            // disabled={componentDisabled}
            // style={{ maxWidth: 600 }}
            initialValues={{ type: MetricType.LIMIT_METERED }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>Name</Col>
              <Col span={12}>Code</Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="metricName"
                  noStyle={true}
                  rules={[
                    {
                      required: true,
                      message: 'Please input your metrics name!'
                    }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  noStyle={true}
                  rules={[
                    {
                      required: true,
                      message: 'Please input your metrics code!'
                    }
                  ]}
                >
                  <Input disabled={!isNew} />
                </Form.Item>
              </Col>
            </Row>
            <Row className="my-4"></Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>Description</Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item name="metricDescription" noStyle={true}>
                  <TextArea rows={4} showCount maxLength={100} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="my-4"></Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>Type</Col>
            </Row>
            <Row>
              <Col>
                <Form.Item name="type">
                  <Radio.Group disabled={!isNew}>
                    <Radio.Button value={MetricType.LIMIT_METERED}>
                      Limit metered
                    </Radio.Button>
                    <Radio.Button value={MetricType.CHARGE_METERED} disabled>
                      Charge metered
                    </Radio.Button>
                    <Radio.Button value={MetricType.CHARGE_RECURRING} disabled>
                      Charge recurring
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Row className="my-4"></Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>Aggregation Type</Col>
              {!aggrePropDisabled && <Col span={12}>Property to aggregate</Col>}
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="aggregationType"
                  rules={[
                    {
                      required: true,
                      message: 'Please select your aggregation type'
                    }
                  ]}
                >
                  <Select
                    style={{ width: 160 }}
                    options={AGGR_TYPE_SELECT_OPT.map((o) => ({
                      ...o,
                      disabled: !isNew
                    }))}
                  />
                </Form.Item>
              </Col>
              {!aggrePropDisabled && (
                <Col span={12}>
                  <Form.Item
                    name="aggregationProperty"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your property to aggregate !'
                      }
                    ]}
                  >
                    <Input disabled={aggrePropDisabled || !isNew} />
                  </Form.Item>
                </Col>
              )}
            </Row>

            <div className="my-12 flex justify-center gap-5">
              <Button
                onClick={() => navigate(`/billable-metric/list`)}
                disabled={loading}
              >
                Go Back
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </Form>
        </div>
        <div className="metrics-code-wrapper relative w-2/5">
          <SyntaxHighlighter
            language="bash"
            style={prism}
            wrapLines={true}
            showLineNumbers={true}
          >
            {`${curlCmd}

# To use the snippet, don’t forget to edit your
# __YOUR_API_KEY__,
# __EXTERNAL_USER_ID__,
# __EVENT_ID__,
${watchAggreType == MetricAggregationType.COUNT ? '' : '# __PROPERTY_VALUE__'}`}
          </SyntaxHighlighter>
          <div className="absolute bottom-6 flex w-full justify-center">
            <CopyToClipboard content={curlCmd} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Index
