import { Button, Popover } from 'antd'
import { useEffect, useRef, useState } from 'react'

const Index = ({
  text,
  width,
  clickHandler
}: {
  text: string
  width?: string // must be of format: '128px'
  clickHandler?: () => void
}) => {
  const [showMore, setShowMore] = useState<boolean>(false)
  const textRef = useRef<HTMLDivElement>(null)

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
          maxWidth: width ?? 'calc(100% - 80px)', // 'view more' button was around 80px width(plus some padding/margin)
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {clickHandler == undefined ? (
          text
        ) : (
          <span className="cursor-pointer text-blue-400" onClick={clickHandler}>
            {text}
          </span>
        )}
      </div>
      {showMore && (
        <Popover
          placement="top"
          overlayStyle={{ maxWidth: '360px' }}
          content={text}
        >
          <Button
            type="link"
            style={{ border: 'none', padding: '0', marginRight: '8px' }}
          >
            View more
          </Button>
        </Popover>
      )}
    </div>
  )
}

export default Index
