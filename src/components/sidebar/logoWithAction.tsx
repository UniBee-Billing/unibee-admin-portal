import { Popover } from 'antd'
import { ReactNode } from 'react'

const LogoWithAction = ({
  collapsed,
  clickHandler,
  text,
  logoColor,
  logo,
  height,
  popoverText
}: {
  collapsed: boolean
  clickHandler?: () => void
  text: string
  logo?: React.ReactNode
  logoColor?: string
  height?: string
  popoverText?: ReactNode
}) => (
  <PopoverWrapper needPopover={popoverText != undefined} content={popoverText}>
    <div
      style={{ height: height ?? '40px' }}
      className={`relative flex w-full ${clickHandler != undefined && 'cursor-pointer'} items-center pl-7 opacity-80 hover:text-gray-900 hover:opacity-100`}
      onClick={clickHandler}
    >
      {logo != undefined && (
        <div
          className={`h-4 w-4 flex-shrink-0 ${logoColor} transition-all duration-300`}
        >
          {logo}
        </div>
      )}
      <div
        className={`${logo != undefined && 'ml-3'} flex-shrink-0 text-gray-100 ${
          collapsed ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
      >
        {text}
      </div>
    </div>
  </PopoverWrapper>
)

export default LogoWithAction

const PopoverWrapper = ({
  children,
  needPopover,
  content
}: React.PropsWithChildren<{ content?: ReactNode; needPopover: boolean }>) => {
  return !needPopover ? (
    <>{children}</>
  ) : (
    <Popover
      content={content}
      placement="top"
      overlayStyle={{ maxWidth: '360px' }}
    >
      {children}
    </Popover>
  )
}
