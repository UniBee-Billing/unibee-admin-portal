import {
  formatDateRange,
  useTableDateFilter
} from '@/components/table/filters/dateFilter'
import { getDiscountCodeStatusTagById } from '@/components/ui/statusTag'
import {
  DISCOUNT_CODE_BILLING_TYPE as _DISCOUNT_CODE_BILLING_TYPE,
  DISCOUNT_CODE_STATUS,
  DISCOUNT_CODE_TYPE as _DISCOUNT_CODE_TYPE
} from '@/constants'
import { showAmount } from '@/helpers'
import { useLoading, usePagination } from '@/hooks'
import {
  deleteDiscountCodeReq,
  exportDataReq,
  getDiscountCodeDetailWithMore,
  getDiscountCodeListReq
} from '@/requests/index'
import '@/shared.css'
import {
  DiscountCode,
  DiscountCodeBillingType,
  DiscountCodeStatus,
  DiscountType
} from '@/shared.types'
import { title as _title } from '@/utils'
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  ProfileOutlined,
} from '@ant-design/icons'
import { Modal, Space, Table, message } from 'antd'
import Icon from '@ant-design/icons'
import { ColumnsType, TableProps } from 'antd/es/table'
import dayjs from 'dayjs'
import { Key, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListItemActionButton } from './action'
import { Header } from './header'
import {
  useWithExportAction
} from './helpers'
import RecurringCycleSvg from '@/assets/recurringCycle.svg?react'

const PAGE_SIZE = 10

const CODE_STATUS_FILTER = Object.entries(DISCOUNT_CODE_STATUS).map((s) => {
  const [value, { label }] = s
  return { value: Number(value), text: label }
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
  const _createTableDateFilter = useTableDateFilter<DiscountCode>()

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
      render: (statusId) => getDiscountCodeStatusTagById(statusId),
      filters: CODE_STATUS_FILTER
    },
    {
      title: 'Discount Info',
      key: 'discountInfo',
      align: 'center',
      render: (_, code) => {
        if (code.discountType === DiscountType.PERCENTAGE) {
          const percentage = code.discountPercentage / 100;
          return <div style={{ textAlign: 'center' }}>{`${percentage} %`}</div>
        }
        return <div style={{ textAlign: 'center' }}>{showAmount(code.discountAmount, code.currency)}</div>
      },
      filters: [
        { text: 'Percentage', value: DiscountType.PERCENTAGE },
        { text: 'Fixed-amount', value: DiscountType.AMOUNT }
      ],
      onFilter: (value, record) => record.discountType === Number(value)
    },
    {
      title: 'Recurring Cycle',
      key: 'recurringCycle',
      align: 'center',
      render: (_, code) => {
        const cycleLimit = code.cycleLimit;
        const value = code.billingType === DiscountCodeBillingType.ONE_TIME ? '1' : 
          (cycleLimit === 0 ? '♾️' : cycleLimit.toString());
        
        return (
          <div style={{ 
            textAlign: 'center', 
            display: 'flex',
            justifyContent: 'center',
            padding: '4px 0'
          }}>
            <div style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              background: '#fff'
            }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
              }}>
                {code.billingType !== DiscountCodeBillingType.ONE_TIME && (
                  <Icon 
                    component={RecurringCycleSvg} 
                    style={{ 
                      fontSize: '32px',
                      color: '#333',
                      position: 'absolute',
                      top: '40%',
                      left: '50%',
                      transform: 'translate(-50%, -53%)'
                    }} 
                  />
                )}
                <span style={{
                  position: 'absolute',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#333',
                  lineHeight: 1,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1
                }}>
                  {value}
                </span>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, code: DiscountCode) => {
        if (quantity === 0) {
          return 'Unlimited';
        }
        return `${quantity} times (${code.liveQuantity} left, ${code.quantityUsed} used)`;
      }
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
            disabled={record.status === DiscountCodeStatus.ARCHIVED}
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
            tooltipMessage="Archive"
            asyncTask
            disabled={record.status === DiscountCodeStatus.ARCHIVED}
            onClick={async () => {
              await new Promise((resolve, reject) =>
                Modal.confirm({
                  title: `Archive the ${record.name} coupon code?`,
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

    message.success('Discount code archived successfully')
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
    const dateFilters = formatDateRange(filters, 'createTime', {
      start: 'createTimeStart',
      end: 'createTimeEnd'
    })
    
    // Add discountType filter
    const discountTypeFilter = filters.discountInfo?.[0]
      ? { discountType: Number(filters.discountInfo[0]) }
      : {}

    fetchData(
      {
        ...dateFilters,
        ...discountTypeFilter
      },
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
        task: 'DiscountExport',
        payload: {}
      })
    )
  )

  useEffect(() => {
    fetchData({}, page)
  }, [fetchData])

  const handleRowClick = (code: DiscountCode) => {
    // If in exporting mode, do not allow row click
    if (
      isShowRowSelectCheckBox ||
      code.status === DiscountCodeStatus.ARCHIVED
    ) {
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
        loading={{
          spinning: isTableLoading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
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