import Icon, { QuestionCircleOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Input,
  List,
  message,
  Row,
  Select,
  Switch,
  Tooltip
} from 'antd'
import { PropsWithChildren, useEffect, useState } from 'react'
import ExchangeIcon from '../../assets/exchange.svg?react'
import { numBoolConvert } from '../../helpers'
import { useFetch } from '../../hooks'
import { getCreditConfigListReq } from '../../requests'
import { request } from '../../requests/client'
import { CreditType, TCreditConfig } from '../../shared.types'
import { useMerchantInfoStore } from '../../stores'
import { Config } from './components'

/*
export type TCreditConfig = {
  id: number
  merchantId: number
  createTime: number
  name: string
  description: string
  type: CreditType
  discountCodeExclusive: 0 | 1 | boolean // 1 | 0(bool like), allow credit and discount be used together
  currency: string
  exchangeRate: number
  payoutEnable: 0 | 1 | boolean // 1 | 0 (bool like), global switch to enable/disable credit use
  recurring: 0 | 1 | boolean
  rechargeEnable: 0 | 1 | boolean // bool like, only used for type: 1
  previewDefaultUsed: 0 | 1 | boolean // 1(used) | 0(not used), bool like. in purchase preview, if not specified whether or not use credit, this default value is assumed.
}
*/

const Index = () => {
  const [creditConfigList, setCreditConfigList] = useState<TCreditConfig[]>([])
  const [loading, setLoading] = useState(false)
  const merchantStore = useMerchantInfoStore()

  const defaultCreditConfig: TCreditConfig = {
    id: -1,
    merchantId: merchantStore.id,
    createTime: Math.round(new Date().getTime() / 1000),
    name: 'default credit config',
    description: 'default credit config',
    type: CreditType.PROMO_CREDIT,
    discountCodeExclusive: true,
    currency: 'EUR',
    exchangeRate: 0,
    payoutEnable: true,
    recurring: true,
    rechargeEnable: false,
    previewDefaultUsed: false
  }

  const getCreditConfigList = async () => {
    setLoading(true)
    const [creditConfigs, err] = await getCreditConfigListReq({
      types: [CreditType.PROMO_CREDIT],
      currency: 'EUR'
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    console.log('res: ', creditConfigs)
    if (creditConfigs == null || creditConfigs.length == 0) {
      setCreditConfigList([defaultCreditConfig])
    } else {
      creditConfigs.forEach((c: TCreditConfig) => {
        c.payoutEnable = numBoolConvert(c.payoutEnable)
        c.discountCodeExclusive = numBoolConvert(c.discountCodeExclusive)
        c.recurring = numBoolConvert(c.recurring)
      })
      setCreditConfigList(creditConfigs)
    }
  }

  useEffect(() => {
    getCreditConfigList()
  }, [])

  return creditConfigList.map((c) => <CreditConfigItems items={c} />)
}

const CreditConfigItems = ({ items }: { items: TCreditConfig }) => {
  const [creditConfig, setCreditConfig] = useState<TCreditConfig>(items)
  const [loading, setLoading] = useState(false)
  const [exCurrency, setExCurrency] = useState('EUR')
  const [editingExchange, setEditingExchange] = useState(false)
  // const
  const CurrencySelector = ({ disabled }: { disabled?: boolean }) => (
    <Select
      disabled={!!disabled || loading}
      value={creditConfig.currency}
      style={{ width: '100px' }}
      options={[
        { label: 'EUR(€)', value: 'EUR' }
        // { label: 'USD($)', value: 'USD' }
      ]}
    />
  )

  const toggleEditApply = () => {
    if (!editingExchange) {
      setEditingExchange(true)
      return
    }
    setEditingExchange(false)
  }

  const configItems = [
    {
      title: 'Enable Promo Credits',
      description: '',
      content: (
        <Switch
          loading={loading}
          checked={creditConfig?.payoutEnable as boolean}
        />
      )
    },
    {
      title: 'Exchange Rate',
      description: (
        <div className="flex w-2/3 flex-col gap-3">
          <Row>
            <Col span={6}>Promo Credits</Col>
            <Col span={2}></Col>
            <Col span={6}>Value</Col>
            <Col span={6} className="ml-3">
              Currency
            </Col>
          </Row>
          <Row>
            <Col span={6}>
              <Input style={{ width: '100%' }} disabled={!editingExchange} />
            </Col>
            <Col span={2} className="flex items-center justify-center">
              <div className="mx-2">
                <Icon component={ExchangeIcon} />
              </div>
            </Col>
            <Col span={6}>
              <Input style={{ width: '100%' }} disabled={!editingExchange} />
            </Col>
            <Col span={6} className="ml-3">
              <CurrencySelector disabled={!editingExchange} />
            </Col>
          </Row>
        </div>
      ),
      content: (
        <Button
          onClick={toggleEditApply}
          type={editingExchange ? 'primary' : 'default'}
        >
          {editingExchange ? 'Apply' : 'Edit'}
        </Button>
      )
    },
    {
      title: (
        <div>
          <span>
            Apply both Promo Credit and Discount Code in one invoice.&nbsp;
          </span>
          <Tooltip
            placement="right"
            title="By default, you can allow both Promo Credit and Discount Code be used in one invoice."
          >
            <QuestionCircleOutlined />
          </Tooltip>
        </div>
      ),
      description: '',
      content: (
        <Switch
          loading={loading}
          checked={creditConfig?.discountCodeExclusive as boolean}
        />
      )
    },

    {
      title: 'Allow auto-apply promo credits to the next invoice',
      description: '',
      content: (
        <Switch
          loading={loading}
          checked={creditConfig?.recurring as boolean}
        />
      )
    }
  ]

  return (
    <List
      dataSource={configItems}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta title={item.title} description={item.description} />
          <div>{item.content}</div>
        </List.Item>
      )}
    ></List>
  )
}

export default Index
