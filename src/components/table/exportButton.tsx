import { DownOutlined } from '@ant-design/icons'
import { Button, ButtonProps, Dropdown, DropdownProps, Space } from 'antd'
import { PropsWithChildren } from 'react'
import { convertActions2Menu } from '../../utils'

export interface ExportButtonProps extends ButtonProps {
  onExportButtonClick?(): void
  moreActions?: Record<string, () => void>
  dropdownProps?: DropdownProps
}

export const ExportButton = ({
  moreActions,
  onExportButtonClick,
  children = 'Export',
  dropdownProps,
  ...buttonProps
}: PropsWithChildren<ExportButtonProps>) =>
  moreActions ? (
    <Dropdown menu={convertActions2Menu(moreActions)} {...dropdownProps}>
      <Button {...buttonProps}>
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
