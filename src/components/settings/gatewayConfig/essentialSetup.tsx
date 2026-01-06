import ExchangeIcon from '@/assets/exchange.svg?react'
import { formatBytes, randomString, uploadFile } from '@/helpers'
import { saveGatewayConfigReq, TGatewayConfigBody } from '@/requests'
import { TGateway, TGatewayExRate } from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import Icon, { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Button,
  Col,
  GetProp,
  Image,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Upload,
  UploadFile,
  UploadProps
} from 'antd'
import update from 'immutability-helper'
import { useEffect, useState } from 'react'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

const FILE_CONSTRAINTS = {
  ALLOWED_FILE_TYPES: ['.png', '.jpg', '.jpeg', '.svg'],
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_FILE_COUNT: 5
} as const

const COMPANY_LOGO_CONSTRAINTS = {
  ALLOWED_FILE_TYPES: ['.png', '.jpg', '.jpeg'],
  MAX_FILE_SIZE: 1 * 1024 * 1024, // 1MB
  MAX_FILE_COUNT: 1
} as const

interface DraggableUploadListItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originNode: React.ReactElement<any, string | React.JSXElementConstructor<any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: UploadFile<any>
}

const DraggableUploadListItem = ({
  originNode,
  file
}: DraggableUploadListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: file.uid
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      // prevent preview event when drag end
      className={isDragging ? 'is-dragging' : ''}
      {...attributes}
      {...listeners}
    >
      {/* hide error tooltip when dragging */}
      {file.status === 'error' && isDragging
        ? originNode.props.children
        : originNode}
    </div>
  )
}

