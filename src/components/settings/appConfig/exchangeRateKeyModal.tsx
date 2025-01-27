import { Button, Input, Modal, message } from 'antd'
import { useState } from 'react'
import { saveExRateKeyReq } from '../../../requests'
const { TextArea } = Input

interface IProps {
  closeModal: () => void
}
const Index = ({ closeModal }: IProps) => {
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const onKeyChange: React.ChangeEventHandler<HTMLTextAreaElement> = (evt) => {
    setApiKey(evt.target.value)
  }
  const onSaveKey = async () => {
    if (apiKey.trim() == '') {
      message.error('Key is empty')
      return
    }
    setLoading(true)
    const [_, err] = await saveExRateKeyReq(apiKey)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`Sendgrid API key saved`)
    closeModal()
  }

  return (
    <div style={{ margin: '32px 0' }}>
      <Modal
        title={`Exchange rate API Setup`}
        width={'640px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <div className="my-6 w-full">
          <div>Your API key</div>
          <TextArea rows={4} value={apiKey} onChange={onKeyChange} />
          <div className="text-xs text-gray-400">
            For security reason, your key won't show up here after submit.
          </div>
          <div>
            Apply your key on&nbsp;&nbsp;
            <a
              href="https://app.exchangerate-api.com/"
              target="_blank"
              rel="noreferrer"
            >
              https://app.exchangerate-api.com/
            </a>
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button onClick={closeModal} disabled={loading}>
            Close
          </Button>
          <Button
            type="primary"
            onClick={onSaveKey}
            disabled={loading}
            loading={loading}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Index
