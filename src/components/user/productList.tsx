import { LoadingOutlined } from '@ant-design/icons'
import { Spin, Tabs, message } from 'antd'
// import currency from 'currency.js'
import React, { useEffect, useState } from 'react'
import { IProduct, IProfile } from '../../@types/shared.types'
import { getProductListReq } from '../../requests'
import '../../shared.css'
import OneTimeHistory from './oneTimePurchaseHistory'
import SubHistory from './subHistory'
import Subscription from './subscriptionTab'

const Index = ({
  userId,
  userProfile,
  refreshSub
}: {
  userId: number
  userProfile: IProfile | undefined
  refreshSub: boolean
}) => {
  const [productId, setProductId] = useState('0') // set default tab
  const [loading, setLoading] = useState(false)
  const [productList, setProductList] = useState<IProduct[]>([])
  const onTabChange = (newActiveKey: string) => {
    setProductId(newActiveKey)
  }

  const getProductList = async () => {
    setLoading(true)
    const [res, err] = await getProductListReq()
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    const productList = res.products ?? []
    setProductList(productList)
  }

  useEffect(() => {
    getProductList()
  }, [])

  return (
    <>
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
      >
        <Tabs
          onChange={onTabChange}
          activeKey={productId}
          items={productList.map((p) => ({
            label: p.productName,
            key: p.id.toString(),
            children: (
              <Subscription
                userId={userId}
                productId={p.id}
                userProfile={userProfile}
                refreshSub={refreshSub}
              />
            )
          }))}
        />
        <SubHistory userId={userId} />
        <OneTimeHistory userId={userId} />
      </Spin>
    </>
  )
}

export default Index
