import { DownOutlined } from '@ant-design/icons'
import { Button, ButtonProps, Dropdown, Space } from 'antd'
import { PropsWithChildren } from 'react'
import { convertActions2Menu } from '../../utils'

export interface ExportButtonProps extends ButtonProps {
  onExportButtonClick?(): void
  moreActions?: Record<string, () => void>
}

export const ExportButton = ({
  moreActions,
  onExportButtonClick,
  children = 'Export',
  ...buttonProps
}: PropsWithChildren<ExportButtonProps>) =>
  moreActions ? (
    <Dropdown menu={convertActions2Menu(moreActions)}>
      <Button>
        <Space>
          {children}
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  ) : (
    <Button onClick={onExportButtonClick} {...buttonProps}>
      {children}
    </Button>
  )
