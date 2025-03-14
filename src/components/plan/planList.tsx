import LongTextPopover from '@/components/ui/longTextPopover'
import { PlanStatusTag } from '@/components/ui/statusTag'
import { PLAN_STATUS, PLAN_TYPE } from '@/constants'
import {
  formatDate,
  formatPlanPrice,
  initializeFilters,
  initializeSort
} from '@/helpers/index'
import { usePagination } from '@/hooks/index'
import {
  archivePlanReq,
  copyPlanReq,
  getPlanList,
  TPlanListBody
} from '@/requests/index'
import { IPlan, PlanPublishStatus, PlanStatus, PlanType } from '@/shared.types'
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  message,
  Modal,
  Pagination,
  Result,
  Row,
  Space,
  Table,
  Tooltip
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import '../../shared.css'

type OnChange = NonNullable<TableProps<IPlan>['onChange']>
type GetSingle<T> = T extends (infer U)[] ? U : never
type Sorts = GetSingle<Parameters<OnChange>[2]>

const PAGE_SIZE = 10
const PLAN_STATUS_FILTER = Object.entries(PLAN_STATUS)
  .map(([statusNumber, { label }]) => ({
    value: Number(statusNumber),
    text: label
  }))
  .filter(({ value }) => value != PlanStatus.INACTIVE) // PlanStatus.INACTIVE is not used.
  .sort((a, b) => (a.value < b.value ? -1 : 1))

