import {
  BarChartOutlined,
  DesktopOutlined,
  IdcardOutlined,
  LogoutOutlined,
  PieChartOutlined,
  ProfileOutlined,
  SettingOutlined,
  TeamOutlined,
  TransactionOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Button, Layout, Menu, message, theme } from 'antd'
import React, { useEffect, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom'
import {
  useAppConfigStore,
  useMerchantInfoStore,
  usePermissionStore,
  useProductListStore,
  useProfileStore,
  useSessionStore
} from './stores'

import BillableMetricsDetail from './components/billableMetrics/detail'
import BillableMetricsList from './components/billableMetrics/list'
import DiscountCodeDetail from './components/discountCode/detail'
import DiscountCodeList from './components/discountCode/list'
import DiscountCodeUsage from './components/discountCode/usageDetail'
import InvoiceDetail from './components/invoice/detail'
import InvoiceList from './components/invoice/list'
import OutletPage from './components/outletPage'
import PaymentDetail from './components/payment/detail'
import PaymentList from './components/payment/list'
import PricePlanList from './components/plan'
import PlanDetail from './components/plan/detail'
import Settings from './components/settings/index'
import SubscriptionDetail from './components/subscription/detail'
import SubscriptionList from './components/subscription/list'
import CustomerDetail from './components/user/detail'
import CustomerList from './components/user/list'
// import Users from "./components/userList";
import { AboutUniBee } from './components/about/aboutUniBee'
import ActivityLogs from './components/activityLogs'
import AppSearch from './components/appSearch'
import Login from './components/login'
import LoginModal from './components/login/LoginModal'
import MerchantUserDetail from './components/merchantUser/userDetail'
import MerchantUserList from './components/merchantUser/userList'
import MyAccount from './components/myAccount/'
import NotFound from './components/notFound'
import Report from './components/report'
import WebhookLogs from './components/settings/webHooks/webhookLogs'
import Signup from './components/signup'
import TaskList from './components/taskList'
import { initializeReq, logoutReq } from './requests'

const { Header, Content, Footer, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label
  } as MenuItem
}

const APP_PATH = import.meta.env.BASE_URL // import.meta.env.VITE_APP_PATH;
const noSiderRoutes = [`${APP_PATH}login`, `${APP_PATH}signup`]

