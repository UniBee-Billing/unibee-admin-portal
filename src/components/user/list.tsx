import { SUBSCRIPTION_STATUS, USER_STATUS } from '@/constants'
import { formatDate } from '@/helpers'
import { usePagination } from '@/hooks'
import { exportDataReq, getPlanList, getUserListReq } from '@/requests'
import '@/shared.css'
import {
  IPlan,
  IProfile,
  PlanStatus,
  PlanType,
  SubscriptionStatus
} from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import {
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  LoadingOutlined,
  MoreOutlined,
  SearchOutlined,
  SyncOutlined,
  UserAddOutlined
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
  Row,
  Space,
  Spin,
  Tooltip,
  message
} from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImportModal from '../shared/dataImportModal'
import LongTextPopover from '../ui/longTextPopover'
import { SubscriptionStatusTag, UserStatusTag } from '../ui/statusTag'
import CreateUserModal from './createUserModal'
import CopyToClipboard from '../ui/copyToClipboard'
import ResponsiveTable from '../table/responsiveTable'
import './list.css'

const BASE_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const USER_STATUS_FILTER = Object.entries(USER_STATUS).map((s) => {
  const [value, { label }] = s
  return { value: Number(value), text: label }
})

const SUB_STATUS_FILTER = Object.entries(SUBSCRIPTION_STATUS)
  .map((s) => {
    const [value, { label }] = s
    return { value: Number(value), text: label }
  })
  .filter(({ value }) => value != SubscriptionStatus.INITIATING)
// INITIATING status is used as a placeholder in this component when user has no active subscription, no need to show it in filter.

type TFilters = {
  status: number[] | null
  subStatus: number[] | null
  planIds: number[] | null
}

