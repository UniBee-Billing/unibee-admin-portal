import { Button, Table, message } from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import { SorterResult } from 'antd/es/table/interface'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate, showAmount } from '../../helpers'
import { useLoading, usePagination } from '../../hooks'
import { exportDataReq, getDiscountCodeUsageDetailReq } from '../../requests'
import { DiscountCodeUsage } from '../../shared.types'
import { renameKeys, trimEmptyValues } from '../../utils/object'
import { ExportButton } from '../table/exportButton'
import {
  formatDateRange,
  useTableDateFilter
} from '../table/filters/dateFilter'
import { parseSearchFilters, useTableSearchBox } from '../table/filters/search'
import { parseAntDSorter2SpecData } from '../table/sort'
import {
  formatDiscountCodeStatus,
  formatRecurringStatus,
  useWithExportAction
} from './helpers'

const PAGE_SIZE = 10

const Index = () => {
  const params = useParams()
  const codeId = params.discountCodeId
  const { page, onPageChange } = usePagination()
  const { isLoading, withLoading } = useLoading()
  const {
    isLoading: isExportButtonLoading,
    withLoading: withExportButtonLoading
  } = useLoading()
  const withExportAction = useWithExportAction()
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const [usageDetailList, setUsageDetailList] = useState<DiscountCodeUsage[]>(
    []
  )
  const createTableSearchBox = useTableSearchBox<DiscountCodeUsage>()
  const createTableDateFilter = useTableDateFilter<DiscountCodeUsage>()

  const goBack = () => navigate(`/discount-code/list`)

  const columns: ColumnsType<DiscountCodeUsage> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      fixed: true
    },
    {
      title: 'Applied plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan) => (
        <div
          onClick={() => navigate(`/plan/${plan.id}`)}
          className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
        >
          {plan.planName}
        </div>
      )
    },
    {
      title: 'Applied Amt',
      dataIndex: 'applyAmount',
      key: 'applyAmount',
      render: (amt, code_detail) => showAmount(amt, code_detail.currency)
    },
    {
      title: 'Used by',
      dataIndex: 'user',
      key: 'user',
      ...createTableSearchBox('user', (user, highlight) =>
        !user ? (
          ''
        ) : (
          <div
            onClick={() => navigate(`/user/${user.id}`)}
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {highlight(user.email)}
          </div>
        )
      )
    },
    {
      title: 'Used at',
      dataIndex: 'createTime',
      key: 'createTime',
      sorter: (a, b) => a.createTime - b.createTime,
      render: (usedAt) => formatDate(usedAt, true),
      ...createTableDateFilter()
    },
    {
      title: 'Recurring',
      dataIndex: 'recurring',
      key: 'recurring',
      render: (recurring) => formatRecurringStatus(recurring)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => formatDiscountCodeStatus(status)
    },
    {
      title: 'Subscription Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subId) =>
        subId == '' || subId == null ? (
          ''
        ) : (
          <div
            onClick={() => navigate(`/subscription/${subId}`)}
            className="w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          >
            {subId}
          </div>
        )
    },
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) =>
        ivId == '' || ivId == null ? (
          ''
        ) : (
          <Button
            onClick={() => navigate(`/invoice/${ivId}`)}
            type="link"
            style={{ padding: 0 }}
          >
            {ivId}
          </Button>
        )
    },
    {
      title: 'Transaction Id',
      dataIndex: 'paymentId',
      key: 'paymentId'
    }
  ]

  const fetchData = async (
    page: number | undefined = 0,
    filters: Record<string, unknown> | undefined = {},
    sorter: Record<string, unknown> | undefined = {}
  ) => {
    const id = Number(codeId)

    if (isNaN(id)) {
      message.error('Invalid code Id')
      return
    }

    const [res, err] = await withLoading(
      () =>
        getDiscountCodeUsageDetailReq({
          id,
          page,
          count: PAGE_SIZE,
          refreshCb: fetchData,
          ...filters,
          ...sorter
        }),
      false
    )

    if (err) {
      message.error(err.message)
      return
    }

    const { userDiscounts, total } = res

    setUsageDetailList(userDiscounts ?? [])
    setTotal(total)
  }

  const handleTableChange: TableProps<DiscountCodeUsage>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    const parsedFilters = renameKeys(
      formatDateRange(parseSearchFilters(filters, ['user']), 'createTime', {
        start: 'createTimeStart',
        end: 'createTimeEnd'
      }),
      {
        user: 'email'
      }
    )

    onPageChange(pagination.current!, PAGE_SIZE)
    fetchData(
      pagination.current! - 1,
      trimEmptyValues(parsedFilters),
      // The back-end only supports sorting one column at a time
      parseAntDSorter2SpecData(sorter as SorterResult<DiscountCodeUsage>, {
        createTime: 'gmt_create'
      })
    )
  }

  const handleExportAllButtonClick = withExportAction(() =>
    withExportButtonLoading(
      () =>
        exportDataReq({
          task: 'UserDiscountExport',
          payload: { id: Number(codeId) }
        }),
      false
    )
  )

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="relative">
      <div className="mb-4 flex justify-end">
        <ExportButton
          onExportButtonClick={handleExportAllButtonClick}
          loading={isExportButtonLoading}
        />
      </div>
      <Table
        columns={columns}
        dataSource={usageDetailList}
        scroll={{ x: 'max-content' }}
        rowKey="id"
        onChange={handleTableChange}
        rowClassName="clickable-tbl-row"
        pagination={{
          current: page + 1,
          pageSize: PAGE_SIZE,
          total,
          showSizeChanger: false
        }}
        loading={isLoading}
      />
      <div className="absolute bottom-[14px]">
        <Button onClick={goBack}>Go back</Button>
      </div>
    </div>
  )
}

export default Index
