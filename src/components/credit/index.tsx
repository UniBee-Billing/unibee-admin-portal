import { useEffect } from 'react'

import PromoCreditTxHistory from '@/components/user/promoCreditTxHist'

const Index = () => {
  useEffect(() => {}, [])

  return (
    <>
      <PromoCreditTxHistory refreshTxHistory={false} />
    </>
  )
}

export default Index
