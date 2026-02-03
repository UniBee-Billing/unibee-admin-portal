import { SUBSCRIPTION_STATUS } from '@/constants'
import {
  formatDate,
  formatPlanInterval,
  initializeFilters,
  showAmount
} from '@/helpers'
import { usePagination } from '@/hooks'
import { exportDataReq, getSublist } from '@/requests'
import '@/shared.css'
import './list.css'
import {
  ExportOutlined,
  ImportOutlined,
  LoadingOutlined,
  MoreOutlined,
  ProfileOutlined,
  SyncOutlined,
  DownOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Dropdown,
  Form,
  FormInstance,
  Input,
  MenuProps,
  Pagination,
  Row,
  Select,
  Spin,
  Tooltip,
  message,
  Tag
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { Currency } from 'dinero.js'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  IPlan,
  ISubscriptionType,
  PlanStatus,
  PlanType,
  SubscriptionStatus,
  SubscriptionWrapper,
  TImportDataType
} from '../../shared.types'
import { useAppConfigStore, usePlanListStore } from '../../stores'
import ImportModal from '../shared/dataImportModal'
import LongTextPopover from '../ui/longTextPopover'
import { SubscriptionStatusTag } from '../ui/statusTag'
import ResponsiveTable from '../table/responsiveTable'
import CopyToClipboard from '../ui/copyToClipboard'

const BASE_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const SUB_STATUS_FILTER = Object.entries(SUBSCRIPTION_STATUS)
  .map(([statusNumber, { label }]) => ({
    text: label,
    value: Number(statusNumber)
  }))
  .filter(({ value }) => value != SubscriptionStatus.INITIATING) // INITIATING status is used as a placeholder in this component when user has no active subscription, no need to show it in filter.
  .sort((a, b) => (a.value < b.value ? -1 : 1))

const PLAN_TYPE_FILTER = [
  { text: 'Main Plan', value: PlanType.MAIN },
  { text: 'One-time Payment', value: PlanType.ONE_TIME_ADD_ON }
]

type TFilters = {
  status: number[] | null
  planIds: number[] | null
  internalPlanNameIds: number[] | null
  planType: number[] | null
  currency?: string | null
}