const EssentialSetup = ({
  closeModal,
  gatewayConfig,
  refresh,
  updateGatewayInStore,
  isDuplicateMode = false,
  sharedDisplayName,
  setSharedDisplayName,
  sharedIssueCompanyName,
  setSharedIssueCompanyName,
  sharedIssueAddress,
  setSharedIssueAddress,
  sharedIssueRegNumber,
  setSharedIssueRegNumber,
  sharedIssueVatNumber,
  setSharedIssueVatNumber,
  sharedIssueLogo,
  setSharedIssueLogo,
  sharedGatewayKey,
  sharedGatewaySecret,
  sharedSubGateway,
  sharedPaymentTypes
}: {
  closeModal: () => void
  gatewayConfig: TGateway
  refresh: () => void
  updateGatewayInStore: () => void
  isDuplicateMode?: boolean
  sharedDisplayName?: string
  setSharedDisplayName?: (name: string) => void
  sharedIssueCompanyName?: string
  setSharedIssueCompanyName?: (name: string) => void
  sharedIssueAddress?: string
  setSharedIssueAddress?: (address: string) => void
  sharedIssueRegNumber?: string
  setSharedIssueRegNumber?: (regNumber: string) => void
  sharedIssueVatNumber?: string
  setSharedIssueVatNumber?: (vatNumber: string) => void
  sharedIssueLogo?: string
  setSharedIssueLogo?: (logo: string) => void
  sharedGatewayKey?: string
  sharedGatewaySecret?: string
  sharedSubGateway?: string
  sharedPaymentTypes?: any
}) => {
  const appConfig = useAppConfigStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [displayName, setDisplayName] = useState(
    sharedDisplayName || gatewayConfig.displayName
  )
  const onNameChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newName = e.target.value
    setDisplayName(newName)
    // Update shared state if available
    if (setSharedDisplayName) {
      setSharedDisplayName(newName)
    }
  }
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>(
    gatewayConfig.gatewayIcons.map((i) => ({
      name: 'icon',
      status: 'done',
      url: i,
      uid: randomString(8)
    }))
  )

  const addLocalId = (exRates: TGatewayExRate[] | null): TGatewayExRate[] =>
    exRates == null
      ? []
      : exRates.map((r: TGatewayExRate) => ({
        ...r,
        localId: randomString(8)
      }))

  const [exchangeRates, setExchangeRates] = useState<TGatewayExRate[]>(
    // In duplicate mode, clear exchange rates (non-required field)
    isDuplicateMode ? [] : addLocalId(gatewayConfig.currencyExchange)
  )

  // Invoice Configuration - use shared state directly (no local state needed)
  // This ensures data is synced across tabs
  const issueCompanyName = sharedIssueCompanyName ?? (gatewayConfig.companyIssuer?.issueCompanyName || '')
  const issueAddress = sharedIssueAddress ?? (gatewayConfig.companyIssuer?.issueAddress || '')
  const issueRegNumber = sharedIssueRegNumber ?? (gatewayConfig.companyIssuer?.issueRegNumber || '')
  const issueVatNumber = sharedIssueVatNumber ?? (gatewayConfig.companyIssuer?.issueVatNumber || '')
  const issueLogo = sharedIssueLogo ?? (gatewayConfig.companyIssuer?.issueLogo || '')

  // State for logo upload
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const addExRate = () => {
    setExchangeRates(
      update(exchangeRates, {
        $push: [
          {
            from_currency: '',
            to_currency: '',
            exchange_rate: 1,
            localId: randomString(8)
          }
        ]
      })
    )
  }
  const removeExRate = (localId: string) => () => {
    const idx = exchangeRates.findIndex((r) => r.localId == localId)
    if (idx != -1) {
      setExchangeRates(update(exchangeRates, { $splice: [[idx, 1]] }))
    }
  }

  const onExRateChange = (localId: string) => (value: number | null) => {
    if (value == null) {
      return
    }
    const idx = exchangeRates.findIndex((r) => r.localId == localId)
    if (idx != -1) {
      setExchangeRates(
        update(exchangeRates, { [idx]: { exchange_rate: { $set: value } } })
      )
    }
  }

  const onExRateCurrencyChange =
    (currencyType: string, exRateId: string) => (value: string) => {
      const idx = exchangeRates.findIndex((r) => r.localId == exRateId)
      if (idx != -1) {
        setExchangeRates(
          update(exchangeRates, { [idx]: { [currencyType]: { $set: value } } })
        )
      }
    }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType)
    }

    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
  }

  const handleChange: UploadProps['onChange'] = ({
    fileList: newFileList
    // file,
    // event
  }) => {
    setFileList(newFileList)
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined className="cursor-pointer" />
      <div className="mt-2 cursor-pointer">Upload</div>
    </button>
  )

  const onUpload = uploadFile(
    FILE_CONSTRAINTS.MAX_FILE_SIZE,
    (logoUrl) => {
      const newFile: UploadFile = {
        uid: randomString(8),
        url: logoUrl,
        status: 'done',
        name: 'icon'
      }
      // after uploading a new file, length should be increased by 1, why $push didn't work?
      const newFileList = update(fileList, {
        [fileList.length - 1]: { $set: newFile }
        // $push: [newFile]
      })
      setFileList(newFileList)
    },
    (err) => {
      message.error(err.message)
    },
    setUploading
  )

  const onSave = async () => {
    // Validation
    if (displayName.trim() == '') {
      message.error('Please input the display name.')
      return
    }
    if (fileList.length == 0) {
      message.error('Please add at least one icon.')
      return
    }

    // Build request body
    const body: TGatewayConfigBody = {
      gatewayName: gatewayConfig.gatewayName,
      displayName,
      gatewayLogo: fileList.filter((f) => f.url != undefined).map((f) => f.url!)
    }

    // Add exchange rates if any
    if (exchangeRates.length > 0) {
      // Remove localId before sending to backend
      const ratesForSubmit = exchangeRates.map((r) => {
        const { localId, ...rest } = r
        return rest
      })
      body.currencyExchange = ratesForSubmit
    }

    // Add company issuer if any field has a value
    if (
      issueCompanyName ||
      issueAddress ||
      issueRegNumber ||
      issueVatNumber ||
      issueLogo
    ) {
      body.companyIssuer = {
        issueCompanyName: issueCompanyName || undefined,
        issueAddress: issueAddress || undefined,
        issueRegNumber: issueRegNumber || undefined,
        issueVatNumber: issueVatNumber || undefined,
        issueLogo: issueLogo || undefined
      }
    }

    // Add keys/secrets from shared state if they don't contain desensitized data (**)
    if (sharedGatewayKey && sharedGatewayKey.trim() !== '' && !sharedGatewayKey.includes('**')) {
      body.gatewayKey = sharedGatewayKey
    }
    if (sharedGatewaySecret && sharedGatewaySecret.trim() !== '' && !sharedGatewaySecret.includes('**')) {
      body.gatewaySecret = sharedGatewaySecret
    }

    // Add subGateway if needed
    if (gatewayConfig.subGatewayName != '' && sharedSubGateway && sharedSubGateway.trim() !== '' && !sharedSubGateway.includes('**')) {
      body.subGateway = sharedSubGateway
    }

    // Add payment types if needed and available
    if (sharedPaymentTypes && sharedPaymentTypes.length > 0) {
      body.gatewayPaymentTypes = sharedPaymentTypes.map((p: any) => p.paymentType)
    }

    // Determine if this is a new gateway setup or edit
    // isNew = true: create new gateway (no gatewayId or duplicate mode)
    // isNew = false: edit existing gateway (has gatewayId and not duplicate mode)
    const isNew = gatewayConfig.gatewayId == 0 || isDuplicateMode

    if (isNew) {
      // Creating a new gateway - gatewayName is required, gatewayId should not be included
      // gatewayName is already set above
    } else {
      // Editing existing gateway - need gatewayId
      body.gatewayId = gatewayConfig.gatewayId
    }

    // Submit to backend
    setLoading(true)
    const [_, err] = await saveGatewayConfigReq(body, isNew)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    // Success
    refresh()
    updateGatewayInStore()
    message.success(
      isDuplicateMode
        ? `${gatewayConfig.name} duplicated successfully.`
        : `${gatewayConfig.name} config saved.`
    )
    closeModal()
  }

  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  })
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setFileList((prev) => {
        const activeIndex = prev.findIndex((i) => i.uid === active.id)
        const overIndex = prev.findIndex((i) => i.uid === over?.id)
        return arrayMove(prev, activeIndex, overIndex)
      })
    }
  }

  useEffect(() => {
    // each exRate record must have a localId(which BE doesn't have), after save,
    // new exRate[] is fetched from BE passed down to this component via this props , I need to re-add these localId
    // In duplicate mode, clear exchange rates (non-required field)
    setExchangeRates(isDuplicateMode ? [] : addLocalId(gatewayConfig.currencyExchange))
  }, [gatewayConfig.currencyExchange, isDuplicateMode])

  useEffect(() => {
    // Use shared display name if available, otherwise use gateway config
    if (sharedDisplayName) {
      setDisplayName(sharedDisplayName)
    } else if (isDuplicateMode) {
      setDisplayName(`${gatewayConfig.displayName} (Copy)`)
    } else {
      setDisplayName(gatewayConfig.displayName)
    }
  }, [gatewayConfig.displayName, isDuplicateMode, sharedDisplayName])

  // No useEffect needed for invoice fields - we use shared state directly

  return (
    <div>
      <div className="my-4 mb-2 text-lg">Display Name</div>
      <Input
        value={displayName}
        disabled={loading}
        onChange={onNameChange}
        status={displayName.trim() == '' ? 'error' : ''}
      />
      <div className="h-6" />
      <div className="mb-2">
        Gateway Icons{' '}
        <span
          className={`text-xs ${fileList.length == 0 ? 'text-red-500' : 'text-gray-500'}`}
        >
          (
          {`At most ${FILE_CONSTRAINTS.MAX_FILE_COUNT} logos (${FILE_CONSTRAINTS.ALLOWED_FILE_TYPES.join(', ')}), each < ${formatBytes(FILE_CONSTRAINTS.MAX_FILE_SIZE)}, drag to reorder them`}
          )
        </span>
      </div>
      <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
        <SortableContext
          items={fileList.map((i) => i.uid)}
          strategy={horizontalListSortingStrategy}
        >
          <Upload
            disabled={uploading}
            listType="picture-card"
            maxCount={FILE_CONSTRAINTS.MAX_FILE_COUNT}
            accept={FILE_CONSTRAINTS.ALLOWED_FILE_TYPES.join(', ')}
            // multiple
            itemRender={(originNode, file) => (
              <DraggableUploadListItem
                originNode={
                  <div className="h-[100px] w-[100px] object-contain">
                    {originNode}
                  </div>
                }
                file={file}
              />
            )}
            customRequest={onUpload}
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
          >
            {fileList.length >= FILE_CONSTRAINTS.MAX_FILE_COUNT
              ? null
              : uploadButton}
          </Upload>
        </SortableContext>
      </DndContext>
      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage('')
          }}
          src={previewImage}
        />
      )}

      {/* Invoice Configuration Section */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <div className="mb-4 flex items-start gap-2">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
            <span className="text-sm font-medium">i</span>
          </div>
          <div>
            <div className="mb-1 font-semibold text-gray-900">
              Invoice Configuration
            </div>
            <div className="text-sm text-gray-600">
              Configure the company information that will appear on invoices
              generated through this payment gateway. This enables support for
              multiple legal entities by allowing different company details for
              different gateways.
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 font-medium text-gray-700">
            Issue Company Name
          </div>
          <Input
            placeholder="Enter company name for invoices"
            value={issueCompanyName}
            onChange={(e) => {
              // Update shared state directly
              if (setSharedIssueCompanyName) {
                setSharedIssueCompanyName(e.target.value)
              }
            }}
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <div className="mb-2 font-medium text-gray-700">Issue Address</div>
          <Input.TextArea
            placeholder="Enter company address for invoices"
            value={issueAddress}
            onChange={(e) => {
              // Update shared state directly
              if (setSharedIssueAddress) {
                setSharedIssueAddress(e.target.value)
              }
            }}
            disabled={loading}
            rows={3}
          />
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-2 font-medium text-gray-700">
              Registration Number
            </div>
            <Input
              placeholder="Company registration number"
              value={issueRegNumber}
              onChange={(e) => {
                // Update shared state directly
                if (setSharedIssueRegNumber) {
                  setSharedIssueRegNumber(e.target.value)
                }
              }}
              disabled={loading}
            />
          </Col>
          <Col span={12}>
            <div className="mb-2 font-medium text-gray-700">VAT Number</div>
            <Input
              placeholder="VAT registration number"
              value={issueVatNumber}
              onChange={(e) => {
                // Update shared state directly
                if (setSharedIssueVatNumber) {
                  setSharedIssueVatNumber(e.target.value)
                }
              }}
              disabled={loading}
            />
          </Col>
        </Row>

        <div className="mt-4">
          <div className="mb-2 font-medium text-gray-700">Company Logo</div>
          <div className="text-sm text-gray-500 mb-2">
            Max size: {formatBytes(COMPANY_LOGO_CONSTRAINTS.MAX_FILE_SIZE)}, allowed file types: {COMPANY_LOGO_CONSTRAINTS.ALLOWED_FILE_TYPES.join(', ')}
          </div>
          <div style={{ height: '102px' }}>
            <Upload
              disabled={uploadingLogo || loading}
              maxCount={COMPANY_LOGO_CONSTRAINTS.MAX_FILE_COUNT}
              accept={COMPANY_LOGO_CONSTRAINTS.ALLOWED_FILE_TYPES.join(', ')}
              listType="picture-card"
              fileList={issueLogo ? [{
                uid: '-1',
                name: 'companyLogo',
                status: 'done',
                url: issueLogo
              }] : []}
              customRequest={uploadFile(
                COMPANY_LOGO_CONSTRAINTS.MAX_FILE_SIZE,
                (logoUrl) => {
                  // Update shared state directly
                  if (setSharedIssueLogo) {
                    setSharedIssueLogo(logoUrl)
                  }
                  message.success('Logo uploaded successfully')
                },
                (err) => {
                  message.error(err.message)
                },
                setUploadingLogo
              )}
              onChange={({ fileList: newFileList }) => {
                // Handle file removal
                if (newFileList.length === 0 && setSharedIssueLogo) {
                  setSharedIssueLogo('')
                }
              }}
              onPreview={async (file) => {
                if (file.url) {
                  setPreviewImage(file.url)
                  setPreviewOpen(true)
                }
              }}
            >
              {!issueLogo && !uploadingLogo && '+ Upload'}
            </Upload>
          </div>
        </div>
      </div>

      {gatewayConfig.currencyExchangeEnabled && (
        <div>
          <div className="my-6 mb-2 text-lg">Add Exchange Rate</div>
          <div className="flex flex-col gap-3">
            <Row>
              <Col span={6}>From</Col>
              <Col span={3}></Col>
              <Col span={6}>To</Col>
              <Col span={3}></Col>
              <Col span={3}>
                <Button
                  onClick={addExRate}
                  disabled={loading}
                  icon={<PlusOutlined />}
                  size="small"
                  style={{ border: 'unset' }}
                ></Button>
              </Col>
            </Row>
            {exchangeRates.map((r) => (
              <Row key={r.localId}>
                <Col span={6}>
                  <Input
                    disabled={true}
                    defaultValue={1}
                    style={{ width: '180px' }}
                    addonAfter={
                      <Select
                        disabled={loading}
                        value={r.from_currency}
                        onChange={onExRateCurrencyChange(
                          'from_currency',
                          r.localId as string
                        )}
                        style={{ width: 80 }}
                        options={appConfig.supportCurrency.map((c) => ({
                          label: c.Currency,
                          value: c.Currency
                        }))}
                      ></Select>
                    }
                  />
                </Col>
                <Col span={3} className="flex items-center justify-center">
                  <div className="flex items-center justify-center">
                    <Icon component={ExchangeIcon} />
                  </div>
                </Col>
                <Col span={6}>
                  <InputNumber
                    min={0}
                    disabled={loading}
                    addonAfter={
                      <Select
                        disabled={loading}
                        value={r.to_currency}
                        onChange={onExRateCurrencyChange(
                          'to_currency',
                          r.localId as string
                        )}
                        style={{ width: 80 }}
                        options={appConfig.supportCurrency.map((c) => ({
                          label: c.Currency,
                          value: c.Currency
                        }))}
                      ></Select>
                    }
                    // status={exErr !== '' ? 'error' : ''}
                    value={r.exchange_rate}
                    onChange={onExRateChange(r.localId as string)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={3}></Col>
                <Col span={3}>
                  <Button
                    disabled={loading}
                    data-ex-rate-id={r.localId}
                    onClick={removeExRate(r.localId as string)}
                    icon={<MinusOutlined />}
                    size="small"
                    style={{ border: 'unset' }}
                  ></Button>
                </Col>
              </Row>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-end gap-4">
        <Button onClick={closeModal} disabled={loading || uploading || uploadingLogo}>
          Close
        </Button>
        <Button
          type="primary"
          onClick={onSave}
          loading={loading || uploading || uploadingLogo}
          disabled={loading || uploading || uploadingLogo}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default EssentialSetup
