import { List, message } from 'antd'
import { PropsWithChildren } from 'react'
import { useFetch } from '../../hooks'
import { request } from '../../requests/client'
import { Config } from './components'

interface SubscriptionConfig {
  downgradeEffectImmediately: boolean
  upgradeProration: boolean
  incompleteExpireTime: number
  invoiceEmail: boolean
  tryAutomaticPaymentBeforePeriodEnd: number
  showZeroInvoice: boolean
}

interface ConfigItemProps {
  title: string
  description?: string
}

const ConfigItem = ({
  title,
  description,
  children
}: PropsWithChildren<ConfigItemProps>) => (
  <div className="flex w-full items-center justify-between">
    <div>
      <div className="text-sm">{title}</div>
      {description && (
        <div className="text-xs text-gray-400">{description}</div>
      )}
    </div>
    <div>{children}</div>
  </div>
)

export const SubscriptionConfig = () => {
  const { data, setData, loading } = useFetch<SubscriptionConfig>(
    '/merchant/subscription/config',
    async (url) => {
      const {
        data: {
          data: { config }
        }
      } = await request.get(url)

      return config
    },
    {
      optimistic: true,
      updateRemoteSourceFunction: async (
        payload: Partial<SubscriptionConfig>,
        data: SubscriptionConfig
      ) => {
        await request.post('/merchant/subscription/config/update', payload)

        message.success('The changes has been applied')

        return data
      },
      onError: (err) => {
        message.error(err.message)
      }
    }
  )
  const updateData = (updatedData: Partial<SubscriptionConfig>) =>
    setData({ ...data!, ...updatedData }, updatedData)

  const configs = [
    {
      title: 'Enable Immediate Downgrade',
      description:
        'By default, downgrades in UniBee take effect at the end of the current billing cycle. Enabling Immediate Downgrade allows users to apply a downgrade as soon as they request it, without waiting for the cycle to end',
      component: (
        <Config.Switch
          loading={loading}
          value={data?.downgradeEffectImmediately}
          update={(checked) => {
            updateData({ downgradeEffectImmediately: checked })
          }}
        />
      )
    },
    {
      title: 'Prorated Upgrade Invoices',
      description:
        'By default, upgrades will automatically generate a prorated invoice based on the remaining billing period',
      component: (
        <Config.Switch
          loading={loading}
          value={data?.upgradeProration}
          update={(checked) => updateData({ upgradeProration: checked })}
        />
      )
    },
    {
      title: ' Incomplete Status Duration',
      description:
        'The duration for which a subscription remains in the "incomplete" status',
      component: (
        <Config.InputNumber
          loading={loading}
          value={data?.incompleteExpireTime}
          suffix="s"
          update={(value) => updateData({ incompleteExpireTime: value })}
        />
      )
    },
    {
      title: 'Enable UniBee Billing Emails',
      description:
        'Turn this on to automatically send billing emails to your users',
      component: (
        <Config.Switch
          loading={loading}
          value={data?.invoiceEmail}
          update={(checked) => updateData({ invoiceEmail: checked })}
        />
      )
    },
    {
      title: 'Auto-Charge Start Time Before Period End (Default 2 hours)',
      description:
        'The time interval before the period ends when auto-payment is triggered. Default set up is 2 hours in UniBee',
      component: (
        <Config.InputNumber
          loading={loading}
          value={data?.tryAutomaticPaymentBeforePeriodEnd}
          suffix="s"
          update={(value) =>
            updateData({ tryAutomaticPaymentBeforePeriodEnd: value })
          }
        />
      )
    },
    {
      title: 'Hide Zero Value Invoices',
      description:
        'By default, UniBee generates and displays invoices with a zero balance. Enable this option to hide invoices with a value of zero',
      component: (
        <Config.Switch
          loading={loading}
          value={!data?.showZeroInvoice}
          update={(isHideZeroInvoice) =>
            updateData({ showZeroInvoice: !isHideZeroInvoice })
          }
        />
      )
    }
  ]

  return (
    <List>
      {configs.map(({ component, title, description }, idx: number) => (
        <List.Item key={idx}>
          <ConfigItem key={title} title={title} description={description}>
            {component}
          </ConfigItem>
        </List.Item>
      ))}
    </List>
  )
}
