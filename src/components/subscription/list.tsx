import { SUBSCRIPTION_STATUS } from '@/constants'
import {
  formatDate,
  formatPlanInterval,
  initializeFilters,
  showAmount
} from '@/helpers'
import { usePagination } from '@/hooks'
import { exportDataReq, getPlanList, getSublist } from '@/requests'
import '@/shared.css'
import {
  ExportOutlined,
  ImportOutlined,
  LoadingOutlined,
  MoreOutlined,
  ProfileOutlined,
  SyncOutlined
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
  Space,
  Spin,
  Table,
  Tooltip,
  message
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { Currency } from 'dinero.js'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { useAppConfigStore } from '../../stores'
import ImportModal from '../shared/dataImportModal'
import LongTextPopover from '../ui/longTextPopover'
import { SubscriptionStatusTag } from '../ui/statusTag'

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
}

const Index = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const appConfigStore = useAppConfigStore()
  const [form] = Form.useForm()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [subList, setSubList] = useState<ISubscriptionType[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState<
    TImportDataType | false
  >(false) // false: modal is close, other values will trigger it open. TImportDataType has 2 values in this component: ActiveSubscriptionImport | HistorySubscriptionImport

  const [filters, setFilters] = useState<TFilters>({
    ...initializeFilters('status', Number, SubscriptionStatus),
    planIds: null, // when the page is loading, we don't know how many plans we have, so we set planIds to null, in fetchPlan call, we will initialize this filter.
    internalPlanNameIds: null,
    planType: null
  } as TFilters)
  const planFilterRef = useRef<{ value: number; text: string }[]>([])
  const internalPlanNameFilterRef = useRef<{ value: number; text: string }[]>([])
  const allPlansRef = useRef<IPlan[]>([]) // Store all plans data for planType filtering

  // Combine planIds and internalPlanNameIds into a single planIds array for API requests
  const buildApiFilters = (curFilters: TFilters) => {
    const { planIds, internalPlanNameIds, planType, ...restFilters } = curFilters
    let mergedPlanIds: number[] | null = null
    
    // Handle planIds filter
    if (planIds != null) {
      mergedPlanIds = [...planIds]
    }
    
    // Handle internalPlanNameIds filter
    if (internalPlanNameIds != null) {
      mergedPlanIds = mergedPlanIds == null ? [...internalPlanNameIds] : [...new Set([...mergedPlanIds, ...internalPlanNameIds])]
    }
    
    // Handle planType filter by converting to planIds
    if (planType != null && planType.length > 0) {
      const planTypeFilteredIds = allPlansRef.current
        .filter(p => p.plan && planType.includes(p.plan.type))
        .map(p => p.plan!.id)
      
      if (planTypeFilteredIds.length > 0) {
        mergedPlanIds = mergedPlanIds == null 
          ? planTypeFilteredIds 
          : mergedPlanIds.filter(id => planTypeFilteredIds.includes(id))
      } else {
        // If no plans match the planType filter, return empty array to get no results
        mergedPlanIds = []
      }
    }
    
    return {
      ...restFilters,
      ...(mergedPlanIds != null && mergedPlanIds.length > 0 ? { planIds: mergedPlanIds } : {})
    }
  }

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    payload = { ...payload, ...buildApiFilters(filters) }

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
      key: 'exportData',
      label: 'Export',
      icon: <ExportOutlined />
    },
    {
      key: 'importActiveSub',
      label: 'Import active subscription',
      icon: <ImportOutlined />
    },
    {
      key: 'importSubHistory',
      label: 'Import subscription history',
      icon: <ImportOutlined />
    }
    /* {
      key: 'downloadImportTemplate',
      label: 'Download import template',
      icon: <DownloadOutlined />
    } */
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
        <Tooltip title={id} overlayClassName="sub-tooltip-wrapper">
          <div
            style={{
              width: '100px',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            <a
              href={`${location.origin}${BASE_PATH}subscription/${id}`}
              onClick={(e) => {
                // Only navigate using react-router for left clicks without modifier keys
                if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                  e.preventDefault();
                  navigate(`/subscription/${id}`);
                }
              }}
            >
              {id}
            </a>
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Plan Name',
      dataIndex: 'planName',
      key: 'planIds',
      filters: planFilterRef.current,
      filteredValue: filters.planIds,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase()),
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
      filters: internalPlanNameFilterRef.current,
      filteredValue: filters.internalPlanNameIds,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase()),
      width: 140,
      // onFilter: (value, record) => record.plan?.id === value,
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
      filters: PLAN_TYPE_FILTER,
      filteredValue: filters.planType,
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
      render: (_, sub) => SubscriptionStatusTag(sub.status),
      filters: SUB_STATUS_FILTER,
      filteredValue: filters.status
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
      render: (_, sub) => formatDate(sub.currentPeriodEnd, true)
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
          <a href={`mailto:${sub.user.email}`}>{sub.user.email}</a>
        ) : null
    },
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
          <Dropdown menu={{ items: extraButtons, onClick: onMenuClick }}>
            <Button
              icon={<MoreOutlined />}
              size="small"
              style={{ marginLeft: '8px' }}
            ></Button>
          </Dropdown>
        </>
      ),
      key: 'action',
      width: 160,
      // fixed: 'right',
      render: (_) => (
        <Space
          size="small"
          className="invoice-action-btn-wrapper"
        // style={{ width: '170px' }}
        >
          <Tooltip title="Detail">
            <Button icon={<ProfileOutlined />} style={{ border: 'unset' }} />
          </Tooltip>
        </Space>
      )
    }
  ]

  const fetchData = async () => {
    const searchTerm = normalizeSearchTerms()
    if (null == searchTerm) {
      return
    }
    setLoading(true)
    const [res, err] = await getSublist(
      {
        page: page as number,
        count: PAGE_SIZE,
        ...buildApiFilters(filters),
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

  const fetchPlan = async () => {
    setLoadingPlans(true)
    const [planList, err] = await getPlanList(
      {
        // type: [PlanType.MAIN, PlanType.ONE_TIME_ADD_ON],
        status: [
          PlanStatus.ACTIVE,
          PlanStatus.SOFT_ARCHIVED, // users might have subscribed to an active plan, but later that plan was archived by admin
          PlanStatus.HARD_ARCHIVED
        ],
        page: page,
        count: 500
      },
      fetchPlan
    )
    setLoadingPlans(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { plans } = planList
    
    // Store all plans data for planType filtering
    allPlansRef.current = plans || []
    
    planFilterRef.current =
      plans == null
        ? []
        : plans.map((p: IPlan) => ({
          value: p.plan?.id,
          text: p.plan?.planName
        }))

    internalPlanNameFilterRef.current =
      plans == null
        ? []
        : plans
          .filter((p: IPlan) => p.plan?.internalName != null && p.plan?.internalName.trim() !== '')
          .map((p: IPlan) => ({
            value: p.plan?.id,
            text: p.plan?.internalName || '(Empty)'
          }))

    // to initialize the planIds filter.
    // planIds filter on URL is a string like planIds=1-2-3, or it could be null.
    // initializeFilters's 3rd param is a Enum type or objects of all the plans, with k/v both being planId.
    // we need to convert the planFilterRef.current to {1: 1, 2: 2, 3: 3, ...}
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
  }

  const onTableChange: TableProps<ISubscriptionType>['onChange'] = (
    _,
    filters
  ) => {
    onPageChange(1, PAGE_SIZE)
    setFilters(filters as TFilters)

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.planIds == null
      ? searchParams.delete('planIds')
      : searchParams.set('planIds', filters.planIds.join('-'))
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.internalPlanNameIds == null
      ? searchParams.delete('internalPlanNameIds')
      : searchParams.set('internalPlanNameIds', filters.internalPlanNameIds.join('-'))
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.status == null
      ? searchParams.delete('status')
      : searchParams.set('status', filters.status.join('-'))
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.planType == null
      ? searchParams.delete('planType')
      : searchParams.set('planType', (filters.planType as number[]).join('-'))

    setSearchParams(searchParams)
  }

  const normalizeSearchTerms = () => {
    const searchTerm = JSON.parse(JSON.stringify(form.getFieldsValue()))

    // Handle email separately to avoid being deleted by the cleanup logic
    const email = form.getFieldValue('email')
    if (email && email.trim() !== '') {
      searchTerm.email = email.trim()
    }

    // Clean up empty values (but preserve email if it was set above)
    Object.keys(searchTerm).forEach(
      (k) =>
        k !== 'email' && // Don't delete email field
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

    const curObj = appConfigStore.currency[searchTerm.currency as Currency]

    let amtFrom = searchTerm.amountStart,
      amtTo = searchTerm.amountEnd
    if (amtFrom != '' && amtFrom != null) {
      amtFrom = Number(amtFrom) * curObj!.Scale
      if (isNaN(amtFrom) || amtFrom < 0) {
        message.error('Invalid amount-from value.')
        return null
      }
    }
    if (amtTo != '' && amtTo != null) {
      amtTo = Number(amtTo) * curObj!.Scale
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
  }, [page, filters])

  useEffect(() => {
    fetchPlan()
  }, [])

  return (
    <div>
      {importModalOpen !== false && (
        <ImportModal
          closeModal={() => setImportModalOpen(false)}
          importType={importModalOpen}
        />
      )}
      <Search
        form={form}
        goSearch={goSearch}
        searching={loading || loadingPlans}
        exporting={exporting}
        onPageChange={onPageChange}
        clearFilters={clearFilters}
      />
      <div className="mb-3"></div>
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
        <Table
          columns={getColumns()}
          dataSource={subList}
          rowKey={'id'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          onChange={onTableChange}
          onRow={(record) => {
            return {
              onClick: (evt) => {
                if (
                  evt.target instanceof HTMLElement &&
                  evt.target.closest('.sub-tooltip-wrapper') != null
                ) {
                  return
                }
                navigate(`/subscription/${record.subscriptionId}`)
              }
            }
          }}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
        />
      )}

      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
        />
      </div>
    </div>
  )
}

export default Index

const DEFAULT_TERM = {
  // currency: 'EUR'
  // amountStart: '',
  // amountEnd: ''
  // refunded: false,
}
const Search = ({
  form,
  searching,
  exporting,
  goSearch,
  onPageChange,
  clearFilters
}: {
  form: FormInstance<unknown>
  searching: boolean
  exporting: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  clearFilters: () => void
}) => {
  const appConfigStore = useAppConfigStore()
  const watchCurrency = Form.useWatch('currency', form)
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    clearFilters()
  }

  const currencySymbol = useMemo(
    () => appConfigStore.currency[watchCurrency as Currency]?.Symbol,
    [watchCurrency]
  )

  return (
    <div>
      <Form
        form={form}
        onFinish={goSearch}
        initialValues={DEFAULT_TERM}
        disabled={searching || exporting}
      >
        <Row className="mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={4} className="font-bold text-gray-500">
            Subscription created
          </Col>
          <Col span={4}>
            <Form.Item name="createTimeStart" noStyle={true}>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="From"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="createTimeEnd"
              noStyle={true}
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
                    return value.isAfter(start)
                      ? Promise.resolve()
                      : Promise.reject('Must be later than start date')
                  }
                })
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="To"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={12} className="flex justify-end">
            <Space>
              <Button onClick={clear} disabled={searching || exporting}>
                Clear
              </Button>
              <Button
                htmlType="submit"
                type="primary"
                loading={searching}
                disabled={searching || exporting}
              >
                Search
              </Button>
              {/* <Button
                onClick={exportData}
                loading={exporting}
                disabled={searching || exporting}
              >
                Export
              </Button> */}
            </Space>
          </Col>
        </Row>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4} className="font-bold text-gray-500">
            <div className="flex items-center">
              <span className="mr-2">Amount</span>
              <Form.Item name="currency" noStyle={true}>
                <Select
                  style={{ width: 80 }}
                  options={appConfigStore.supportCurrency.map((c) => ({
                    label: c.Currency,
                    value: c.Currency
                  }))}
                />
              </Form.Item>
            </div>
          </Col>
          <Col span={4}>
            <Form.Item name="amountStart" noStyle={true}>
              <Input
                prefix={currencySymbol ? `from ${currencySymbol}` : ''}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input
                prefix={currencySymbol ? `to ${currencySymbol}` : ''}
              />
            </Form.Item>
          </Col>
          {/* <Col span={11} className=" ml-4 font-bold text-gray-500">
            <span className="mr-2">Status</span>
            <Form.Item name="status" noStyle={true}>
              <Select
                mode="multiple"
                options={statusOpt}
                style={{ maxWidth: 420, minWidth: 120, margin: '8px 0' }}
              />
            </Form.Item>
          </Col> */}
        </Row>
        <Row className="flex items-center mt-3" gutter={[8, 8]}>
          <Col span={4} className="font-bold text-gray-500">
            Email
          </Col>
          <Col span={8}>
            <Form.Item name="email" noStyle>
              <Input placeholder="Search by email" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
