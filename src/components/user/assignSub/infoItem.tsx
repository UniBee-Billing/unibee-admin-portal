import { PropsWithChildren } from 'react'
import { WithStyle } from '../../../shared.types'

interface InfoItemProps {
  title: string
  isBold?: boolean
  horizontal?: boolean
}

export const InfoItem = ({
  title,
  children,
  isBold,
  className,
  horizontal
}: PropsWithChildren<WithStyle<InfoItemProps>>) => (
  <div
    className={`${className} ${horizontal && 'flex items-center justify-between'}`}
  >
    <div className={`${(isBold ?? true) && 'font-bold'}`}>{title}</div>
    <div className={`${!horizontal && 'mt-2'}`}>{children}</div>
  </div>
)
