import { MerchantUserStatusTag } from '@/components/ui/statusTag'
import { emailValidate, formatDate } from '@/helpers'
import { usePagination } from '@/hooks'
import {
  getMerchantUserListReq2,
  getMerchantUserListWithMoreReq,
  inviteMemberReq,
  suspendMemberReq,
  updateMemberRolesReq,
  getRoleListReq
} from '@/requests'
import { IMerchantMemberProfile, TRole } from '@/shared.types'
import { useMerchantMemberProfileStore } from '@/stores'
import {
  LoadingOutlined,
  ProfileOutlined,
  SyncOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  message
} from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import ResponsiveTable from '../table/responsiveTable'
import './userList.css'

const PAGE_SIZE = 10

const MERCHANT_USER_STATUS = {
  0: { label: 'Active', color: 'green' },
  2: { label: 'Suspended', color: 'red' }
}

const STATUS_FILTER = Object.entries(MERCHANT_USER_STATUS).map(([value, { label }]) => ({
  text: label,
  value: Number(value)
}))

type TFilters = {
  MemberRoles: number[] | null
  status: number[] | null
}

const Index = () => {
  // const navigate = useNavigate()
  const isMountingRef = useRef(false)
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const [form] = Form.useForm()
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<TRole[]>([])
  const [filters, setFilters] = useState<TFilters>({
    MemberRoles: null,
    status: null
  })
  const [users, setUsers] = useState<IMerchantMemberProfile[]>([])
  const [activeUser, setActiveUser] = useState<
    IMerchantMemberProfile | undefined
  >(undefined) // user to be edited in Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const toggleInviteModal = () => {
    if (inviteModalOpen) {
      // before closing the modal, set user = null, otherwise, clicking 'invite' button will the previous active user data
      setActiveUser(undefined)
    }
    setInviteModalOpen(!inviteModalOpen)
  }

  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const toggleSuspendModal = () => {
    if (suspendModalOpen) {
      // before closing the modal, set user = null, otherwise, clicking 'invite' button will the previous active user data
      setActiveUser(undefined)
    }
    setSuspendModalOpen(!suspendModalOpen)
  }

  const normalizeSearchTerms = () => {
    const searchTerm = JSON.parse(JSON.stringify(form.getFieldsValue()))
    
    // Clean up empty values
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

    return searchTerm
  }

  const fetchData = async () => {
    const searchTerm = normalizeSearchTerms()
    
    const body = {
      page,
      count: pageSize,
      roleIds:
        filters.MemberRoles != null && filters.MemberRoles.length > 0
          ? filters.MemberRoles
          : undefined,
      ...searchTerm
    }
    
    setLoading(true)
    const [res, err] = await getMerchantUserListReq2(body, fetchData)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    const { merchantMembers, total } = res
    setUsers(merchantMembers ?? [])
    setTotal(total)
  }

  const fetchRoles = async () => {
    const [res, err] = await getRoleListReq(fetchRoles)
    if (err != null) {
      message.error(err.message)
      return
    }

    setRoles(res.merchantRoles ?? [])
  }

  const columns: ColumnsType<IMerchantMemberProfile> = [
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
      width: 120
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
      width: 120
    },
    {
      title: 'Roles',
      dataIndex: 'MemberRoles',
      key: 'MemberRoles',
      width: 130,
      filters: roles.map((r) => ({ text: r.role, value: r.id as number })),
      filteredValue: filters.MemberRoles,
      filterSearch: (input, record) =>
        String(record.text).toLowerCase().includes(input.toLowerCase()),
      onFilter: (value, record) => {
        // Filter by role ID in MemberRoles array
        return record.MemberRoles.some((role: TRole) => role.id === value)
      },
      render: (memberRoles: TRole[], record: IMerchantMemberProfile) => (
        <Space size={[0, 8]} wrap className="btn-merchant-user-roles cursor-pointer">
          {record.isOwner && (
            <Tag color="gold">
              owner
            </Tag>
          )}
          {memberRoles.map((role: TRole) => (
            <Tag key={role.id as number}>
              {role.role}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: STATUS_FILTER,
      filteredValue: filters.status,
      onFilter: (value, record) => record.status === value,
      render: (s) => MerchantUserStatusTag(s)
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 120,
      render: (d) => (d === 0 ? '―' : formatDate(d))
    },
    {
      title: 'Actions',
      width: 220,
      key: 'action',
      render: (_, record) => (
        <Space size="small" className="member-action-btn-wrapper">
          <Tooltip title="View activities logs">
            <Button
              type="text"
              disabled={loading}
              icon={<ProfileOutlined className="text-blue-500" />}
            />
          </Tooltip>

          <Tooltip title="Suspend account">
            <Button
              type="text"
              className="btn-merchant-suspend"
              disabled={loading}
              onClick={() => {
                setActiveUser(record);
                toggleSuspendModal();
              }}
              icon={<UserDeleteOutlined className="text-red-500" />}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const onTableChange: TableProps<IMerchantMemberProfile>['onChange'] = (
    pagination,
    filters
  ) => {
    const newPageSize = pagination.pageSize || PAGE_SIZE
    const newPage = pagination.current || 1
    
    // If pageSize changed, reset to page 1
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      onPageChangeNoParams(1, newPageSize) // Reset to page 0 (backend uses 0-based)
    } else {
      // Convert from 1-based (UI) to 0-based (backend)
      onPageChangeNoParams(newPage, newPageSize)
    }

    setFilters(filters as TFilters)
  }

  const clearFilters = () => {
    setFilters({ MemberRoles: null, status: null })
  }

  const goSearch = () => {
    // Always go to first page (page=0 backend) on new search
    if (page === 0) {
      // Already on page 0, just fetch data
      fetchData()
    } else {
      // Go to page 0, useEffect will trigger fetchData
      onPageChange(1, pageSize)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [filters, page, pageSize])

  return (
    <div className="bg-gray-50 min-h-screen">
      {inviteModalOpen && (
        <InviteModal
          closeModal={toggleInviteModal}
          refresh={fetchData}
          userData={activeUser}
          roles={roles}
        />
      )}
      {suspendModalOpen && (
        <SuspendModal
          closeModal={toggleSuspendModal}
          refresh={fetchData}
          userData={activeUser}
        />
      )}

      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold mb-6">Admin List</h1>

        <Search
          form={form}
          goSearch={goSearch}
          searching={loading}
          onPageChange={onPageChange}
          clearFilters={clearFilters}
        />

        {/* Records Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Members</h2>
              <div className="flex items-center gap-3">
                <Button
                  icon={<SyncOutlined />}
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center"
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={toggleInviteModal}
                  className="flex items-center"
                >
                  Invite member
                </Button>
              </div>
            </div>
          </div>

          <ResponsiveTable
            columns={columns}
            dataSource={users}
            onChange={onTableChange}
            rowKey={'id'}
            rowClassName="clickable-tbl-row"
            pagination={{
              current: page + 1,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              locale: { items_per_page: '' },
              disabled: loading,
              className: 'admin-list-pagination',
            }}
            loading={{
              spinning: loading,
              indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
            }}
            scroll={{ x: 1200 }}
            onRow={(user) => {
              return {
                onClick: (evt) => {
                  if (!merchantMemberProfile.isOwner) {
                    // return
                  }
                  const tgt = evt.target
                  
                  // Check if clicked on Roles column to edit roles
                  if (
                    tgt instanceof Element &&
                    tgt.closest('.btn-merchant-user-roles')
                  ) {
                    setActiveUser(user)
                    toggleInviteModal()
                    return
                  }

                  // Check if clicked on suspend button
                  if (
                    tgt instanceof Element &&
                    tgt.closest('.btn-merchant-suspend')
                  ) {
                    setActiveUser(user)
                    toggleSuspendModal()
                    return
                  }
                  // navigate(`/admin/${user.id}`)
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Index

// this Modal is used to invite new users and edit existing user's roles
const InviteModal = ({
  closeModal,
  refresh,
  userData,
  roles
}: {
  closeModal: () => void
  refresh: () => void
  userData: IMerchantMemberProfile | undefined
  roles: TRole[]
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const isNew = userData == undefined

  const onConfirm = async () => {
    const body = form.getFieldsValue()
    setLoading(true)
    if (isNew) {
      // Get the current hostname
      const hostname = window.location.origin
      // Construct the returnUrl for password setup
      const returnUrl = `${hostname}/member_inviter`
      
      const [_, err] = await inviteMemberReq({
        ...body,
        returnUrl
      })
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
    } else {
      const [_, err] = await updateMemberRolesReq({
        memberId: body.id,
        roleIds: body.roleIds
      })
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
    }

    message.success(
      isNew
        ? `An invitation email has been sent to ${form.getFieldValue('email')}. They will be prompted to set up a password.`
        : 'New roles saved'
    )
    closeModal()
    refresh()
  }

  return (
    <Modal
      title={`${isNew ? 'Invite team member' : 'Edit team member roles'}`}
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        form={form}
        style={{ margin: '24px 0' }}
        onFinish={onConfirm}
        initialValues={
          !isNew
            ? {
                ...userData,
                roleIds: userData.MemberRoles.map((r: TRole) => r.id as number)
              }
            : {
                firstName: '',
                lastName: '',
                email: '',
                role: []
              }
        }
      >
        {!isNew && (
          <Form.Item name="id" label="User Id" hidden>
            <Input />
          </Form.Item>
        )}

        <Form.Item
          label="First name"
          name="firstName"
          rules={[
            {
              required: true,
              message: "Please input invitee's first name!"
            }
          ]}
        >
          <Input disabled={!isNew || loading} />
        </Form.Item>
        <Form.Item
          label="Last name"
          name="lastName"
          rules={[
            {
              required: true,
              message: "Please input invitee's last name!"
            }
          ]}
        >
          <Input disabled={!isNew || loading} />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your Email!'
            },
            () => ({
              validator(_, value) {
                if (value != null && value != '' && emailValidate(value)) {
                  return Promise.resolve()
                }
                return Promise.reject('Please input valid email address.')
              }
            })
          ]}
        >
          <Input disabled={!isNew || loading} />
        </Form.Item>
        <Form.Item
          label="Roles"
          name="roleIds"
          rules={[
            {
              required: true,
              message: 'Please select at least one role!'
            }
          ]}
        >
          <Select
            mode="multiple"
            disabled={loading}
            style={{ width: '80%' }}
            options={roles.map((r) => ({
              label: r.role,
              value: r.id as number
            }))}
          />
        </Form.Item>
        
        {isNew && (
          <div className="mb-3 ml-6 text-sm text-gray-500">
            An invitation email will be sent to the team member.
            They will need to set up their password via the link in the email.
          </div>
        )}
      </Form>

      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
        >
          {`${isNew ? 'Invite' : 'OK'}`}
        </Button>
      </div>
    </Modal>
  )
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px'
}
const colStyle: CSSProperties = { fontWeight: 'bold' }

const SuspendModal = ({
  closeModal,
  refresh,
  userData
}: {
  closeModal: () => void
  refresh: () => void
  userData: IMerchantMemberProfile | undefined
}) => {
  const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    if (userData == null) {
      return
    }
    setLoading(true)
    const [_, err] = await suspendMemberReq(userData!.id)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    message.success(
      `Admin account of '${userData!.firstName} ${userData!.lastName} has been suspended`
    )
    closeModal()
    refresh()
  }

  return (
    <Modal
      title={`Suspend account confirm`}
      width={'640px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Row style={rowStyle}>
        <Col span={8} style={colStyle}>
          First Name
        </Col>
        <Col span={16}>{userData?.firstName}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col style={colStyle} span={8}>
          Last Name
        </Col>
        <Col span={16}>{userData?.lastName}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col style={colStyle} span={8}>
          Email
        </Col>
        <Col span={16}>{userData?.email}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col style={colStyle} span={8}>
          Roles
        </Col>
        <Col span={16}>
          <Space size={[0, 8]} wrap>
            {userData?.MemberRoles.map((r) => (
              <Tag key={r.id as number}>{r.role}</Tag>
            ))}
          </Space>
        </Col>
      </Row>

      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          danger
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          Suspend
        </Button>
      </div>
    </Modal>
  )
}

const DEFAULT_SEARCH = {}

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
    clearFilters()
    // Reset to first page - onPageChange will trigger data fetch via useEffect
    onPageChange(1, PAGE_SIZE)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <Form
        form={form}
        onFinish={goSearch}
        initialValues={DEFAULT_SEARCH}
        disabled={searching}
      >
        {/* Single Row - Search field, Created at, and Buttons */}
        <div className="flex items-end gap-4 flex-wrap">
          {/* Search Field */}
          <div className="flex-shrink-0">
            <div className="text-sm text-gray-600 mb-2">Search</div>
            <Form.Item name="searchKey" noStyle>
              <Input 
                placeholder="Search first name, last name, email" 
                onPressEnter={() => form.submit()}
                size="large"
                allowClear
                style={{ width: '300px' }}
              />
            </Form.Item>
          </div>

          {/* Created At Date Range */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-600 mb-2">Created at</div>
            <div className="flex items-center gap-2">
              <Form.Item name="createTimeStart" noStyle={true}>
                <DatePicker
                  placeholder="Start Date"
                  format="MM.DD.YYYY"
                  disabledDate={(d) => d.isAfter(new Date())}
                  size="large"
                  allowClear
                  style={{ width: '140px' }}
                />
              </Form.Item>
              <span className="text-gray-400">-</span>
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
                      return value.isAfter(start) || value.isSame(start, 'day')
                        ? Promise.resolve()
                        : Promise.reject('Must be same or later than start date')
                    }
                  })
                ]}
              >
                <DatePicker
                  placeholder="End Date"
                  format="MM.DD.YYYY"
                  disabledDate={(d) => d.isAfter(new Date())}
                  size="large"
                  allowClear
                  style={{ width: '140px' }}
                />
              </Form.Item>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 ml-auto">
            <Button
              size="large"
              onClick={clear}
              disabled={searching}
            >
              Clear
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={searching}
              disabled={searching}
            >
              Search
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
