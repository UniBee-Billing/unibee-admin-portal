import { useLoading } from '@/hooks'
import { Button, ButtonProps, Tooltip } from 'antd'
import { MouseEvent, PropsWithChildren } from 'react'

interface ListItemActionButtonProps extends ButtonProps {
  tooltipMessage: string
  asyncTask?: boolean
}

export const ListItemActionButton = ({
  tooltipMessage,
  children,
  onClick,
  asyncTask,
  ...buttonProps
}: PropsWithChildren<ListItemActionButtonProps>) => {
  const { isLoading, withLoading } = useLoading()
  const handleActionButtonClick = async (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()

    await (asyncTask
      ? withLoading(() => onClick?.(e) as unknown as Promise<void>)
      : onClick?.(e))
  }

  return (
    <Tooltip title={tooltipMessage}>
      <Button
        className="btn-code-usage-detail"
        style={{ border: 'unset' }}
        icon={children}
        loading={isLoading}
        onClick={handleActionButtonClick}
        {...buttonProps}
      />
    </Tooltip>
  )
}
