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
  exportDataReq,
  TPlanListBody,
  getExportColumnListReq
} from '@/requests/index'
import { IPlan, PlanPublishStatus, PlanStatus, PlanType } from '@/shared.types'
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
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
  Tooltip,
  Radio,
  Checkbox
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import '../../shared.css'
import { useAppConfigStore } from '../../stores'

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
  internalName?: number[] | null
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
  const planFilterRef = useRef<{ value: number; text: string }[]>([])
  const internalNameFilterRef = useRef<{ value: number; text: string }[]>([])
  const [allPlans,setAllPlans] = useState<IPlan[]>([])
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false)

  // Note: We use 'planIds' parameter in URL for both plan name and internal name filters
  // since both are filtering by plan ID
  const planIdsParam = searchParams.get('planIds');
  const internalNameIdsParam = searchParams.get('internalNameIds');
  
  // Initialize filters from URL search params
  const typeFilters = initializeFilters('type', Number, PlanType);
  const statusFilters = initializeFilters('status', Number, PlanStatus);
  
  // Handle planIds parameter manually for planName
  let planIdFilter = null;
  if (planIdsParam) {
    try {
      planIdFilter = planIdsParam.split('-').map(Number).filter(id => !isNaN(id));
    } catch (_e) {
      // Silently handle parsing errors
    }
  }
  
  // Handle internalNameIds parameter manually for internalName
  let internalNameIdFilter = null;
  if (internalNameIdsParam) {
    try {
      internalNameIdFilter = internalNameIdsParam.split('-').map(Number).filter(id => !isNaN(id));
    } catch (_e) {
      // Silently handle parsing errors
    }
  }
  
  // Setup initial filters
  const [filters, setFilters] = useState<TFilters>({
    type: typeFilters.type,
    status: statusFilters.status,
    planName: planIdFilter,
    internalName: internalNameIdFilter
  });

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
    // onPageChange(1, 100)
    // navigate(`/plan/new?productId=${productId}`)
    navigate(`/plan/new?productId=${productId}`, {
      state: {
        from: location.pathname + location.search
      }
    })
  }

  const fetchAllPlans = async () => {
    const [planList, err] = await getPlanList({
      productIds: [productId],
      page: 0,
      count: 150,
      // status: [
      //   PlanStatus.ACTIVE,
      //   PlanStatus.SOFT_ARCHIVED,
      //   PlanStatus.HARD_ARCHIVED
      // ],
      type: filters.type
    }, fetchPlan)

    if (err == null && planList.plans) {
      const plans = planList.plans.map((p: IPlan) => ({
        ...p.plan,
        metricPlanLimits: p.metricPlanLimits
      }))
      setAllPlans(plans)
      
      // Update filter options
      planFilterRef.current = plans.map((plan: IPlan) => ({
        value: plan.id,
        text: plan.planName
      }))
      
      // Update internal name filter options - using the same approach as plan name
      internalNameFilterRef.current = plans
        .filter((plan: IPlan) => plan.internalName && plan.internalName.trim() !== '')
        .map((plan: IPlan) => ({
          value: plan.id,
          text: plan.internalName
        }));
    }
  }

  const fetchPlan = async () => {
    // 如果已经有所有计划的数据，直接从中过滤
    if (allPlans.length > 0) {
      let filteredPlans = allPlans;
      
      // 应用排序
      if (sortFilter.columnKey != null) {
        filteredPlans = [...filteredPlans].sort((a, b) => {
          const field = sortFilter.columnKey === 'planName' ? 'planName' : 'createTime';
          const order = sortFilter.order === 'descend' ? -1 : 1;
          return a[field] > b[field] ? order : -order;
        });
      }
      
      // 应用过滤
      if (filters.type?.length) {
        filteredPlans = filteredPlans.filter(plan => filters.type!.includes(plan.type));
      }
      if (filters.status?.length) {
        filteredPlans = filteredPlans.filter(plan => filters.status!.includes(plan.status));
      }
      
      // Apply filtering for planName and internalName independently
      const hasPlanNameFilter = filters.planName && filters.planName.length > 0;
      const hasInternalNameFilter = filters.internalName && filters.internalName.length > 0;
      
      // Apply planName filter if it exists
      if (hasPlanNameFilter) {
        filteredPlans = filteredPlans.filter((plan: IPlan) => 
          filters.planName!.includes(plan.id)
        );
      }
      
      // Apply internalName filter if it exists
      if (hasInternalNameFilter) {
        filteredPlans = filteredPlans.filter((plan: IPlan) => 
          filters.internalName!.includes(plan.id)
        );
      }
      
      // 应用分页
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      
      setTotal(filteredPlans.length);
      setPlan(filteredPlans.slice(start, end));
      return;
    }

    // 如果没有缓存数据，则从服务器获取
    const body: TPlanListBody = {
      productIds: [productId],
      page: page,
      count: PAGE_SIZE,
      type: filters.type
    }
    if (sortFilter.columnKey != null) {
      body.sortField =
        sortFilter.columnKey == 'planName' ? 'plan_name' : 'gmt_create'
      body.sortType = sortFilter.order == 'descend' ? 'desc' : 'asc'
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
    
    const planData = plans == null
      ? []
      : plans.map((p: IPlan) => ({
          ...p.plan,
          metricPlanLimits: p.metricPlanLimits
        }))
    
    // Apply filtering for planName and internalName independently
    let filteredPlans = planData;
    const hasPlanNameFilter = filters.planName && filters.planName.length > 0;
    const hasInternalNameFilter = filters.internalName && filters.internalName.length > 0;
    
    // Apply planName filter if it exists
    if (hasPlanNameFilter) {
      filteredPlans = filteredPlans.filter((plan: IPlan) => 
        filters.planName!.includes(plan.id)
      );
    }
    
    // Apply internalName filter if it exists
    if (hasInternalNameFilter) {
      filteredPlans = filteredPlans.filter((plan: IPlan) => 
        filters.internalName!.includes(plan.id)
      );
    }
    
    setPlan(filteredPlans)
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
      filters: planFilterRef.current,
      filteredValue: filters.planName,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase()),
      render: (planName) => (
        <div className="w-28 overflow-hidden whitespace-nowrap">
          <LongTextPopover text={planName} placement="topLeft" width="120px" />
        </div>
      )
    },
    {
      title: 'Internal Name',
      dataIndex: 'internalName',
      key: 'internalName',
      width: 120,
      filters: internalNameFilterRef.current,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase()),
      filteredValue: filters.internalName,
      render: (internalName) => (
        <div className="w-28 overflow-hidden whitespace-nowrap">
          <LongTextPopover text={internalName || ''} placement="topLeft" width="120px" />
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
    // Store the filters in state
    setFilters(filters as TFilters)

    // Update URL parameters based on filter selections
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.type == null
      ? searchParams.delete('type')
      : searchParams.set('type', filters.type.join('-'))
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.status == null
      ? searchParams.delete('status')
      : searchParams.set('status', filters.status.join('-'))
    
    // Handle planName and internalName filters separately
    if (!filters.planName || filters.planName.length === 0) {
      searchParams.delete('planIds');
    } else {
      searchParams.set('planIds', filters.planName.join('-'));
    }
    
    if (!filters.internalName || filters.internalName.length === 0) {
      searchParams.delete('internalNameIds');
    } else {
      searchParams.set('internalNameIds', filters.internalName.join('-'));
    }

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
      fetchAllPlans()
    }
  }, [isProductValid])

  useEffect(() => {
    if (isProductValid) {
      fetchPlan()
    }
  }, [filters, page, sortFilter])

  return (
    <>
      {archiveModalOpen != null && (
        <ArchiveModal
          plan={archiveModalOpen!}
          closeModal={() => toggleArchiveModal()}
          refreshCb={fetchPlan}
        />
      )}
      {exportModalOpen && (
        <ExportModal 
          closeModal={() => setExportModalOpen(false)}
          filters={filters}
          productId={productId}
          sortFilter={sortFilter}
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
          <div className="flex justify-between mb-4">
            <div></div>
            <Button
              type="primary"
              onClick={() => setExportModalOpen(true)}
              icon={<ExportOutlined />}
            >
              Export
            </Button>
          </div>
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

interface ExportModalProps {
  closeModal: () => void
  filters: TFilters
  productId: number
  sortFilter: Sorts
}

const ExportModal = ({
  closeModal,
  filters,
  productId,
  sortFilter
}: ExportModalProps) => {
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState<'filtered' | 'all'>('filtered')
  const [fileFormat, setFileFormat] = useState<'csv' | 'xlsx'>('csv')
  const appConfigStore = useAppConfigStore()
  const [columnLoading, setColumnLoading] = useState(true)
  const [columnOptions, setColumnOptions] = useState<{ label: string; value: string; checked: boolean }[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  
  // Fetch column options when component mounts
  useEffect(() => {
    const fetchColumnOptions = async () => {
      setColumnLoading(true)
      const [data, err] = await getExportColumnListReq('PlanExport')
      setColumnLoading(false)
      
      if (err != null) {
        message.error(err.message)
        return
      }
      
      if (data && data.columnHeaders) {
        // Convert columnHeaders object to array of options
        const options = Object.entries(data.columnHeaders).map(([key, value]) => ({
          label: value as string,
          value: key,
          checked: true
        }))
        
        setColumnOptions(options)
        // Select all fields by default
        setSelectedFields(options.map(opt => opt.value))
      }
    }
    
    fetchColumnOptions()
  }, [])

  const handleFieldChange = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, field])
    } else {
      setSelectedFields(prev => prev.filter(f => f !== field))
    }
  }

  const selectAllFields = () => {
    setSelectedFields(columnOptions.map(field => field.value))
  }

  const deselectAllFields = () => {
    setSelectedFields([])
  }

  const handleExport = async () => {
    try {
      if (selectedFields.length === 0) {
        message.error('Please select at least one field to export')
        return
      }

      setLoading(true)

      const payload: any = {
        productIds: [productId]
      }

      // Include filters if exporting filtered data
      if (exportType === 'filtered') {
        if (filters.type?.length) {
          payload.type = filters.type
        }
        if (filters.status?.length) {
          payload.status = filters.status
        }
        
        // Combine both planName and internalName filters into a single planIds array
        const combinedPlanIds = [
          ...(filters.planName || []),
          ...(filters.internalName || [])
        ];
        
        if (combinedPlanIds.length > 0) {
          payload.planIds = combinedPlanIds
        }

        // Include sort information if available
        if (sortFilter.columnKey != null) {
          payload.sortField = sortFilter.columnKey == 'planName' ? 'plan_name' : 'gmt_create'
          payload.sortType = sortFilter.order == 'descend' ? 'desc' : 'asc'
        }
      }

      // Call API to export data
      const [_, err] = await exportDataReq({
        task: 'PlanExport',
        payload: payload,
        format: fileFormat,
        exportColumns: selectedFields
      })
      
      if (err != null) {
        message.error(err.message)
        setLoading(false)
        return
      }
      
      message.success('Plan list is being exported, please check task list for progress.')
      appConfigStore.setTaskListOpen(true)
      closeModal()
    } catch (error: any) {
      message.error(error.message || 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      title="Export Plans"
      width={600}
      onCancel={closeModal}
      footer={[
        <Button key="cancel" onClick={closeModal} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          onClick={handleExport}
          loading={loading}
        >
          Confirm Export
        </Button>
      ]}
    >
      <div className="py-4">
        <div className="mb-4">
          <div className="mb-2 font-medium">Export Data</div>
          <Radio.Group
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
          >
            <Radio value="filtered">Current Filtered Results</Radio>
            <Radio value="all">All Plans</Radio>
          </Radio.Group>
        </div>

        <div className="mb-4">
          <div className="mb-2 font-medium">File Format</div>
          <Radio.Group
            value={fileFormat}
            onChange={(e) => setFileFormat(e.target.value)}
          >
            <Radio value="csv">CSV</Radio>
            <Radio value="xlsx">Excel</Radio>
          </Radio.Group>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">Select Fields to Export</div>
            <div>
              <Button size="small" onClick={selectAllFields} style={{ marginRight: '8px' }}>
                Select All
              </Button>
              <Button size="small" onClick={deselectAllFields}>
                Deselect All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border p-3 rounded">
            {columnLoading ? (
              <div className="col-span-2 flex justify-center items-center py-4">
                <LoadingOutlined style={{ fontSize: 24 }} />
              </div>
            ) : (
              columnOptions.map(field => (
                <div key={field.value} className="flex items-center">
                  <Checkbox
                    checked={selectedFields.includes(field.value)}
                    onChange={(e) => handleFieldChange(field.value, e.target.checked)}
                  >
                    {field.label}
                  </Checkbox>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          <p>The exported file will include only the selected fields.</p>
        </div>
      </div>
    </Modal>
  )
}
