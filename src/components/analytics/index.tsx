import { LoadingOutlined } from '@ant-design/icons'
import { Form, message, Skeleton, Spin } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { getRevenueReq } from '../../requests'
import '../../shared.css'

type TRevenueAndUser = {
  id: number
  merchantId: number
  amountType: string
  amount: number
  currency: string
  timeFrame: number
  activeUserCount: number
  updatedAt: Date
}

const Index = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [revenue, setRevenue] = useState<TRevenueAndUser | null>(null)

  const getRevenue = async () => {
    setLoading(true)
    const [rev, err] = await getRevenueReq()
    setLoading(false)
    if (err != null) {
      message.error((err as Error).message)
      return
    }
    setRevenue(rev)
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
            {loading && (
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            )}
            {revenue != null && revenue.activeUserCount}
          </div>
          <div className="text-xl">Active users</div>
        </div>
        <div className="flex flex-col items-center justify-between">
          <div className=" text-6xl text-gray-700">
            {loading && (
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            )}
            {revenue != null && revenue.amount / 100}
          </div>
          <div className="text-xl">Revenues</div>
        </div>
      </div>

      <div className="flex justify-end">
        <span className="text-sm text-gray-500">
          {revenue != null && `Last update: ${revenue.updatedAt}`}
        </span>
      </div>
    </div>
  )
}

export default Index
