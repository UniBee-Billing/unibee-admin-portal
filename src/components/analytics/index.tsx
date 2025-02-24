import screenshot from '@/assets/AnalyticsScreenshot.png'
import { useLicense } from '@/hooks/useVersion'
import { getRevenueReq } from '@/requests'
import { CaretUpOutlined, LoadingOutlined } from '@ant-design/icons'
import { Button, message, Modal, Spin } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

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
  const [loading, setLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const togglePopup = () => setShowPopup(!showPopup)

  const [revenue, setRevenue] = useState<TRevenueAndUser | null>(null)
  const {
    loading: loadingLicense,
    isActivePremium,
    isExpiredPremium,
    error: fetchLicenseError
  } = useLicense()

  const goToApp = () => {
    if (isActivePremium && !isExpiredPremium) {
      const url = window.location.origin + '/analytics/'
      window.open(url, '_blank')
      return
    }
    togglePopup()
  }

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
      <Modal open={showPopup} onCancel={togglePopup} footer={null} width={580}>
        <p className="my-8 text-lg">
          This is a premium feature. Contact us if you want to upgrade.
        </p>
        <div className="flex justify-center">
          Contact us at&nbsp;
          <a href="https://unibee.dev/contact/" target="_blank">
            https://unibee.dev/contact/
          </a>
        </div>
      </Modal>
      <div className="flex justify-end text-2xl font-bold text-blue-500">
        {revenue != null && dayjs(revenue.timeFrame * 1000).format('YYYY-MMM')}
      </div>
      <div className="my-8 flex h-36 justify-center gap-32">
        <div className="flex flex-col items-center justify-between">
          <div className="text-6xl text-gray-700">
            {loading && (
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            )}
            {revenue != null && revenue.activeUserCount}{' '}
            <CaretUpOutlined style={{ fontSize: '32px', color: '#aed581' }} />
          </div>
          <div className="text-xl">Active users</div>
        </div>
        <div className="flex flex-col items-center justify-between">
          <div className="text-6xl text-gray-700">
            {loading && (
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            )}
            {revenue != null && `$${(revenue.amount / 100).toLocaleString()} `}{' '}
            <CaretUpOutlined style={{ fontSize: '32px', color: '#aed581' }} />
          </div>
          <div className="text-xl">Revenues</div>
        </div>
      </div>

      <div className="flex justify-end">
        <span className="text-sm text-gray-500">
          {revenue != null && `Last update: ${revenue.updatedAt}`}
        </span>
      </div>

      <div className="flex flex-col justify-center">
        <Button
          size="large"
          onClick={goToApp}
          loading={loadingLicense}
          disabled={loadingLicense || fetchLicenseError != undefined}
          type="link"
        >
          Detailed Subscription Analytics
        </Button>
        <img src={screenshot} className="my-8" />
      </div>
    </div>
  )
}

export default Index
