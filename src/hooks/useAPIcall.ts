import { message } from 'antd'
import { useState } from 'react'
import { ExpiredError } from '../shared.types'
import { useSessionStore } from '../stores'

// under experiment, not used yet

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAPIcall = (call: () => Promise<any>, refreshCb?: boolean) => {
  const sessionStore = useSessionStore()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [statusCode, setStatusCode] = useState(0)

  const apiCall = async () => {
    setLoading(true)
    const [res, serverError, code] = await call()
    setLoading(false)
    setStatusCode(code)

    if (serverError != null) {
      const e =
        serverError instanceof Error ? serverError : new Error('Unknown error')
      setError(e)
      message.error(e.message)
      return
    }

    if (code == 61 || code == 62) {
      message.error('session expired in useApicall')
      sessionStore.setSession({
        expired: true,
        refresh: refreshCb ? apiCall : null
      })
      setError(
        new ExpiredError(
          `${code == 61 ? 'Session expired' : 'Your roles or permissions have been changed, please relogin'}`
        )
      )
      return
    }
    setData(res)
  }

  return { apiCall, loading, data, error, statusCode }
}
