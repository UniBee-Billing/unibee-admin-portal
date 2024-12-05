import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ProfileOutlined
} from '@ant-design/icons'
import { Modal, Popconfirm, Space, Table, message } from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import dayjs from 'dayjs'
import { Key, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DISCOUNT_CODE_BILLING_TYPE,
  DISCOUNT_CODE_STATUS,
  DISCOUNT_CODE_TYPE
} from '../../constants'
import { formatDate, showAmount } from '../../helpers'
import { useLoading, usePagination } from '../../hooks'
import {
  deleteDiscountCodeReq,
  exportDataReq,
  getDiscountCodeDetailWithMore,
  getDiscountCodeListReq
} from '../../requests'
import '../../shared.css'
import { DiscountCode, DiscountCodeStatus } from '../../shared.types'
import {
  formatDateRange,
  useTableDateFilter
} from '../table/filters/dateFilter'
import { getDiscountCodeStatusTagById } from '../ui/statusTag'
import { ListItemActionButton } from './action'
import { Header } from './header'
import {
  formatNumberByZeroUnLimitedRule,
  formatQuantity,
  useWithExportAction
} from './helpers'

const PAGE_SIZE = 10

const CODE_STATUS_FILTER = Object.entries(DISCOUNT_CODE_STATUS).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})
const BILLING_TYPE_FILTER = Object.entries(DISCOUNT_CODE_BILLING_TYPE).map(
  (s) => {
    const [value, text] = s
    return { value: Number(value), text }
  }
)
const DISCOUNT_TYPE_FILTER = Object.entries(DISCOUNT_CODE_TYPE).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})

type TableRowSelection<T extends object = object> =
  TableProps<T>['rowSelection']