const Index = () => {
  const navigate = useNavigate()
  const appConfig = useAppConfigStore()
  const { page, onPageChange } = usePagination()
  const [importModalOpen, setImportModalOpen] = useState(false)
  const toggleImportModal = () => setImportModalOpen(!importModalOpen)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<TFilters>({
    status: null,
    subStatus: null,
    planIds: null
  })
  const planFilterRef = useRef<{ value: number; text: string }[]>([])

  const [newUserModalOpen, setNewUserModalOpen] = useState(false)
  const toggleNewUserModal = () => setNewUserModalOpen(!newUserModalOpen)
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [users, setUsers] = useState<IProfile[]>([])
  const [form] = Form.useForm()

  const normalizeSearchTerms = () => {
    const start = form.getFieldValue('createTimeStart')
    const end = form.getFieldValue('createTimeEnd')
    const searchTerms = JSON.parse(JSON.stringify(form.getFieldsValue()))
    Object.keys(searchTerms).forEach(
      (k) =>
        (searchTerms[k] == undefined ||
          (typeof searchTerms[k] == 'string' && searchTerms[k].trim() == '')) &&
        delete searchTerms[k]
    )
    if (start != null) {
      searchTerms.createTimeStart = start.hour(0).minute(0).second(0).unix()
    }
    if (end != null) {
      searchTerms.createTimeEnd = end.hour(23).minute(59).second(59).unix()
    }

    return searchTerms
  }

  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getUserListReq(
      {
        page,
        count: PAGE_SIZE,
        ...normalizeSearchTerms(),
        ...filters
      },
      fetchData
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { userAccounts, total } = res
    setUsers(userAccounts ?? [])
    setTotal(total)
  }

  const fetchPlan = async () => {
    setLoadingPlans(true)
    //Filter out all the plans
    const [planList, err] = await getPlanList(
      {
        // type: [PlanType.MAIN],
        status: [PlanStatus.ACTIVE],
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

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    payload = { ...payload, ...filters }

    const [_, err] = await exportDataReq({ task: 'UserExport', payload })
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'User list is being exported, please check task list for progress.'
    )
    appConfig.setTaskListOpen(true)
  }

  const extraActions: { [key: string]: () => void } = {
    exportData: exportData,
    importData: toggleImportModal
  }

  const extraButtons = [
    {
      key: 'exportData',
      label: 'Export',
      icon: <ExportOutlined />
    },
    {
      key: 'importData',
      label: 'Import',
      icon: <ImportOutlined />
    }
  ]
  const onMenuClick: MenuProps['onClick'] = (e) => {
    extraActions[e.key]()
  }
  const getColumns = (): ColumnsType<IProfile> => [
    {
      title: 'User ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
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
          <CopyToClipboard content={String(id)} />
        </div>
      )
    },
    {
      title: 'External User ID',
      dataIndex: 'externalUserId',
      key: 'externalUserId',
      width: 100,
      render: (externalUserId) => externalUserId || ''
    },
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'userName',
      width: 100,
      render: (_, user) => user.firstName + ' ' + user.lastName
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    

    {
      title: 'Subscription Plan',
      dataIndex: 'subscriptionName',
      key: 'planIds',
      width: 132,
      render: (planName) => (
        <div className="w-28 overflow-hidden whitespace-nowrap">
          <LongTextPopover text={planName} placement="topLeft" width="132px" />
        </div>
      ),
      filters: planFilterRef.current,
      filteredValue: filters.planIds,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase()),
    },
    {
      title: 'Sub ID',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      width: 150,
      render: (subId, _) => (
        <div className="flex items-center gap-1">
          <Tooltip title={subId}>
            <div
              style={{
                width: '100px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {subId}
            </div>
          </Tooltip>
          <CopyToClipboard content={String(subId)} />
        </div>
      )
    },
    {
      title: 'Sub Status',
      dataIndex: 'subscriptionStatus',
      key: 'subStatus',
      width: 120,
      render: (subStatus, _) => SubscriptionStatusTag(subStatus),
      filters: SUB_STATUS_FILTER,
      filteredValue: filters.subStatus
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 120,
      render: (d) => (d === 0 ? '―' : formatDate(d)) // dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, _) => UserStatusTag(status),
      filters: USER_STATUS_FILTER,
      filteredValue: filters.status
    },
    {
      title: (
        <>
          <span></span>
          <Tooltip title="New user">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={toggleNewUserModal}
              icon={<UserAddOutlined />}
            />
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            />
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
      width: 140,
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle" className="user-action-btn-wrapper">
          <Button
            type="link"
            onClick={() => navigate(`/user/${record.id}`)}
          >
            View Details
          </Button>
        </Space>
      )
    }
  ]

  // search should always start with page 0(it shows ?page=1 on URL)
  // search result might have fewer records than PAGE_SIZE(only visible on page=1), it will be empty from page=2
  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  const clearFilters = () =>
    setFilters({ status: null, subStatus: null, planIds: null })

  const onTableChange: TableProps<IProfile>['onChange'] = (
    pagination,
    filters,
    _sorter,
    _extra
  ) => {
    const newPage = pagination.current || 1
    
    onPageChange(newPage, PAGE_SIZE)
    setFilters(filters as TFilters)
  }

  useEffect(() => {
    fetchData()
  }, [filters, page])

  useEffect(() => {
    fetchPlan()
  }, [])

  return (
    <div>
      {newUserModalOpen && (
        <CreateUserModal closeModal={toggleNewUserModal} refresh={fetchData} />
      )}
      {importModalOpen && (
        <ImportModal
          closeModal={toggleImportModal}
          importType="UserImport"
          // downloadTemplate={downloadTemplate}
        />
      )}
      <Row>
        <Col span={24}>
          <Search
            form={form}
            goSearch={goSearch}
            onPageChange={onPageChange}
            clearFilters={clearFilters}
            searching={loading}
          />
        </Col>
      </Row>
      <div className="h-3"></div>

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
          dataSource={users}
          onChange={onTableChange}
          rowKey={'id'}
          pagination={{
            current: page + 1,
            pageSize: PAGE_SIZE,
            total: total,
            onChange: onPageChange,
            disabled: loading,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
          }}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
          scroll={{ x: 1200 }}
        />
      )}
    </div>
  )
}

export default Index
const Search = ({
  form,
  searching,
  goSearch,
  onPageChange,
  clearFilters
}: {
  form: FormInstance<unknown>
  searching: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  clearFilters: () => void
}) => {
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    clearFilters()
  }

  return (
    <div>
      <Form
        form={form}
        onFinish={goSearch}
        // initialValues={DEFAULT_SEARCH_TERM}
      >
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={3} className="font-bold text-gray-500">
            Account name
          </Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="first name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="last name" />
            </Form.Item>
          </Col>

          <Col span={2} className="text-right font-bold text-gray-500">
            Email
          </Col>
          <Col span={5}>
            <Form.Item name="email" noStyle={true}>
              <Input onPressEnter={goSearch} />
            </Form.Item>
          </Col>
        </Row>

        <Row className="my-3 flex items-center" gutter={[8, 8]}>
          <Col span={3} className="font-bold text-gray-500">
            External User ID
          </Col>
          <Col span={8}>
            <Form.Item name="externalUserId" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="External User ID" />
            </Form.Item>
          </Col>
        </Row>

        <Row className="my-3 flex items-center" gutter={[8, 8]}>
          <Col span={3} className="font-bold text-gray-500">
            Account created
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
          <Col span={13} className="flex justify-end">
            <Space>
              <Button onClick={clear} disabled={searching}>
                Clear
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                icon={<SearchOutlined />}
                loading={searching}
                disabled={searching}
              >
                Search
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
