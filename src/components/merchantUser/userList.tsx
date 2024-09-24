import {
  LoadingOutlined,
  ProfileOutlined,
  SyncOutlined,
  UserAddOutlined,
  UserDeleteOutlined} from '@ant-design/icons'
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Pagination,
  Popover,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message
} from 'antd'
import { ColumnsType, TableProps } from 'antd/es/table'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { emailValidate, formatDate } from '../../helpers'
import { usePagination } from '../../hooks'
import {
  getMerchantUserListReq2,
  getMerchantUserListWithMoreReq,
  inviteMemberReq,
  suspendMemberReq,
  updateMemberRolesReq
} from '../../requests'
import '../../shared.css'
import { IMerchantUserProfile, TRole } from '../../shared.types'
import { useProfileStore } from '../../stores'
import { MerchantUserStatus } from '../ui/statusTag'

const PAGE_SIZE = 10

type TFilters = {
  MemberRoles: number[] | null
}

const Index = () => {
  // const navigate = useNavigate()
  const isMountingRef = useRef(false)
  const profileStore = useProfileStore()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<TRole[]>([])
  const [roleFilters, setRoleFilters] = useState<TFilters>({
    MemberRoles: null
  })
  const [users, setUsers] = useState<IMerchantUserProfile[]>([])
  const [activeUser, setActiveUser] = useState<
    IMerchantUserProfile | undefined
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

  const fetchData = async () => {
    setLoading(true)
    const [res, err] = await getMerchantUserListWithMoreReq(fetchData)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('get merchantUser AND roleList: ', res)
    const { merchantUserListRes, roleListRes } = res
    const { merchantMembers, total } = merchantUserListRes
    setUsers(merchantMembers ?? [])
    setTotal(total)
    setRoles(roleListRes.merchantRoles ?? [])
  }

  const getMerchantUserList = async () => {
    const body: any = { page, count: PAGE_SIZE }
    if (roleFilters.MemberRoles != null && roleFilters.MemberRoles.length > 0) {
      body.roleIds = roleFilters.MemberRoles
    }
    setLoading(true)
    const [res, err] = await getMerchantUserListReq2(body, getMerchantUserList)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    console.log('get merchant user list: ', res)
    const { merchantMembers, total } = res
    setUsers(merchantMembers ?? [])
    setTotal(total)
  }

  const columns: ColumnsType<IMerchantUserProfile> = [
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName'
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName'
    },
    {
      title: 'Roles',
      dataIndex: 'MemberRoles',
      key: 'MemberRoles',
      filters: roles.map((r) => ({ text: r.role, value: r.id as number })),
      render: (roles) => (
        <Popover
          placement="top"
          content={
            <Space size={[0, 8]} wrap>
              {roles.map((role: TRole) => (
                <Tag key={role.id as number}>{role.role}</Tag>
              ))}
            </Space>
          }
        >
          <div className="btn-merchant-user-roles h-6 w-4 cursor-pointer text-blue-500">
            {roles.length}
          </div>
        </Popover>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => MerchantUserStatus(s)
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => (d === 0 ? '―' : formatDate(d)) // dayjs(d * 1000).format('YYYY-MMM-DD')
    },
    {
      title: (
        <>
          <span>Actions</span>

          <Tooltip title="Invite member">
            <Button
              size="small"
              style={{ border: 'unset', marginLeft: '4px' }}
              onClick={toggleInviteModal}
              icon={<UserAddOutlined />}
            />
          </Tooltip>

          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ border: 'unset', marginLeft: '8px' }}
              disabled={loading}
              onClick={getMerchantUserList}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      width: 164,
      key: 'action',
      render: (_) => (
        <Space size="middle" className="member-action-btn-wrapper">
          <Tooltip title="View activities logs">
            <Button
              disabled={loading}
              style={{ border: 'unset' }}
              // onClick={() => goToDetail(record.id)}
              icon={<ProfileOutlined />}
            />
          </Tooltip>

          <Tooltip title="Suspend account">
            <Button
              className="btn-merchant-suspend"
              style={{ border: 'unset' }}
              disabled={loading}
              onClick={toggleSuspendModal}
              icon={<UserDeleteOutlined />}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const onTableChange: TableProps<IMerchantUserProfile>['onChange'] = (
    pagination,
    filters  ) => {
    setRoleFilters(filters as TFilters)
    onPageChange(1, PAGE_SIZE) // any search term, filters change should reset page to 1.
  }

  useEffect(() => {
    isMountingRef.current = true
  }, [])

  useEffect(() => {
    if (!isMountingRef.current) {
      getMerchantUserList()
    } else {
      isMountingRef.current = false
      fetchData()
    }
  }, [roleFilters, page])

  return (
    <div>
      {inviteModalOpen && (
        <InviteModal
          closeModal={toggleInviteModal}
          refresh={getMerchantUserList}
          userData={activeUser}
          roles={roles}
        />
      )}
      {suspendModalOpen && (
        <SuspendModal
          closeModal={toggleSuspendModal}
          refresh={getMerchantUserList}
          userData={activeUser}
        />
      )}
      {/* <Search form={form} goSearch={fetchData} searching={loading} /> */}
      {/* profileStore.isOwner && (
        <div className="my-2 flex justify-end">
          <Button type="primary" onClick={toggleInviteModal}>
            Invite
          </Button>
        </div>
      ) */}
      <Table
        columns={columns}
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
              if (!profileStore.isOwner) {
                // return
              }
              const tgt = evt.target
              if (
                tgt instanceof HTMLElement &&
                tgt.classList.contains('btn-merchant-user-roles')
              ) {
                setActiveUser(user)
                toggleInviteModal()
                return
              }

              if (
                tgt instanceof Element &&
                tgt.closest('.btn-merchant-suspend')
              ) {
                setActiveUser(user)
                toggleSuspendModal()
                return
              }
              // navigate(`${APP_PATH}admin/${user.id}`)
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
  userData: IMerchantUserProfile | undefined
  roles: TRole[]
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const isNew = userData == undefined

  const onConfirm = async () => {
    const body: any = form.getFieldsValue()
    setLoading(true)
    if (isNew) {
      const [res, err] = await inviteMemberReq(body)
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
    } else {
      const [res, err] = await updateMemberRolesReq({
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
        ? `An invitation email has been sent to ${form.getFieldValue('email')}`
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
              validator(value) {
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
  userData: IMerchantUserProfile | undefined
}) => {
  const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    if (userData == null) {
      return
    }
    setLoading(true)
    const [res, err] = await suspendMemberReq(userData!.id)
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
