import { Button, Modal, Table, Tabs, TabsProps } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import ReactQuill from 'react-quill'

type TEmailTmpl = {
  id: number
  name: string
  description: string
  status: string
  createdBy: string
  updatedAt: string
}

const RAW_TEXT = `
  <p>
  Dear [customer.name]:
  </p>
  <p><br></p>
  <p>
  Congratulation on your successful subscription on our Premium plan. Your benefits include:
  </p>
  <p><br></p>
  <p><br></p>
  <ul>
  <li>Local and cloud stored browser profiles</li>
  <li>Mimic and Stealthfox privacy browsers</li>
  <li>Custom browser fingerprint based on real-user data</li>
  <li>Easy proxy integration and verification</li>
  <li>Open API and knowledge center</li>
  <li>Browser automation with Playwright (Mimic only), Selenium Hardened, and Puppeteer Hardened</li>
  <li>10 Team member seats</li><li>Advanced team management</li>
  <li>Profile sharing24/7 in-app live chat and email support</li>
  </ul>
  <p><br></p>
  <p><br></p>
  <p>Your subscription fee will be charged on every [intervalCount] [intervalUnit] with [subscription.currency] [subscription.amount].</p>
  <p><br></p>
  `
const PreviewText = () => (
  <>
    <p>Dear [customer.name]:</p>
    <p>
      Congratulation on your successful subscription on our Premium plan. Your
      benefits include:
    </p>
    <ul>
      <li>Local and cloud stored browser profiles</li>
      <li>Mimic and Stealthfox privacy browsers</li>
      <li>Custom browser fingerprint based on real-user data</li>
      <li>Easy proxy integration and verification</li>
      <li>Open API and knowledge center</li>
      <li>
        Browser automation with Playwright (Mimic only), Selenium Hardened, and
        Puppeteer Hardened
      </li>
      <li>10 Team member seats</li>
      <li>Advanced team management</li>
      <li>Profile sharing</li>
      <li>24/7 in-app live chat and email support</li>
    </ul>
    <p>
      <br />
    </p>
    <p>
      Your subscription fee will be charged on every [intervalCount]
      [intervalUnit] with [subscription.amount].
    </p>
    <p>
      <br />
    </p>
  </>
)
const EditTemplate = () => {
  const [value, setValue] = useState(RAW_TEXT)
  const onTextChange = (content: string) => {
    setValue(content)
  }
  return (
    <div>
      <ReactQuill theme="snow" value={value} onChange={onTextChange} />
    </div>
  )
}

const PreviewTemplate = () => {
  return <PreviewText />
}

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [tabKey, setTabKey] = useState('Edit')
  const toggleModal = () => setModalOpen(!modalOpen)

  const tabItems: TabsProps['items'] = [
    {
      key: 'Edit',
      label: 'Edit',
      children: <EditTemplate />
    },
    {
      key: 'Preview',
      label: 'Preview',
      children: <PreviewTemplate />
    }
  ]
  const onTabChange = (key: string) => {
    setTabKey(key)
  }

  const columns: ColumnsType<TEmailTmpl> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status'
    },
    {
      title: 'Updated at',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (d) => dayjs(new Date(d)).format('YYYY-MMM-DD')
    },
    {
      title: 'Created by',
      dataIndex: 'createdBy',
      key: 'createdBy'
    }
  ]
  const data: TEmailTmpl[] = [
    {
      id: 1,
      name: 'login via OTP',
      description: 'send OTP in email',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 2,
      name: 'signup email confirm',
      description: 'signup email confirm',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 3,
      name: 'reset password',
      description: 'reset password',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 4,
      name: 'Successful subscription',
      description: 'Subscription with successful payment',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 5,
      name: 'Reminder to charge subscription fee',
      description: 'Reminder to charge subscription fee',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 6,
      name: 'Subscription with pending payment',
      description: 'Subscription with pending payment',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 7,
      name: 'Subscription with failed payment',
      description: 'Subscription with failed payment',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 8,
      name: 'Subscription fee charged successfully',
      description: 'Subscription fee charged successfully',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 9,
      name: 'Fail to charge subscription fee',
      description: 'Fail to charge subscription fee',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 10,
      name: 'Invoice delivered',
      description: 'Invoice delivered',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 11,
      name: 'Subscription plan upgraded',
      description: 'Subscription plan upgraded',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 12,
      name: 'Subscription plan downgraded',
      description: 'Subscription plan downgraded',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 13,
      name: 'Subscription due date extended',
      description: 'Subscription due date extended by *** days to ****-**-**',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 14,
      name: 'Subscription cancelled',
      description: 'Subscription cancelled',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    },
    {
      id: 15,
      name: 'Subscription resumed',
      description: 'Subscription resumed',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin'
    }
  ]
  return (
    <div>
      <Modal
        title="Email Template"
        open={modalOpen}
        width={'720px'}
        footer={null}
        closeIcon={null}
      >
        <Tabs activeKey={tabKey} items={tabItems} onChange={onTabChange} />

        <div className="my-5 flex items-center justify-end gap-4">
          <Button onClick={toggleModal}>Close</Button>
          <Button onClick={toggleModal}>Make it Default</Button>
          <Button type="primary" onClick={toggleModal}>
            Save
          </Button>
        </div>
      </Modal>
      <Table
        columns={columns}
        dataSource={data}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        onRow={() => {
          return {
            onClick: () => {
              toggleModal()
            }
          }
        }}
      />
    </div>
  )
}

export default Index
