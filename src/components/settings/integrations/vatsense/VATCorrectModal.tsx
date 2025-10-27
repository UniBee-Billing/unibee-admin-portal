import { Button, Input, Modal, Select, Tag, message } from 'antd';
import { VATRecord } from './VATSenseRecords';
import { useState, useEffect } from 'react';
import { correctVATValidationReq, deactivateVATValidationReq } from '@/requests';
import { getSystemInformationReq } from '@/requests/systemService';

interface VATCorrectModalProps {
  open: boolean;
  onClose: () => void;
  record: VATRecord | null;
  onConfirm: (data: any) => void;
}

const { TextArea } = Input;

// Helper function to get country name from country code
const getCountryName = (countryCode: string): string => {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

const VATCorrectModal = ({ open, onClose, record, onConfirm }: VATCorrectModalProps) => {
  const [country, setCountry] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supportedCountries, setSupportedCountries] = useState<string[]>([]);

  // Determine operation type based on current status
  // If current status is success, only allow deactivate (mark as invalid)
  // If current status is failure, only allow activate (mark as valid)
  const isActivateOperation = record?.validationStatus === 'failure';

  // Fetch supported countries from system information
  useEffect(() => {
    const fetchSupportedCountries = async () => {
      try {
        const [sysInfo, error] = await getSystemInformationReq()
        
        if (error) {
          console.error('Error fetching system information:', error)
          return
        }

      if (sysInfo?.supportCountryCode) {
        setSupportedCountries(Array.isArray(sysInfo.supportCountryCode) ? sysInfo.supportCountryCode : [])
      }
      } catch (err) {
        console.error('Exception in fetchSupportedCountries:', err)
      }
    }
    
    fetchSupportedCountries()
  }, [])

  useEffect(() => {
    if (record && open) {
      // Reset form when modal opens
      setCountry('');
      setCompanyName('');
      setCompanyAddress('');
    }
  }, [record, open]);

  if (!record) {
    return null;
  }

  const handleConfirm = () => {
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = async () => {
    if (!record) return;

    setLoading(true);

    try {
      if (isActivateOperation) {
        // Activate: Mark as valid
        // Validate required fields
        if (!country || !companyName || !companyAddress) {
          message.error('Please fill in all required fields');
          setLoading(false);
          return;
        }

        const [, error] = await correctVATValidationReq({
          historyId: record.id,
          countryCode: country,
          companyName: companyName,
          companyAddress: companyAddress,
        });

        if (error) {
          message.error(error.message || 'Failed to activate VAT record');
          setLoading(false);
          return;
        }

        message.success('VAT record activated successfully');
        
        const data = {
          isActivated: true,
          country,
          companyName,
          companyAddress,
        };
        onConfirm(data);
      } else {
        // Deactivate: Mark as invalid
        const [, error] = await deactivateVATValidationReq({
          historyId: record.id
        });

        if (error) {
          message.error(error.message || 'Failed to deactivate VAT record');
          setLoading(false);
          return;
        }

        message.success('VAT record deactivated successfully');
        
        const data = {
          isActivated: false,
        };
        onConfirm(data);
      }

      setShowConfirmDialog(false);
      onClose();
    } catch (err) {
      message.error('An error occurred while updating VAT record');
      console.error('Error updating VAT:', err);
    } finally {
      setLoading(false);
    }
  };

  const addressCharCount = companyAddress.length;
  // const notesCharCount = notes.length;

  return (
    <>
      <Modal
        open={open && !showConfirmDialog}
        onCancel={onClose}
        title={
          <span className="text-xl font-semibold">
            {isActivateOperation ? 'Activate Correction Action' : 'Deactivate Correction Action'}
          </span>
        }
        footer={null}
        centered
        width={540}
        closeIcon={<span className="text-gray-400 text-xl">×</span>}
      >
        <div className="space-y-5 pt-4">
          {/* Current Record Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Current Record</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Current Status:</p>
                <div className="mt-1">
                  {record.validationStatus === 'success' ? (
                    <Tag color="success">Success</Tag>
                  ) : (
                    <Tag color="error">Failure</Tag>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Country:</p>
                <p className="text-sm">{record.country ? `${getCountryName(record.country)} (${record.country})` : ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">VAT Number:</p>
                <p className="text-sm">{record.vatNumber}</p>
              </div>
            </div>
          </div>

          {/* Conditional Form Fields */}
          {isActivateOperation ? (
            <>
              {/* Activated State - Override as Valid */}
              <div>
                <label className="text-sm text-gray-700 mb-2 block">Country</label>
                <Select
                  value={country}
                  onChange={setCountry}
                  placeholder="Choose your country"
                  className="w-full"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    const label = option?.label;
                    if (typeof label === 'string') {
                      return label.toLowerCase().includes(input.toLowerCase());
                    }
                    return false;
                  }}
                >
                  {supportedCountries.map((countryCode) => (
                    <Select.Option 
                      key={countryCode} 
                      value={countryCode}
                      label={`${getCountryName(countryCode)} (${countryCode})`}
                    >
                      {getCountryName(countryCode)} ({countryCode})
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">Company Name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter Company Name..."
                  size="large"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">Company Address</label>
                <TextArea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Enter Company Address..."
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="text-xs text-gray-400 mt-1">{addressCharCount}/500 characters</div>
              </div>

              {/* <div>
                <label className="text-sm text-gray-700 mb-2 block">Notes</label>
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter Notes..."
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="text-xs text-gray-400 mt-1">{notesCharCount}/500 characters</div>
              </div> */}
            </>
          ) : (
            <>
              {/* Deactivated State - Mark as Invalid */}
              {/* <div>
                <label className="text-sm text-gray-700 mb-2 block">Reason</label>
                <Select
                  value={reason}
                  onChange={setReason}
                  placeholder="Choose your reason"
                  className="w-full"
                  size="large"
                >
                  <Select.Option value="invalid_format">Invalid Format</Select.Option>
                  <Select.Option value="not_registered">Not Registered</Select.Option>
                  <Select.Option value="expired">Expired</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </div> */}

              {/* <div>
                <label className="text-sm text-gray-700 mb-2 block">Notes</label>
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter Notes..."
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="text-xs text-gray-400 mt-1">{notesCharCount}/500 characters</div>
              </div> */}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              size="large"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleConfirm}
              style={{
                backgroundColor: '#FFD700',
                borderColor: '#FFD700',
                color: '#000',
                fontWeight: 500
              }}
              className="flex-1 hover:opacity-90"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <Modal
        open={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        title={<span className="text-xl font-semibold">Confirm Changes?</span>}
        footer={null}
        centered
        width={440}
        closeIcon={<span className="text-gray-400 text-xl">×</span>}
      >
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-6">
            You are about to override the system result. This action will affect tax calculation and invoicing.
          </p>
          <div className="flex gap-3">
            <Button
              size="large"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleFinalConfirm}
              loading={loading}
              style={{
                backgroundColor: '#FFD700',
                borderColor: '#FFD700',
                color: '#000',
                fontWeight: 500
              }}
              className="flex-1 hover:opacity-90"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default VATCorrectModal;

