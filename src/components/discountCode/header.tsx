import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import Search, { SearchProps } from 'antd/es/input/Search'
import { Key } from 'react'
import { WithStyle } from '../../shared.types'
import {
  ExportButton,
  ExportButtonWithSelectOption
} from '../table/exportButton'

interface HeaderProps {
  selectedRowKeys: Key[]
  disabled: boolean
  isExporting: boolean
  isLoadingExportButton: boolean
  isLoadingExportAllButton: boolean
  onSearch: SearchProps['onSearch']
  onCancelExportButtonClick: () => void
  onExportButtonClick: () => void
  onExportAllButtonClick: () => void
  onCreateNewCodeButtonClick: () => void
  onExportSelectedCodeUsageDetailsButtonClick: () => void
}

export const Header = ({
  disabled,
  className,
  onCancelExportButtonClick,
  selectedRowKeys,
  isExporting,
  isLoadingExportButton,
  isLoadingExportAllButton,
  onExportButtonClick,
  onExportAllButtonClick,
  onExportSelectedCodeUsageDetailsButtonClick,
  onCreateNewCodeButtonClick,
  onSearch
}: WithStyle<HeaderProps>) => {
  return (
    <div className={`${className}`}>
      {isExporting ? (
        <div className="flex w-full justify-between">
          <Button
            color="danger"
            variant="outlined"
            onClick={onCancelExportButtonClick}
            disabled={disabled}
          >
            Cancel
          </Button>
          <div>
            <span className="mr-4 text-gray-400">
              {selectedRowKeys.length} discount code selected
            </span>
            <ExportButton
              type="primary"
              loading={isLoadingExportButton}
              onExportButtonClick={onExportButtonClick}
            ></ExportButton>
          </div>
        </div>
      ) : (
        <div className="flex justify-between">
          <Search
            allowClear
            placeholder="Enter coupon code or name"
            onSearch={onSearch}
            style={{ width: 375 }}
          />
          <div className="flex">
            <ExportButtonWithSelectOption
              loading={isLoadingExportAllButton}
              selectExportButtonTitle="Export selected code usage details"
              onSelectExportButtonClick={
                onExportSelectedCodeUsageDetailsButtonClick
              }
              disabled={disabled}
              onExportButtonClick={onExportAllButtonClick}
            />
            <Button
              type="primary"
              icon={<PlusOutlined></PlusOutlined>}
              className="ml-3"
              disabled={disabled}
              onClick={onCreateNewCodeButtonClick}
            >
              Add a code
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
