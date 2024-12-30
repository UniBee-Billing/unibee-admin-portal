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
  Pagination,
  Row,
  Space,
  Spin,
  Table,
  Tooltip,
  message
} from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBSCRIPTION_STATUS, USER_STATUS } from '../../constants'
import { formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import { exportDataReq, getPlanList, getUserListReq } from '../../requests'
import '../../shared.css'
import { IPlan, IProfile } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import ImportModal from '../shared/dataImportModal'
import { SubscriptionStatus, UserStatus } from '../ui/statusTag'
import CreateUserModal from './createUserModal'
import './list.css'

const BASE_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const STATUS_FILTER = Object.entries(USER_STATUS).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})
const SUB_STATUS_FILTER = Object.entries(SUBSCRIPTION_STATUS).map((s) => {
  const [value, text] = s
  return { value: Number(value), text }
})

type TFilters = {
  status: number[] | null
  subStatus: number[] | null
  planIds: number[] | null
}

const Index = () => {
  const navigate = useNavigate()
  const appConfig = useAppConfigStore()
  const [exporting, setExporting] = useState(false)
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

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    payload = { ...payload, ...filters }

    // return
    setExporting(true)
    const [_, err] = await exportDataReq({ task: 'UserExport', payload })
    setExporting(false)
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
      title: 'Uer Id',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (
        <a href={`${location.origin}${BASE_PATH}user/${id}`}>{id}</a>
      )
    },
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'userName',
      render: (_, user) => user.firstName + ' ' + user.lastName
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },

    {
      title: 'Subscription Plan',
      dataIndex: 'subscriptionName',
      key: 'planIds',
      filters: planFilterRef.current,
      filteredValue: filters.planIds
    },
    {
      title: 'Sub Id',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subId, _) => (
        <div
          className="btn-user-with-subid w-28 overflow-hidden overflow-ellipsis whitespace-nowrap text-blue-500"
          onClick={() => {
            navigate(`/subscription/${subId}`)
          }}
        >
          {subId}
        </div>
      )
    },
    {
      title: 'Sub Status',
      dataIndex: 'subscriptionStatus',
      key: 'subStatus',
      render: (subStatus, _) => SubscriptionStatus(subStatus),
      filters: SUB_STATUS_FILTER,
      filteredValue: filters.subStatus
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => (d === 0 ? '―' : formatDate(d)) // dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, _) => UserStatus(status),
      filters: STATUS_FILTER,
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
      width: 128,
      key: 'action',
      render: (_) => (
        <Space size="middle" className="user-action-btn-wrapper">
          <Tooltip title="Edit">
            <Button
              // disabled={copyingPlan}
              style={{ border: 'unset' }}
              // onClick={() => goToDetail(record.id)}
              icon={<EditOutlined />}
            />
          </Tooltip>
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
    _pagination,
    filters,
    _sorter,
    _extra
  ) => {
    // onPageChange(1, PAGE_SIZE)

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
            exporting={exporting}
            // normalizeSearchTerms={normalizeSearchTerms}
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
        <Table
          columns={getColumns()}
          dataSource={users}
          onChange={onTableChange}
          rowKey={'id'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
          onRow={(user) => {
            return {
              onClick: (evt) => {
                if (
                  evt.target instanceof HTMLElement &&
                  evt.target.classList.contains('btn-user-with-subid')
                ) {
                  return
                }
                navigate(`/user/${user.id}`)
              }
            }
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
              <Button onClick={clear} disabled={searching || exporting}>
                Clear
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                icon={<SearchOutlined />}
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
      </Form>
    </div>
  )
}
