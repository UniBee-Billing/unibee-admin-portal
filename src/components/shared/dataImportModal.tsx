import {
  DownloadOutlined,
  LoadingOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { Button, Modal, Steps, message } from 'antd'
import { useState } from 'react'
import { downloadStaticFile, formatBytes } from '../../helpers'
import { importDataReq } from '../../requests'
import '../../shared.css'
import { TImportDataType } from '../../shared.types'
import { useAppConfigStore } from '../../stores'

const Index = ({
  closeModal,
  importType
}: {
  closeModal: () => void
  importType: TImportDataType
}) => {
  const appConfig = useAppConfigStore()
  const [importing, setImporting] = useState(false)
  const [fileStat, setFileStat] = useState({ name: '', size: 0 })

  const title: { [key in TImportDataType]: string } = {
    UserImport: 'User import',
    ActiveSubscriptionImport: 'Active subscription import',
    HistorySubscriptionImport: 'Subscription history import'
  }

  const downloadTemplate: { [key in TImportDataType]: () => void } = {
    UserImport: () => {
      console.log('user data import')
      downloadStaticFile(
        'https://api.unibee.top/import/template/user_import',
        'user_import_template.xlsx'
      )
    },
    ActiveSubscriptionImport: () => {
      console.log('active sub import')
      downloadStaticFile(
        'https://api.unibee.top/import/template/active_subscription_import',
        'active_subscription_import_template.xlsx'
      )
    },
    HistorySubscriptionImport: () => {
      console.log('history sub import')
      downloadStaticFile(
        'https://api.unibee.top/import/template/history_subscription_import',
        'subscription_history_import_template.xlsx'
      )
    }
  }

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    evt
  ) => {
    console.log('file change: ', evt)
    if (evt.target.files == null) {
      return
    }
    const f = evt.target.files[0]
    if (f.size > 1024 * 1024 * 20) {
      message.error('Max file size is 20M')
      return
    }
    setFileStat({ name: f.name, size: f.size })
    // evt.preventDefault()
    // console.log('importing: ', importType, '///', f)
    // return
    setImporting(true)
    const [res, err] = await importDataReq(f, importType)
    setImporting(false)
    evt.target.value = ''
    if (null != err) {
      message.error(`File upload failed: ${err.message}`)
      return
    }
    message.success(
      'Data is being imported, please check task list for progress'
    )
    closeModal()
    appConfig.setTaskListOpen(true)
  }

  return (
    <Modal
      title={title[importType]}
      width={'620px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div className="my-6">
        <Steps
          direction="vertical"
          size="small"
          // progressDot={true}
          current={1}
          items={[
            {
              title: (
                <Button
                  onClick={downloadTemplate[importType]}
                  size="small"
                  icon={<DownloadOutlined />}
                >
                  Download template file
                </Button>
              ),
              description: (
                <span className="text-xs text-gray-500">
                  To-be-imported data must comply to the structure in this
                  template file.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className="text-lg text-gray-900">
                  Populate template file with your data
                </span>
              ),
              description: (
                <span className="text-xs text-gray-500">
                  You cannot remove/modify column name in this file.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <div className="items-c flex">
                  <label htmlFor="input-user-data-file">
                    <div
                      className={`user-data-file-upload flex items-center ${importing ? 'disabled' : ''}`}
                    >
                      {importing ? <LoadingOutlined /> : <UploadOutlined />}{' '}
                      <span className="ml-2">Upload and import</span>
                    </div>
                  </label>
                  <div className="ml-2 flex items-center text-sm text-gray-500">
                    {`${fileStat.name} ${fileStat.size == 0 ? '' : '(' + formatBytes(fileStat.size) + ')'}`}
                  </div>
                  <input
                    type="file"
                    hidden
                    disabled={importing}
                    onChange={onFileChange}
                    // onClick={onFileClick}
                    style={{ display: 'none' }}
                    id="input-user-data-file"
                    name="input-user-data-file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  />
                </div>
              ),
              description: (
                <span className="text-xs text-gray-500">
                  Max file size: <span className="text-red-500">20M</span>
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className="text-gray-900">
                  Open task list to check importing progress
                </span>
              ),
              description: (
                <span className="text-xs text-gray-500">
                  In case of importing error, you can download the file you just
                  uploaded, each error will be explained in detail.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className="text-gray-900">
                  Refresh the page to further ensure data are imported
                </span>
              ),
              status: 'process'
            }
          ]}
        />
        <div className="flex items-center justify-end gap-4">
          <Button onClick={closeModal} disabled={importing}>
            Close
          </Button>
          {/* <Button
            type="primary"
            // onClick={form.submit}
            // loading={loading}
            // disabled={loading}
          >
            Import
          </Button> */}
        </div>
      </div>
    </Modal>
  )
}

export default Index
