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
import { useAppConfigStore, usePlanListStore } from '@/stores'
import {
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FilterOutlined,
  InboxOutlined,
  LoadingOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Result,
  Row,
  Select,
  Space,
  Tag,
  Tooltip
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { MenuProps } from 'antd'
import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import '../../shared.css'
import ResponsiveTable from '../table/responsiveTable'
import './planList.css'

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
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const { plans: globalPlans, fetchAllPlans: fetchGlobalPlans } = usePlanListStore()
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
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [form] = Form.useForm()
  const [pageSize, setPageSize] = useState(PAGE_SIZE)


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

  const fetchPlan = async (searchOverride?: string) => {
    const activeSearchQuery = typeof searchOverride === 'string' ? searchOverride : searchQuery

    // Combine planName and internalName filters into planIds for backend
    const planIds = [...(filters.planName || []), ...(filters.internalName || [])]

    const body: TPlanListBody = {
      productIds: [productId],
      page: page,
      count: pageSize,
      type: filters.type,
      status: filters.status,
      planIds: planIds.length > 0 ? planIds : undefined,
      searchKey: activeSearchQuery || undefined
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
    
    setPlan(planData)
  }

  const getActionMenuItems = (record: IPlan): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: `copy-${record.id}`,
        label: (
          <div className="plan-action-menu-item">
            <CopyOutlined />
            <span>Copy</span>
          </div>
        ),
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation()
          copyPlan(record.id)
        }
      }
    ]
    return items
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
      render: (type) => PLAN_TYPE[type as PlanType].label
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => PlanStatusTag(s as PlanStatus)
    },
    {
      title: 'Published',
      dataIndex: 'publishStatus',
      key: 'publishStatus',
      render: (publishStatus) => (
        <span
          className={`status-pill ${
            publishStatus == PlanPublishStatus.PUBLISHED
              ? 'status-pill--success'
              : 'status-pill--danger'
          }`}
        >
          {publishStatus == PlanPublishStatus.PUBLISHED ? (
            <CheckOutlined />
          ) : (
            <CloseOutlined />
          )}
        </span>
      )
    },
    {
      title: 'Allow Trial',
      dataIndex: 'trialDurationTime',
      key: 'trialDurationTime',
      render: (trialDurationTime) => (
        <span
          className={`status-pill ${
            trialDurationTime > 0 ? 'status-pill--success' : 'status-pill--danger'
          }`}
        >
          {trialDurationTime > 0 ? <CheckOutlined /> : <CloseOutlined />}
        </span>
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
      title: 'Actions',
      key: 'action',
      className: 'action-column',
      fixed: 'right',
      width: 160,
      render: (_, record) => {
        const disabledArchive =
          record.status == PlanStatus.SOFT_ARCHIVED ||
          record.status == PlanStatus.HARD_ARCHIVED
        return (
          <div className="plan-action-buttons">
            <Tooltip title="Edit">
              <Button
                type="text"
                disabled={copyingPlan}
                className="plan-action-btn plan-action-btn--edit"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  goToDetail(record.id)
                }}
              />
            </Tooltip>
            <Tooltip title="Archive">
              <Button
                type="text"
                className="plan-action-btn plan-action-btn--delete"
                disabled={disabledArchive}
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleArchiveModal(record)
                }}
              />
            </Tooltip>
            <Dropdown
              menu={{ items: getActionMenuItems(record) }}
              trigger={['click']}
              overlayClassName="plan-action-dropdown"
            >
              <Button
                type="text"
                className="plan-action-btn plan-action-btn--more"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>
        )
      }
    }
  ]

  const onTableChange: TableProps<IPlan>['onChange'] = (
    pagination,
    _filters,
    sorter
  ) => {
    // Handle pagination
    const newPageSize = pagination.pageSize || PAGE_SIZE
    const newPage = pagination.current || 1
    
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      onPageChange(1, newPageSize)
    } else {
      onPageChange(newPage, newPageSize)
    }

    if (Array.isArray(sorter)) {
      return // Handle array case if needed
    }

    setSortFilter(sorter as Sorts)
    if (sorter.field != undefined) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('sortby', sorter.field as string)
      newParams.set('sortorder', sorter.order as string)
      setSearchParams(newParams)
    } else {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('sortby')
      newParams.delete('sortorder')
      setSearchParams(newParams)
    }
  }

  // Sync form values when filters change
  useEffect(() => {
    form.setFieldsValue({
      type: filters.type || [],
      status: filters.status || [],
      planName: filters.planName || [],
      internalName: filters.internalName || []
    })
  }, [filters, form])

  useEffect(() => {
    if (isProductValid) {
      fetchPlan()
    }
  }, [isProductValid, productId, filters, page, pageSize, sortFilter, searchQuery])

  // Sync global plan store data to filter refs (for Plan Name and Internal Name filters)
  useEffect(() => {
    fetchGlobalPlans()
  }, [fetchGlobalPlans])

  useEffect(() => {
    if (globalPlans.length === 0) return

    // Filter plans by current productId
    const productPlans = globalPlans.filter((p) => p.plan?.productId === productId)

    // Update filter options with product-specific plans (format: #id planName)
    planFilterRef.current = productPlans.map((p) => ({
      value: p.plan?.id as number,
      text: `#${p.plan?.id} ${p.plan?.planName}`
    })).filter((p) => p.value && p.text)

    internalNameFilterRef.current = productPlans
      .filter((p) => p.plan?.internalName && p.plan?.internalName.trim() !== '')
      .map((p) => ({
        value: p.plan?.id as number,
        text: `#${p.plan?.id} ${p.plan?.internalName}`
      }))
      .filter((p) => p.value && p.text)
  }, [globalPlans, productId])

  const syncFiltersToUrl = (nextFilters: TFilters) => {
    const newParams = new URLSearchParams(searchParams)
    if (nextFilters.type == null || nextFilters.type.length === 0) {
      newParams.delete('type')
    } else {
      newParams.set('type', nextFilters.type.join('-'))
    }
    if (nextFilters.status == null || nextFilters.status.length === 0) {
      newParams.delete('status')
    } else {
      newParams.set('status', nextFilters.status.join('-'))
    }
    if (nextFilters.planName == null || nextFilters.planName.length === 0) {
      newParams.delete('planIds')
    } else {
      newParams.set('planIds', nextFilters.planName.join('-'))
    }
    if (nextFilters.internalName == null || nextFilters.internalName.length === 0) {
      newParams.delete('internalNameIds')
    } else {
      newParams.set('internalNameIds', nextFilters.internalName.join('-'))
    }
    setSearchParams(newParams)
  }

  // Get active filters count
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.type && filters.type.length > 0) count += filters.type.length
    if (filters.status && filters.status.length > 0) count += filters.status.length
    if (filters.planName && filters.planName.length > 0) count += filters.planName.length
    if (filters.internalName && filters.internalName.length > 0) count += filters.internalName.length
    return count
  }

  // Get active filters for display
  const getActiveFilters = () => {
    const activeFilters: { key: string; label: string; value: any; type: string }[] = []
    
    // Type filters
    if (filters.type && filters.type.length > 0) {
      filters.type.forEach((type: PlanType) => {
        const typeLabel = PLAN_TYPE_FILTER.find(t => t.value === type)?.text
        if (typeLabel) {
          activeFilters.push({ key: `type-${type}`, label: typeLabel, value: type, type: 'type' })
        }
      })
    }
    
    // Status filters
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((status: PlanStatus) => {
        const statusLabel = PLAN_STATUS_FILTER.find(s => s.value === status)?.text
        if (statusLabel) {
          activeFilters.push({ key: `status-${status}`, label: statusLabel, value: status, type: 'status' })
        }
      })
    }
    
    // Plan Name filters
    if (filters.planName && filters.planName.length > 0) {
      filters.planName.forEach((planId: number) => {
        const planOption = planFilterRef.current.find(p => p.value === planId)
        if (planOption) {
          activeFilters.push({ key: `planName-${planId}`, label: planOption.text, value: planId, type: 'planName' })
        }
      })
    }
    
    // Internal Name filters
    if (filters.internalName && filters.internalName.length > 0) {
      filters.internalName.forEach((planId: number) => {
        const planOption = internalNameFilterRef.current.find(p => p.value === planId)
        if (planOption) {
          activeFilters.push({ key: `internalName-${planId}`, label: planOption.text, value: planId, type: 'internalName' })
        }
      })
    }
    
    return activeFilters
  }

  // Remove a specific filter
  const removeFilter = (filterKey: string) => {
    let newFilters = { ...filters }
    if (filterKey.startsWith('type-')) {
      const type = Number(filterKey.replace('type-', '')) as PlanType
      const newType = filters.type?.filter(t => t !== type) || []
      newFilters.type = newType.length > 0 ? newType : null
    } else if (filterKey.startsWith('status-')) {
      const status = Number(filterKey.replace('status-', '')) as PlanStatus
      const newStatus = filters.status?.filter(s => s !== status) || []
      newFilters.status = newStatus.length > 0 ? newStatus : null
    } else if (filterKey.startsWith('planName-')) {
      const planId = Number(filterKey.replace('planName-', ''))
      const newPlanName = filters.planName?.filter(id => id !== planId) || []
      newFilters.planName = newPlanName.length > 0 ? newPlanName : null
    } else if (filterKey.startsWith('internalName-')) {
      const planId = Number(filterKey.replace('internalName-', ''))
      const newInternalName = filters.internalName?.filter(id => id !== planId) || []
      newFilters.internalName = newInternalName.length > 0 ? newInternalName : null
    }
    // Update form values
    form.setFieldsValue({
      type: newFilters.type || [],
      status: newFilters.status || [],
      planName: newFilters.planName || [],
      internalName: newFilters.internalName || []
    })
    
    // Update page state without triggering URL update
    onPageChangeNoParams(1, pageSize)
    
    // Sync filters to URL (single setSearchParams call)
    syncFiltersToUrl(newFilters)
    
    // Update filters state - useEffect will trigger fetchPlan
    setFilters(newFilters)
  }

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters: TFilters = {
      type: null,
      status: null,
      planName: null,
      internalName: null
    }
    form.resetFields()
    
    // Update page state without triggering URL update
    onPageChangeNoParams(1, pageSize)
    
    // Sync filters to URL (single setSearchParams call)
    syncFiltersToUrl(clearedFilters)
    
    // Update filters state - useEffect will trigger fetchPlan
    setFilters(clearedFilters)
  }

  // Apply filters from form
  const applyFilters = () => {
    const formValues = form.getFieldsValue()
    const newFilters: TFilters = {
      type: formValues.type && formValues.type.length > 0 ? formValues.type : null,
      status: formValues.status && formValues.status.length > 0 ? formValues.status : null,
      planName: formValues.planName && formValues.planName.length > 0 ? formValues.planName : null,
      internalName: formValues.internalName && formValues.internalName.length > 0 ? formValues.internalName : null
    }
    setFilterDrawerOpen(false)
    
    // Update page state without triggering URL update
    onPageChangeNoParams(1, pageSize)
    
    // Sync filters to URL (single setSearchParams call)
    syncFiltersToUrl(newFilters)
    
    // Update filters state - useEffect will trigger fetchPlan
    setFilters(newFilters)
  }


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
        <div className="bg-gray-50 min-h-screen">
          <div className="p-6">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2" style={{ maxWidth: '450px', flex: 1 }}>
                  <Input
                    placeholder="Search by Plan Name, Description"
                    value={searchInput}
                    onChange={(e) => {
                      const next = e.target.value
                      setSearchInput(next)
                      const isClearClick =
                        (e as any).nativeEvent?.type === 'click' ||
                        (e as any).type === 'click'
                      if (isClearClick && next === '') {
                        if (searchQuery !== '') {
                          setSearchQuery('')
                        }
                        if (page === 0) {
                          fetchPlan('')
                        } else {
                          onPageChange(1, pageSize)
                        }
                      }
                    }}
                    onPressEnter={() => {
                      const trimmed = searchInput.trim()
                      if (trimmed === searchQuery && page === 0) {
                        fetchPlan(trimmed)
                        return
                      }
                      setSearchQuery(trimmed)
                      if (page !== 0) {
                        onPageChange(1, pageSize)
                      } else {
                        fetchPlan(trimmed)
                      }
                    }}
                    size="large"
                    allowClear
                    style={{
                      flex: 1,
                      height: '48px',
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => {
                      const trimmed = searchInput.trim()
                      if (trimmed === searchQuery && page === 0) {
                        fetchPlan(trimmed)
                        return
                      }
                      setSearchQuery(trimmed)
                      if (page !== 0) {
                        onPageChange(1, pageSize)
                      } else {
                        fetchPlan(trimmed)
                      }
                    }}
                    size="large"
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  />
                </div>

                {/* Filter Button */}
                <div style={{ position: 'relative' }}>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                    size="large"
                    className="flex items-center"
                    style={{
                      borderRadius: '8px',
                      padding: '4px 16px',
                      height: '40px'
                    }}
                  >
                    <span style={{ marginRight: getActiveFilterCount() > 0 ? '8px' : 0 }}>Filter</span>
                    {getActiveFilterCount() > 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '20px',
                          height: '20px',
                          padding: '0 6px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#000'
                        }}
                      >
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </Button>

                  {/* Filter Panel - Floating */}
                  {filterDrawerOpen && (
                    <>
                      {/* Overlay */}
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 999
                        }}
                        onClick={() => setFilterDrawerOpen(false)}
                      />
                      
                      {/* Filter Panel */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          width: '400px',
                          zIndex: 1000
                        }}
                        className="bg-white rounded-lg shadow-xl border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-6">
                          <h3 className="text-lg font-semibold mb-6">Filters</h3>
                          <Form
                            form={form}
                            layout="vertical"
                          >
                            {/* Plan Name */}
                            <Form.Item label="Plan Name" name="planName" style={{ marginBottom: '20px' }}>
                              <Select
                                placeholder="Choose a Plan Name"
                                allowClear
                                mode="multiple"
                                showSearch
                                filterOption={(input, option) =>
                                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                }
                                options={planFilterRef.current.map(p => ({ label: p.text, value: p.value }))}
                              />
                            </Form.Item>

                            {/* Internal Name */}
                            <Form.Item label="Internal Name" name="internalName" style={{ marginBottom: '20px' }}>
                              <Select
                                placeholder="Choose a Internal Name"
                                allowClear
                                mode="multiple"
                                showSearch
                                filterOption={(input, option) =>
                                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                }
                                options={internalNameFilterRef.current.map(p => ({ label: p.text, value: p.value }))}
                              />
                            </Form.Item>

                            {/* Type */}
                            <Form.Item label="Type" name="type" style={{ marginBottom: '20px' }}>
                              <Select
                                placeholder="Choose a Type"
                                allowClear
                                mode="multiple"
                                showSearch
                                filterOption={(input, option) =>
                                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                }
                                options={PLAN_TYPE_FILTER.map(t => ({ label: t.text, value: t.value }))}
                              />
                            </Form.Item>

                            {/* Status */}
                            <Form.Item label="Status" name="status" style={{ marginBottom: '20px' }}>
                              <Select
                                placeholder="Choose a Status"
                                allowClear
                                mode="multiple"
                                showSearch
                                filterOption={(input, option) =>
                                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                }
                                options={PLAN_STATUS_FILTER.map(s => ({ label: s.text, value: s.value }))}
                              />
                            </Form.Item>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 mt-6">
                              <Button
                                onClick={() => setFilterDrawerOpen(false)}
                                size="large"
                              >
                                Close
                              </Button>
                              <Button
                                type="primary"
                                size="large"
                                onClick={applyFilters}
                              >
                                Save Filters
                              </Button>
                            </div>
                          </Form>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Active Filters Display - Below Search Bar */}
              {getActiveFilters().length > 0 && (
                <div 
                  className="mt-4 flex items-center gap-2 flex-wrap"
                >
                  {getActiveFilters().map(filter => (
                    <Tag
                      key={filter.key}
                      closable
                      onClose={() => removeFilter(filter.key)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '13px',
                        borderRadius: '16px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: '#f5f5f5',
                        display: 'inline-flex',
                        alignItems: 'center',
                        margin: 0,
                        marginBottom: '4px'
                      }}
                    >
                      {filter.label}
                    </Tag>
                  ))}
                  <span
                    onClick={clearAllFilters}
                    style={{
                      fontSize: '13px',
                      color: '#666',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      marginLeft: '4px'
                    }}
                  >
                    Clear all
                  </span>
                </div>
              )}
            </div>

            {/* Plan List Section */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Plan List</h2>
                  <div className="flex items-center gap-3">
                    <Button
                      icon={<SyncOutlined />}
                      onClick={() => fetchPlan()}
                      disabled={loading}
                      className="flex items-center"
                    >
                      Refresh
                    </Button>
                    <Button
                      icon={<ExportOutlined />}
                      onClick={() => setExportModalOpen(true)}
                      className="flex items-center"
                    >
                      Export
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={onNewPlan}
                      disabled={copyingPlan}
                      className="flex items-center"
                    >
                      Add Plan
                    </Button>
                  </div>
                </div>
              </div>

              <ResponsiveTable
                columns={columns.filter(c => !c.hidden)}
                dataSource={plan}
                rowKey={'id'}
                rowClassName="clickable-tbl-row"
                className="plan-table"
                pagination={{
                  current: page + 1,
                  pageSize: pageSize,
                  total: total,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                  locale: { items_per_page: '' },
                  disabled: loading,
                  className: 'plan-pagination'
                }}
                loading={{
                  spinning: loading,
                  indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
                }}
                onChange={onTableChange}
                scroll={{ x: 1400 }}
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
            </div>
          </div>
        </div>
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
        const options = Object.entries(data.columnHeaders).map(([key, value]) => ({
          label: value as string,
          value: key,
          checked: true
        }))
        
        setColumnOptions(options)
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

      const payload: Record<string, unknown> = {
        productIds: [productId]
      }

      if (exportType === 'filtered') {
        if (filters.type?.length) {
          payload.type = filters.type
        }
        if (filters.status?.length) {
          payload.status = filters.status
        }
        
        const combinedPlanIds = [
          ...(filters.planName || []),
          ...(filters.internalName || [])
        ];
        
        if (combinedPlanIds.length > 0) {
          payload.planIds = combinedPlanIds
        }

        if (sortFilter.columnKey != null) {
          payload.sortField = sortFilter.columnKey == 'planName' ? 'plan_name' : 'gmt_create'
          payload.sortType = sortFilter.order == 'descend' ? 'desc' : 'asc'
        }
      }

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
    } catch (error: unknown) {
      message.error((error as Error).message || 'Export failed')
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
