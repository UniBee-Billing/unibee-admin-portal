import { Button, ButtonProps, Dropdown } from 'antd'
import { PropsWithChildren } from 'react'
import { convertActions2Menu } from '../../utils'

export interface ExportButtonProps extends ButtonProps {
  onExportButtonClick(): void
  moreActions?: Record<string, () => void>
}

export const ExportButton = ({
  moreActions,
  onExportButtonClick,
  children = 'Export',
  ...buttonProps
}: PropsWithChildren<ExportButtonProps>) => {
  return moreActions ? (
    <Dropdown.Button
      onClick={onExportButtonClick}
      menu={convertActions2Menu(moreActions)}
      {...buttonProps}
    >
      {children}
    </Dropdown.Button>
  ) : (
    <Button onClick={onExportButtonClick} {...buttonProps}>
      {children}
    </Button>
  )
}

export interface ExportButtonWithSelectOptionProps extends ExportButtonProps {
  selectExportButtonTitle: string
  onSelectExportButtonClick(): void
}

export const ExportButtonWithSelectOption = ({
  onSelectExportButtonClick,
  selectExportButtonTitle,
  ...exportButtonProps
}: ExportButtonWithSelectOptionProps) => (
  <ExportButton
    moreActions={{ [selectExportButtonTitle]: onSelectExportButtonClick }}
    {...exportButtonProps}
  />
)
