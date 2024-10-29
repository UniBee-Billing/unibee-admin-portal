import {
  BarChartOutlined,
  DesktopOutlined,
  IdcardOutlined,
  PieChartOutlined,
  ProfileOutlined,
  SettingOutlined,
  TeamOutlined,
  TransactionOutlined
} from '@ant-design/icons'
import { Menu, MenuProps } from 'antd'
import { ItemType, MenuItemType } from 'antd/es/menu/hooks/useItems'
import { useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccessiblePages } from '../../hooks/useAccessiblePages'
import { APP_ROUTES } from '../../routes'
import { useProfileStore } from '../../stores'
import { basePathName, trimEnvBasePath } from '../../utils'

const MENU_ITEMS: ItemType<MenuItemType>[] = [
  { label: 'Product and Plan', key: 'plan', icon: <DesktopOutlined /> },
  {
    label: 'Billable Metric',
    key: 'billable-metric',
    icon: <DesktopOutlined />
  },
  {
    label: 'Discount Code',
    key: 'discount-code',
    icon: <DesktopOutlined />
  },
  {
    label: 'Subscription',
    key: 'subscription',
    icon: <PieChartOutlined />
  },
  { label: 'Invoice', key: 'invoice', icon: <PieChartOutlined /> },
  {
    label: 'Transaction',
    key: 'transaction',
    icon: <TransactionOutlined />
  },
  { label: 'User List', key: 'user', icon: <IdcardOutlined /> },
  { label: 'Admin List', key: 'admin', icon: <TeamOutlined /> },
  { label: 'Analytics', key: 'analytics', icon: <PieChartOutlined /> },
  { label: 'My Account', key: 'my-account', icon: <IdcardOutlined /> },
  { label: 'Report', key: 'report', icon: <BarChartOutlined /> },
  {
    label: 'Configuration',
    key: 'configuration',
    icon: <SettingOutlined />
  },
  { label: 'Activity Logs', key: 'activity-logs', icon: <ProfileOutlined /> }
]

const DEFAULT_ACTIVE_MENU_ITEM_KEY = '/plan/list'

const parsedMenuItems: ItemType<MenuItemType>[] = MENU_ITEMS.map((item) => {
  const route = APP_ROUTES.find(({ id }) => id === item!.key)

  return route ? { ...item, key: route.path! } : undefined
}).filter((item) => !!item)

export const SideMenu = (props: MenuProps) => {
  const navigate = useNavigate()
  const [activeMenuItem, setActiveMenuItem] = useState<string[]>([
    DEFAULT_ACTIVE_MENU_ITEM_KEY
  ])
  const accessiblePages = useAccessiblePages()
  const profileStore = useProfileStore()
  const items = useMemo(
    () =>
      !profileStore.isOwner
        ? parsedMenuItems.filter((item) =>
            accessiblePages.find(
              (page) => page === basePathName((item?.key as string) ?? '')
            )
          )
        : parsedMenuItems,
    [profileStore.isOwner, accessiblePages]
  )

  useLayoutEffect(() => {
    setActiveMenuItem([basePathName(trimEnvBasePath(window.location.pathname))])
  }, [window.location.pathname])

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={activeMenuItem}
      onClick={(e) => navigate(e.key)}
      defaultSelectedKeys={['/plan/list']}
      items={items}
      style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
      {...props}
    />
  )
}
