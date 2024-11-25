import { Button, Input, message, Modal } from 'antd'
import { useState } from 'react'
import { useLoading } from '../../hooks'
import { saveExportTmplReq } from '../../requests'
import { Template } from './templateSelector'

interface AddNewTemplateButtonProps {
  onTemplateCreate(template: Template): void
}

export const AddNewTemplateButton = ({
  onTemplateCreate
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

    const [data, err] = await withLoading(
      () => saveExportTmplReq({ task: 'InvoiceExport', name: templateName }),
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
        footer={[
          <Button key="cancel" onClick={closeAddNewTemplateModal}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmitClick}
            loading={isLoading}
          >
            Submit
          </Button>
        ]}
      >
        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Input new template name"
        ></Input>
      </Modal>
      <Button
        type="primary"
        className="mb-5 ml-6"
        onClick={() => setIsOpenAddNewTemplateModal(true)}
      >
        Add new template
      </Button>
    </>
  )
}