const App: React.FC = () => {
  const merchantInfoStore = useMerchantInfoStore()
  const permStore = usePermissionStore()
  const profileStore = useProfileStore()
  const sessionStore = useSessionStore()
  const appConfigStore = useAppConfigStore()
  const productsStore = useProductListStore()
  const [openLoginModal, setOpenLoginModal] = useState(false)
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [activeMenuItem, setActiveMenuItem] = useState<string[]>([
    window.location.pathname
  ])

  // const [openKeys, setOpenKeys] = useState<string[]>(["/subscription/list"]);
  // this is the default open keys after successful login.
  // const [openKeys, setOpenKeys] = useState<string[]>(["/subscription"]);
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const toggleTaskListOpen = () =>
    appConfigStore.setTaskListOpen(!appConfigStore.taskListOpen)

  let items: MenuItem[] = [
    getItem('Product and Plan', '/plan/list', <DesktopOutlined />),
    getItem('Billable Metric', '/billable-metric/list', <DesktopOutlined />),
    getItem('Discount Code', '/discount-code/list', <DesktopOutlined />),
    getItem('Subscription', '/subscription/list', <PieChartOutlined />),
    getItem('Invoice', '/invoice/list', <PieChartOutlined />),
    getItem('Transaction', '/transaction/list', <TransactionOutlined />),
    getItem('User List', '/user/list', <IdcardOutlined />),
    getItem('Admin List', '/admin/list', <TeamOutlined />),
    getItem('My Account', '/my-account', <IdcardOutlined />),
    getItem('Report', '/report', <BarChartOutlined />),
    getItem('Configuration', '/configuration', <SettingOutlined />),
    getItem('Activity Logs', '/activity-logs', <ProfileOutlined />)
  ]

  const accessiblePages: string[] = []
  profileStore.MemberRoles.forEach((r) =>
    r.permissions.forEach(
      (p) => p.permissions.length > 0 && accessiblePages.push(p.group)
    )
  )

  if (!profileStore.isOwner) {
    items = items.filter(
      (i) =>
        accessiblePages.findIndex(
          (a) => a == (i?.key as string).split('/')[1]
        ) != -1
    )
  }

  const defaultPage = () => {
    if (profileStore.isOwner) {
      return 'subscription'
    }
    if (accessiblePages.findIndex((p) => p == 'subscription') != -1) {
      return 'subscription'
    } else {
      return accessiblePages[0]
    }
  }

  const navigate = useNavigate()

  const onItemClick = ({ key }: { key: string; needNavigate?: boolean }) => {
    navigate(`${APP_PATH}${key.substring(1)}`) // remove the leading '/' character, coz APP_PATH already has it
    setActiveMenuItem([key])
  }

  const logout = async () => {
    const [_, err] = await logoutReq()
    if (null != err) {
      message.error(err.message)
      return
    }
    sessionStore.reset()
    profileStore.reset()
    merchantInfoStore.reset()
    appConfigStore.reset()
    permStore.reset()
    localStorage.removeItem('merchantToken')
    localStorage.removeItem('appConfig')
    localStorage.removeItem('merchantInfo')
    localStorage.removeItem('session')
    localStorage.removeItem('profile')
    localStorage.removeItem('permissions')
    navigate(`${APP_PATH}login`)
  }

  useEffect(() => {
    const pathItems = location.pathname.split('/').filter((p) => p != '')
    if (pathItems[0] == 'subscription') {
      setActiveMenuItem(['/subscription/list'])
    } else if (pathItems[0] == 'plan') {
      setActiveMenuItem(['/plan/list'])
    } else if (pathItems[0] == 'user') {
      setActiveMenuItem(['/user/list'])
    } else if (pathItems[0] == 'admin') {
      setActiveMenuItem(['/admin/list'])
    } else if (pathItems[0] == 'invoice') {
      setActiveMenuItem(['/invoice/list'])
    } else if (pathItems[0] == 'transaction') {
      setActiveMenuItem(['/transaction/list'])
    } else if (pathItems[0] == 'discount-code') {
      setActiveMenuItem(['/discount-code/list'])
    } else if (pathItems[0] == 'billable-metric') {
      setActiveMenuItem(['/billable-metric/list'])
    } else if (pathItems[0] == 'configuration') {
      setActiveMenuItem(['/configuration'])
    } else if (pathItems[0] == 'activity-logs') {
      setActiveMenuItem(['/activity-logs'])
    } else if (pathItems[0] == 'report') {
      setActiveMenuItem(['/report'])
    } else {
      setActiveMenuItem(['/' + pathItems[0]])
    }
  }, [location, location.pathname])

  useEffect(() => {
    if (sessionStore.expired) {
      if (null == profileStore.id || window.redirectToLogin) {
        // is it better to use email?
        navigate(`${APP_PATH}login`)
      } else {
        setOpenLoginModal(true)
      }
    } else {
      setOpenLoginModal(false)
    }
  }, [sessionStore.expired])

  useEffect(() => {
    // detect reload
    const init = async () => {
      const navigationEntries =
        window.performance.getEntriesByType('navigation')
      if (
        navigationEntries.length > 0 &&
        (navigationEntries[0] as PerformanceNavigationTiming).type === 'reload'
      ) {
        const [initRes, errInit] = await initializeReq()

        if (null != errInit) {
          return
        }
        const { appConfig, gateways, merchantInfo, products } = initRes
        appConfigStore.setAppConfig(appConfig)
        appConfigStore.setGateway(gateways)
        merchantInfoStore.setMerchantInfo(merchantInfo.merchant)
        productsStore.setProductList({ list: products.products })
        permStore.setPerm({
          role: merchantInfo.merchantMember.role,
          permissions: merchantInfo.merchantMember.permissions
        })
      }
    }
    init()
  }, [])

  return (
    <>
      {noSiderRoutes.findIndex((r) => r == location.pathname) != -1 ? (
        <Layout style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path={`${APP_PATH}login`} Component={Login} />
            <Route path={`${APP_PATH}signup`} Component={Signup} />
          </Routes>
        </Layout>
      ) : (
        <Layout style={{ minHeight: '100vh' }}>
          {openLoginModal && <LoginModal email={profileStore.email} />}
          <Sider
            // theme="light"
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <div className="demo-logo-vertical" />
            <div
              style={{
                color: '#FFF',
                display: 'flex',
                justifyContent: 'center',
                margin: '16px 0'
              }}
            >
              <img
                src={
                  merchantInfoStore.companyLogo ||
                  APP_PATH + 'logoPlaceholder.png'
                }
                height={'80px'}
              />
            </div>
            <Menu
              theme="dark"
              selectedKeys={activeMenuItem}
              mode="inline"
              items={items}
              style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
              onClick={onItemClick}
            />
            <div className="absolute bottom-20 flex w-full flex-col items-center justify-center text-gray-50">
              <div className="flex flex-col items-center">
                <div className="text-xs">{profileStore.email}</div>
                <div>{`${profileStore.firstName} ${profileStore.lastName}`}</div>
                <div className="text-xs text-gray-400">
                  {profileStore.isOwner
                    ? 'Owner'
                    : profileStore.MemberRoles.map((r) => (
                        <div key={r.role} className="flex justify-center">
                          {r.role}
                        </div>
                      ))}
                </div>
              </div>
              <AboutUniBee></AboutUniBee>
              <div
                onClick={logout}
                className="my-4 cursor-pointer text-red-400"
              >
                <LogoutOutlined />
                &nbsp;&nbsp;Logout
              </div>
            </div>
          </Sider>
          {appConfigStore.taskListOpen && (
            <TaskList onClose={toggleTaskListOpen} />
          )}
          <Layout>
            <Header style={{ background: colorBgContainer }}>
              <div className="flex h-full items-center justify-between">
                <AppSearch />
                <Button
                  onClick={toggleTaskListOpen}
                  icon={<UnorderedListOutlined />}
                >
                  Tasks
                </Button>
              </div>
            </Header>
            <Content
              style={{
                padding: '16px',
                height: 'calc(100vh - 180px)',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  padding: 24,
                  minHeight: 360,
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG
                  // height: "100%",
                }}
              >
                <Routes>
                  <Route path="*" Component={NotFound} />
                  <Route
                    path={APP_PATH}
                    element={<Navigate to={`${APP_PATH}${defaultPage()}`} />} // default page after login
                  />
                  {app_routes
                    .filter((r) =>
                      profileStore.isOwner
                        ? true
                        : accessiblePages.findIndex((p) => p == r.page) != -1
                    )
                    .map((r) => r.route)}
                </Routes>
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>Copyright © 2024</Footer>
          </Layout>
        </Layout>
      )}
    </>
  )
}

