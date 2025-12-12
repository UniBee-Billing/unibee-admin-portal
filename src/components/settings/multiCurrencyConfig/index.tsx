import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Select,
  Switch,
  message,
  Tag,
  InputNumber,
  Spin,
  Card,
  Divider
} from 'antd'
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { saveExRateKeyReq, getMerchantInfoReq, setupMultiCurrenciesReq } from '../../../requests'
import ExchangeRateServiceIcon from '../../../assets/integrationsKeysIcon/ExchangeRateService.svg'

interface ExchangeRate {
  fromCurrency: string
  toCurrency: string
  rate?: number
  mode: 'manual' | 'api'
}

interface CurrencyRuleSet {
  id: string
  name: string
  defaultCurrency: string
  additionalCurrencies: string[]
  exchangeRates: ExchangeRate[]
}

interface MultiCurrencyConfig {
  exchangeApiEnabled: boolean
  exchangeApiKey: string
  multiCurrencyEnabled: boolean
  ruleSet: CurrencyRuleSet[]
}

interface CurrencyInfo {
  Currency: string
  Symbol: string
  Scale: number
}

interface CurrencyOption {
  label: string
  value: string
  symbol: string
  scale: number
}

interface MerchantCurrencyConfig {
  currency: string
  autoExchange: boolean
  exchangeRate: number
}

interface MerchantMultiCurrencyConfig {
  name: string
  defaultCurrency: string
  currencyConfigs: MerchantCurrencyConfig[]
  lastUpdateTime?: number
}

// Empty currency options as fallback
const EMPTY_CURRENCY_OPTIONS: CurrencyOption[] = []

