import Icon, {
  PieChartOutlined,
  TeamOutlined,
  TransactionOutlined
} from '@ant-design/icons'
import { Menu, MenuProps } from 'antd'
import { ItemType, MenuItemType } from 'antd/es/menu/interface'
import { useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActivityLogSvg from '../../assets/navIcons/activityLog.svg?react'
import BillableMetricsSvg from '../../assets/navIcons/billableMetrics.svg?react'
import ConfigSvg from '../../assets/navIcons/config.svg?react'
import DiscountCodeSvg from '../../assets/navIcons/discountCode.svg?react'
import InvoiceSvg from '../../assets/navIcons/invoice.svg?react'
import MyAccountSvg from '../../assets/navIcons/myAccount.svg?react'
import ProductPlanSvg from '../../assets/navIcons/productPlan.svg?react'
import ReportSvg from '../../assets/navIcons/report.svg?react'
import UserListSvg from '../../assets/navIcons/userList.svg?react'

import { useAccessiblePages } from '../../hooks/useAccessiblePages'
import { APP_ROUTES } from '../../routes'
import { useProfileStore } from '../../stores'
import { basePathName, trimEnvBasePath } from '../../utils'

const MENU_ITEMS: ItemType<MenuItemType>[] = [
  {
    label: 'Product and Plan',
    key: 'plan',
    icon: <Icon component={ProductPlanSvg} />
  },
  {
    label: 'Billable Metric',
    key: 'billable-metric',
    icon: <Icon component={BillableMetricsSvg} />
  },
  {
    label: 'Discount Code',
    key: 'discount-code',
    icon: <Icon component={DiscountCodeSvg} />
  },
  {
    label: 'Subscription',
    key: 'subscription',
    icon: <PieChartOutlined />
  },
  { label: 'Invoice', key: 'invoice', icon: <Icon component={InvoiceSvg} /> },
  {
    label: 'Transaction',
    key: 'transaction',
    icon: <TransactionOutlined />
  },
  { label: 'User List', key: 'user', icon: <Icon component={UserListSvg} /> },
  { label: 'Admin List', key: 'admin', icon: <TeamOutlined /> },
  // The backend of Analytics is not completed yet, so it should hide from the menu until backend is ready
  // { label: 'Analytics', key: 'analytics', icon: <PieChartOutlined /> },
  {
    label: 'My Account',
    key: 'my-account',
    icon: <Icon component={MyAccountSvg} />
  },
  {
    label: 'Report',
    key: 'report',
    icon: <Icon component={ReportSvg} />
  },
  {
    label: 'Configuration',
    key: 'configuration',
    icon: <Icon component={ConfigSvg} />
  },
  {
    label: 'Activity Logs',
    key: 'activity-logs',
    icon: <Icon component={ActivityLogSvg} />
  }
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
