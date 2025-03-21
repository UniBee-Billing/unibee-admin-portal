import { useMemo } from 'react'
import { Navigate, Outlet, RouteObject, useRoutes } from 'react-router-dom'
import ActivityLogs from './components/activityLogs'
import Analytics from './components/analytics'
import BillableMetricsDetail from './components/billableMetrics/detail'
import BillableMetricsList from './components/billableMetrics/list'
import PromoCredits from './components/credit'
import DiscountCodeDetail from './components/discountCode/detail'
import { DiscountCodeList } from './components/discountCode/list'
import DiscountCodeUsage from './components/discountCode/usageDetail'
import InvoiceDetail from './components/invoice/detail'
import InvoiceList from './components/invoice/list'
import MerchantUserDetail from './components/merchantUser/userDetail'
import MerchantUserList from './components/merchantUser/userList'
import MyAccount from './components/myAccount/'
import PaymentDetail from './components/payment/detail'
import PaymentList from './components/payment/list'
import PricePlanList from './components/plan'
import PlanDetail from './components/plan/detail/index'
import { ReportPage } from './components/report'
import Settings from './components/settings/index'
import WebhookLogs from './components/settings/webHooks/webhookLogs'
import SubscriptionDetail from './components/subscription/detail'
import SubscriptionList from './components/subscription/list'
import CustomerDetail from './components/user/detail'
import CustomerList from './components/user/list'
import { useMerchantMemberProfileStore, usePermissionStore } from './stores'

export const APP_ROUTES: RouteObject[] = [
  {
    id: 'my-account',
    path: 'my-account',
    element: <MyAccount />
  },
  {
    id: 'analytics',
    path: 'revenue',
    element: <Analytics />
  },
  {
    id: 'configuration',
    path: 'configuration',
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <Settings />
      },
      {
        path: 'webhook-logs/:id',
        element: <WebhookLogs />
      }
    ]
  },
  {
    id: 'subscription',
    path: 'subscription',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="list" replace /> },
      {
        path: 'list',
        element: <SubscriptionList />
      },
      {
        path: ':subscriptionId',
        element: <SubscriptionDetail />
      }
    ]
  },
  {
    id: 'plan',
    path: 'plan',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="list" replace /> },
      {
        path: 'list',
        element: <PricePlanList />
      },
      {
        path: 'new',
        element: <PlanDetail />
      },
      { path: ':planId', element: <PlanDetail /> }
    ]
  },
  {
    id: 'billable-metric',
    path: 'billable-metric',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="list" replace /> },
      {
        path: 'list',
        element: <BillableMetricsList />
      },
      {
        path: 'new',
        element: <BillableMetricsDetail />
      },
      {
        path: ':metricsId',
        element: <BillableMetricsDetail />
      }
    ]
  },
  {
    id: 'discount-code',
    path: 'discount-code',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="list" replace /> },
      {
        path: 'list',
        element: <DiscountCodeList />
      },
      {
        path: 'new',
        element: <DiscountCodeDetail />
      },
      { path: ':discountCodeId', element: <DiscountCodeDetail /> },
      { path: ':discountCodeId/usage-detail', element: <DiscountCodeUsage /> }
    ]
  },
  {
    id: 'user',
    path: 'user',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="list" replace /> },
      {
        path: 'list',
        element: <CustomerList />
      },
      {
        path: ':userId',
        element: <CustomerDetail />
      }
    ]
  },
  {
    id: 'admin',
    path: 'admin',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="list" replace /> },
      {
        path: 'list',
        element: <MerchantUserList />
      },
      {
        path: ':adminId',
        element: <MerchantUserDetail />
      }
    ]
  },
  {
    id: 'invoice',
    path: 'invoice',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="list" replace /> },
      {
        path: 'list',
        element: <InvoiceList />
      },
      {
        path: ':invoiceId',
        element: <InvoiceDetail />
      }
    ]
  },
  {
    id: 'transaction',
    path: 'transaction',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="list" replace /> },
      {
        path: 'list',
        element: <PaymentList />
      },
      {
        path: ':paymentId',
        element: <PaymentDetail />
      }
    ]
  },
  {
    id: 'promo-credit',
    path: 'promo-credit',
    element: <PromoCredits />
  },
  {
    id: 'activity-logs',
    path: 'activity-logs',
    element: <ActivityLogs />
  },
  {
    id: 'report',
    path: 'report',
    element: <ReportPage />
  }
]

export const useAppRoutesConfig = () => {
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const permStore = usePermissionStore()

  return useMemo(
    () =>
      APP_ROUTES.filter(
        ({ id }) =>
          merchantMemberProfile.isOwner ||
          permStore.permissions.find((p) => p == id)
      ).concat(
        {
          id: 'root-path',
          path: '/',
          element: <Navigate to={permStore.defaultPage} replace />
        }
        // { id: 'not-found', path: '*', element: <NotFound /> } // catch-all NOT-FOUND has to be defined in the last item.
      ),
    [merchantMemberProfile.isOwner, permStore]
  )
}

export const useAppRoutes = () => {
  const appRoutesConfig = useAppRoutesConfig()
  return useRoutes(appRoutesConfig)
}
