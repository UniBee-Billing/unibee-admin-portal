import { CopyOutlined, LoadingOutlined } from '@ant-design/icons'
import { Button, Modal, Spin, message } from 'antd'
import { useState } from 'react'
import { useCopyContent } from '../../../hooks'
import { generateApiKeyReq } from '../../../requests'

interface IProps {
  closeModal: () => void
}
const Index = ({ closeModal }: IProps) => {
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(true)
  const [key, setKey] = useState('')
  const onCreateKey = async () => {
    setLoading(true)
    const [key, err] = await generateApiKeyReq()
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setKey(key)
    setConfirming(false)
  }

  const copyContent = async () => {
    const err = await useCopyContent(key)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Copied')
  }

  return (
    <div style={{ margin: '32px 0' }}>
      <Modal
        title="UniBee API Key"
        width={'640px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <div className="my-6 flex w-full items-center justify-center gap-4">
          {confirming ? (
            <div>
              <p>
                You current key will still be valid within 1 hour after creating
                a new key. Are you sure you want to create the new key?
              </p>
            </div>
          ) : (
            <div>
              {loading ? (
                <Spin
                  spinning={loading}
                  indicator={
                    <LoadingOutlined
                      style={{ fontSize: 32, color: 'blue' }}
                      spin
                    />
                  }
                />
              ) : (
                <div className="flex w-full flex-col items-center justify-center">
                  <h1>UniBee API Key</h1>
                  <div className="flex items-center">
                    <div className="text-lg text-red-700">{key}</div>
                    <Button
                      type="link"
                      onClick={copyContent}
                      icon={<CopyOutlined />}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="my-4 text-xs text-gray-500">
                    This key won't show on this page after you close, please
                    copy and save it in a secure area. Your old key is still
                    valid within 1 hour.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4">
          <Button onClick={closeModal} disabled={loading}>
            Close
          </Button>
          <Button
            type="primary"
            onClick={onCreateKey}
            disabled={loading}
            loading={loading}
          >
            Create
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Index
