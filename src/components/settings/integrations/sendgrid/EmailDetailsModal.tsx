import { Button, Modal, Tag, Input } from 'antd';
import DOMPurify from 'dompurify';
import { EmailRecord } from './SendGridRecords';

interface EmailDetailsModalProps {
  open: boolean;
  onClose: () => void;
  record: EmailRecord | null;
}

const { TextArea } = Input;

const EmailDetailsModal = ({ open, onClose, record }: EmailDetailsModalProps) => {
  if (!record) {
    return null;
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span className="text-xl font-semibold">Email Details</span>}
      footer={null}
      centered
      width={680}
    >
      <div className="space-y-5 pt-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Sent Time</p>
          <p className="text-base">{record.sentTime}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Recipient</p>
          <p className="text-base">{record.recipient}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Subject</p>
          <p className="text-base">{record.subject.replace('...', '')}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Status</p>
          {record.status === 'sent' ? (
            <Tag color="success">Sent</Tag>
          ) : (
            <Tag color="error">Failed</Tag>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Original Email Content</p>
          <TextArea
            readOnly
            value={record.content}
            autoSize={{ minRows: 3, maxRows: 6 }}
            className="bg-gray-50 border rounded-md"
          />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">HTML Email Content</p>
          <div
            className="bg-white border rounded-md p-4 max-h-96 overflow-auto text-sm leading-relaxed"
            style={{ wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(record.content),
            }}
          />
        </div>
        <Button
          type="primary"
          size="large"
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default EmailDetailsModal;
