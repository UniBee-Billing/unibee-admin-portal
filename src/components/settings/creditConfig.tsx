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
// import update from 'immutability-helper'
import { useEffect, useState } from 'react'
import ExchangeIcon from '../../assets/exchange.svg?react'
import { numBoolConvert } from '../../helpers'
import {
  createCreditConfigReq,
  getCreditConfigListReq,
  saveCreditConfigReq
} from '../../requests'
import { CreditType, TCreditConfig } from '../../shared.types'
import { useMerchantInfoStore } from '../../stores'

const normalizeCreditConfig = (c: TCreditConfig): TCreditConfig => {
  if (typeof c.payoutEnable == 'number') {
    // when this field type is number, data is from BE directly
    // some fields from backend are 1 | 0 (bool like), I need to convert them to bool for FE use
    // but before submit, I need to convert them back to 0 | 1
    // exchange rate also need to be divided by 100 for FE use, before submit to BE, need to be multiplied by 100
    ;(c.exchangeRate as number) /= 100
    // discountCodeExclusive is used to denote "Allow both Promo Credit and Discount Code in one invoice?"
    // its meaning is totally opposite of what it means on UI, so flip its value.
    c.discountCodeExclusive = c.discountCodeExclusive == 1 ? 0 : 1
  } else {
    // data is from FE
    ;(c.exchangeRate as number) *= 100
    c.discountCodeExclusive = c.discountCodeExclusive ? false : true
  }
  c.payoutEnable = numBoolConvert(c.payoutEnable)
  c.discountCodeExclusive = numBoolConvert(c.discountCodeExclusive)
  c.recurring = numBoolConvert(c.recurring)
  return c
}