export const DiscountCodeList = () => {
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const { isLoading, withLoading } = useLoading()
  const { isLoading: isTableLoading, withLoading: withTableLoading } =
    useLoading()
  const {
    isLoading: isExportAllButtonLoading,
    withLoading: withExportAllButtonLoading
  } = useLoading()
  const [codeList, setCodeList] = useState<DiscountCode[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [isShowRowSelectCheckBox, setIsShowRowSelectCheckBox] = useState(false)
  const withExportAction = useWithExportAction()
  const createTableDateFilter = useTableDateFilter<DiscountCode>()

  const rowSelection: TableRowSelection<DiscountCode> = {
    selectedRowKeys,
    onChange: (key) => setSelectedRowKeys(key),
    preserveSelectedRowKeys: true
  }

  const fetchData = useCallback(
    async (
      filters: Record<string, unknown> | undefined = {},
      page: number | undefined = 0
    ) => {
      const [res, err] = await withTableLoading(
        () =>
          getDiscountCodeListReq(
            { page, count: PAGE_SIZE, ...filters },
            fetchData
          ),
        false
      )

      if (err) {
        message.error(err.message)
        return
      }

      const { discounts, total } = res

      setCodeList(discounts ?? [])
      setTotal(total)
    },
    []
  )

  const columns: ColumnsType<DiscountCode> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      fixed: true
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (statusId) => getDiscountCodeStatusTagById(statusId), // STATUS[s]
      filters: CODE_STATUS_FILTER
    },
    {
      title: 'Billing Type',
      dataIndex: 'billingType',
      key: 'billingType',
      render: (s) => DISCOUNT_CODE_BILLING_TYPE[s],
      filters: BILLING_TYPE_FILTER
    },
    {
      title: 'Discount Type',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (s) => DISCOUNT_CODE_TYPE[s],
      filters: DISCOUNT_TYPE_FILTER
    },
    {
      title: 'Amount',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (amt, code) =>
        code.discountType == 1 ? '' : showAmount(amt, code.currency)
    },
    {
      title: 'Percentage',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      render: (percent, code) =>
        code.discountType == 1 ? `${percent / 100} %` : ''
    },
    {
      title: 'Cycle Limit',
      dataIndex: 'cycleLimit',
      key: 'cycleLimit',
      render: (lim, code) => {
        if (code.billingType == 1) {
          // one-time use
          return '1'
        } else if (code.billingType == 2) {
          // recurring
          return formatNumberByZeroUnLimitedRule(lim)
        } else {
          return lim
        }
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => formatQuantity(quantity)
    },
    {
      title: 'Remaining Quantity',
      dataIndex: 'liveQuantity',
      key: 'liveQuantity',
      render: (remainingQuantity, code) =>
        // If quantity is 0, the remaining quantity should display unlimited.
        code.quantity === 0 ? 'Unlimited' : remainingQuantity
    },
    {
      title: 'Usage count',
      dataIndex: 'quantityUsed',
      key: 'quantityUsed'
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime) => formatDate(createTime),
      ...createTableDateFilter()
    },
    {
      title: 'Validity Range',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (start, code) =>
        dayjs(start * 1000).format('YYYY-MMM-DD') +
        ' ~ ' +
        dayjs(code.endTime * 1000).format('YYYY-MMM-DD')
    },
    {
      fixed: 'right',
      title: 'Actions',
      width: 128,
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="middle" className="code-action-btn-wrapper">
          <ListItemActionButton
            tooltipMessage="Edit"
            onClick={() => navigateToEditPage(record)}
          >
            <EditOutlined />
          </ListItemActionButton>

          <ListItemActionButton
            tooltipMessage="View usage detail"
            onClick={() => navigateToUsageDetailPage(record)}
            disabled={record.status === DiscountCodeStatus.EDITING}
          >
            <ProfileOutlined />
          </ListItemActionButton>

          <ListItemActionButton
            tooltipMessage="Copy"
            asyncTask
            onClick={() => copyCode(record)}
          >
            <CopyOutlined />
          </ListItemActionButton>

          <ListItemActionButton
            tooltipMessage="Delete"
            asyncTask
            onClick={async () => {
              await new Promise((resolve, reject) =>
                Modal.confirm({
                  title: `Delete the ${record.name} coupon code?`,
                  content: 'Are you sure to archive this coupon code?',
                  onOk: () => resolve(undefined),
                  onCancel: () => reject(undefined)
                })
              )
              await deleteDiscountCode(record)
            }}
          >
            <DeleteOutlined />
          </ListItemActionButton>
        </Space>
      )
    }
  ]

  const copyCode = async (code: DiscountCode) => {
    const [copyDiscountCode, err] = await getDiscountCodeDetailWithMore(
      code.id!,
      () => {}
    )

    if (err) {
      message.error('Failed to copy discount code, Please try again later')
      return
    }

    navigate('/discount-code/new', {
      state: {
        copyDiscountCode
      }
    })
  }

  const deleteDiscountCode = async (code: DiscountCode) => {
    const [_, err] = await deleteDiscountCodeReq(code.id!)

    if (err) {
      message.error('Failed to delete discount code, Please try again later')
      return
    }

    message.success('Discount code deleted successfully')
    fetchData({}, page)
  }

  const navigateToEditPage = (code: DiscountCode) =>
    navigate(`/discount-code/${code.id}`)

  const navigateToUsageDetailPage = (code: DiscountCode) =>
    navigate(`/discount-code/${code.id}/usage-detail`)

  const handleTableChange: TableProps<DiscountCode>['onChange'] = (
    pagination,
    filters
  ) => {
    onPageChange(pagination.current!, pagination.pageSize!)
    fetchData(
      formatDateRange(filters, 'createTime', {
        start: 'createTimeStart',
        end: 'createTimeEnd'
      }),
      pagination.current! - 1
    )
  }

  const handleExportButtonClick = withExportAction(async () => {
    const res = await withLoading(
      () =>
        exportDataReq({
          task: 'MultiUserDiscountExport',
          payload: {
            ids: selectedRowKeys
          }
        }),
      false
    )

    exitExportingMode()

    return res
  })

  const handleExportAllButtonClick = withExportAction(() =>
    withExportAllButtonLoading(() =>
      exportDataReq({
        task: 'MultiUserDiscountExport',
        payload: {
          exportAll: 1
        }
      })
    )
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRowClick = (code: DiscountCode) => {
    // If in exporting mode, do not allow row click
    if (isShowRowSelectCheckBox) {
      return
    }

    navigateToEditPage(code)
  }

  const handleSearch = (codeOrName: string) =>
    fetchData({ searchKey: codeOrName })

  const exitExportingMode = () => {
    setSelectedRowKeys([])
    setIsShowRowSelectCheckBox(false)
  }

  return (
    <div>
      <Header
        className="mb-4"
        onSearch={handleSearch}
        selectedRowKeys={selectedRowKeys}
        onExportButtonClick={() => handleExportButtonClick()}
        isLoadingExportButton={isLoading}
        isLoadingExportAllButton={isExportAllButtonLoading}
        onCancelExportButtonClick={() => setIsShowRowSelectCheckBox(false)}
        isExporting={isShowRowSelectCheckBox}
        disabled={isTableLoading}
        onExportAllButtonClick={handleExportAllButtonClick}
        onExportSelectedCodeUsageDetailsButtonClick={() =>
          setIsShowRowSelectCheckBox(true)
        }
        onCreateNewCodeButtonClick={() => navigate(`/discount-code/new`)}
      />
      <Table<DiscountCode>
        rowSelection={isShowRowSelectCheckBox ? rowSelection : undefined}
        scroll={{ x: 'max-content' }}
        columns={columns}
        dataSource={codeList}
        onChange={handleTableChange}
        rowKey="id"
        rowClassName="clickable-tbl-row"
        loading={isTableLoading}
        pagination={{
          total,
          pageSize: PAGE_SIZE,
          showSizeChanger: false,
          current: page + 1
        }}
        onRow={(code) => ({
          onClick: () => handleRowClick(code)
        })}
      />
    </div>
  )
}
