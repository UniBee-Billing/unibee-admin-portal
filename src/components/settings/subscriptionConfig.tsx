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
}

const ConfigItem = ({
  title,
  children
}: PropsWithChildren<ConfigItemProps>) => (
  <div className="flex w-full items-center justify-between">
    <div>{title}</div>
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
      title: 'Should downgrade effect immediately',
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
      title: 'Upgrade proration',
      component: (
        <Config.Switch
          loading={loading}
          value={data?.upgradeProration}
          update={(checked) => updateData({ upgradeProration: checked })}
        />
      )
    },
    {
      title: 'Incomplete expire time',
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
      title: 'Invoice email',
      component: (
        <Config.Switch
          loading={loading}
          value={data?.invoiceEmail}
          update={(checked) => updateData({ invoiceEmail: checked })}
        />
      )
    },
    {
      title: 'Automatic payment period',
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
      title: 'Show zero invoice',
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
      {configs.map(({ component, title }) => (
        <List.Item>
          <ConfigItem key={title} title={title}>
            {component}
          </ConfigItem>
        </List.Item>
      ))}
    </List>
  )
}
