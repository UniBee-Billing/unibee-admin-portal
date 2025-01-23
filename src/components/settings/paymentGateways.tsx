import {
  CheckOutlined,
  ExclamationOutlined,
  PlusOutlined
} from '@ant-design/icons'
import type { GetProp, UploadFile, UploadProps } from 'antd'
import {
  Button,
  Form,
  Image,
  Input,
  List,
  message,
  Modal,
  Tabs,
  TabsProps,
  Tag,
  Upload
} from 'antd'

// import update from 'immutability-helper'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useForm } from 'antd/es/form/Form'
import TextArea from 'antd/es/input/TextArea'
import update from 'immutability-helper'
import { useEffect, useState } from 'react'
import { randomString } from '../../helpers'
import { useCopyContent } from '../../hooks'
import {
  saveGatewayConfigReq,
  TGatewayConfigBody,
  uploadLogoReq
} from '../../requests'
import { TGateway } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import CopyToClipboard from '../ui/copyToClipboard'
import ModalWireTransfer from './appConfig/wireTransferModal'
import './paymentGateways.css'

function SortableItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </div>
  )
}
const Index = () => {
  const appConfig = useAppConfigStore()
  const [loading, setLoading] = useState(false)
  // const gatewayConfigList = appConfig.gateway
  const gateways = appConfig.gateway.map((g, idx) => ({
    ...g,
    id: randomString(8)
  }))
  // const [gatewayConfigList, setGatewayConfigList] = useState(gateways)
  const [items, setItems] = useState(gateways)
  const [gatewayName, setGatewayName] = useState('') // the gateway user want to config(open Modal to config this gateway)
  const [openSetupModal, setOpenSetupModal] = useState(false)
  const toggleSetupModal = (gatewayName?: string) => {
    setOpenSetupModal(!openSetupModal)
    setGatewayName(gatewayName ?? '')
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  const handleDragEnd = (event: DragEndEvent) => {
    const tgt = event.activatorEvent.target

    if (
      tgt != undefined &&
      tgt instanceof Element &&
      tgt.closest('.btn-gateway-config') != undefined
    ) {
      const gatewayClicked = tgt
        ?.closest('.btn-gateway-config')
        ?.getAttribute('data-gateway-name')
      toggleSetupModal(gatewayClicked as string)
      return
    }

    const { active, over } = event

    if (over != null && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id == active.id)
        const newIndex = items.findIndex((i) => i.id == over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const onReorder = () => {
    setLoading(true)
    setLoading(false)
  }

  const saveConfigInStore = (newGateway: TGateway) => {
    // if it's the first time admin configured this gateway, gatewayId is 0, so we cannot use id to find.
    const idx = items.findIndex((g) => g.gatewayName == newGateway.gatewayName)
    if (idx != -1) {
      const newGatewayList = update(items, {
        [idx]: { $set: newGateway }
      })
      appConfig.setGateway(newGatewayList)
    } else {
      message.error('Gateway not found')
    }
  }

  return (
    <div>
      {openSetupModal &&
        (gatewayName != 'wire_transfer' ? (
          <PaymentGatewaySetupModal
            gatewayConfig={items.find((i) => i.gatewayName == gatewayName)!}
            saveConfigInStore={saveConfigInStore}
            closeModal={toggleSetupModal}
          />
        ) : (
          <ModalWireTransfer
            gatewayConfig={items.find((i) => i.gatewayName == gatewayName)!}
            saveConfigInStore={saveConfigInStore}
            closeModal={toggleSetupModal}
          />
        ))}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={items}
          renderItem={(item, index) => (
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              <SortableItem key={item.id} id={item.id}>
                <List.Item className="payment-gateway-config-item">
                  <List.Item.Meta
                    avatar={
                      item.gatewayWebsiteLink == '' ? (
                        <div className="flex h-8 items-center justify-center overflow-hidden">
                          <img
                            style={{ flexShrink: 0 }}
                            height={'100%'}
                            src={item.gatewayLogo}
                          />
                        </div>
                      ) : (
                        <a href={item.gatewayWebsiteLink} target="_blank">
                          <div className="flex h-8 items-center justify-center overflow-hidden">
                            <img
                              style={{ flexShrink: 0 }}
                              height={'100%'}
                              src={item.gatewayLogo}
                            />
                          </div>
                        </a>
                      )
                    }
                    title={
                      item.gatewayWebsiteLink == '' ? (
                        <span>
                          {item.name}
                          <span className="text-xs text-gray-500">{` (${item.displayName})`}</span>
                        </span>
                      ) : (
                        <a href={item.gatewayWebsiteLink} target="_blank">
                          <span>
                            {item.name}
                            <span className="text-xs text-gray-500">{` (${item.displayName})`}</span>
                          </span>
                        </a>
                      )
                    }
                    description={item.description}
                  />
                  <div className="flex w-[180px] items-center justify-between">
                    {item.IsSetupFinished ? (
                      <Tag icon={<CheckOutlined />} color="#34C759">
                        Ready
                      </Tag>
                    ) : (
                      <Tag icon={<ExclamationOutlined />} color="#AEAEB2">
                        Not Set
                      </Tag>
                    )}
                    <Button
                      className="btn-gateway-config"
                      data-gateway-name={item.gatewayName}
                      // onClick event will be captured by handleDragEnd, never reached this button.
                      type={item.IsSetupFinished ? 'default' : 'primary'}
                    >
                      {item.IsSetupFinished ? 'Edit' : 'Set up'}
                    </Button>
                  </div>
                </List.Item>
              </SortableItem>
            </SortableContext>
          )}
        />
      </DndContext>
    </div>
  )
}
export default Index

const PaymentGatewaySetupModal = ({
  gatewayConfig,
  closeModal,
  saveConfigInStore
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  saveConfigInStore: (g: TGateway) => void
}) => {
  const needWebHook = ['changelly', 'unitpay', 'payssion'] // these 3 gateways need webhook config
  const tabItems: TabsProps['items'] = [
    {
      key: 'Essentials',
      label: 'Essentials',
      children: (
        <EssentialSetup
          gatewayConfig={gatewayConfig}
          saveConfigInStore={saveConfigInStore}
          closeModal={closeModal}
        />
      )
    },
    {
      key: 'Public/Private Keys',
      label: 'Public/Private Keys',
      children: (
        <PubPriKeySetup
          gatewayConfig={gatewayConfig}
          saveConfigInStore={saveConfigInStore}
          closeModal={closeModal}
        />
      )
    },
    {
      key: 'Webhook Keys',
      label: 'Webhook Keys',
      children: (
        <WebHookSetup
          gatewayConfig={gatewayConfig}
          saveConfigInStore={saveConfigInStore}
          closeModal={closeModal}
        />
      )
    }
  ]

  return (
    <Modal
      title={
        gatewayConfig.IsSetupFinished
          ? `Editing keys for ${gatewayConfig.name}`
          : `New keys for ${gatewayConfig.name}`
      }
      width={'720px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Tabs
        defaultActiveKey={'Essentials'}
        items={tabItems.filter(
          (t) =>
            t.key != 'Webhook Keys' ||
            needWebHook.find((w) => w == gatewayConfig.gatewayName) != undefined
        )}
      />
    </Modal>
  )
}

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

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

const MAX_FILE_COUNT = 5
const EssentialSetup = ({
  closeModal,
  gatewayConfig,
  saveConfigInStore
}: {
  closeModal: () => void
  gatewayConfig: TGateway
  saveConfigInStore: (g: TGateway) => void
}) => {
  const [loading] = useState(false)
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

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType)
    }

    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
  }

  const handleChange: UploadProps['onChange'] = ({
    fileList: newFileList,
    file,
    event
  }) => {
    setFileList(newFileList)
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined className="cursor-pointer" />
      <div className="mt-2 cursor-pointer">Upload</div>
    </button>
  )

  const onUpload = async () => {
    const formData = new FormData()
    const file = fileList[fileList.length - 1].originFileObj
    if (file == undefined) {
      return
    }
    const buf = await file.arrayBuffer()
    const blob = new Blob([buf])
    formData.append('file', blob)
    setUploading(true)
    const [logoUrl, err] = await uploadLogoReq(formData)
    setUploading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    const newFile: UploadFile = {
      uid: randomString(8),
      url: logoUrl,
      status: 'done',
      name: 'icon'
    }
    const newFileList = update(fileList, {
      [fileList.length - 1]: { $set: newFile }
    })
    setFileList(newFileList)
  }

  const onSave = async () => {
    if (displayName.trim() == '') {
      return
    }
    if (fileList.length == 0) {
      return
    }
    const body: TGatewayConfigBody = {
      gatewayName: gatewayConfig.gatewayName,
      displayName,
      gatewayLogo: fileList.filter((f) => f.url != undefined).map((f) => f.url!)
    }
    const isNew = gatewayConfig.gatewayId == 0
    if (!isNew) {
      body.gatewayId = gatewayConfig.gatewayId
    }
    const [newGateway, err] = await saveGatewayConfigReq(body, isNew)
    if (err != null) {
      message.error(err.message)
      return
    }
    saveConfigInStore(newGateway)
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

  return (
    <div>
      <div className="mb-2">Display Name</div>
      <Input
        value={displayName}
        onChange={onNameChange}
        status={displayName.trim() == '' ? 'error' : ''}
      />
      <div className="h-6" />
      <div className="mb-2">
        Gateway Icons{' '}
        <span className="text-xs text-gray-500">
          ({`${MAX_FILE_COUNT} logos at most, each < 2M, drag to reorder them`})
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
            maxCount={MAX_FILE_COUNT}
            accept=".png, .jpg, .jpeg"
            // accept=".png, .jpg, .jpeg, .svg"
            // multiple
            itemRender={(originNode, file) => (
              <DraggableUploadListItem originNode={originNode} file={file} />
            )}
            customRequest={onUpload}
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
          >
            {fileList.length >= MAX_FILE_COUNT ? null : uploadButton}
          </Upload>
        </SortableContext>
      </DndContext>
      {previewImage && (
        <Image
          width={'32px'}
          height={'32px'}
          // wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage('')
          }}
          src={previewImage}
        />
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
          OK
        </Button>
      </div>
    </div>
  )
}

const PubPriKeySetup = ({
  gatewayConfig,
  closeModal,
  saveConfigInStore
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  saveConfigInStore: (g: TGateway) => void
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    const pubKey = form.getFieldValue('gatewayKey')
    if (pubKey.trim() == '') {
      message.error('Public Key is empty')
      return
    }

    const privateKey = form.getFieldValue('gatewaySecret')
    if (privateKey.trim() == '') {
      message.error('Private Key is empty')
      return
    }
    const body: TGatewayConfigBody = {
      gatewayKey: pubKey,
      gatewaySecret: privateKey
    }
    const isNew = gatewayConfig.gatewayId == 0
    if (isNew) {
      body.gatewayName = gatewayConfig.gatewayName
    } else {
      body.gatewayId = gatewayConfig.gatewayId
    }

    setLoading(true)
    const [newGateway, err] = await saveGatewayConfigReq(body, isNew)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`${gatewayConfig?.gatewayName} keys saved`)
    saveConfigInStore(newGateway)
  }

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        colon={false}
        disabled={loading}
        initialValues={gatewayConfig}
      >
        <Form.Item label="Gateway ID" name="gatewayId" hidden>
          <Input disabled />
        </Form.Item>
        <div className="h-2" />

        <Form.Item
          label={
            gatewayConfig.gatewayName == 'paypal' ? 'Client Id' : 'Public Key'
          }
          name="gatewayKey"
          help={
            <div className="text-xs text-gray-400">
              For security reason, your{' '}
              {gatewayConfig.gatewayName == 'paypal'
                ? 'Client Id'
                : 'Public Key'}{' '}
              will be desensitized after submit.
            </div>
          }
        >
          <TextArea rows={4} />
        </Form.Item>
        <div className="h-2" />

        <Form.Item
          label={
            gatewayConfig.gatewayName == 'paypal' ? 'Secret' : 'Private Key'
          }
          name="gatewaySecret"
          help={
            <div className="text-xs text-gray-400">
              For security reason, your{' '}
              {gatewayConfig.gatewayName == 'paypal' ? 'Secret' : 'Private Key'}{' '}
              will be desensitized after submit.
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
          onClick={onSave}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </div>
  )
}

const WebHookSetup = ({
  gatewayConfig,
  closeModal,
  saveConfigInStore
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  saveConfigInStore: (g: TGateway) => void
}) => {
  const [form] = useForm()
  const [loading, setLoading] = useState(false)
  // configure pub/private keys first, then configure webhook
  const notSubmitable = gatewayConfig.gatewayKey == ''
  const onSave = () => {
    // saveConfigInStore()
    setLoading(true)
    setLoading(false)
  }
  const copyContent = async () => {
    const err = await useCopyContent(gatewayConfig.webhookEndpointUrl)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Copied')
  }

  return (
    <div>
      {notSubmitable && (
        <span className="text-xs text-red-500">
          Please create your Public/Private keys first, then configure the
          Webhook.
        </span>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        colon={false}
        disabled={gatewayConfig.gatewayKey == ''}
        initialValues={gatewayConfig}
      >
        <Form.Item label="Gateway ID" name="gatewayId" hidden>
          <Input disabled />
        </Form.Item>
        <div className="h-2" />

        <Form.Item
          label="Callback URL"
          name="webhookEndpointUrl"
          hidden={gatewayConfig.gatewayName !== 'changelly'}
        >
          <Input
            disabled
            suffix={
              <CopyToClipboard
                content={gatewayConfig.webhookEndpointUrl}
                disabled={notSubmitable}
              />
            }
          />
        </Form.Item>
        <div className="h-2" />
        <Form.Item
          label="Callback Key"
          name="webhookSecret"
          hidden={gatewayConfig.gatewayName !== 'changelly'}
          help={
            <div className="mt-2 text-sm">
              <Button
                type="link"
                onClick={copyContent}
                style={{ padding: 0 }}
                size="small"
              >
                Copy
              </Button>
              &nbsp;
              <span className="text-xs text-gray-400">
                the above URL, use this URL to generate your public key
                on&nbsp;&nbsp;
              </span>
              <a
                href="https://app.pay.changelly.com/integrations"
                target="_blank"
                rel="noreferrer"
                className="text-xs"
              >
                https://app.pay.changelly.com/integrations
              </a>
              <span className="text-xs text-gray-400">
                , then paste it here.
              </span>
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
          onClick={onSave}
          loading={loading}
          disabled={loading || notSubmitable}
        >
          OK
        </Button>
      </div>
    </div>
  )
}
