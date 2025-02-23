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
  updateGatewayInStore
}: {
  closeModal: () => void
  gatewayConfig: TGateway
  refresh: () => void
  updateGatewayInStore: () => void
}) => {
  const appConfig = useAppConfigStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [displayName, setDisplayName] = useState(gatewayConfig.displayName)
  const onNameChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
    setDisplayName(e.target.value)
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
    addLocalId(gatewayConfig.currencyExchange)
  )

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
    if (displayName.trim() == '') {
      message.error('Please input the display name.')
      return
    }
    if (fileList.length == 0) {
      message.error('Please add at least one icon.')
      return
    }
    const body: TGatewayConfigBody = {
      gatewayName: gatewayConfig.gatewayName,
      displayName,
      gatewayLogo: fileList.filter((f) => f.url != undefined).map((f) => f.url!)
    }

    if (exchangeRates.length > 0) {
      // todo: validation check
      exchangeRates.map((r) => r).forEach((r) => delete r.localId)
      body.currencyExchange = exchangeRates
    }

    const isNew = gatewayConfig.gatewayId == 0
    if (!isNew) {
      body.gatewayId = gatewayConfig.gatewayId
    }
    setLoading(true)
    const [_, err] = await saveGatewayConfigReq(body, isNew)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    refresh()
    updateGatewayInStore()
    message.success(`${gatewayConfig.name} config saved.`)
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
    setExchangeRates(addLocalId(gatewayConfig.currencyExchange))
  }, [gatewayConfig.currencyExchange])

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
        <Button onClick={closeModal} disabled={loading || uploading}>
          Close
        </Button>
        <Button
          type="primary"
          onClick={onSave}
          loading={loading || uploading}
          disabled={loading || uploading}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default EssentialSetup
