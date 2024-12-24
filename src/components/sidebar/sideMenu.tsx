import Icon, { TransactionOutlined } from '@ant-design/icons'
import { Menu, MenuProps, message } from 'antd'
import { ItemType, MenuItemType } from 'antd/es/menu/interface'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActivityLogSvg from '../../assets/navIcons/activityLog.svg?react'
import AdminListSvg from '../../assets/navIcons/adminList.svg?react'
import BillableMetricsSvg from '../../assets/navIcons/billableMetrics.svg?react'
import ConfigSvg from '../../assets/navIcons/config.svg?react'
import DiscountCodeSvg from '../../assets/navIcons/discountCode.svg?react'
import InvoiceSvg from '../../assets/navIcons/invoice.svg?react'
import MyAccountSvg from '../../assets/navIcons/myAccount.svg?react'
import ProductPlanSvg from '../../assets/navIcons/productPlan.svg?react'
import PromoCreditSvg from '../../assets/navIcons/promoCredit.svg?react'
import ReportSvg from '../../assets/navIcons/report.svg?react'
import SubscriptionSvg from '../../assets/navIcons/subscription.svg?react'
import UserListSvg from '../../assets/navIcons/userList.svg?react'
import { useCopyContent } from '../../hooks'
import { useAccessiblePages } from '../../hooks/useAccessiblePages'
import { APP_ROUTES } from '../../routes'
import { useProfileStore } from '../../stores'
import { basePathName, trimEnvBasePath } from '../../utils'
import './sideMenu.css'

const BASE_PATH = import.meta.env.BASE_URL
// console.log('base path: ', BASE_PATH)

const ContextMenu = ({ label, link }: { label: string; link: string }) => {
  const [clicked, setClicked] = useState(false)
  const [points, setPoints] = useState({
    x: 0,
    y: 0
  })
  useEffect(() => {
    const handleClick = () => setClicked(false)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <div>
      <div
        style={{ position: 'relative' }}
        onContextMenu={(e) => {
          e.preventDefault()
          setClicked(true)
          setPoints({
            x: e.pageX,
            y: e.pageY
          })
        }}
      >
        {label}
      </div>

      {clicked && (
        <div
          style={{
            borderRadius: '4px',
            padding: '6px',
            position: 'fixed',
            top: `${points.y}px`,
            left: `${points.x}px`,
            color: 'rgb(37, 37, 37)',
            background: 'rgb(237, 237, 237)',
            zIndex: 100000
          }}
        >
          <ul className="sidebar-nav-context-menu">
            <li
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setClicked(false)
                window.open(`${location.origin}${BASE_PATH}${link}`)
              }}
            >
              Open Link in New Tab
            </li>
            <li
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                setClicked(false)
                const url = `${location.origin}${BASE_PATH}${link}`
                const err = await useCopyContent(url)
                if (err != null) {
                  message.error('Copy Link failed')
                }
              }}
            >
              Copy Link
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

/*
const onRightClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
  e.preventDefault()
  if (!(e.target instanceof HTMLDivElement)) {
    return
  }
  if (e.nativeEvent.button === 2) {
    window.open(`${location.origin}${BASE_PATH}${e.target.dataset['link']}`)
  }
}
  */

const MENU_ITEMS: ItemType<MenuItemType>[] = [
  {
    // label: 'Product and Plan',
    // label: <a href={`${location.origin}/plan/list`}>Product and Plan</a>,
    /*
    label: (
      <div onContextMenu={onRightClick} data-link="plan/list">
        Product and Plan
      </div>
    ),
    */
    label: <ContextMenu label="Product and Plan" link="plan/list" />,
    key: 'plan',
    icon: <Icon component={ProductPlanSvg} />
  },
  {
    // label: 'Billable Metric',
    label: (
      <a href={`${location.origin}${BASE_PATH}billable-metric`}>
        Billable Metric
      </a>
    ),
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
    icon: <Icon component={SubscriptionSvg} />
  },
  { label: 'Invoice', key: 'invoice', icon: <Icon component={InvoiceSvg} /> },
  {
    label: 'Transaction',
    key: 'transaction',
    icon: <TransactionOutlined />
  },
  {
    label: 'Promo Credit',
    key: 'promoCredit',
    icon: <Icon component={PromoCreditSvg} />
  },
  { label: 'User List', key: 'user', icon: <Icon component={UserListSvg} /> },
  {
    label: 'Admin List',
    key: 'admin',
    icon: <Icon component={AdminListSvg} />
  },
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
