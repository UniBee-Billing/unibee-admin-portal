import { Button, Modal, Tag } from 'antd';
import { VATRecord } from './VATSenseRecords';

interface VATDetailsModalProps {
  open: boolean;
  onClose: () => void;
  record: VATRecord | null;
}

const VATDetailsModal = ({ open, onClose, record }: VATDetailsModalProps) => {
  if (!record) {
    return null;
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span className="text-xl font-semibold">VAT Record Details</span>}
      footer={null}
      centered
      width={520}
      closeIcon={<span className="text-gray-400 text-xl">×</span>}
    >
      <div className="space-y-6 pt-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Merchant ID</p>
          <p className="text-base">{record.merchantId}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">VAT Number</p>
          <p className="text-base">{record.vatNumber}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Country</p>
          <p className="text-base">{record.country || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Company Name</p>
          <p className="text-base">{record.companyName || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Company Address</p>
          <p className="text-base">{record.companyAddress || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Validation Result</p>
          {record.manualOverride === 'activated' ? (
            <Tag color="success" className="px-3 py-1">Activated (Manual)</Tag>
          ) : record.manualOverride === 'deactivated' ? (
            <Tag color="default" className="px-3 py-1">Deactivated (Manual)</Tag>
          ) : (
            <Tag color={record.validationStatus === 'success' ? 'success' : 'error'} className="px-3 py-1">
              {record.validationStatus === 'success' ? 'Success' : 'Failure'}
            </Tag>
          )}
        </div>

        {/* <div>
          <p className="text-sm text-gray-500 mb-2">Notes</p>
          <p className="text-base">{record.notes || 'No notes'}</p>
        </div> */}

        <Button
          type="primary"
          size="large"
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '8px'
          }}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default VATDetailsModal;

