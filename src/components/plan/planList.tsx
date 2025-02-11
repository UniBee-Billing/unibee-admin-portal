import {
  CheckCircleOutlined,
  CopyOutlined,
  EditOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  message,
  Pagination,
  Result,
  Space,
  Table,
  Tooltip
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
// import currency from 'currency.js'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLAN_STATUS } from '../../constants'
import { formatDate, formatPlanPrice } from '../../helpers'
import { usePagination } from '../../hooks'
import { copyPlanReq, getPlanList, TPlanListBody } from '../../requests'
import '../../shared.css'
import { IPlan } from '../../shared.types'
import LongTextPopover from '../ui/longTextPopover'
import { PlanStatus } from '../ui/statusTag'

const PAGE_SIZE = 10
const PLAN_STATUS_FILTER = Object.keys(PLAN_STATUS)
  .map((s) => ({
    text: PLAN_STATUS[Number(s)],
    value: Number(s)
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1))

const PLAN_TYPE_FILTER = [
  { text: 'Main plan', value: 1 },
  { text: 'Add-on', value: 2 },
  { text: 'One-time payment', value: 3 }
] // main plan or addon

type TFilters = {
  type: number[] | null // plan type filter
  status: number[] | null // plan status filter
}

type TSort = {
  sortField: 'planName' | 'createTime'
  sortType: 'desc' | 'asc'
}

const Index = ({
  productId,
  isProductValid
}: {
  productId: number
  isProductValid: boolean
}) => {
  const navigate = useNavigate()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<IPlan[]>([])
  const [copyingPlan, setCopyingPlan] = useState(false)
  const [filters, setFilters] = useState<TFilters>({
    type: null,
    status: null
  })
  const [sortFilter, setSortFilter] = useState<TSort | null>(null)

  const goToDetail = (planId: number) =>
    navigate(`/plan/${planId}?productId=${productId}`)
  const copyPlan = async (planId: number) => {
    setCopyingPlan(true)
    const [newPlan, err] = await copyPlanReq(planId)
    setCopyingPlan(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    goToDetail(newPlan.id)
  }

  const onNewPlan = () => {
    // setPage(0) // if user are on page 3, after creating new plan, they'll be redirected back to page 1,so the newly created plan will be shown on the top
    onPageChange(1, 100)
    navigate(`/plan/new?productId=${productId}`)
  }

  const fetchPlan = async () => {
    const body: TPlanListBody = {
      // type: undefined, // get main plan and addon
      // status: undefined, // active, inactive, expired, editing, all of them
      ...filters,
      productIds: [productId],
      page: page,
      count: PAGE_SIZE
    }
    if (sortFilter != null) {
      body.sortField =
        sortFilter.sortField == 'planName' ? 'plan_name' : 'gmt_create'
      body.sortType = sortFilter.sortType
    }

    setLoading(true)
    const [planList, err] = await getPlanList(body, fetchPlan)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { plans, total } = planList
    setTotal(total)
    setPlan(
      plans == null
        ? []
        : plans.map((p: IPlan) => ({
            ...p.plan,
            metricPlanLimits: p.metricPlanLimits
          }))
    )
  }

  const columns: ColumnsType<IPlan> = [
    {
      title: 'Plan ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Name',
      dataIndex: 'planName',
      key: 'planName',
      width: 120,
      sorter: (a, b) => a.planName.localeCompare(b.planName),
      render: (planName) => (
        <div className="w-28 overflow-hidden whitespace-nowrap">
          <LongTextPopover text={planName} placement="topLeft" width="120px" />
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 128,
      render: (desc) => (
        <div className="w-36 overflow-hidden overflow-ellipsis whitespace-nowrap">
          <LongTextPopover text={desc} placement="topLeft" width="128px" />
        </div>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (_, p) => {
        return <span>{formatPlanPrice(p)}</span>
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (_, plan) => {
        return plan.type == 1 ? (
          <span>Main plan</span>
        ) : plan.type == 2 ? (
          <span>Add-on</span>
        ) : (
          <span>One-time payment</span>
        )
      },
      filters: PLAN_TYPE_FILTER
      // onFilter: (value, record) => record.status == value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => PlanStatus(s), // (_, plan) => STATUS[plan.status],
      filters: PLAN_STATUS_FILTER
      // onFilter: (value, record) => record.status == value,
    },
    {
      title: 'Published',
      dataIndex: 'publishStatus',
      key: 'publishStatus',
      render: (publishStatus) =>
        publishStatus == 2 ? (
          <CheckCircleOutlined style={{ color: 'green' }} />
        ) : (
          <MinusOutlined style={{ color: 'red' }} />
        )
    },
    {
      title: 'Allow Trial',
      dataIndex: 'trialDurationTime',
      key: 'trialDurationTime',
      render: (trialDurationTime) =>
        trialDurationTime > 0 ? (
          <CheckCircleOutlined style={{ color: 'green' }} />
        ) : (
          <MinusOutlined style={{ color: 'red' }} />
        )
    },
    {
      title: 'Billable metrics',
      dataIndex: 'metricPlanLimits',
      render: (m) => (null == m || 0 == m.length ? 'No' : m.length),
      hidden: true
    },
    {
      title: 'External Id',
      dataIndex: 'externalPlanId',
      width: 120,
      hidden: true
    },
    {
      title: 'Creation Time',
      dataIndex: 'createTime',
      render: (t) => (t == 0 ? '' : formatDate(t)),
      sorter: (a, b) => a.createTime - b.createTime
    },
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="New plan">
            <Button
              // type="primary"
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={copyingPlan}
              onClick={onNewPlan}
              icon={<PlusOutlined />}
            ></Button>
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchPlan}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle" className="plan-action-btn-wrapper">
          <Tooltip title="Edit">
            <Button
              disabled={copyingPlan}
              style={{ border: 'unset' }}
              onClick={() => goToDetail(record.id)}
              icon={<EditOutlined />}
            />
          </Tooltip>
          <Tooltip title="Copy">
            <Button
              style={{ border: 'unset' }}
              disabled={copyingPlan}
              onClick={() => copyPlan(record.id)}
              icon={<CopyOutlined />}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const onTableChange: TableProps<IPlan>['onChange'] = (_, filters, sorter) => {
    // onPageChange(1, PAGE_SIZE)
    setFilters(filters as TFilters)
    if (Array.isArray(sorter)) {
      return // Handle array case if needed
    }
    let sortFilter: TSort | null = null
    if (sorter.field != undefined) {
      sortFilter = {
        sortField: sorter.field == 'planName' ? 'planName' : 'createTime',
        sortType: sorter.order == 'descend' ? 'desc' : 'asc'
      }
    }

    setSortFilter(sortFilter)
  }

  useEffect(() => {
    if (isProductValid) {
      fetchPlan()
    }
  }, [filters, page, sortFilter])

  return (
    <>
      {!isProductValid ? (
        <div className="flex justify-center">
          <Result
            status="404"
            title="Product not found"
            // subTitle="Invalid product"
            // extra={<Button type="primary">Back Home</Button>}
          />
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={plan}
            rowKey={'id'}
            rowClassName="clickable-tbl-row"
            pagination={false}
            loading={{
              spinning: loading,
              indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
            }}
            onChange={onTableChange}
            onRow={(record) => {
              return {
                onClick: (event) => {
                  if (
                    event.target instanceof Element &&
                    event.target.closest('.plan-action-btn-wrapper') != null
                  ) {
                    return
                  }
                  navigate(`/plan/${record.id}?productId=${productId}`)
                }
              }
            }}
          />
          <div className="mx-0 my-4 flex items-center justify-end">
            <Pagination
              current={page + 1} // back-end starts with 0, front-end starts with 1
              pageSize={PAGE_SIZE}
              total={total}
              size="small"
              onChange={onPageChange}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
              disabled={loading}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </>
  )
}

export default Index
