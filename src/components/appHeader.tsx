import { withEnvBasePath } from '../utils'

const Index = () => (
  <div
    style={{
      position: 'absolute',
      top: '0',
      height: '64px',
      padding: '0 24px',
      display: 'flex',
      zIndex: '100',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      background: '#334b61',
      color: '#FFF'
    }}
  >
    <div>
      <img src={withEnvBasePath('UniBeeLogo.png')} height={'36px'} />{' '}
      <span style={{ marginLeft: '8px', fontSize: '12px' }}>
        One-stop Billing for SaaS
      </span>
    </div>
  </div>
)
export default Index
