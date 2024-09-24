const APP_PATH = import.meta.env.BASE_URL

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
      <img src={`${APP_PATH}UniBeeLogo.png`} height={'36px'} />{' '}
      <span style={{ marginLeft: '8px', fontSize: '12px' }}>
        One-stop Billing for SaaS
      </span>
    </div>
    {/* <ul style={{ marginBottom: '0', display: 'flex', alignItems: 'center' }}>
      <li style={{ display: 'inline', marginRight: '16px' }}>
        <span>Home</span>
      </li>
      <li style={{ display: 'inline', marginRight: '16px' }}>
        <span>About</span>
      </li>
      <li style={{ display: 'inline', marginRight: '16px' }}>
        <span>Contact</span>
      </li>
      <li style={{ display: 'inline', marginRight: '0px' }}>
        <Search style={{ width: 120 }} />
      </li>
  </ul>*/}
  </div>
)
export default Index
