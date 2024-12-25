import { useEffect } from 'react'

import PromoCreditTxHistory from '../user/promoCreditTxHist'

const Index = () => {
  useEffect(() => {}, [])

  return (
    <>
      <PromoCreditTxHistory refreshTxHistory={false} />
    </>
  )
}

export default Index
