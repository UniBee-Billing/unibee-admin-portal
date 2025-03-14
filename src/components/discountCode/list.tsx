import {
  formatDateRange,
  useTableDateFilter
} from '@/components/table/filters/dateFilter'
import { getDiscountCodeStatusTagById } from '@/components/ui/statusTag'
import {
  DISCOUNT_CODE_BILLING_TYPE,
  DISCOUNT_CODE_STATUS,
  DISCOUNT_CODE_TYPE
} from '@/constants'
import { formatDate, showAmount } from '@/helpers'
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
import { title } from '@/utils'
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  ProfileOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { Modal, Space, Table, message } from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import dayjs from 'dayjs'
import { Key, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListItemActionButton } from './action'
import { Header } from './header'
import {
  formatNumberByZeroUnLimitedRule,
  formatQuantity,
  useWithExportAction
} from './helpers'

const PAGE_SIZE = 10

const CODE_STATUS_FILTER = Object.entries(DISCOUNT_CODE_STATUS).map((s) => {
  const [value, { label }] = s
  return { value: Number(value), text: label }
})
const BILLING_TYPE_FILTER = Object.entries(DISCOUNT_CODE_BILLING_TYPE).map(
  (s) => {
    const [value, text] = s
    return { value: Number(value), text: title(text) }
  }
)
const DISCOUNT_TYPE_FILTER = Object.entries(DISCOUNT_CODE_TYPE).map((s) => {
  const [value, text] = s
  return { value: Number(value), text: title(text) }
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
        const isRecurring = code.billingType === DiscountCodeBillingType.RECURRING;
        
        if (!isRecurring) {
          return (
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              width: '44px',
              height: '44px',
              background: '#fff',
            }}>
              <span style={{ fontSize: '16px' }}>{value}</span>
            </div>
          );
        }

        return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            width: '44px',
            height: '44px',
            background: '#fff',
          }}>
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 28 28" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <text
                x="14"
                y="17.5"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#333333"
                style={{
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                {value}
              </text>
              <path d="M6.2207 16.3458H7.46279C7.50419 16.3457 7.54387 16.3292 7.57315 16.2999C7.60243 16.2706 7.61893 16.2309 7.61904 16.1895V11.20326H17.9436V12.6212C17.9436 12.6583 17.9557 12.6933 17.979 12.7228C17.9922 12.7396 18.0086 12.7536 18.0273 12.7641C18.0459 12.7745 18.0664 12.7812 18.0876 12.7837C18.1088 12.7862 18.1303 12.7845 18.1508 12.7787C18.1714 12.7729 18.1906 12.7632 18.2074 12.7499L21.0061 10.55284C21.0903 10.45534 21.077 10.35159 21.0061 10.29493L18.2074 8.09951C18.1831 8.08086 18.154 8.06935 18.1235 8.06627C18.093 8.06318 18.0623 8.06866 18.0347 8.08207C18.0072 8.09548 17.9839 8.1163 17.9675 8.14219C17.9511 8.16809 17.9423 8.19803 17.942 8.22868V9.64659H7.46445C7.09306 9.64748 6.73716 9.79555 6.47474 10.05836C6.21232 10.32117 6.06478 10.67728 6.06445 11.04868V16.1895C6.06445 16.2753 6.13487 16.3458 6.2207 16.3458ZM20.9082 18.7833H19.6661C19.6247 18.7834 19.585 18.7999 19.5558 18.8291C19.5265 18.8584 19.51 18.8981 19.5099 18.9395V23.9258H9.18529V22.5078C9.18568 22.4771 9.17734 22.4469 9.16122 22.4207C9.14511 22.3944 9.12189 22.3734 9.09427 22.3598C9.06665 22.3463 9.03575 22.3409 9.00517 22.3442C8.9746 22.3476 8.94559 22.3595 8.92154 22.3787L6.12279 24.5766C6.03862 24.6745 6.05195 24.7778 6.12279 24.8345L8.92154 27.0299C8.94585 27.0487 8.97492 27.0603 9.00548 27.0635C9.03603 27.0666 9.06686 27.0612 9.09449 27.0477C9.12211 27.0343 9.14545 27.0134 9.16186 26.9875C9.17827 26.9615 9.1871 26.9315 9.18737 26.9008V25.4828H19.6674C20.439 25.4828 21.0678 24.8537 21.0678 24.0803V18.9395C21.0662 18.8979 21.0487 18.8586 21.0189 18.8295C20.9892 18.8004 20.9494 18.7839 20.9078 18.7833H20.9082Z" fill="#333333"/>
            </svg>
          </div>
        );
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: any) => {
        if (quantity === 0) {
          return 'Unlimited';
        }
        const used = record.quantityUsed ?? 0;
        const remaining = record.liveQuantity ?? quantity;
        return `${quantity} times (${remaining} left, ${used} used)`;
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
    
    // Add discountType filter
    const discountTypeFilter = filters.discountInfo?.[0]
      ? { discountType: Number(filters.discountInfo[0]) }
      : {}

    fetchData(
      {
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
