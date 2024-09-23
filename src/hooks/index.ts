import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export const useCopyContent = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return null
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown copy error')
    return e
  }
}

export const usePagination = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageNum = parseInt(searchParams.get('page') ?? '0')
  const [page, setPage] = useState(
    isNaN(pageNum) || pageNum <= 0 ? 0 : pageNum - 1
  )
  const onPageChange: (page: number, pageSize: number) => void = (
    page: number,
  ) => {
    setPage(page - 1)
    setSearchParams({ page: page + '' })
  }

  // some tables are part of a page, no need to set searchParams on URL
  const onPageChangeNoParams: (page: number, pageSize: number) => void = (
    page: number,
  ) => {
    setPage(page - 1)
  }

  return { page, onPageChange, onPageChangeNoParams }
}

export const useCountdown = (
  initialVal: number
): [number, boolean, () => void, () => void] => {
  const [currentVal, setCurrentVal] = useState(initialVal)
  const [counting, setCounting] = useState(false)
  const countdownReqId = useRef(0)

  const start = () => {
    const valBK = currentVal
    let val = currentVal
    let lastTime = new Date().getTime()
    setCounting(true)
    ;(function timer() {
      countdownReqId.current = requestAnimationFrame(timer)
      const currentTime = new Date().getTime()
      if (currentTime - lastTime >= 1000) {
        lastTime = currentTime
        val--;

        if(val >= 0) {
          setCurrentVal(val)
        }

        if(val === 0) {
          setCounting(false)
        }

        if(val < 0) {
          setCurrentVal(valBK)
          cancelAnimationFrame(countdownReqId.current)
        }
      }
    })()
  }

  // after a stop, start() will start with initialValue, not from leftover value, 'resume' not implemented yet
  const stop = () => {
    cancelAnimationFrame(countdownReqId.current)
    setCurrentVal(initialVal)
    setCounting(false)
    countdownReqId.current = 0
  }
  return [currentVal, counting, start, stop]
}

// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
/*
function useInterval(callback: any, delay: number) {
  const savedCallback = useRef()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}
*/
