import { Button, Input, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useLoading } from '../../hooks'
import { saveExportTmplReq } from '../../requests'
import { Template } from './templateSelector'
import { getSystemTimezone } from '../../utils'

interface AddNewTemplateButtonProps {
  onTemplateCreate(template: Template): void
  templates?: Template[]
}

export const AddNewTemplateButton = ({
  onTemplateCreate,
  templates = []
}: AddNewTemplateButtonProps) => {
  const { isLoading, withLoading } = useLoading()
  const [isOpenAddNewTemplateModal, setIsOpenAddNewTemplateModal] =
    useState(false)
  const [templateName, setTemplateName] = useState<string | undefined>()

  const closeAddNewTemplateModal = () => setIsOpenAddNewTemplateModal(false)

  const handleSubmitClick = async () => {
    if (!templateName) {
      message.error('Template name is required')
      return
    }

    // Check if template with the same name already exists
    const isDuplicateName = templates.some(
      template => template.name.toLowerCase() === templateName.toLowerCase()
    )
    
    if (isDuplicateName) {
      message.error('Template name already exists. Please use a different name.')
      return
    }

    const [data, err] = await withLoading(
      () => {
        return saveExportTmplReq({ 
          task: 'InvoiceExport', 
          name: templateName,
          format: 'xlsx',
          payload: {
            timezone: getSystemTimezone(),
            isIncludePaidInvoices: false
          }
        })
      },
      false
    )

    if (err) {
      message.error(err.message)
      return
    }

    message.success('Template created successfully')
    onTemplateCreate(data.template)
    closeAddNewTemplateModal()
    setTemplateName(undefined)
  }

  return (
    <>
      <Modal
        open={isOpenAddNewTemplateModal}
        title="Add new template"
        destroyOnClose
        onCancel={closeAddNewTemplateModal}
        footer={
          <div className="flex justify-end pt-4">
            <Button key="cancel" onClick={closeAddNewTemplateModal} className="mr-2">
              Cancel
            </Button>
            <Button
              key="submit"
              onClick={handleSubmitClick}
              loading={isLoading}
              type="primary"
            >
              Submit
            </Button>
          </div>
        }
      >
        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Input new template name"
          className="mt-4"
        />
      </Modal>
      <Button
        type="primary"
        className="flex items-center justify-center w-full"
        onClick={() => setIsOpenAddNewTemplateModal(true)}
        icon={<PlusOutlined />}
      >
        Add New Template
      </Button>
    </>
  )
}
