import {
  GithubOutlined,
  LinkedinOutlined,
  TwitterOutlined
} from '@ant-design/icons'
import { Divider } from 'antd'

const Index = () => (
  <div
    style={{
      position: 'absolute',
      bottom: '0',
      height: '164px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      background: '#334b61',
      color: '#FFF'
    }}
  >
    <div style={{ width: '80%' }}>
      <Divider style={{ border: '#FFF', width: '80%' }}>
        <div style={{ display: 'flex', gap: '24px', color: '#FFF' }}>
          <GithubOutlined style={{ fontSize: '24px' }} />
          <TwitterOutlined style={{ fontSize: '24px' }} />
          <LinkedinOutlined style={{ fontSize: '24px' }} />
        </div>
      </Divider>
      <div className="flex flex-col items-center justify-center gap-3 text-white">
        <span>Copyright © 2024</span>
      </div>
    </div>
  </div>
)
export default Index
