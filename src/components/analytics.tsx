import {
  DownloadOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Divider,
  Drawer,
  Pagination,
  Popover,
  Row,
  Spin,
  Tooltip,
  message
} from 'antd'
import axios from 'axios'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { CSSProperties, useEffect, useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism'
import { useInterval } from 'usehooks-ts'
import { downloadStaticFile, formatDate } from '../helpers'
import { usePagination } from '../hooks'
import { getAnalyticsReportReq, getDownloadListReq } from '../requests'
import { TExportDataType } from '../shared.types'
import { TaskStatus } from './ui/statusTag'
dayjs.extend(duration)
dayjs.extend(relativeTime)

const PAGE_SIZE = 10
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const headStyle: CSSProperties = {
  ...rowStyle,
  background: '#eee'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

type TAnalyticsRecord = {
  amount: number
  amountType: string // mrr | new_mrr | upgrade_mrr | downgrade_mrr | arr | reactivation_mrr |
  currency: string
  id: number
  merchantId: number
  timeFrame: number
  userId: number
}

const Index = () => {
  const [analyticsList, setAnalyticsList] = useState<TAnalyticsRecord[]>([])
  const [loading, setLoading] = useState(false)

  const getValue = (timeFrame: number, amountType: string) => {
    const a = analyticsList.find(
      (a) => a.amountType == amountType && a.timeFrame == timeFrame
    )

    return a == null ? '-' : a?.amount / 100
  }

  const getList = async () => {
    setLoading(true)
    axios
      .get('https://api.unibee.top/analytics-api/analytics')
      .then((res) => {
        setLoading(false)
        setAnalyticsList(res.data.data)
        console.log('res: ', res)
      })
      .catch((err) => {
        setLoading(false)
        console.log('err: ', err)
      })
  }

  useEffect(() => {
    getList()
  }, [])

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={getList} disabled={loading}>
          Refresh
        </Button>
      </div>
      <Row style={headStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          MRR
        </Col>
        <Col span={3}>Mar 2024</Col>
        <Col span={3}>Apr 2024</Col>
        <Col span={3}>May 2024</Col>
        <Col span={3}>Jun 2024</Col>
        <Col span={3}>Jul 2024</Col>
        <Col span={3}>Aug 2024</Col>
        <Col span={3}>Sep 2024</Col>
      </Row>

      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          New
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {getValue(
            new Date('2024-09-01 00:00:00').getTime() / 1000,
            'new_mrr'
          )}
        </Col>
      </Row>

      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Reactivation
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {' '}
          {getValue(
            new Date('2024-09-01 00:00:00').getTime() / 1000,
            'reactivation_mrr'
          )}
        </Col>
      </Row>

      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Upgrades
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {' '}
          {getValue(
            new Date('2024-09-01 00:00:00').getTime() / 1000,
            'upgrade_mrr'
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Downgrades
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {' '}
          {getValue(
            new Date('2024-09-01 00:00:00').getTime() / 1000,
            'downgrade_mrr'
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Voluntary churn
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {' '}
          {getValue(
            new Date('2024-09-01 00:00:00').getTime() / 1000,
            'voluntary_churn'
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Delinquent churn
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {' '}
          {getValue(
            new Date('2024-09-01 00:00:00').getTime() / 1000,
            'delinquent_churn'
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Existing
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {' '}
          {getValue(
            new Date('2024-09-01 00:00:00').getTime() / 1000,
            'existing_mrr'
          )}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          MRR
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {' '}
          {getValue(new Date('2024-09-01 00:00:00').getTime() / 1000, 'mrr')}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          ARR
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>
          {' '}
          {getValue(new Date('2024-09-01 00:00:00').getTime() / 1000, 'arr')}
        </Col>
      </Row>

      <Row style={headStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Customers
        </Col>
        <Col span={3}>Mar 2024</Col>
        <Col span={3}>Apr 2024</Col>
        <Col span={3}>May 2024</Col>
        <Col span={3}>Jun 2024</Col>
        <Col span={3}>Jul 2024</Col>
        <Col span={3}>Aug 2024</Col>
        <Col span={3}>Sep 2024</Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          New
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Reactivation
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Voluntary churn
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={3} style={colStyle}>
          Delinquent churn
        </Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
        <Col span={3}>0</Col>
      </Row>
    </div>
  )
}

export default Index
