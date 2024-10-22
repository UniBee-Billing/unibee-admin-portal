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
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivityLogsReq, getAnalyticsReportReq } from '../../requests'
import { TActivityLogs } from '../../shared.types'

import axios from 'axios'
import { formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import '../../shared.css'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

type TRevenueAndUser = {
  id: number
  merchantId: number
  amountType: string
  amount: number
  currency: string
  timeFrame: number
  activeUserCount: number
}

const Index = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [total, setTotal] = useState(0)
  const { page, onPageChange } = usePagination()
  const [loading, setLoading] = useState(false)
  const [revenue, setRevenue] = useState<TRevenueAndUser | null>(null)

  const getRevenue = () => {
    setLoading(true)
    axios
      .get('http://localhost:8888/analytics/revenue')
      .then((res) => {
        setLoading(false)
        setRevenue(res.data.data)
        console.log('revenue res: ', res)
      })
      .catch((err) => {
        setLoading(false)
        console.log('err getting revenue: ', err)
      })

    /*
    const [revenueRes, err] = await getAnalyticsReportReq()
    console.log('res res: ', revenueRes, '//', err)
    if (err != null) {
      message.error((err as Error).message)
      return
    }
      */
  }

  useEffect(() => {
    getRevenue()
  }, [])

  return (
    <div>
      <div className=" flex justify-end text-2xl font-bold text-blue-500">
        {revenue != null && dayjs(revenue.timeFrame * 1000).format('YYYY-MMM')}
      </div>
      <div className="my-8 flex h-60 justify-center gap-32 ">
        <div className="flex flex-col items-center justify-between">
          <div className=" text-6xl text-gray-700">
            {revenue != null && revenue.activeUserCount}
          </div>
          <div className="text-xl">Active users</div>
        </div>
        <div className="flex flex-col items-center justify-between">
          <div className=" text-6xl text-gray-700">
            {revenue != null && revenue.amount / 100}
          </div>
          <div className="text-xl">Revenues</div>
        </div>
      </div>

      <div className="flex justify-end">
        <span className="text-sm text-gray-500">
          Last update: 2024-Oct-22, 14:00:00
        </span>
      </div>
    </div>
  )
}

export default Index
