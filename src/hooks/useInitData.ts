import { useEffect } from 'react'
import { useAppInitialize } from './useAppInitialize'

export const useInitData = () => {
  const initDataCallback = useAppInitialize()

  useEffect(() => {
    initDataCallback()
  }, [])
}
