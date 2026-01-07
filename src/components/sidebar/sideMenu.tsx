import ActivityLogSvg from '@/assets/navIcons/activityLog.svg?react'
import AdminListSvg from '@/assets/navIcons/adminList.svg?react'
import BillableMetricsSvg from '@/assets/navIcons/billableMetrics.svg?react'
import ConfigSvg from '@/assets/navIcons/config.svg?react'
import DiscountCodeSvg from '@/assets/navIcons/discountCode.svg?react'
import InvoiceSvg from '@/assets/navIcons/invoice.svg?react'
import MyAccountSvg from '@/assets/navIcons/myAccount.svg?react'
import ProductPlanSvg from '@/assets/navIcons/productPlan.svg?react'
import PromoCreditSvg from '@/assets/navIcons/promoCredit.svg?react'
import ReportSvg from '@/assets/navIcons/report.svg?react'
import SubscriptionSvg from '@/assets/navIcons/subscription.svg?react'
import UserListSvg from '@/assets/navIcons/userList.svg?react'
import RefundSvg from '@/assets/refund.svg?react'
import { APP_ROUTES } from '@/routes'
import { useMerchantMemberProfileStore, usePermissionStore } from '@/stores'
import { basePathName, trimEnvBasePath } from '@/utils'
import Icon, { DollarOutlined } from '@ant-design/icons'
import { Menu, MenuProps } from 'antd'
import { ItemType, MenuItemType } from 'antd/es/menu/interface'
import { MouseEvent, useLayoutEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './sideMenu.css'

const BASE_PATH = import.meta.env.BASE_URL

// Custom link component to handle both client-side navigation and preserving right-click behavior
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const navigate = useNavigate();
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Only navigate using react-router for left clicks without modifier keys
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation(); // Stop propagation to prevent Menu's onClick from also firing
      navigate(to);
    }
  };

  return (
    <a 
      href={`${location.origin}${BASE_PATH}${to}`}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

const MENU_ITEMS: ItemType<MenuItemType>[] = [
  {
    label: 'Product and Plan',
    key: 'plan',
    icon: <Icon component={ProductPlanSvg} />
  },
  /*
  {
    label: 'Analytics',
    key: 'analytics',
    icon: <Icon component={ProductPlanSvg} />
  },
  */
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
  /*{
    label: 'Bulk Discount Code',
    key: 'bulk-discount-code',
    icon: <Icon component={DiscountCodeSvg} />
  },*/
  {
    label: (
      <NavLink to="subscription/list">
        Subscription
      </NavLink>
    ),
    key: 'subscription',
    icon: <Icon component={SubscriptionSvg} />
  },
  {
    label: <NavLink to="invoice/list">Invoice</NavLink>,
    key: 'invoice',
    icon: <Icon component={InvoiceSvg} />
  },
  {
    label: 'Transaction',
    key: 'transaction',
    icon: <DollarOutlined />
  },
  {
    label: 'Refund',
    key: 'refund',
    icon: <Icon component={RefundSvg} />
  },
  {
    label: 'Promo Credit',
    key: 'promo-credit',
    icon: <Icon component={PromoCreditSvg} />
  },
  {
    label: <NavLink to="user/list">User List</NavLink>,
    key: 'user',
    icon: <Icon component={UserListSvg} />
  },
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

export const SideMenu = (props: MenuProps) => {
  const permStore = usePermissionStore()
  const navigate = useNavigate()
  const parsedMenuItems: ItemType<MenuItemType>[] = MENU_ITEMS.map((item) => {
    const route = APP_ROUTES.find(({ id }) => id === item!.key)

    return route ? { ...item, key: route.path! } : undefined
  }).filter((item) => !!item)
  const [activeMenuItem, setActiveMenuItem] = useState<string[]>([
    DEFAULT_ACTIVE_MENU_ITEM_KEY
  ])
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const items = useMemo(
    () =>
      !merchantMemberProfile.isOwner
        ? parsedMenuItems.filter((item) =>
            permStore.permissions.find(
              (page) => page === basePathName((item?.key as string) ?? '')
            )
          )
        : parsedMenuItems,
    [merchantMemberProfile.isOwner, permStore.permissions]
  )

  useLayoutEffect(() => {
    const path = basePathName(trimEnvBasePath(window.location.pathname));
    
    // Handle the special case for custom NavLink paths
    let activeKey = path;
    
    // Map paths like 'subscription/list' to just 'subscription' for menu highlighting
    if (path.startsWith('subscription/')) {
      activeKey = 'subscription';
    } else if (path.startsWith('invoice/')) {
      activeKey = 'invoice';
    } else if (path.startsWith('user/')) {
      activeKey = 'user';
    }
    
    setActiveMenuItem([activeKey]);
  }, [window.location.pathname])

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={activeMenuItem}
      onClick={(e) => {
        // Check if the key belongs to an item with a NavLink
        const isNavLinkItem = ['subscription', 'invoice', 'user'].includes(basePathName(e.key));
        // Only navigate for non-NavLink items
        if (!isNavLinkItem) {
          navigate(e.key);
        }
      }}
      defaultSelectedKeys={['/plan/list']}
      items={items}
      style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}
      {...props}
    />
  )
}
