import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Table,
  message
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivityLogsReq, getAnalyticsReportReq } from '../../requests'
import { TActivityLogs } from '../../shared.types'

import { formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import '../../shared.css'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [total, setTotal] = useState(0)
  const { page, onPageChange } = usePagination()
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<TActivityLogs[]>([])

  const getRevenue = async () => {
    const [revenueRes, err] = await getAnalyticsReportReq()
    if (err != null) {
      message.error((err as Error).message)
      return
    }
    console.log('res res: ', revenueRes)
  }

  useEffect(() => {
    // fetchLogs()
    getRevenue()
  }, [])

  return <div>analytics page</div>
}

export default Index