const Index = () => {
  const [creditConfigList, setCreditConfigList] = useState<TCreditConfig[]>([])
  const [_, setLoading] = useState(false)
  const merchantStore = useMerchantInfoStore()

  const defaultCreditConfig: TCreditConfig = {
    id: -1,
    merchantId: merchantStore.id,
    createTime: Math.round(new Date().getTime() / 1000),
    name: 'default credit config',
    description: 'default credit config',
    type: CreditType.PROMO_CREDIT,
    currency: 'EUR',
    exchangeRate: 100,
    payoutEnable: false,
    discountCodeExclusive: false,
    recurring: false,
    rechargeEnable: false,
    previewDefaultUsed: false
  }

  // check all used currency, re-assign a non-used as 'currency'
  /*
  const createNewConfig = () => {
    let defCurrency = ''
    if (creditConfigList.findIndex((c) => c.currency == 'EUR') == -1) {
      defCurrency = 'EUR'
    }
    if (creditConfigList.findIndex((c) => c.currency == 'USD') == -1) {
      defCurrency = 'USD'
    }
    if (creditConfigList.findIndex((c) => c.currency == 'JPY') == -1) {
      defCurrency = 'JPY'
    }
    if (defCurrency == '') {
      message.error('All currencies have been configured')
      return
    }
    setCreditConfigList(
      update(creditConfigList, {
        $push: [{ ...defaultCreditConfig, currency: defCurrency }]
      })
    )
  }
    */

  const getCreditConfigList = async () => {
    setLoading(true)
    const [creditConfigs, err] = await getCreditConfigListReq(
      {
        types: [CreditType.PROMO_CREDIT],
        currency: 'EUR'
      },
      getCreditConfigList
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    if (creditConfigs == null || creditConfigs.length == 0) {
      setCreditConfigList([defaultCreditConfig])
    } else {
      setCreditConfigList(creditConfigs.map(normalizeCreditConfig))
    }
  }

  useEffect(() => {
    getCreditConfigList()
  }, [])

  return (
    <div>
      {creditConfigList.map((c) => (
        <CreditConfigItems key={c.id} items={c} />
      ))}
      {/* <div className="my-4 flex justify-end">
        <Button onClick={createNewConfig}>New</Button>
      </div> */}
    </div>
  )
}
export default Index

const CreditConfigItems = ({ items }: { items: TCreditConfig }) => {
  const isNew = items.id == -1
  const [creditConfig, setCreditConfig] = useState<TCreditConfig>(items)
  const [loading, setLoading] = useState(false)
  const [editingExchange, setEditingExchange] = useState(false)
  const [exErr, setExErr] = useState('') // empty string means no error

  const CurrencySelector = ({ disabled }: { disabled?: boolean }) => (
    <Select
      disabled={!!disabled || loading || items.id != -1}
      value={creditConfig.currency}
      style={{ width: '100px' }}
      options={[
        { label: 'EUR(€)', value: 'EUR' },
        { label: 'USD($)', value: 'USD' },
        { label: 'JPY(¥)', value: 'JPY' }
      ]}
    />
  )

  const toggleEditApply = () => {
    if (!editingExchange) {
      setEditingExchange(true)
      return
    }
    onExRateApply()
    setEditingExchange(false) // what if onSave failed, in that case, this line should not run.
  }

  const onExRateApply = () => {
    const ex = Number(creditConfig.exchangeRate)
    if (exErr != '') {
      message.error(exErr)
      return
    }
    onSave('exchangeRate', ex * 100)
  }

  const onSwitchChange = (key: string) => (value: boolean) => {
    if (key == 'discountCodeExclusive') {
      value = !value
    }
    onSave(key, numBoolConvert(value))
    setCreditConfig({ ...creditConfig, [key]: value })
  }

  const onExChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const ex = Number(e.target.value)
    if (isNaN(ex)) {
      setExErr('Invalid exchange rate')
    } else {
      setExErr('')
    }
    setCreditConfig({ ...creditConfig, exchangeRate: e.target.value })
  }

  const onSave = async (key: string, value: number | string | boolean) => {
    if (isNew) {
      setLoading(true)
      const [newCreditConfig, err] = await createCreditConfigReq(items)
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
      if (newCreditConfig != null) {
        setCreditConfig(normalizeCreditConfig(newCreditConfig))
      }
    } else {
      setLoading(true)
      const [newCreditConfig, err] = await saveCreditConfigReq({
        merchantId: creditConfig.merchantId,
        type: creditConfig.type,
        currency: creditConfig.currency,
        key,
        value
      })
      setLoading(false)
      if (null != err) {
        message.error(err.message)
        return
      }
      if (newCreditConfig != null) {
        setCreditConfig(normalizeCreditConfig(newCreditConfig))
      }
    }
  }

  const configItems = [
    {
      title: 'Enable Promo Credits',
      description: '',
      content: (
        <Switch
          checked={creditConfig.payoutEnable as boolean}
          onChange={onSwitchChange('payoutEnable')}
          loading={loading}
          disabled={loading}
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
              <Input
                defaultValue={1}
                style={{ width: '100%' }}
                disabled={true}
              />
            </Col>
            <Col span={2} className="flex items-center justify-center">
              <div className="mx-2">
                <Icon component={ExchangeIcon} />
              </div>
            </Col>
            <Col span={6}>
              <Input
                status={exErr !== '' ? 'error' : ''}
                value={creditConfig.exchangeRate}
                onChange={onExChange}
                style={{ width: '100%' }}
                disabled={!editingExchange || !creditConfig.payoutEnable}
              />
            </Col>
            <Col span={6} className="ml-3">
              <CurrencySelector
                disabled={!editingExchange || !creditConfig.payoutEnable}
              />
            </Col>
          </Row>
        </div>
      ),
      content: (
        <Button
          disabled={!creditConfig.payoutEnable || exErr != ''}
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
            Allow both Promo Credit and Discount Code applied in one
            invoice.&nbsp;
          </span>
          <Tooltip
            placement="right"
            title="By default, you can allow both Promo Credit and Discount Code be used in one invoice."
          >
            <QuestionCircleOutlined className="text-gray-400" />
          </Tooltip>
        </div>
      ),
      description: '',
      content: (
        <Switch
          checked={creditConfig.discountCodeExclusive as boolean}
          onChange={onSwitchChange('discountCodeExclusive')}
          disabled={!creditConfig.payoutEnable}
          loading={loading}
        />
      )
    },

    {
      title: 'Allow auto-apply promo credits to the next invoice',
      description: '',
      content: (
        <Switch
          checked={creditConfig.recurring as boolean}
          onChange={onSwitchChange('recurring')}
          disabled={!creditConfig.payoutEnable}
          loading={loading}
        />
      )
    }
  ]

  return (
    <List
      className="mb-10"
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
