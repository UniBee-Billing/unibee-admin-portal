import { Button, Popover } from 'antd'
import { TooltipPlacement } from 'antd/es/tooltip'
import { useEffect, useRef, useState } from 'react'

const Index = ({
  text,
  width,
  showViewMoreButton, // true: there is a 'View more' button to the right of the text, hover to show popup, false: no button, just hover on text to show popup
  // the latter case is mostly used in table column with limited width
  placement,
  clickHandler
}: {
  text: string
  width?: string // must be of format: '128px'
  showViewMoreButton?: boolean
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

  const renderPopup = () =>
    showViewMoreButton ? (
      <>
        <div
          className="overflow-hidden text-ellipsis whitespace-nowrap"
          ref={textRef}
          style={{
            maxWidth: width ?? `calc(100% - ${showMore ? '80px' : '0px'})` // 'view more' button was around 80px width(plus some padding/margin)
          }}
        >
          {textContent}
        </div>
        {showMore && (
          <PopoverWrapper placement={placement} text={text}>
            <Button
              type="link"
              style={{ border: 'none', padding: '0', marginRight: '8px' }}
            >
              View more
            </Button>
          </PopoverWrapper>
        )}
      </>
    ) : (
      <div
        className="overflow-hidden text-ellipsis whitespace-nowrap"
        ref={textRef}
        style={{
          maxWidth: width ?? '100%'
        }}
      >
        {showMore ? (
          <PopoverWrapper placement={placement} text={text}>
            {textContent}
          </PopoverWrapper>
        ) : (
          textContent
        )}
      </div>
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

  return <div className="flex items-center">{renderPopup()}</div>
}

export default Index

const PopoverWrapper = ({
  text,
  placement,
  children
}: React.PropsWithChildren<{ text: string; placement?: TooltipPlacement }>) => (
  <Popover
    placement={placement ?? 'topLeft'}
    overlayStyle={{ maxWidth: '360px' }}
    content={text}
  >
    {children}
  </Popover>
)
