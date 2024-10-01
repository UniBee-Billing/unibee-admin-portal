import { useRef, useState } from 'react'

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
        val--

        if (val >= 0) {
          setCurrentVal(val)
        }

        if (val === 0) {
          setCounting(false)
        }

        if (val < 0) {
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
