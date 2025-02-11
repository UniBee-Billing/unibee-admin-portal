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
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRENCY, SUBSCRIPTION_STATUS } from '../../constants'
import { formatDate, formatPlanInterval, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { exportDataReq, getPlanList, getSublist } from '../../requests'
import '../../shared.css'
import {
  IPlan,
  ISubscriptionType,
  SubscriptionWrapper,
  TImportDataType
} from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import ImportModal from '../shared/dataImportModal'
import { SubscriptionStatus } from '../ui/statusTag'
import TableCellPopover from '../ui/tableCellPopover'

const BASE_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const SUB_STATUS_FILTER = Object.keys(SUBSCRIPTION_STATUS)
  .map((s) => ({
    text: SUBSCRIPTION_STATUS[Number(s)],
    value: Number(s)
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1))

type TFilters = {
  status: number[] | null
  planIds: number[] | null
}

const Index = () => {
  const navigate = useNavigate()
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
    status: null,
    planIds: null
  })
  const planFilterRef = useRef<{ value: number; text: string }[]>([])

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    payload = { ...payload, ...filters }

    // return
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
            <a href={`${location.origin}${BASE_PATH}subscription/${id}`}>
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
      width: 120,
      render: (_, sub) => (
        <div className="w-28 overflow-hidden whitespace-nowrap">
          {sub.plan?.planName != undefined && (
            <TableCellPopover
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 128,
      render: (_, sub) =>
        sub.plan?.description != undefined && (
          <TableCellPopover
            text={sub.plan.description}
            placement="topLeft"
            width="128px"
          />
        )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt, s) =>
        `${showAmount(amt, s.currency)}/${formatPlanInterval(s.plan)}`
    },
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
      render: (_, sub) => SubscriptionStatus(sub.status),
      filters: SUB_STATUS_FILTER,
      filteredValue: filters.status
    },
    {
      title: 'Start',
      dataIndex: 'currentPeriodStart',
      key: 'currentPeriodStart',
      render: (_, sub) =>
        // (sub.currentPeriodStart * 1000).format('YYYY-MMM-DD HH:MM')
        formatDate(sub.currentPeriodStart, true)
    },
    {
      title: 'End',
      dataIndex: 'currentPeriodEnd',
      key: 'currentPeriodEnd',
      render: (_, sub) =>
        // dayjs(sub.currentPeriodEnd * 1000).format('YYYY-MMM-DD HH:MM')
        formatDate(sub.currentPeriodEnd, true)
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
        ...filters,
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
        type: [1], // 'main plan' only
        status: [2], // 'active' only
        page: page,
        count: 100
      },
      fetchPlan
    )
    setLoadingPlans(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { plans } = planList
    planFilterRef.current =
      plans == null
        ? []
        : plans.map((p: IPlan) => ({
            value: p.plan?.id,
            text: p.plan?.planName
          }))
  }

  const onTableChange: TableProps<ISubscriptionType>['onChange'] = (
    _,
    filters
  ) => {
    // onPageChange(1, PAGE_SIZE)
    setFilters(filters as TFilters)
  }

  const normalizeSearchTerms = () => {
    const searchTerm = JSON.parse(JSON.stringify(form.getFieldsValue()))
    Object.keys(searchTerm).forEach(
      (k) =>
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

    let amtFrom = searchTerm.amountStart,
      amtTo = searchTerm.amountEnd
    if (amtFrom != '' && amtFrom != null) {
      amtFrom = Number(amtFrom) * CURRENCY[searchTerm.currency].stripe_factor
      if (isNaN(amtFrom) || amtFrom < 0) {
        message.error('Invalid amount-from value.')
        return null
      }
    }
    if (amtTo != '' && amtTo != null) {
      amtTo = Number(amtTo) * CURRENCY[searchTerm.currency].stripe_factor
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

  const clearFilters = () => setFilters({ status: null, planIds: null })

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
                navigate(`/subscription/${record.subscriptionId}`, {
                  state: { subscriptionId: record.subscriptionId }
                })
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
  currency: 'EUR'
  // status: [],
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
  const appStore = useAppConfigStore()
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    clearFilters()
  }
  // const appConfig = useAppConfigStore()
  // const CURRENCIES = appConfig.supportCurrency

  const currencySymbol =
    CURRENCY[form.getFieldValue('currency') || DEFAULT_TERM.currency].symbol

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
                onClick={form.submit}
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
                  options={appStore.supportCurrency.map((c) => ({
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
                prefix={`from ${currencySymbol}`}
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input
                prefix={`to ${currencySymbol}`}
                onPressEnter={form.submit}
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
      </Form>
    </div>
  )
}