const PLAN_TYPE_FILTER = Object.entries(PLAN_TYPE)
  .map(([typeNumber, { label }]) => ({
    value: Number(typeNumber),
    text: label
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1))

type TFilters = {
  type: PlanType[] | null
  status: PlanStatus[] | null
  planName?: number[] | null
}

const Index = ({
  productId,
  isProductValid
}: {
  productId: number
  isProductValid: boolean
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<IPlan[]>([])
  const [copyingPlan, setCopyingPlan] = useState(false)
  const [archiveModalOpen, setArchiveModalOpen] = useState<undefined | IPlan>(
    undefined
  ) // undefined: modal is closed, otherwise: modal is open with this plan
  const toggleArchiveModal = (plan?: IPlan) => setArchiveModalOpen(plan)
  const [planNameFilters, setPlanNameFilters] = useState<{ value: number; text: string }[]>([])

  // 注意：我们在URL中使用'planIds'参数，但在Ant Design Table的筛选器中，字段名是'planName'
  // 这是因为Table组件的onChange事件返回的filters对象使用列的key作为字段名
  // 我们的列key是'planName'，但我们存储的是plan ID，所以URL参数用'planIds'更准确
  const planIdsParam = searchParams.get('planIds');
  // console.log('URL planIds param:', planIdsParam);
  
  // 检查initializeFilters函数的结果
  const typeFilters = initializeFilters('type', Number, PlanType);
  const statusFilters = initializeFilters('status', Number, PlanStatus);
  // console.log('initializeFilters results:', { typeFilters, statusFilters });
  
  // 手动处理planIds参数
  let planNameFilter = null;
  if (planIdsParam) {
    try {
      planNameFilter = planIdsParam.split('-').map(Number).filter(id => !isNaN(id));
      // console.log('Parsed planIds from URL:', planNameFilter);
    } catch (_e) {
      // console.error('Error parsing planIds:', _e);
    }
  }
  
  const [filters, setFilters] = useState<TFilters>({
    ...typeFilters,
    ...statusFilters,
    planName: planNameFilter
  } as TFilters)

  // console.log('Initial filters:', filters);
  
  const [sortFilter, setSortFilter] = useState<Sorts>(
    initializeSort<IPlan>(['planName', 'createTime']) // pass all the sortable column.key in array
  )

  const goToDetail = (planId: number) => {
    navigate(`/plan/${planId}?productId=${productId}`, {
      state: {
        from: location.pathname + location.search
      }
    })
  }

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
    // console.log('fetchPlan called with filters:', filters);
    // console.log('planNameFilters available:', planNameFilters);
    
    const body: TPlanListBody = {
      productIds: [productId],
      page: page,
      count: PAGE_SIZE,
      type: filters.type,
      status: filters.status
    }
    if (sortFilter.columnKey != null) {
      body.sortField =
        sortFilter.columnKey == 'planName' ? 'plan_name' : 'gmt_create'
      body.sortType = sortFilter.order == 'descend' ? 'desc' : 'asc'
    }

    // Add planName filter if it exists - we need to find the plan name from the ID
    if (filters.planName && filters.planName.length > 0) {
      // console.log('Filtering by planName:', filters.planName);
      
      // 确保planNameFilters已经加载
      if (planNameFilters.length === 0) {
        // console.log('planNameFilters not loaded yet, skipping planName filter');
      } else {
        // Find the plan name from the plan ID
        const selectedPlan = planNameFilters.find(p => p.value === filters.planName![0]);
        // console.log('Selected plan from filter:', selectedPlan);
        if (selectedPlan) {
          body.planName = selectedPlan.text;
          // console.log('Setting API planName filter to:', selectedPlan.text);
        } else {
          // console.log('Could not find plan with ID:', filters.planName[0]);
          // console.log('Available plan IDs:', planNameFilters.map(p => p.value));
        }
      }
    }

    // console.log('API request body:', body);
    
    setLoading(true)
    const [planList, err] = await getPlanList(body, fetchPlan)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { plans, total } = planList
    setTotal(total)
    
    // console.log('API response plans:', plans);
    
    setPlan(
      plans == null
        ? []
        : plans.map((p: IPlan) => ({
            ...p.plan,
            metricPlanLimits: p.metricPlanLimits
          }))
    )
  }

  //Get all plan names individually for filtering
  const fetchAllPlanNames = async () => {
    const [planList, err] = await getPlanList(
      {
        productIds: [productId],
        page: 0,
        count: 1000 // Get enough plans to include all names
      },
      fetchPlan
    )
    
    if (err != null) {
      message.error(err.message)
      return
    }
    
    const { plans } = planList
    
    if (plans && plans.length > 0) {
      const uniquePlanNames = new Set<string>();
      const newPlanNameFilters: { value: number; text: string }[] = [];
      
      plans.forEach((p: IPlan) => {
        const planName = p.plan?.planName;
        const planId = p.plan?.id;
        if (planName && planId && !uniquePlanNames.has(planName)) {
          uniquePlanNames.add(planName);
          newPlanNameFilters.push({
            value: planId,
            text: planName
          });
        }
      });
      
      // console.log('Plan name filters:', newPlanNameFilters);
      setPlanNameFilters(newPlanNameFilters);
    }
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
      filters: planNameFilters,
      filteredValue: filters.planName,
      filterMode: 'tree',
      filterSearch: true,
      onFilter: (value, record) => {
        // console.log('onFilter comparing:', { value, recordId: record.id, valueType: typeof value, recordIdType: typeof record.id });
        // 确保类型匹配，将value转换为数字进行比较
        return record.id === Number(value);
      },
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
      render: (type) => PLAN_TYPE[type as PlanType].label,
      filters: PLAN_TYPE_FILTER,
      filteredValue: filters.type
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => PlanStatusTag(s as PlanStatus),
      filters: PLAN_STATUS_FILTER,
      filteredValue: filters.status
    },
    {
      title: 'Published',
      dataIndex: 'publishStatus',
      key: 'publishStatus',
      render: (publishStatus) =>
        publishStatus == PlanPublishStatus.PUBLISHED ? (
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
      key: 'createTime',
      render: (t) => (t == 0 ? '' : formatDate(t)),
      sorter: (a, b) => a.createTime - b.createTime,
      sortOrder: sortFilter?.columnKey == 'createTime' ? sortFilter.order : null
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
          <Tooltip title="Archive">
            <Button
              style={{ border: 'unset' }}
              disabled={
                record.status == PlanStatus.SOFT_ARCHIVED ||
                record.status == PlanStatus.HARD_ARCHIVED
              }
              onClick={() => toggleArchiveModal(record)}
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const onTableChange: TableProps<IPlan>['onChange'] = (_, filters, sorter) => {
    // onPageChange(1, PAGE_SIZE)
    // console.log('Table filter change:', filters);
    
    // 检查filters.planName的类型和值
    // 注意：虽然字段名是planName，但实际上存储的是plan ID
    // console.log('planName filter:', {
    //   value: filters.planName,
    //   type: typeof filters.planName,
    //   isArray: Array.isArray(filters.planName)
    // });
    
    setFilters(filters as TFilters)

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.type == null
      ? searchParams.delete('type')
      : searchParams.set('type', filters.type.join('-'))
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.status == null
      ? searchParams.delete('status')
      : searchParams.set('status', filters.status.join('-'))
    
    // 处理planIds参数 - 虽然filters中的字段名是planName，但我们在URL中使用planIds
    // 因为这些值实际上是plan ID而不是plan名称
    if (filters.planName == null || filters.planName.length === 0) {
      // console.log('Removing planIds from URL');
      searchParams.delete('planIds');
    } else {
      const planIdsStr = filters.planName.join('-');
      // console.log('Setting planIds in URL:', planIdsStr);
      searchParams.set('planIds', planIdsStr);
    }

    // console.log('Updated search params:', Object.fromEntries(searchParams.entries()));

    if (Array.isArray(sorter)) {
      return // Handle array case if needed
    }

    setSortFilter(sorter as Sorts)
    if (sorter.field != undefined) {
      searchParams.set('sortby', sorter.field as string)
      searchParams.set('sortorder', sorter.order as string)
    } else {
      searchParams.delete('sortby')
      searchParams.delete('sortorder')
    }

    setSearchParams(searchParams)
  }

  useEffect(() => {
    if (isProductValid) {
      fetchPlan()
    }
  }, [filters, page, sortFilter])

  useEffect(() => {
    if (isProductValid) {
      fetchAllPlanNames()
    }
  }, [productId, isProductValid])

  // 添加日志，检查表格筛选器的状态
  useEffect(() => {
    // console.log('Render state:', {
    //   filters,
    //   planNameFilters,
    //   planIdsInURL: searchParams.get('planIds')
    // });
  }, [filters, planNameFilters, searchParams]);

  return (
    <>
      {archiveModalOpen != null && (
        <ArchiveModal
          plan={archiveModalOpen!}
          closeModal={() => toggleArchiveModal()}
          refreshCb={fetchPlan}
        />
      )}
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
                    // table's onRow event will be triggered first, then those action buttons'.
                    // use this if-check to make action button' handlers have to chance to run.
                    event.target instanceof Element &&
                    event.target.closest('.plan-action-btn-wrapper') != null
                  ) {
                    return
                  }
                  goToDetail(record.id)
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

const ArchiveOptions = [
  {
    type: PlanStatus.SOFT_ARCHIVED as const,
    icon: <InboxOutlined style={{ fontSize: '48px', color: '#0591FF' }} />,
    label: 'Soft Archive',
    description:
      'Unavailable to new users; upgrades blocked; existing users unaffected.'
  },
  {
    type: PlanStatus.HARD_ARCHIVED as const,
    icon: <DeleteOutlined style={{ fontSize: '48px', color: '#007AFF' }} />,
    label: 'Hard Archive',
    description:
      'Unavailable to new users; no upgrades or renewals; existing subscriptions end after the current billing cycle.'
  }
]

const ArchiveOption = ({
  selectedOption,
  setSelectedOption,
  disabled
}: {
  selectedOption: PlanStatus.SOFT_ARCHIVED | PlanStatus.HARD_ARCHIVED
  setSelectedOption: (
    option: PlanStatus.SOFT_ARCHIVED | PlanStatus.HARD_ARCHIVED
  ) => void
  disabled: boolean
}) => {
  return (
    <div className={`my-5 flex h-full justify-between gap-3`}>
      {ArchiveOptions.map((option) => (
        <div
          key={option.label}
          onClick={() => {
            if (!disabled) {
              setSelectedOption(option.type)
            }
          }}
          className={`border-1 flex h-56 w-64 shrink-0 grow-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} flex-col items-center justify-center rounded-md border-solid p-4 transition-all duration-300 ${selectedOption == option.type ? 'border-[#007AFF] bg-[#0591FF1A]' : 'border-[#D9D9D9] bg-[#FAFAFA]'}`}
        >
          <div className="h-2/6 flex-shrink-0 flex-grow-0">{option.icon}</div>
          <div
            className={`h-1/6 flex-shrink-0 flex-grow-0 ${selectedOption == option.type ? 'text-[#007AFF]' : 'text-[#000000E0]'}`}
          >
            {option.label}
          </div>
          <div className="h-3/6 flex-shrink-0 flex-grow-0 text-center text-[#00000073]">
            {option.description}
          </div>
        </div>
      ))}
    </div>
  )
}

const ArchiveModal = ({
  plan,
  closeModal,
  refreshCb
}: {
  plan: IPlan
  closeModal: () => void
  refreshCb: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<
    PlanStatus.SOFT_ARCHIVED | PlanStatus.HARD_ARCHIVED
  >(PlanStatus.SOFT_ARCHIVED)
  const onSubmit = async () => {
    setLoading(true)
    const [_, err] = await archivePlanReq(plan.id, selectedOption)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Plan archived')
    refreshCb()
    closeModal()
  }
  return (
    <Modal
      open={true}
      title="Archive options"
      width={580}
      onCancel={closeModal}
      footer={[
        <Button key="cancel" onClick={closeModal} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={onSubmit}
          loading={loading}
          disabled={loading}
        >
          Confirm
        </Button>
      ]}
    >
      <Row className="mt-4 h-6">
        <Col span={6} className="text-gray-500">
          Plan Name
        </Col>
        <Col span={18}>
          <LongTextPopover text={plan.planName} />
        </Col>
      </Row>
      <Row className="h-6">
        <Col span={6} className="text-gray-500">
          Plan Description
        </Col>
        <Col span={18}>
          <LongTextPopover text={plan.description} />
        </Col>
      </Row>
      <Row className="h-6">
        <Col span={6} className="text-gray-500">
          Plan Price
        </Col>
        <Col span={18}>{formatPlanPrice(plan)}</Col>
      </Row>
      <ArchiveOption
        selectedOption={selectedOption}
        disabled={loading}
        setSelectedOption={setSelectedOption}
      />
    </Modal>
  )
}
