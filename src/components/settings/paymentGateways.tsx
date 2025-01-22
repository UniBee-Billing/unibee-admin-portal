import {
  CheckOutlined,
  ExclamationOutlined,
  LoadingOutlined,
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
import { useForm } from 'antd/es/form/Form'
import TextArea from 'antd/es/input/TextArea'
import update from 'immutability-helper'
import { useEffect, useState } from 'react'
import { randomString } from '../../helpers'
import { useCopyContent } from '../../hooks'
import {
  getPaymentGatewayConfigListReq,
  saveGatewayConfigReq,
  TGatewayConfigBody,
  uploadLogoReq
} from '../../requests'
import { TGateway } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import CopyToClipboard from '../ui/copyToClipboard'
import ModalWireTransfer, {
  NEW_WIRE_TRANSFER
} from './appConfig/wireTransferModal'

const Index = () => {
  const appConfig = useAppConfigStore()
  const [gatewayConfigList, setGatewayConfigList] = useState<TGateway[]>([])
  const [loading, setLoading] = useState(false)
  const [gatewayIndex, setGatewayIndex] = useState(-1)
  const [openSetupModal, setOpenSetupModal] = useState(false)
  const toggleSetupModal = (gatewayIdx?: number) => {
    setOpenSetupModal(!openSetupModal)
    if (gatewayIdx != undefined) {
      setGatewayIndex(gatewayIdx)
    }
  }

  const getGatewayConfigList = async () => {
    setLoading(true)
    const [gateways, err] = await getPaymentGatewayConfigListReq({
      refreshCb: getGatewayConfigList
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const wiredTransfer = appConfig.gateway.find(
      (g) => g.gatewayName == 'wire_transfer'
    )

    setGatewayConfigList(gateways.concat(wiredTransfer ?? NEW_WIRE_TRANSFER))
  }

  useEffect(() => {
    getGatewayConfigList()
  }, [])

  return (
    <div>
      {openSetupModal &&
        (gatewayConfigList[gatewayIndex].gatewayName != 'wire_transfer' ? (
          <PaymentGatewaySetupModal
            closeModal={toggleSetupModal}
            gatewayConfig={gatewayConfigList[gatewayIndex]}
            refresh={getGatewayConfigList}
          />
        ) : (
          <ModalWireTransfer
            closeModal={toggleSetupModal}
            detail={gatewayConfigList[gatewayIndex]}
            refresh={getGatewayConfigList}
          />
        ))}
      <List
        itemLayout="horizontal"
        loading={{ indicator: <LoadingOutlined spin />, spinning: loading }}
        dataSource={gatewayConfigList}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                item.gatewayWebsiteLink == '' ? (
                  <div
                    style={{
                      height: '36px',
                      width: '140px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      style={{ flexShrink: 0 }}
                      height={'100%'}
                      src={item.gatewayLogo}
                    />
                  </div>
                ) : (
                  <a href={item.gatewayWebsiteLink} target="_blank">
                    <div
                      style={{
                        height: '36px',
                        width: '140px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}
                    >
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
                  item.name
                ) : (
                  <a href={item.gatewayWebsiteLink} target="_blank">
                    {item.name}
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
                onClick={() => toggleSetupModal(index)}
                type={item.IsSetupFinished ? 'default' : 'primary'}
              >
                {item.IsSetupFinished ? 'Edit' : 'Set up'}
              </Button>
            </div>
          </List.Item>
        )}
      />
    </div>
  )
}
export default Index

const PaymentGatewaySetupModal = ({
  gatewayConfig,
  refresh,
  closeModal
}: {
  gatewayConfig: TGateway
  refresh: () => void
  closeModal: () => void
}) => {
  const tabItems: TabsProps['items'] = [
    {
      key: 'Essentials',
      label: 'Essentials',
      children: (
        <EssentialSetup
          gatewayConfig={gatewayConfig}
          refresh={refresh}
          closeModal={closeModal}
        />
      )
    },
    {
      key: 'Keys',
      label: 'Public/Private Keys',
      children: (
        <PubPriKeySetup
          gatewayConfig={gatewayConfig}
          refresh={refresh}
          closeModal={closeModal}
        />
      )
    },
    {
      key: 'Webhook',
      label: 'Webhook Keys',
      children: (
        <WebHookSetup
          gatewayConfig={gatewayConfig}
          refresh={refresh}
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
        // onChange={onTabChange}
        defaultActiveKey={'Essentials'}
        // onEdit={onTabEdit}
        items={tabItems}
      />
    </Modal>
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
  refresh
}: {
  closeModal: () => void
  gatewayConfig: TGateway
  refresh: () => void
}) => {
  const appConfig = useAppConfigStore()
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
    console.log(
      'file change, newFileList: ',
      newFileList,
      '//',
      file,
      '//',
      event
    )
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
    console.log(
      'save gateway config res: ',
      newGateway,
      '///',
      appConfig.gateway
    )
    message.success(`${gatewayConfig.name} config saved.`)
    refresh()
    const idx = appConfig.gateway.findIndex((g) => g.name == newGateway.name)
    if (idx != -1) {
      const newGatewayList = update(appConfig.gateway, {
        [idx]: { $set: newGateway }
      })
      appConfig.setGateway(newGatewayList)
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
        Gateway Logos{' '}
        <span className="text-xs text-gray-500">
          ({`${MAX_FILE_COUNT} logos at most, each < 2M`})
        </span>
      </div>
      <Upload
        disabled={uploading}
        listType="picture-card"
        maxCount={MAX_FILE_COUNT}
        accept=".png, .jpg, .jpeg, .svg"
        // multiple
        customRequest={onUpload}
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
      >
        {fileList.length >= MAX_FILE_COUNT ? null : uploadButton}
      </Upload>
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
  refresh
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  refresh: () => void
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    // return
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
      gatewaySecret: privateKey,
      gatewayName: gatewayConfig.gatewayName
    }

    setLoading(true)
    const [_, err] = await saveGatewayConfigReq(
      body,
      gatewayConfig.gatewayId == 0
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`${gatewayConfig?.gatewayName} keys saved`)
    refresh()
    closeModal()
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
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        colon={false}
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
              won't show up here after submit.
            </div>
          }
        >
          <TextArea rows={4} />
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
              <CopyToClipboard content={gatewayConfig.webhookEndpointUrl} />
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
  refresh
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  refresh: () => void
}) => {
  const [form] = useForm()
  const [loading] = useState(false)
  const onSave = () => {
    refresh()
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
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        colon={false}
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
              <CopyToClipboard content={gatewayConfig.webhookEndpointUrl} />
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
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </div>
  )
}