const Index = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const appConfigStore = useAppConfigStore()
  const [form] = Form.useForm()
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [subList, setSubList] = useState<ISubscriptionType[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState<
    TImportDataType | false
  >(false) // false: modal is close, other values will trigger it open. TImportDataType has 2 values in this component: ActiveSubscriptionImport | HistorySubscriptionImport

  // Use global plan list store
  const {
    planOptions: globalPlanOptions,
    internalPlanNameOptions: globalInternalPlanNameOptions,
    planTypeToIds: globalPlanTypeToIds,
    loading: loadingPlans,
    fetchAllPlans
  } = usePlanListStore()

  const [filters, setFilters] = useState<TFilters>({
    ...initializeFilters('status', Number, SubscriptionStatus),
    planIds: null,
    internalPlanNameIds: null,
    planType: null
  } as TFilters)
  const planFilterRef = useRef<{ value: number; text: string }[]>([])
  const internalPlanNameFilterRef = useRef<{ value: number; text: string }[]>([])
  const planTypeToIdsRef = useRef<{ [key: number]: number[] }>({})

  // Combine planIds and planType using INTERSECTION, then UNION with internalPlanNameIds
  const getBackendFilters = () => {
    const { planIds, internalPlanNameIds, planType, ...restFilters } = filters

    // Build candidate lists for intersection (planIds and planType)
    const intersectionLists: number[][] = []

    if (planIds != null && planIds.length > 0) {
      intersectionLists.push(planIds)
    }

    if (planType != null && planType.length > 0) {
      const typeIds: number[] = []
      planType.forEach((type) => {
        const planIdsForType = planTypeToIdsRef.current[type] || []
        planIdsForType.forEach((id) => typeIds.push(id))
      })
      intersectionLists.push(typeIds)
    }

    // Compute intersection of planIds and planType
    let intersectionResult: number[] | null = null
    if (intersectionLists.length > 0) {
      intersectionResult = intersectionLists[0].slice()
      for (let i = 1; i < intersectionLists.length; i++) {
        const setB = new Set(intersectionLists[i])
        intersectionResult = intersectionResult.filter((id) => setB.has(id))
        if (intersectionResult.length === 0) break
      }
    }

    // Now combine with internalPlanNameIds using UNION (OR)
    let finalPlanIds: number[] | null = null

    if (intersectionResult != null && intersectionResult.length > 0) {
      finalPlanIds = intersectionResult
    }

    if (internalPlanNameIds != null && internalPlanNameIds.length > 0) {
      if (finalPlanIds == null) {
        // Only internalPlanNameIds is set
        finalPlanIds = internalPlanNameIds
      } else {
        // Union: combine both sets and remove duplicates
        const unionSet = new Set([...finalPlanIds, ...internalPlanNameIds])
        finalPlanIds = Array.from(unionSet)
      }
    }

    // If no filters provided that affect planIds, return null
    if (finalPlanIds == null) {
      return { ...restFilters, planIds: null as number[] | null }
    }

    // If result is empty array, return it to indicate no results
    return { ...restFilters, planIds: finalPlanIds }
  }

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    const backendFilters = getBackendFilters()
    // If intersection of plan-related filters results in empty set, there is nothing to export
    if (Array.isArray(backendFilters.planIds) && backendFilters.planIds.length === 0) {
      message.info('No data matches current filters.')
      return
    }
    payload = { ...payload, ...backendFilters }

    setExporting(true)
    const [_, err] = await exportDataReq({
      task: 'SubscriptionExport',
      payload
    })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'Subscription list is being exported, please check task list for progress.'
    )
    appConfigStore.setTaskListOpen(true)
  }

  const extraActions: { [key: string]: () => void } = {
    exportData: exportData,
    importActiveSub: () => setImportModalOpen('ActiveSubscriptionImport'),
    importSubHistory: () => setImportModalOpen('HistorySubscriptionImport')
  }

  const extraButtons = [
    {
      key: 'importActiveSub',
      label: 'Import active subscription',
    },
    {
      key: 'importSubHistory',
      label: 'Import subscription history',
    }
  ]
  const onMenuClick: MenuProps['onClick'] = (e) => {
    extraActions[e.key]()
  }

  const getColumns = (): ColumnsType<ISubscriptionType> => [
    {
      title: 'Sub Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (id) => (
        <div className="flex items-center gap-1">
          <Tooltip title={id}>
            <div
              style={{
                width: '100px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {id}
            </div>
          </Tooltip>
          <CopyToClipboard content={id} />
        </div>
      )
    },
    {
      title: 'Plan Name',
      dataIndex: 'planName',
      key: 'planIds',
      width: 120,
      render: (_, sub) => (
        <div className="w-28 overflow-hidden whitespace-nowrap">
          {sub.plan?.planName != undefined && (
            <LongTextPopover
              text={sub.plan.planName}
              placement="topLeft"
              width="120px"
            />
          )}
          <div className="text-xs text-gray-400">
            {`${showAmount(sub.plan?.amount, sub.plan?.currency)}/${formatPlanInterval(sub.plan)}`}
          </div>
        </div>
      )
    },
    {
      title: 'Internal Plan Name',
      dataIndex: 'internalPlanName',
      key: 'internalPlanNameIds',
      width: 140,
      render: (_, sub) => (
        <div className="w-36 overflow-hidden whitespace-nowrap">
          {sub.plan?.internalName != undefined && (
            <LongTextPopover
              text={sub.plan.internalName}
              placement="topLeft"
              width="140px"
            />
          )}
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 160,
      render: (_, sub) =>
        sub.plan?.description != undefined && (
          <LongTextPopover
            text={sub.plan.description}
            placement="topLeft"
            width="160px"
          />
        )
    },
    {
      title: 'Plan Type',
      dataIndex: 'planType',
      key: 'planType',
      width: 160,
      render: (_, sub) => (
        <span className="whitespace-nowrap">
          {sub.plan?.type === PlanType.ONE_TIME_ADD_ON ? 'One-time Payment' : 'Main Plan'}
        </span>
      )
    },
    /* {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt, s) =>
        `${showAmount(amt, s.currency)}/${formatPlanInterval(s.plan)}`
    },
    */
    /* {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (_, s) => (
        <span>{` ${showAmount(
          s.plan!.amount +
            (s.addons == null
              ? 0
              : s.addons!.reduce(
                  // total subscription amount = plan amount + all addons(an array): amount * quantity
                  // this value might not be the value users are gonna pay on next billing cycle
                  // because, users might downgrade their plan.
                  (
                    sum,
                    { quantity, amount }: { quantity: number; amount: number } // destructure the quantity and amount from addon obj
                  ) => sum + quantity * amount,
                  0
                )),
          s.plan!.currency
        )}/${formatPlanInterval(s.plan)}
        `}</span>
      )
    }, */
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, sub) => SubscriptionStatusTag(sub.status)
    },
    {
      title: 'Start',
      dataIndex: 'currentPeriodStart',
      key: 'currentPeriodStart',
      render: (_, sub) => formatDate(sub.currentPeriodStart, true)
    },
    {
      title: 'End',
      dataIndex: 'currentPeriodEnd',
      key: 'currentPeriodEnd',
      render: (_, sub) => {
        // If trialEnd exists and is greater than currentPeriodEnd, show trialEnd (extended due date)
        const endDate =
          sub.trialEnd != 0 && sub.trialEnd > sub.currentPeriodEnd
            ? sub.trialEnd
            : sub.currentPeriodEnd
        return formatDate(endDate, true)
      }
    },
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (_, sub) => (
        <span>{`${sub.user != null ? sub.user.firstName + ' ' + sub.user.lastName : ''}`}</span>
      )
    },
    {
      title: 'Email',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (_, sub) =>
        sub.user != null ? (
          <div className="flex items-center gap-1">
            <span>{sub.user.email}</span>
            <CopyToClipboard content={sub.user.email} />
          </div>
        ) : null
    },
    {
      title: 'Actions',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="link"
          onClick={() => navigate(`/subscription/${record.subscriptionId}`)}
        >
          View Details
        </Button>
      )
    }
  ]

  const fetchData = async () => {
    const searchTerm = normalizeSearchTerms()
    if (null == searchTerm) {
      return
    }
    const backendFilters = getBackendFilters()
    // If planIds intersection is empty array, return empty result set directly
    if (Array.isArray(backendFilters.planIds) && backendFilters.planIds.length === 0) {
      setSubList([])
      setTotal(0)
      return
    }
    setLoading(true)
    const [res, err] = await getSublist(
      {
        page: page as number,
        count: pageSize,
        ...backendFilters,
        ...searchTerm
      },
      fetchData
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { subscriptions, total } = res
    if (subscriptions == null) {
      setSubList([])
      setTotal(0)
      return
    }

    const list: ISubscriptionType[] = subscriptions.map(
      (s: SubscriptionWrapper) => {
        return {
          ...s.subscription,
          plan: s.plan,
          addons:
            s.addons == null
              ? []
              : s.addons.map((a) => ({
                ...a.addonPlan,
                quantity: a.quantity
              })),
          user: s.user
        }
      }
    )
    setSubList(list)
    setTotal(total)
  }

  // Sync global plan store data to filter refs
  useEffect(() => {
    fetchAllPlans()
  }, [fetchAllPlans])

  useEffect(() => {
    if (globalPlanOptions.length === 0) return

    planFilterRef.current = globalPlanOptions
    internalPlanNameFilterRef.current = globalInternalPlanNameOptions
    planTypeToIdsRef.current = globalPlanTypeToIds

    // Initialize filters from URL params
    const planIds = searchParams.get('planIds')
    const internalPlanNameIds = searchParams.get('internalPlanNameIds')
    const planType = searchParams.get('planType')
    const newFilters = { ...filters }

    if (planIds != null && planFilterRef.current.length > 0) {
      const planIdsMap: { [key: number]: number } = {}
      planFilterRef.current.forEach((p) => (planIdsMap[p.value] = p.value))
      newFilters.planIds = initializeFilters('planIds', Number, planIdsMap).planIds
    }

    if (internalPlanNameIds != null && internalPlanNameFilterRef.current.length > 0) {
      const internalPlanNameIdsMap: { [key: number]: number } = {}
      internalPlanNameFilterRef.current.forEach((p) => (internalPlanNameIdsMap[p.value] = p.value))
      newFilters.internalPlanNameIds = initializeFilters('internalPlanNameIds', Number, internalPlanNameIdsMap).internalPlanNameIds
    }

    if (planType != null) {
      const planTypeMap: { [key: number]: number } = {}
      PLAN_TYPE_FILTER.forEach((p) => (planTypeMap[p.value] = p.value))
      newFilters.planType = initializeFilters('planType', Number, planTypeMap).planType
    }

    setFilters(newFilters)
  }, [globalPlanOptions, globalInternalPlanNameOptions, globalPlanTypeToIds])

  const onTableChange: TableProps<ISubscriptionType>['onChange'] = (
    pagination,
  ) => {
    const newPageSize = pagination.pageSize || PAGE_SIZE
    const newPage = pagination.current || 1
    
    // If pageSize changed, reset to page 1
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      onPageChangeNoParams(1, newPageSize)
      searchParams.set('page', '1')
    } else {
      onPageChangeNoParams(newPage, newPageSize)
      searchParams.set('page', String(newPage))
    }

    setSearchParams(searchParams)
  }

  const normalizeSearchTerms = () => {
    const searchTerm = JSON.parse(JSON.stringify(form.getFieldsValue()))

    // Handle searchKey separately to avoid being deleted by the cleanup logic
    const searchKey = form.getFieldValue('searchKey')
    if (searchKey && searchKey.trim() !== '') {
      searchTerm.searchKey = searchKey.trim()
    }

    // Save currency before cleanup
    const currency = form.getFieldValue('currency')
    const amountStart = form.getFieldValue('amountStart')
    const amountEnd = form.getFieldValue('amountEnd')

    // Clean up empty values (but preserve searchKey if it was set above)
    Object.keys(searchTerm).forEach(
      (k) =>
        k !== 'searchKey' && // Don't delete searchKey field
        (searchTerm[k] == undefined ||
          (typeof searchTerm[k] == 'string' && searchTerm[k].trim() == '')) &&
        delete searchTerm[k]
    )

    const start = form.getFieldValue('createTimeStart')
    const end = form.getFieldValue('createTimeEnd')
    if (start != null) {
      searchTerm.createTimeStart = start.hour(0).minute(0).second(0).unix()
    }
    if (end != null) {
      searchTerm.createTimeEnd = end.hour(23).minute(59).second(59).unix()
    }

    // Handle currency separately - can be used independently of amount
    if (currency) {
      searchTerm.currency = currency
    }

    // Handle amount filtering
    const hasAmountFilter = (amountStart != null && amountStart !== '') || (amountEnd != null && amountEnd !== '')
    
    if (hasAmountFilter && currency) {
      // Restore currency for amount calculation
      let amtFrom = amountStart
      let amtTo = amountEnd
      
      if (amtFrom != '' && amtFrom != null) {
        amtFrom =
          Number(amtFrom) *
          appConfigStore.currency[currency as Currency]!.Scale
        if (isNaN(amtFrom) || amtFrom < 0) {
          message.error('Invalid amount-from value.')
          return null
        }
      }
      if (amtTo != '' && amtTo != null) {
        amtTo =
          Number(amtTo) *
          appConfigStore.currency[currency as Currency]!.Scale
        if (isNaN(amtTo) || amtTo < 0) {
          message.error('Invalid amount-to value')
          return null
        }
      }

      if (
        typeof amtFrom == 'number' &&
        typeof amtTo == 'number' &&
        amtFrom > amtTo
      ) {
        message.error('Amount-from must be less than or equal to amount-to')
        return null
      }
      searchTerm.amountStart = amtFrom
      searchTerm.amountEnd = amtTo
    }

    return searchTerm
  }

  const clearFilters = () => setFilters({ status: null, planIds: null, internalPlanNameIds: null, planType: null })

  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, filters])

  // Sync filters to URL params
  useEffect(() => {
    if (filters.planIds == null) {
      searchParams.delete('planIds')
    } else {
      searchParams.set('planIds', filters.planIds.join('-'))
    }

    if (filters.internalPlanNameIds == null) {
      searchParams.delete('internalPlanNameIds')
    } else {
      searchParams.set('internalPlanNameIds', filters.internalPlanNameIds.join('-'))
    }

    if (filters.status == null) {
      searchParams.delete('status')
    } else {
      searchParams.set('status', filters.status.join('-'))
    }

    if (filters.planType == null) {
      searchParams.delete('planType')
    } else {
      searchParams.set('planType', filters.planType.join('-'))
    }

    setSearchParams(searchParams, { replace: true })
  }, [filters])

  // Sync filters to form fields
  useEffect(() => {
    form.setFieldsValue({
      planIds: filters.planIds,
      internalPlanNameIds: filters.internalPlanNameIds,
      status: filters.status,
      planType: filters.planType
    })
  }, [filters])

  return (
    <div className="bg-gray-50 min-h-screen">
      {importModalOpen !== false && (
        <ImportModal
          closeModal={() => setImportModalOpen(false)}
          importType={importModalOpen}
        />
      )}
      
      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold mb-6">Subscriptions</h1>

        <Search
          form={form}
          goSearch={goSearch}
          searching={loading || loadingPlans}
          exporting={exporting}
          onPageChange={onPageChange}
          clearFilters={clearFilters}
          planFilterOptions={globalPlanOptions}
          internalPlanNameFilterOptions={globalInternalPlanNameOptions}
          updateFilters={setFilters}
          page={page}
        />

        {/* Records Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Records</h2>
              <div className="flex items-center gap-3">
                <Button
                  icon={<SyncOutlined />}
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center"
                >
                  Refresh
                </Button>
                <Dropdown menu={{ items: extraButtons, onClick: onMenuClick }}>
                  <Button className="flex items-center">
                    Import <DownOutlined />
                  </Button>
                </Dropdown>
                <Button
                  icon={<ExportOutlined />}
                  onClick={exportData}
                  loading={exporting}
                  disabled={loading || exporting}
                  className="flex items-center"
                >
                  Export
                </Button>
              </div>
            </div>
          </div>

          {loadingPlans ? (
            <Spin
              indicator={<LoadingOutlined spin />}
              size="large"
              style={{
                width: '100%',
                height: '320px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          ) : (
            <ResponsiveTable
              columns={getColumns()}
              dataSource={subList}
              rowKey={'id'}
              pagination={{
                current: page + 1,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                locale: { items_per_page: '' },
                disabled: loading,
                className: 'subscription-pagination',
              }}
              onChange={onTableChange}
              loading={{
                spinning: loading,
                indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
              }}
              scroll={{ x: 1400 }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Index

const Search = ({
  form,
  searching,
  exporting,
  goSearch,
  onPageChange,
  clearFilters,
  planFilterOptions,
  internalPlanNameFilterOptions,
  updateFilters,
  page
}: {
  form: FormInstance<unknown>
  searching: boolean
  exporting: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  clearFilters: () => void
  planFilterOptions: { value: number; text: string }[]
  internalPlanNameFilterOptions: { value: number; text: string }[]
  updateFilters: (filters: TFilters) => void
  page: number
}) => {
  const appConfigStore = useAppConfigStore()
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    clearFilters()
    setSearchText('')
  }

  const handleSearch = (overrideSearchText?: string) => {
    const value = overrideSearchText !== undefined ? overrideSearchText : searchText
    // Update form with search text
    if (value && value.trim() !== '') {
      form.setFieldValue('searchKey', value.trim())
    } else {
      form.setFieldValue('searchKey', undefined)
    }
    // Reset to page 1 when searching
    if (page === 0) {
      goSearch()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  // Get active filter count and labels
  const getActiveFilters = () => {
    const activeFilters: { key: string; label: string; value: any; type: string }[] = []
    
    const filters = form.getFieldsValue(['status', 'planIds', 'internalPlanNameIds', 'planType'])
    
    // Status filters
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((status: number) => {
        const statusLabel = SUB_STATUS_FILTER.find(s => s.value === status)?.text
        if (statusLabel) {
          activeFilters.push({ key: `status-${status}`, label: statusLabel, value: status, type: 'status' })
        }
      })
    }
    
    // Plan Name filters
    if (filters.planIds && filters.planIds.length > 0) {
      filters.planIds.forEach((planId: number) => {
        const planLabel = planFilterOptions.find(p => p.value === planId)?.text
        if (planLabel) {
          const shortLabel = planLabel.length > 20 ? planLabel.substring(0, 20) + '...' : planLabel
          activeFilters.push({ key: `planIds-${planId}`, label: shortLabel, value: planId, type: 'plan' })
        }
      })
    }
    
    // Internal Plan Name filters
    if (filters.internalPlanNameIds && filters.internalPlanNameIds.length > 0) {
      filters.internalPlanNameIds.forEach((planId: number) => {
        const planLabel = internalPlanNameFilterOptions.find(p => p.value === planId)?.text
        if (planLabel) {
          const shortLabel = planLabel.length > 20 ? planLabel.substring(0, 20) + '...' : planLabel
          activeFilters.push({ key: `internalPlanNameIds-${planId}`, label: `${shortLabel} (Internal)`, value: planId, type: 'internalPlan' })
        }
      })
    }
    
    // Plan Type filters
    if (filters.planType && filters.planType.length > 0) {
      filters.planType.forEach((type: number) => {
        const typeLabel = PLAN_TYPE_FILTER.find(t => t.value === type)?.text
        if (typeLabel) {
          activeFilters.push({ key: `planType-${type}`, label: typeLabel, value: type, type: 'planType' })
        }
      })
    }

    // Date range filters
    const startDate = form.getFieldValue('createTimeStart')
    const endDate = form.getFieldValue('createTimeEnd')
    if (startDate || endDate) {
      const startStr = startDate ? startDate.format('MMM DD') : ''
      const endStr = endDate ? endDate.format('MMM DD') : ''
      const startYear = startDate ? startDate.year() : null
      const endYear = endDate ? endDate.year() : null
      
      // Check if dates span different years
      const isYearSpanning = startYear != null && endYear != null && startYear !== endYear
      
      let dateLabel = ''
      if (startStr && endStr) {
        if (isYearSpanning) {
          dateLabel = `${startDate.format('MMM DD, YYYY')} ~ ${endDate.format('MMM DD, YYYY')}`
        } else {
          dateLabel = `${startStr} ~ ${endStr}`
        }
      } else if (startStr) {
        dateLabel = `From ${startStr}${startYear && endYear === null ? `, ${startYear}` : ''}`
      } else if (endStr) {
        dateLabel = `Until ${endStr}${endYear && startYear === null ? `, ${endYear}` : ''}`
      }
      
      if (dateLabel) {
        activeFilters.push({ key: 'dateRange', label: dateLabel, value: 'dateRange', type: 'date' })
      }
    }

    // Amount filters
    const amountStart = form.getFieldValue('amountStart')
    const amountEnd = form.getFieldValue('amountEnd')
    const currency = form.getFieldValue('currency')
    
    // Check if there are amount values
    const hasAmountValues = (amountStart && amountStart.trim() !== '') || (amountEnd && amountEnd.trim() !== '')
    
    if (hasAmountValues) {
      let amountLabel = ''
      if (amountStart && amountStart.trim() !== '' && amountEnd && amountEnd.trim() !== '') {
        amountLabel = `${amountStart}~${amountEnd} ${currency || ''}`
      } else if (amountStart && amountStart.trim() !== '') {
        amountLabel = `From ${amountStart} ${currency || ''}`
      } else if (amountEnd && amountEnd.trim() !== '') {
        amountLabel = `To ${amountEnd} ${currency || ''}`
      }
      if (amountLabel) {
        activeFilters.push({ key: 'amountRange', label: amountLabel, value: 'amountRange', type: 'amount' })
      }
    } else if (currency) {
      // Show currency as a standalone filter when no amount is specified
      activeFilters.push({ key: 'currency', label: currency, value: currency, type: 'currency' })
    }
    
    return activeFilters
  }

  const removeFilter = (filterKey: string) => {
    if (filterKey.startsWith('status-')) {
      const status = Number(filterKey.replace('status-', ''))
      const currentStatus = form.getFieldValue('status') || []
      const newStatus = currentStatus.filter((s: number) => s !== status)
      form.setFieldValue('status', newStatus.length > 0 ? newStatus : undefined)
      updateFilters({ ...form.getFieldsValue(['status', 'planIds', 'internalPlanNameIds', 'planType']) })
    } else if (filterKey.startsWith('planIds-')) {
      const planId = Number(filterKey.replace('planIds-', ''))
      const currentPlanIds = form.getFieldValue('planIds') || []
      const newPlanIds = currentPlanIds.filter((p: number) => p !== planId)
      form.setFieldValue('planIds', newPlanIds.length > 0 ? newPlanIds : undefined)
      updateFilters({ ...form.getFieldsValue(['status', 'planIds', 'internalPlanNameIds', 'planType']) })
    } else if (filterKey.startsWith('internalPlanNameIds-')) {
      const planId = Number(filterKey.replace('internalPlanNameIds-', ''))
      const currentPlanIds = form.getFieldValue('internalPlanNameIds') || []
      const newPlanIds = currentPlanIds.filter((p: number) => p !== planId)
      form.setFieldValue('internalPlanNameIds', newPlanIds.length > 0 ? newPlanIds : undefined)
      updateFilters({ ...form.getFieldsValue(['status', 'planIds', 'internalPlanNameIds', 'planType']) })
    } else if (filterKey.startsWith('planType-')) {
      const type = Number(filterKey.replace('planType-', ''))
      const currentTypes = form.getFieldValue('planType') || []
      const newTypes = currentTypes.filter((t: number) => t !== type)
      form.setFieldValue('planType', newTypes.length > 0 ? newTypes : undefined)
      updateFilters({ ...form.getFieldsValue(['status', 'planIds', 'internalPlanNameIds', 'planType']) })
    } else if (filterKey === 'dateRange') {
      form.setFieldsValue({ createTimeStart: undefined, createTimeEnd: undefined })
    } else if (filterKey === 'amountRange') {
      form.setFieldsValue({ amountStart: undefined, amountEnd: undefined, currency: undefined })
    } else if (filterKey === 'currency') {
      form.setFieldValue('currency', undefined)
    }
    // Trigger refetch
    if (page === 0) {
      goSearch()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  const activeFilters = getActiveFilters()
  const filterCount = activeFilters.length

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" style={{ maxWidth: '400px', flex: 1 }}>
          <Input
            placeholder="Search Subscription ID or Email"
            value={searchText}
            onChange={(e) => {
              const next = e.target.value
              setSearchText(next)
              const isClearClick =
                (e as any).nativeEvent?.type === 'click' || (e as any).type === 'click'
              if (isClearClick && next === '') {
                handleSearch('')
              }
            }}
            onPressEnter={() => handleSearch()}
            size="large"
            allowClear
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => handleSearch()}
            size="large"
            disabled={searching || exporting}
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
            <span style={{ marginRight: filterCount > 0 ? '8px' : 0 }}>Filter</span>
            {filterCount > 0 && (
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
                {filterCount}
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
                    <Form.Item label="Plan Name" name="planIds" style={{ marginBottom: '20px' }}>
                      <Select
                        placeholder="Choose a Plan Name"
                        allowClear
                        mode="multiple"
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={planFilterOptions.map(opt => ({ label: opt.text, value: opt.value }))}
                      />
                    </Form.Item>

                    {/* Internal Plan Name */}
                    <Form.Item label="Internal Plan Name" name="internalPlanNameIds" style={{ marginBottom: '20px' }}>
                      <Select
                        placeholder="Choose an Internal Plan Name"
                        allowClear
                        mode="multiple"
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={internalPlanNameFilterOptions.map(opt => ({ label: opt.text, value: opt.value }))}
                      />
                    </Form.Item>

                    {/* Status */}
                    <Form.Item label="Status" name="status" style={{ marginBottom: '20px' }}>
                      <Select
                        placeholder="Choose a Status"
                        allowClear
                        mode="multiple"
                        options={SUB_STATUS_FILTER.map(s => ({ label: s.text, value: s.value }))}
                      />
                    </Form.Item>

                    {/* Plan Type */}
                    <Form.Item label="Plan Type" name="planType" style={{ marginBottom: '20px' }}>
                      <Select
                        placeholder="Choose a Plan Type"
                        allowClear
                        mode="multiple"
                        options={PLAN_TYPE_FILTER.map(s => ({ label: s.text, value: s.value }))}
                      />
                    </Form.Item>

                    {/* Subscription created */}
                    <Form.Item label="Subscription created" style={{ marginBottom: '20px' }}>
                      <div className="flex items-center gap-2">
                        <Form.Item name="createTimeStart" noStyle>
                          <DatePicker
                            placeholder="From"
                            format="MM.DD.YYYY"
                            disabledDate={(d) => d.isAfter(new Date())}
                            style={{ flex: 1 }}
                          />
                        </Form.Item>
                        <span className="text-gray-400">-</span>
                        <Form.Item
                          name="createTimeEnd"
                          noStyle
                          rules={[
                            {
                              required: false,
                              message: 'Must be later than start date.'
                            },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const start = getFieldValue('createTimeStart')
                                if (null == start || value == null) {
                                  return Promise.resolve()
                                }
                                return value.isAfter(start) || value.isSame(start, 'day')
                                  ? Promise.resolve()
                                  : Promise.reject('Must be same or later than start date')
                              }
                            })
                          ]}
                        >
                          <DatePicker
                            placeholder="To"
                            format="MM.DD.YYYY"
                            disabledDate={(d) => d.isAfter(new Date())}
                            style={{ flex: 1 }}
                          />
                        </Form.Item>
                      </div>
                    </Form.Item>

                    {/* Amount */}
                    <Form.Item label="Amount" style={{ marginBottom: '20px' }}>
                      <Form.Item name="currency" noStyle>
                        <Select
                          style={{ width: '100%', marginBottom: '8px' }}
                          options={appConfigStore.supportCurrency.map((c) => ({
                            label: c.Currency,
                            value: c.Currency
                          }))}
                        />
                      </Form.Item>
                      <div className="flex items-center gap-2">
                        <Form.Item name="amountStart" noStyle>
                          <Input placeholder="From" style={{ flex: 1 }} />
                        </Form.Item>
                        <span className="text-gray-400">-</span>
                        <Form.Item name="amountEnd" noStyle>
                          <Input placeholder="To" style={{ flex: 1 }} />
                        </Form.Item>
                      </div>
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
                        onClick={() => {
                          // Read filter values from form
                          const formValues = form.getFieldsValue() as any
                          const newFilters: TFilters = {
                            status: formValues.status || null,
                            planIds: formValues.planIds || null,
                            internalPlanNameIds: formValues.internalPlanNameIds || null,
                            planType: formValues.planType || null
                          }
                          
                          // Reset to page 1 if not already there; rely on useEffect to fetch
                          if (page !== 0) {
                            onPageChange(1, PAGE_SIZE)
                          }
                          
                          // Update filters state
                          updateFilters(newFilters)
                          
                          // Update searchKey in form
                          if (searchText && searchText.trim() !== '') {
                            form.setFieldValue('searchKey', searchText.trim())
                          }
                          
                          setFilterDrawerOpen(false)
                        }}
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
      {activeFilters.length > 0 && (
        <div 
          className="mt-4 flex items-center gap-2 flex-wrap"
        >
          {activeFilters.map(filter => (
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
            onClick={() => {
              // Clear all filters including form fields
              form.resetFields()
              clearFilters()
              onPageChange(1, PAGE_SIZE)
            }}
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
  )
}
