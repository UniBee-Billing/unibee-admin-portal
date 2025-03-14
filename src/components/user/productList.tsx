import { getProductListReq } from '@/requests'
import '@/shared.css'
import { IProduct, IProfile } from '@/shared.types'
import { LoadingOutlined } from '@ant-design/icons'
import { Spin, Tabs, message } from 'antd'
import React, { useEffect, useState } from 'react'

interface TabContentProps {
  userId: number
  productId: number
  userProfile: IProfile | undefined
  refreshSub: boolean
  refreshUserProfile: () => void
}

type ProductListProps = {
  userId: number
  userProfile: IProfile | undefined
  refreshSub: boolean
  refreshUserProfile: () => void
  TabContent: React.FC<TabContentProps>
}

const Index = ({
  userId,
  userProfile,
  refreshSub,
  refreshUserProfile,
  TabContent
}: ProductListProps) => {
  const [productId, setProductId] = useState('0') // set default tab
  const [loading, setLoading] = useState(false)
  const [productList, setProductList] = useState<IProduct[]>([])
  const onTabChange = (newActiveKey: string) => setProductId(newActiveKey)

  const getProductList = async () => {
    setLoading(true)
    const [res, err] = await getProductListReq({ refreshCb: getProductList })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setProductList(res.products ?? [])
  }

  useEffect(() => {
    getProductList()
  }, [userId])

  return (
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
            <TabContent
              userId={userId}
              productId={p.id}
              userProfile={userProfile}
              refreshSub={refreshSub}
              refreshUserProfile={refreshUserProfile}
            />
          )
        }))}
      />
    </Spin>
  )
}

export default Index