export default App

const app_routes = [
  {
    page: 'my-account',
    route: (
      <Route
        key="my-account"
        path={`${APP_PATH}my-account`}
        Component={MyAccount}
      />
    )
  },
  {
    page: 'configuration',
    route: (
      <Route
        key="configuration"
        path={`${APP_PATH}configuration`}
        Component={Settings}
      />
    )
  },
  {
    page: 'configuration',
    route: (
      <Route
        key="configuration-webhook-logs"
        path={`${APP_PATH}configuration/webhook-logs/:id`}
        element={<WebhookLogs />}
      />
    )
  },
  {
    page: 'subscription',
    route: (
      <Route
        key="subscription-top"
        path={`${APP_PATH}subscription`}
        element={<SubscriptionList />}
      />
    )
  },
  {
    page: 'subscription',
    route: (
      <Route
        key="subscription"
        path={`${APP_PATH}subscription`}
        Component={OutletPage}
      >
        <Route path="list" element={<SubscriptionList />} />
        <Route path=":subscriptionId" element={<SubscriptionDetail />} />
      </Route>
    )
  },
  {
    page: 'plan',
    route: (
      <Route
        key="plan-top"
        path={`${APP_PATH}/plan`}
        element={<PricePlanList />}
      />
    )
  },
  {
    page: 'plan',
    route: (
      <Route key="plan" path={`${APP_PATH}plan`} Component={OutletPage}>
        <Route path="list" element={<PricePlanList />} />
        <Route path="new" element={<PlanDetail />} />
        <Route path=":planId" element={<PlanDetail />} />
      </Route>
    )
  },
  {
    page: 'billable-metric',
    route: (
      <Route
        key="billable-metric-top"
        path={`${APP_PATH}billable-metric`}
        element={<BillableMetricsList />}
      />
    )
  },
  {
    page: 'billable-metric',
    route: (
      <Route
        key="billable-metric"
        path={`${APP_PATH}billable-metric`}
        Component={OutletPage}
      >
        <Route path="list" element={<BillableMetricsList />} />
        <Route path="new" element={<BillableMetricsDetail />} />
        <Route path=":metricsId" element={<BillableMetricsDetail />} />
      </Route>
    )
  },
  {
    page: 'discount-code',
    route: (
      <Route
        key="discount-code-top"
        path={`${APP_PATH}discount-code`}
        element={<DiscountCodeList />}
      />
    )
  },
  {
    page: 'discount-code',
    route: (
      <Route
        key="discount-code"
        path={`${APP_PATH}discount-code`}
        Component={OutletPage}
      >
        <Route path="list" element={<DiscountCodeList />} />
        <Route path="new" element={<DiscountCodeDetail />} />
        <Route path=":discountCodeId" element={<DiscountCodeDetail />} />
        <Route
          path=":discountCodeId/usage-detail"
          element={<DiscountCodeUsage />}
        />
      </Route>
    )
  },
  {
    page: 'user',
    route: (
      <Route
        key="user-top"
        path={`${APP_PATH}user`}
        element={<CustomerList />}
      />
    )
  },
  {
    page: 'user',
    route: (
      <Route key="user" path={`${APP_PATH}user`} Component={OutletPage}>
        <Route path="list" element={<CustomerList />} />
        <Route path=":userId" element={<CustomerDetail />} />
      </Route>
    )
  },
  {
    page: 'admin',
    route: (
      <Route
        key="admin-top"
        path={`${APP_PATH}admin`}
        element={<MerchantUserList />}
      />
    )
  },
  {
    page: 'admin',
    route: (
      <Route key="admin" path={`${APP_PATH}admin`} Component={OutletPage}>
        <Route path="list" element={<MerchantUserList />} />
        <Route path=":adminId" element={<MerchantUserDetail />} />
      </Route>
    )
  },
  {
    page: 'invoice',
    route: (
      <Route
        key="invoice-top"
        path={`${APP_PATH}invoice`}
        element={<InvoiceList />}
      />
    )
  },
  {
    page: 'invoice',
    route: (
      <Route key="invoice" path={`${APP_PATH}invoice`} Component={OutletPage}>
        <Route path="list" element={<InvoiceList />} />
        <Route path=":invoiceId" element={<InvoiceDetail />} />
      </Route>
    )
  },
  {
    page: 'transaction',
    route: (
      <Route
        key="tx-top"
        path={`${APP_PATH}transaction`}
        element={<PaymentList />}
      />
    )
  },
  {
    page: 'transaction',
    route: (
      <Route key="tx" path={`${APP_PATH}transaction`} Component={OutletPage}>
        <Route path="list" element={<PaymentList />} />
        <Route path=":paymentId" element={<PaymentDetail />} />
      </Route>
    )
  },
  {
    page: 'activity-logs',
    route: (
      <Route
        key="activity-logs"
        path={`${APP_PATH}activity-logs`}
        element={<ActivityLogs />}
      />
    )
  },
  {
    page: 'report',
    route: (
      <Route key="report" path={`${APP_PATH}report`} element={<Report />} />
    )
  }
]
