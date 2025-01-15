import { useEffect, useRef } from 'react'

export const useSkipFirstRender = (
  callback: () => void,
  dependencies: string[]
) => {
  const firstRenderRef = useRef(true)

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }
    callback()
  }, dependencies)
}
