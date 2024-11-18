import { PropsWithChildren } from 'react'

interface SettingItemProps {
  title: string
}

export const SettingItem = ({
  title,
  children
}: PropsWithChildren<SettingItemProps>) => (
  <div className="mb-4">
    <div className="mb-1">{title}</div>
    {children}
  </div>
)
