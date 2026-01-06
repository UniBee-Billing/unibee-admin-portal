import { Form, Input, message, Select } from 'antd'

import { saveGatewayConfigReq, TGatewayConfigBody } from '@/requests/index'
import { GatewayPaymentType, TGateway } from '@/shared.types'
import { getPaymentMethodIcons } from '@/utils/paymentMethodIcons'
import { Button } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'

const PubPriKeySetup = ({
  gatewayConfig,
  closeModal,
  refresh,
  updateGatewayInStore,
  isDuplicateMode = false,
  sharedDisplayName,
  sharedIssueCompanyName,
  sharedIssueAddress,
  sharedIssueRegNumber,
  sharedIssueVatNumber,
  sharedIssueLogo,
  sharedGatewayKey,
  setSharedGatewayKey,
  sharedGatewaySecret,
  setSharedGatewaySecret,
  sharedSubGateway,
  setSharedSubGateway,
  sharedPaymentTypes,
  setSharedPaymentTypes
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  refresh: () => void
  updateGatewayInStore: () => void
  isDuplicateMode?: boolean
  sharedDisplayName?: string
  sharedIssueCompanyName?: string
  sharedIssueAddress?: string
  sharedIssueRegNumber?: string
  sharedIssueVatNumber?: string
  sharedIssueLogo?: string
  sharedGatewayKey?: string
  setSharedGatewayKey?: (key: string) => void
  sharedGatewaySecret?: string
  setSharedGatewaySecret?: (secret: string) => void
  sharedSubGateway?: string
  setSharedSubGateway?: (subGateway: string) => void
  sharedPaymentTypes?: any
  setSharedPaymentTypes?: (types: any) => void
}) => {
  const [form] = Form.useForm()
  const [paymentTypes, setPaymentTypes] = useState<
    GatewayPaymentType[] | undefined
  >(
    // In duplicate mode, clear payment types so user can select new ones
    isDuplicateMode ? undefined : (sharedPaymentTypes || gatewayConfig.gatewayPaymentTypes)
  )

  // Update shared state when local payment types change
  useEffect(() => {
    if (setSharedPaymentTypes && paymentTypes !== sharedPaymentTypes) {
      setSharedPaymentTypes(paymentTypes)
    }
  }, [paymentTypes, setSharedPaymentTypes, sharedPaymentTypes])

  // Only Alipay+ and Payssion expose selectable payment types in the Keys step,
  // both in setup and duplicate modes. For all other gateways (e.g. Stripe),
  // hide the Payment Types UI even if BE provides a list.
  const isPaymentTypesGateway = (() => {
    const name = (gatewayConfig.gatewayName || '').toLowerCase()
    return name.includes('alipay') || name.includes('payssion')
  })()

  // Availability from BE
  const paymentTypesAvailable =
    gatewayConfig.setupGatewayPaymentTypes != null &&
    gatewayConfig.setupGatewayPaymentTypes.length > 0

  // Show rule:
  // - Duplicate mode: only show for Alipay+/Payssion (requirement)
  // - Edit/New (non-duplicate): show whenever BE provides options (e.g., Stripe)
  const paymentTypesNeeded =
    (isDuplicateMode ? isPaymentTypesGateway : true) && paymentTypesAvailable

  const paymentTypesErr =
    paymentTypesNeeded &&
    (paymentTypes == undefined || paymentTypes.length == 0)

  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    const pubKey = form.getFieldValue('gatewayKey')
    const privateKey = form.getFieldValue('gatewaySecret')
    const subGatewayValue = form.getFieldValue('subGateway')
    const body: TGatewayConfigBody = {}

    // Only submit keys if they don't contain desensitized data (**)
    // This applies to both edit mode and duplicate mode
    if (pubKey && pubKey.trim() !== '' && !pubKey.includes('**')) {
      body.gatewayKey = pubKey
    }
    if (privateKey && privateKey.trim() !== '' && !privateKey.includes('**')) {
      body.gatewaySecret = privateKey
    }

    // Handle subGateway if needed
    if (gatewayConfig.subGatewayName != '' && subGatewayValue && subGatewayValue.trim() !== '' && !subGatewayValue.includes('**')) {
      body.subGateway = subGatewayValue
    }

    // Handle payment types
    if (paymentTypesNeeded) {
      if (paymentTypesErr) {
        message.error('Please select your payment types!')
        return
      }
      body.gatewayPaymentTypes = paymentTypes!.map((p) => p.paymentType)
    }

    // Determine if this is a new gateway setup or edit
    // isNew = true: create new gateway (no gatewayId or duplicate mode)
    // isNew = false: edit existing gateway (has gatewayId and not duplicate mode)
    const isNew = gatewayConfig.gatewayId == 0 || isDuplicateMode

    if (isNew) {
      // Creating a new gateway - need gatewayName
      body.gatewayName = gatewayConfig.gatewayName

      // In duplicate mode, include all necessary fields for a complete gateway setup
      if (isDuplicateMode) {
        body.displayName = sharedDisplayName || `${gatewayConfig.displayName} (Copy)`
        body.gatewayLogo = gatewayConfig.gatewayIcons || []
        if (gatewayConfig.currencyExchange && gatewayConfig.currencyExchange.length > 0) {
          body.currencyExchange = gatewayConfig.currencyExchange
        }
      }
    } else {
      // Editing existing gateway - need gatewayId
      body.gatewayId = gatewayConfig.gatewayId
    }

    // Add company issuer if any field has a value (from shared state)
    if (
      sharedIssueCompanyName ||
      sharedIssueAddress ||
      sharedIssueRegNumber ||
      sharedIssueVatNumber ||
      sharedIssueLogo
    ) {
      body.companyIssuer = {
        issueCompanyName: sharedIssueCompanyName || undefined,
        issueAddress: sharedIssueAddress || undefined,
        issueRegNumber: sharedIssueRegNumber || undefined,
        issueVatNumber: sharedIssueVatNumber || undefined,
        issueLogo: sharedIssueLogo || undefined
      }
    }

    // Debug: Log the request details
    console.log('PubPriKeySetup save:', {
      isDuplicateMode,
      isNew,
      paymentTypesNeeded,
      paymentTypesErr,
      body,
      gatewayConfig: {
        gatewayId: gatewayConfig.gatewayId,
        gatewayName: gatewayConfig.gatewayName,
        hasKey: !!gatewayConfig.gatewayKey,
        hasSecret: !!gatewayConfig.gatewaySecret,
        paymentTypes: gatewayConfig.gatewayPaymentTypes
      }
    })

    setLoading(true)
    const [gateway, err] = await saveGatewayConfigReq(body, isNew)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    message.success(
      isDuplicateMode
        ? `${gatewayConfig?.gatewayName} duplicated successfully`
        : `${gatewayConfig?.gatewayName} keys saved`
    )

    refresh()
    updateGatewayInStore()
    closeModal()
  }

  useEffect(() => {
    // after save, refresh() call will fetch the latest config item list, passed down as gatewayConfig props,
    if (isDuplicateMode) {
      // In duplicate mode, clear non-required fields so user can input new ones
      const clearedConfig = {
        ...gatewayConfig,
        gatewayKey: '',        // Clear keys - user should input new ones
        gatewaySecret: '',     // Clear secrets - user should input new ones
        subGateway: ''         // Clear subGateway - it's optional
      }
      form.setFieldsValue(clearedConfig)
      // Clear payment types in duplicate mode
      setPaymentTypes(undefined)
    } else {
      form.setFieldsValue(gatewayConfig)
      setPaymentTypes(gatewayConfig.gatewayPaymentTypes)
    }
  }, [gatewayConfig, isDuplicateMode])

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        colon={false}
        disabled={loading}
        initialValues={isDuplicateMode ? {
          ...gatewayConfig,
          gatewayKey: '',        // Clear keys - user should input new ones
          gatewaySecret: '',     // Clear secrets - user should input new ones
          subGateway: ''         // Clear subGateway - it's optional
        } : gatewayConfig}
        onValuesChange={(changedValues) => {
          // Update shared state when form fields change
          if (changedValues.gatewayKey !== undefined && setSharedGatewayKey) {
            setSharedGatewayKey(changedValues.gatewayKey)
          }
          if (changedValues.gatewaySecret !== undefined && setSharedGatewaySecret) {
            setSharedGatewaySecret(changedValues.gatewaySecret)
          }
          if (changedValues.subGateway !== undefined && setSharedSubGateway) {
            setSharedSubGateway(changedValues.subGateway)
          }
        }}
      >
        <Form.Item label="Gateway ID" name="gatewayId" hidden>
          <Input disabled />
        </Form.Item>
        <div className="h-2" />

        {gatewayConfig.subGatewayName != '' && (
          <Form.Item label={gatewayConfig.subGatewayName} name="subGateway">
            <Input />
          </Form.Item>
        )}

        {/*
        select values of "gatewayPaymentTypes" returned from BE is not string[], but {paymentType, name, autoCharge, category, countryName}[],
        cannot let form handle its change.
        */}

        {paymentTypesNeeded && (
          <Form.Item
            label="Payment Types"
            // name="gatewayPaymentTypes"
            extra={
              paymentTypesErr ? (
                <div className="text-sm text-red-500">
                  Please select your payment types!
                </div>
              ) : null
            }
          >
            <Select
              mode="multiple"
              status={paymentTypesErr ? 'error' : undefined}
              value={
                paymentTypes == undefined
                  ? []
                  : paymentTypes.map((p) => p.paymentType)
              }
              onChange={(value) =>
                setPaymentTypes(
                  value.map((v) =>
                    gatewayConfig.setupGatewayPaymentTypes!.find(
                      (p) => p.paymentType === v
                    )
                  ) as GatewayPaymentType[]
                )
              }
              tagRender={(props) => {
                const { value, closable, onClose } = props
                const paymentType = gatewayConfig.setupGatewayPaymentTypes!.find(
                  (p) => p.paymentType === value
                )
                const icons = paymentType ? getPaymentMethodIcons(paymentType.paymentType) : []

                return (
                  <div
                    className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-sm"
                    style={{ marginRight: 4 }}
                  >
                    {icons.length > 0 && icons[0] && (
                      <img
                        src={icons[0]}
                        alt={String(value)}
                        className="h-4 w-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <span>{paymentType?.name || value}</span>
                    {closable && (
                      <span
                        onClick={onClose}
                        className="ml-1 cursor-pointer text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </span>
                    )}
                  </div>
                )
              }}
              options={gatewayConfig.setupGatewayPaymentTypes!.map((p) => {
                const icons = getPaymentMethodIcons(p.paymentType)
                return {
                  label: (
                    <div className="flex items-center gap-2">
                      {icons.length > 0 && (
                        <div className="flex items-center gap-1">
                          {icons.map((icon, idx) => (
                            <img
                              key={idx}
                              src={icon}
                              alt={p.paymentType}
                              className="h-5 w-5 object-contain"
                              onError={(e) => {
                                // Hide image if failed to load
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <span>
                        {p.name}{' '}
                        <span className="text-xs text-gray-400">
                          ({p.paymentType} - {p.countryName})
                        </span>
                      </span>
                    </div>
                  ),
                  value: p.paymentType
                }
              })}
            />
          </Form.Item>
        )}

        <Form.Item
          label={gatewayConfig.publicKeyName}
          name="gatewayKey"
          extra={
            <div className="text-xs text-gray-400">
              For security reason, your {gatewayConfig.publicKeyName} will be
              desensitized after submit.
            </div>
          }
          rules={[
            {
              required: true,
              message: `Please input your ${gatewayConfig.publicKeyName}!`
            },
            () => ({
              validator(_, value) {
                if (value == undefined || value.trim() == '') {
                  return Promise.reject(
                    `Invalid ${gatewayConfig.publicKeyName}.`
                  )
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <div className="h-2" />

        <Form.Item
          label={gatewayConfig.privateSecretName}
          name="gatewaySecret"
          rules={[
            {
              required: true,
              message: `Please input your ${gatewayConfig.privateSecretName}!`
            },
            () => ({
              validator(_, value) {
                if (value == undefined || value.trim() == '') {
                  return Promise.reject(
                    `Invalid ${gatewayConfig.privateSecretName}.`
                  )
                }
                return Promise.resolve()
              }
            })
          ]}
          extra={
            <div className="text-xs text-gray-400">
              For security reason, your {gatewayConfig.privateSecretName} will
              be desensitized after submit.
            </div>
          }
        >
          <TextArea rows={4} />
        </Form.Item>
        <div className="h-2" />
      </Form>

      <div className="mt-6 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading}>
          Close
        </Button>
        <Button
          type="primary"
          onClick={form.submit}
          loading={loading}
          disabled={loading}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
export default PubPriKeySetup
