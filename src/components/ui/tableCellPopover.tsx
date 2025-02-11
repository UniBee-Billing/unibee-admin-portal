import { Popover } from 'antd'
import { TooltipPlacement } from 'antd/es/tooltip'
import { useEffect, useRef, useState } from 'react'

const Index = ({
  text,
  width,
  placement,
  clickHandler
}: {
  text: string
  width?: string // must be of format: '128px'
  placement?: TooltipPlacement
  clickHandler?: () => void
}) => {
  const [showMore, setShowMore] = useState<boolean>(false)
  const textRef = useRef<HTMLDivElement>(null)

  const textContent =
    clickHandler == undefined ? (
      text
    ) : (
      <span className="cursor-pointer text-blue-400" onClick={clickHandler}>
        {text}
      </span>
    )

  useEffect(() => {
    if (textRef.current) {
      const { current } = textRef
      if (current.scrollWidth > current.clientWidth) {
        setShowMore(true)
      } else {
        setShowMore(false)
      }
    }
  }, [textRef])

  return (
    <div className="flex items-center">
      <div
        ref={textRef}
        style={{
          maxWidth: width ?? '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {showMore ? (
          <PopoverWrapper text={text} placement={placement}>
            {textContent}
          </PopoverWrapper>
        ) : (
          textContent
        )}
      </div>
    </div>
  )
}

export default Index

const PopoverWrapper = ({
  text,
  placement,
  children
}: React.PropsWithChildren<{ text: string; placement?: TooltipPlacement }>) => (
  <Popover
    placement={placement ?? 'topLeft'}
    overlayStyle={{ width: '360px' }}
    content={text}
  >
    {children}
  </Popover>
)
