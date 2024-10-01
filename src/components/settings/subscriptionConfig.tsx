import { List } from 'antd'
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
        request.post('/merchant/subscription/config/update', payload)
        return data
      }
    }
  )
  const updateData = (updatedData: Partial<SubscriptionConfig>) =>
    setData({ ...data!, ...updatedData }, updatedData)

  const configs = [
    {
      title: 'Immediate Downgrade',
      description:
        'By default, the downgrades takes effect at the end of the period',
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
      description: 'Upgrades will generate prorated invoice by default',
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
        'The period during which subscription remains in “incomplete”',
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
      title: 'Enable Invoice Email',
      description: 'Toggle to send invoice email to customers',
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
        'Time Difference for Auto-Payment Activation Before Period End',
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
      title: 'Display Invoices With Zero Amount',
      description: 'Invoice With Zero Amount will hidden in list by default',
      component: (
        <Config.Switch
          loading={loading}
          value={data?.showZeroInvoice}
          update={(checked) => updateData({ showZeroInvoice: checked })}
        />
      )
    }
  ]

  return (
    <List>
      {configs.map(({ component, title, description }) => (
        <List.Item>
          <ConfigItem key={title} title={title} description={description}>
            {component}
          </ConfigItem>
        </List.Item>
      ))}
    </List>
  )
}
