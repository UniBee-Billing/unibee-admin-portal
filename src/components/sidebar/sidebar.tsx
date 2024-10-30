import { LogoutOutlined } from '@ant-design/icons'
import { Layout } from 'antd'
import { useMemo, useState } from 'react'
import { useUser } from '../../services'
import { AboutUniBee } from './about/aboutUniBee'
import { Logo } from './logo'
import { SideMenu } from './sideMenu'

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { logout, profile } = useUser()
  const role = useMemo(
    () =>
      profile.isOwner
        ? 'Owner'
        : profile.MemberRoles.map(({ role }) => (
            <div key={role} className="flex justify-center">
              {role}
            </div>
          )),
    [profile]
  )

  return (
    <Layout.Sider
      theme="dark"
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <Logo />
          <SideMenu />
        </div>
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center">
            <div className="text-xs text-white">{profile.email}</div>
            <div className="text-white">{`${profile.firstName} ${profile.lastName}`}</div>
            <div className="text-xs text-gray-400">{role}</div>
          </div>
          <AboutUniBee />
          <div
            onClick={() => logout('login')}
            className="my-4 cursor-pointer text-red-400"
          >
            <LogoutOutlined />
            &nbsp;&nbsp;Logout
          </div>
        </div>
      </div>
    </Layout.Sider>
  )
}
