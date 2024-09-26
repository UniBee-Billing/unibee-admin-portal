import { LoadingOutlined } from '@ant-design/icons'
import { Button, Spin, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPaymentDetailReq } from '../../requests'
// import MarkAsPaidModal from './markAsPaidModal'
// import InvoiceItemsModal from '../subscription/modals/newInvoice' // obsolete

const APP_PATH = import.meta.env.BASE_URL // if not specified in build command, default is /

const Index = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const goBack = () => navigate(`${APP_PATH}transaction/list`)

  const fetchData = async () => {
    const pathName = window.location.pathname.split('/')
    const paymentId = pathName.pop()
    if (paymentId == null) {
      message.error('Invalid payment')
      return
    }
    setLoading(true)
    const [paymentDetail, err] = await getPaymentDetailReq(paymentId, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    /*
    const { invoice } = res
    normalizeAmt([invoice])
    setInvoiceDetail(invoice)
    */
    /*
    const pathName = window.location.pathname.split('/')
    const ivId = pathName.pop()
    if (ivId == null) {
      message.error('Invalid invoice')
      return
    }
    setLoading(true)
    const [res, err] = await getInvoiceDetailReq(ivId, fetchData)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { invoice } = res
    normalizeAmt([invoice])
    setInvoiceDetail(invoice)
    */
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      dd
      <div className="m-8 flex justify-center">
        <Button onClick={goBack}>Go Back</Button>
      </div>
    </div>
  )
}

export default Index
