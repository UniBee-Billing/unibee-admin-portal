import {
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Switch,
  Tooltip,
  message
} from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import update from 'immutability-helper'
import { ChangeEventHandler, useEffect, useState } from 'react'
import { PERMISSION_LIST } from '../../../constants'
import { ramdonString } from '../../../helpers'
import { deleteRoleReq, getRoleListReq, saveRoleReq } from '../../../requests'
import { TRole, TRolePermission } from '../../../shared.types'

const OWNER_ROLE: TRole = {
  localId: ramdonString(8),
  id: -1, // this is locally defined, not from backend, just to prevent name conflict, and notify users there is a builtin owner role.
  role: 'Owner',
  permissions: PERMISSION_LIST.map((p) => ({
    group: p.group,
    permissions: p.permissions
  }))
}

const Index = () => {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<TRole[]>([])
  const [errLocalId, setErrLocalId] = useState('')

  const fetchRoles = async () => {
    setErrLocalId('')
    setLoading(true)
    const [res, err] = await getRoleListReq(fetchRoles)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { merchantRoles } = res
    merchantRoles.forEach((r: TRole) => (r.localId = r.id + ''))
    merchantRoles.unshift(OWNER_ROLE)
    setRoles(merchantRoles)
  }

  const onSave = (r: TRole) => async () => {
    if (r.role == null || r.role.trim() == '') {
      message.error('Role name must not be empty')
      setErrLocalId(r.localId)
      return
    }
    if (
      roles.filter(
        (role) => role.role.trim().toLowerCase() == r.role.trim().toLowerCase()
      ).length > 1
    ) {
      message.error(`Role name "${r.role}" already exist`)
      setErrLocalId(r.localId)
      return
    }
    if (
      r.permissions == null ||
      r.permissions.length == 0 ||
      r.permissions.every((p) => p.permissions.length == 0)
    ) {
      message.error('Each role must have at least one permission')
      setErrLocalId(r.localId)
      return
    }
    // return
    setErrLocalId('')
    const role = JSON.parse(JSON.stringify(r))
    delete role.createTime
    delete role.localId
    delete role.merchantId
    setLoading(true)
    const [_, err] = await saveRoleReq(role, r.id == null)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`Role (${r.role}) saved`)
  }

  const onNewRole = () => {
    const newRole: TRole = {
      localId: ramdonString(8),
      role: '',
      permissions: []
    }
    setRoles(update(roles, { $push: [newRole] }))
  }

  const onDelete = (id: number) => async () => {
    setLoading(true)
    const [_, err] = await deleteRoleReq(id)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(`${roles.find((r) => r.id == id)?.role} deleted`)
    fetchRoles()
  }

  const onRoleNameChange =
    (localId: string): ChangeEventHandler<HTMLInputElement> =>
    (evt) => {
      const idx = roles.findIndex((r) => r.localId == localId)
      if (idx == -1) {
        return
      }
      setRoles(update(roles, { [idx]: { role: { $set: evt.target.value } } }))
    }

  const onPermChange =
    (localId: string, group: string) => (checked: boolean) => {
      const rowIdx = roles.findIndex((r) => r.localId == localId)

      if (rowIdx == -1) {
        return
      }
      const colIdx =
        roles[rowIdx].permissions == null
          ? -1
          : roles[rowIdx].permissions.findIndex((p) => p.group == group)

      let newRoles = roles
      if (colIdx == -1) {
        if (newRoles[rowIdx].permissions == null) {
          newRoles = update(newRoles, {
            [rowIdx]: { permissions: { $set: [] } }
          })
        }
        newRoles = update(newRoles, {
          [rowIdx]: {
            permissions: {
              $push: [{ group, permissions: checked ? ['access'] : [] }]
            }
          }
        })
      } else {
        newRoles = update(newRoles, {
          [rowIdx]: {
            permissions: {
              [colIdx]: { permissions: { $set: checked ? ['access'] : [] } }
            }
          }
        })
      }

      setRoles(newRoles)
    }

  const columns: ColumnsType<TRole> = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      fixed: 'left',
      width: 150,
      render: (r, record) =>
        record.id == -1 ? ( // this is Owner
          <span>{r}</span>
        ) : (
          <Input
            width={120}
            disabled={loading}
            value={record.role}
            onChange={onRoleNameChange(record.localId)}
            status={record.localId == errLocalId ? 'error' : ''}
          />
        )
    },
    ...PERMISSION_LIST.map((p) => ({
      title: p.label,
      dataIndex: 'permissions',
      key: p.group,
      with: p.width,
      render: (perm: TRole['permissions'], record: TRole) => {
        const g =
          perm == null
            ? undefined
            : perm.find((pm: TRolePermission) => pm.group == p.group)
        return (
          <Switch
            size="small"
            disabled={loading || record.id == -1} // Owner.id == -1 (locally defined, not from backend)
            onChange={onPermChange(record.localId, p.group)}
            checked={
              g != null && g.permissions != null && g.permissions.length > 0
            }
          />
        )
      }
    })),
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="New role">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={onNewRole}
              icon={<PlusOutlined />}
              disabled={loading}
            />
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchRoles}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
        </>
      ),
      width: 150,
      fixed: 'right',
      key: 'actions',
      render: (_, role) =>
        role.id == -1 ? null : (
          <Space
            size="small"
            className="invoice-action-btn-wrapper"
            // style={{ width: '170px' }}
          >
            <Tooltip title="Save">
              <Button
                onClick={onSave(role)}
                icon={<SaveOutlined />}
                style={{ border: 'unset' }}
                disabled={loading}
              />
            </Tooltip>
            <Tooltip title="Remove">
              <Popconfirm
                title="Deletion Confirm"
                description="Are you sure to delete this role?"
                onConfirm={onDelete(role.id as number)}
                showCancel={false}
                okText="Yes"
              >
                <Button
                  // onClick={onDelete(role.id as number)}
                  icon={<MinusOutlined />}
                  style={{ border: 'unset' }}
                  disabled={loading}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        )
    }
  ]

  useEffect(() => {
    fetchRoles()
  }, [])
  return (
    <>
      <Table
        columns={columns}
        dataSource={roles}
        rowKey={'localId'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        scroll={{ x: 1990 }}
        // onChange={onTableChange}
        /* onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('.plan-action-btn-wrapper') != null
              ) {
                return
              }
              navigate(`/plan/${record.id}`)
            }
          }
        }} */
      />
      {/* <div className="my-2 flex justify-end gap-4">
        <Button>Apply Change</Button>
        <Button onClick={onAddNewRole}>Add New Role</Button>
      </div> */}
    </>
  )
}

export default Index