const MultiCurrencyConfiguration = () => {
  const [config, setConfig] = useState<MultiCurrencyConfig>({
    exchangeApiEnabled: false,
    exchangeApiKey: '',
    multiCurrencyEnabled: false,
    ruleSet: []
  })
  
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [savedExchangeApiKey, setSavedExchangeApiKey] = useState('')
  const [exchangeApiLoading, setExchangeApiLoading] = useState(false)
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>(EMPTY_CURRENCY_OPTIONS)
  const [currencyLoading, setCurrencyLoading] = useState(false)

  // Fetch merchant info to get saved exchange API key and currency list
  const fetchMerchantInfo = async () => {
    setCurrencyLoading(true)
    try {
      const [merchantInfo, error] = await getMerchantInfoReq()
      if (error) {
        // console.error('Failed to fetch merchant info:', error)
        return
      }
      
      // exchangeRateApiKey is in the top level data, not in merchant object
      if (merchantInfo?.exchangeRateApiKey) {
        setSavedExchangeApiKey(merchantInfo.exchangeRateApiKey)
        setConfig(prev => ({
          ...prev,
          exchangeApiEnabled: true
        }))
      }

      // Process currency list from API
      if (merchantInfo?.Currency && Array.isArray(merchantInfo.Currency)) {
        const dynamicCurrencyOptions: CurrencyOption[] = merchantInfo.Currency.map((currency: CurrencyInfo) => ({
          label: `${currency.Currency} - ${currency.Symbol}`,
          value: currency.Currency,
          symbol: currency.Symbol,
          scale: currency.Scale
        }))
        setCurrencyOptions(dynamicCurrencyOptions)
      }

      // Load saved multi-currency configurations
      if (merchantInfo?.multiCurrencyConfigs && Array.isArray(merchantInfo.multiCurrencyConfigs)) {
        const savedRuleSets: CurrencyRuleSet[] = merchantInfo.multiCurrencyConfigs.map((config: MerchantMultiCurrencyConfig, index: number) => {
          return {
            id: `saved_rule_${index}`,
            name: config.name || `Rule Set ${index + 1}`,
            defaultCurrency: config.defaultCurrency,
            additionalCurrencies: config.currencyConfigs.map(cc => cc.currency),
            exchangeRates: config.currencyConfigs.map(cc => ({
              fromCurrency: config.defaultCurrency,
              toCurrency: cc.currency,
              rate: (cc.exchangeRate && cc.exchangeRate > 0) ? cc.exchangeRate : undefined,
              mode: cc.autoExchange ? 'api' : 'manual'
            }))
          }
        })
        
        setConfig(prev => ({
          ...prev,
          multiCurrencyEnabled: savedRuleSets.length > 0,
          ruleSet: savedRuleSets
        }))
      }
    } catch (_error) {
      // console.error('Error fetching merchant info:', _error)
      // Keep empty options on error
      setCurrencyOptions(EMPTY_CURRENCY_OPTIONS)
    } finally {
      setCurrencyLoading(false)
    }
  }

  // Refresh configuration data from server
  const refreshConfigurationData = async () => {
    await fetchMerchantInfo()
  }

  useEffect(() => {
    fetchMerchantInfo()
  }, [])

  // Generate unique identifier for new currency rule sets
  const generateId = () => `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add a new currency rule set to the configuration
  const addNewRuleSet = () => {
    const newRuleSet: CurrencyRuleSet = {
      id: generateId(),
      name: '',
      defaultCurrency: '',
      additionalCurrencies: [],
      exchangeRates: []
    }
    setConfig(prev => ({
      ...prev,
      ruleSet: [...prev.ruleSet, newRuleSet]
    }))
    setHasChanges(true)
  }

  // Remove a currency rule set from the configuration
  const deleteRuleSet = (id: string) => {
    setConfig(prev => ({
      ...prev,
      ruleSet: prev.ruleSet.filter(rule => rule.id !== id)
    }))
    setHasChanges(true)
  }

  // Update a specific field in a currency rule set
  const updateRuleSet = (id: string, field: keyof Omit<CurrencyRuleSet, 'id'>, value: unknown) => {
    setConfig(prev => ({
      ...prev,
      ruleSet: prev.ruleSet.map(rule =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    }))
    setHasChanges(true)
  }

  // Generate exchange rates when currencies change
  const generateExchangeRates = (ruleSet: CurrencyRuleSet) => {
    const { defaultCurrency, additionalCurrencies } = ruleSet
    const exchangeRates: ExchangeRate[] = []
    
    additionalCurrencies.forEach(currency => {
      exchangeRates.push({
        fromCurrency: defaultCurrency,
        toCurrency: currency,
        rate: undefined, // Keep blank for new currencies
        mode: savedExchangeApiKey ? 'api' : 'manual'
      })
    })
    
    return exchangeRates
  }

  // Update exchange rate for a specific currency pair
  const updateExchangeRate = (ruleSetId: string, fromCurrency: string, toCurrency: string, rate: number) => {
    setConfig(prev => ({
      ...prev,
      ruleSet: prev.ruleSet.map(rule => {
        if (rule.id === ruleSetId) {
          const updatedRates = rule.exchangeRates.map(exchangeRate =>
            exchangeRate.fromCurrency === fromCurrency && exchangeRate.toCurrency === toCurrency
              ? { ...exchangeRate, rate }
              : exchangeRate
          )
          return { ...rule, exchangeRates: updatedRates }
        }
        return rule
      })
    }))
    setHasChanges(true)
  }

  // Update exchange rate mode for a specific currency pair
  const updateExchangeRateMode = (ruleSetId: string, fromCurrency: string, toCurrency: string, mode: 'manual' | 'api') => {
    setConfig(prev => ({
      ...prev,
      ruleSet: prev.ruleSet.map(rule => {
        if (rule.id === ruleSetId) {
          const updatedRates = rule.exchangeRates.map(exchangeRate =>
            exchangeRate.fromCurrency === fromCurrency && exchangeRate.toCurrency === toCurrency
              ? { ...exchangeRate, mode }
              : exchangeRate
          )
          return { ...rule, exchangeRates: updatedRates }
        }
        return rule
      })
    }))
    setHasChanges(true)
  }

  // Validate that default currency is unique across rule sets
  const validateDefaultCurrency = (currentId: string, currency: string) => {
    const existingRule = config.ruleSet.find(
      rule => rule.id !== currentId && rule.defaultCurrency === currency
    )
    if (existingRule) {
      message.error('This default currency already exists in another rule set and cannot be duplicated')
      return false
    }
    return true
  }

  // Handle default currency change with duplicate validation
  const handleDefaultCurrencyChange = (id: string, currency: string) => {
    if (validateDefaultCurrency(id, currency)) {
      updateRuleSet(id, 'defaultCurrency', currency)
      // Update exchange rates when default currency changes
      const rule = config.ruleSet.find(r => r.id === id)
      if (rule) {
        const newExchangeRates = generateExchangeRates({ ...rule, defaultCurrency: currency })
        updateRuleSet(id, 'exchangeRates', newExchangeRates)
      }
    }
  }

  // Handle additional currencies change
  const handleAdditionalCurrenciesChange = (id: string, currencies: string[]) => {
    updateRuleSet(id, 'additionalCurrencies', currencies)
    // Update exchange rates when additional currencies change
    const rule = config.ruleSet.find(r => r.id === id)
    if (rule && rule.defaultCurrency) {
      const currentCurrencies = rule.additionalCurrencies
      const currentRates = rule.exchangeRates || []
      
      // Find new currencies that were added
      const newCurrencies = currencies.filter(currency => !currentCurrencies.includes(currency))
      // Find currencies that should remain (intersection)
      const remainingCurrencies = currencies.filter(currency => currentCurrencies.includes(currency))
      
      // Keep existing rates for remaining currencies
      const existingRates = currentRates.filter(rate => 
        remainingCurrencies.includes(rate.toCurrency) && rate.fromCurrency === rule.defaultCurrency
      )
      
      // Create rates for new currencies (with undefined rate to show blank)
      const newRates = newCurrencies.map(currency => ({
        fromCurrency: rule.defaultCurrency,
        toCurrency: currency,
        rate: undefined, // Keep blank for new currencies
        mode: savedExchangeApiKey ? 'api' : 'manual'
      } as ExchangeRate))
      
      const updatedRates = [...existingRates, ...newRates]
      updateRuleSet(id, 'exchangeRates', updatedRates)
    }
  }


  // Save exchange API key
  const handleSaveExchangeApi = async () => {
    if (!config.exchangeApiKey.trim()) {
      message.error('Please enter an Exchange API Key')
      return
    }

    setExchangeApiLoading(true)
    try {
      const [, error] = await saveExRateKeyReq(config.exchangeApiKey)
      if (error) {
        message.error('Failed to save Exchange API Key. Please try again.')
        return
      }

      // Fetch updated merchant info to get the masked key
      const [merchantInfo, merchantError] = await getMerchantInfoReq()
      if (merchantError) {
        message.error('Failed to fetch updated merchant information')
        return
      }

      if (merchantInfo?.exchangeRateApiKey) {
        setSavedExchangeApiKey(merchantInfo.exchangeRateApiKey)
      }

      message.success('Exchange API Key saved successfully')
      setConfig(prev => ({ ...prev, exchangeApiKey: '' })) // Clear input after successful save
    } catch (_error) {
      message.error('Failed to save Exchange API Key. Please try again.')
    } finally {
      setExchangeApiLoading(false)
    }
  }

  // Save configuration
  const handleSave = async () => {
    // Validate that all rule sets have required fields
    for (const rule of config.ruleSet) {
      if (!rule.name || !rule.defaultCurrency) {
        message.error('Rule set name and default currency are required fields and must be filled before saving')
        return
      }
    }

    setLoading(true)
    try {
      // Transform component data to API format
      const multiCurrencyConfigs: MerchantMultiCurrencyConfig[] = config.ruleSet.map(rule => ({
        name: rule.name,
        defaultCurrency: rule.defaultCurrency,
        currencyConfigs: rule.additionalCurrencies.map(currency => {
          const exchangeRate = rule.exchangeRates.find(
            rate => rate.fromCurrency === rule.defaultCurrency && rate.toCurrency === currency
          )
          return {
            currency,
            autoExchange: exchangeRate?.mode === 'api',
            exchangeRate: exchangeRate?.rate ?? 1.0 // Use 1.0 as default if rate is undefined
          }
        }),
        lastUpdateTime: Date.now()
      }))

      const [, error] = await setupMultiCurrenciesReq(multiCurrencyConfigs)
      if (error) {
        message.error('Failed to save multi-currency configuration. Please try again.')
        return
      }
      
      message.success('Multi-currency configuration saved successfully')
      setHasChanges(false)
      
      // Refresh data from server after successful save
      await refreshConfigurationData()
    } catch (_error) {
      message.error('Failed to save configuration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get currency symbol from dynamic options
  const getCurrencySymbol = (currency: string) => {
    const currencyOption = currencyOptions.find(option => option.value === currency)
    return currencyOption?.symbol || currency
  }

  return (
    <Spin spinning={loading || currencyLoading}>
      <div className="w-full p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">Multi-Currency Configuration</h2>
          {hasChanges && (
            <Tag color="orange" className="animate-pulse">
              Unsaved Changes
            </Tag>
          )}
        </div>
        
        <div className="space-y-8">
          {/* Exchange API Configuration */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <img src={ExchangeRateServiceIcon} alt="Exchange Rate Service" className="w-8 h-8 mt-1" />
                <div>
                  <h3 className="text-base font-medium mb-2">Exchange API Configuration</h3>
                  <p className="text-gray-400 text-sm">Configure exchange rate data source</p>
                  <p className="text-gray-400 text-sm">Apply your key on <a href="https://app.exchangerate-api.com/" target="_blank" rel="noopener noreferrer">https://app.exchangerate-api.com/</a></p>
                </div>
              </div>
              <Switch
                checked={config.exchangeApiEnabled}
                disabled={!!savedExchangeApiKey} // Cannot disable if a saved key exists
                onChange={(checked) => {
                  setConfig(prev => ({ ...prev, exchangeApiEnabled: checked }))
                  setHasChanges(true)
                }}
              />
            </div>
            
            {config.exchangeApiEnabled && (
              <div className="mt-6 space-y-4">
                {/* Display saved/masked API key if exists */}
                {savedExchangeApiKey && (
                  <div>
                    <div className="mb-2">
                      <label className="text-sm font-medium text-gray-700">Current API Key</label>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-green-700 font-mono text-sm">{savedExchangeApiKey}</span>
                        <Tag color="green">Configured</Tag>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Input for new API key */}
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      {savedExchangeApiKey ? 'Update API Key' : 'API Key'}
                    </label>
                  </div>
                  <div className="flex gap-3 items-end">
                    <Input
                      placeholder="Enter Exchange API Key..."
                      value={config.exchangeApiKey}
                      onChange={(e) => {
                        setConfig(prev => ({ ...prev, exchangeApiKey: e.target.value }))
                        setHasChanges(true)
                      }}
                      className="w-64"
                    />
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveExchangeApi}
                      loading={exchangeApiLoading}
                      disabled={!config.exchangeApiKey.trim()}
                    >
                      Save
                    </Button>
                  </div>
                  {savedExchangeApiKey && (
                    <div className="text-gray-500 text-xs mt-1">
                      Enter a new API key to update the current configuration
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Multi-Currency Feature */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium mb-2">Multi-Currency Feature</h3>
                <p className="text-gray-400 text-sm">Enable support for multiple currencies in billing and settlement</p>
                {config.ruleSet.length > 0 && (
                  <p className='text-gray-400 text-sm'>There is an active Rule Set currently in use. To disable the Multi-Currency feature, please delete the Rule Set first</p>
                )}
              </div>
              <Switch
                checked={config.multiCurrencyEnabled}
                disabled={config.ruleSet.length > 0} // Disable switch if there are active Rule Sets
                onChange={(checked) => {
                  setConfig(prev => ({ ...prev, multiCurrencyEnabled: checked }))
                  setHasChanges(true)
                }}
              />
            </div>
          </Card>

          {/* Currency Rule Sets */}
          {config.multiCurrencyEnabled && (
            <div className="space-y-4">
              {config.ruleSet.map((rule, _index) => (
                <Card key={rule.id} className="relative">
                  <div className="absolute top-4 right-4">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteRuleSet(rule.id)}
                      className="flex items-center justify-center w-8 h-8"
                    />
                  </div>
                  
                  <div className="pr-12">
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Rule Set Name</label>
                      <Input
                        placeholder="Enter rule set name"
                        value={rule.name}
                        onChange={(e) => updateRuleSet(rule.id, 'name', e.target.value)}
                        className="w-64"
                        status={!rule.name ? 'error' : ''}
                      />
                      {!rule.name && (
                        <div className="text-red-500 text-xs mt-1">Rule set name is required</div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Default Currency</label>
                        <Select
                          placeholder="Choose default currency"
                          value={rule.defaultCurrency || undefined}
                          onChange={(value) => handleDefaultCurrencyChange(rule.id, value)}
                          options={currencyOptions.map(option => ({
                            ...option,
                            label: `${option.value} - ${option.symbol}`
                          }))}
                          className="w-full"
                          showSearch
                          status={!rule.defaultCurrency ? 'error' : ''}
                          loading={currencyLoading}
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                        />
                        {!rule.defaultCurrency && (
                          <div className="text-red-500 text-xs mt-1">Default currency is required</div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Additional Currencies</label>
                        <Select
                          mode="multiple"
                          placeholder="Choose additional currencies"
                          value={rule.additionalCurrencies}
                          onChange={(value) => handleAdditionalCurrenciesChange(rule.id, value)}
                          options={currencyOptions
                            .filter(option => option.value !== rule.defaultCurrency)
                            .map(option => ({
                              ...option,
                              label: `${option.value} - ${option.symbol}`
                            }))}
                          className="w-full"
                          showSearch
                          loading={currencyLoading}
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          tagRender={(props) => {
                            const { value, closable, onClose } = props
                            return (
                              <Tag
                                closable={closable}
                                onClose={onClose}
                                style={{ 
                                  marginRight: 3,
                                  backgroundColor: '#f5f5f5',
                                  border: '1px solid #d9d9d9',
                                  borderRadius: '6px',
                                  color: '#000000'
                                }}
                              >
                                {getCurrencySymbol(value)} {value}
                              </Tag>
                            )
                          }}
                        />
                        <div className="text-gray-500 text-xs mt-1">
                          {rule.additionalCurrencies.length} currencies selected
                        </div>
                      </div>
                    </div>

                    {/* Exchange Rate Configuration */}
                    {rule.defaultCurrency && rule.additionalCurrencies.length > 0 && (
                      <div className="mt-6">
                        <Divider orientation="left">
                          <span className="text-sm font-medium">Exchange Rate Configuration</span>
                        </Divider>
                        
                        <div className="space-y-3">
                          {rule.additionalCurrencies.map((currency) => {
                            const exchangeRate = rule.exchangeRates.find(
                              rate => rate.fromCurrency === rule.defaultCurrency && rate.toCurrency === currency
                            )
                            const isApiMode = exchangeRate?.mode === 'api'
                            return (
                              <div key={currency} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                {/* Mode Selection Dropdown */}
                                <div className="min-w-[140px]">
                                  <Select
                                    value={exchangeRate?.mode || 'manual'}
                                    onChange={(value) => updateExchangeRateMode(rule.id, rule.defaultCurrency, currency, value)}
                                    className="w-full"
                                    size="small"
                                    options={[
                                      {
                                        value: 'manual',
                                        label: 'Manual'
                                      },
                                      {
                                        value: 'api',
                                        label: 'Auto Exchange',
                                        disabled: !savedExchangeApiKey
                                      }
                                    ]}
                                  />
                                </div>
                                
                                {/* Currency display */}
                                <div className="flex items-center gap-2 min-w-[120px]">
                                  <span className="font-medium text-lg">
                                    {getCurrencySymbol(rule.defaultCurrency)}
                                  </span>
                                  <span className="text-sm text-gray-600">1 {rule.defaultCurrency}</span>
                                </div>
                                
                                <div className="text-gray-400">=</div>
                                
                                {/* Rate input */}
                                <div className="flex items-center gap-2">
                                  <InputNumber
                                    value={exchangeRate?.rate}
                                    onChange={(value) => updateExchangeRate(rule.id, rule.defaultCurrency, currency, value || 0)}
                                    step={0.01}
                                    min={0.001}
                                    precision={3}
                                    placeholder={isApiMode ? "Auto" : "Enter rate"}
                                    className="w-28"
                                    disabled={isApiMode}
                                    style={{
                                      backgroundColor: isApiMode ? '#f5f5f5' : 'white'
                                    }}
                                  />
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-lg">
                                      {getCurrencySymbol(currency)}
                                    </span>
                                    <span className="text-sm text-gray-600">{currency}</span>
                                  </div>
                                  {isApiMode && (
                                    <div className="text-xs text-gray-400 ml-2 flex items-center gap-1">
                                      <span className="w-3 h-3 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">i</span>
                                      <span>The exchange rate is updated once per day</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {/* Add New Rule Set Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addNewRuleSet}
                  className="min-w-[200px] h-10"
                  size="large"
                >
                  Add New Rule Set
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 sticky bottom-6">
          <div className="flex items-center justify-end gap-4">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
              disabled={!hasChanges}
              size="large"
              className="min-w-[120px] font-medium"
              style={{
                backgroundColor: !hasChanges ? '#d1d5db' : '#1677ff',
                borderColor: !hasChanges ? '#d1d5db' : '#1677ff',
                color: !hasChanges ? '#9ca3af' : '#ffffff'
              }}
            >
              {loading ? 'Saving...' : hasChanges ? 'Save' : 'Saved'}
            </Button>
          </div>
          
          {hasChanges && (
            <div className="text-center text-sm text-gray-500 mt-3">
              You have unsaved changes
            </div>
          )}
        </div>
      </div>
    </Spin>
  )
}

export default MultiCurrencyConfiguration
