import { LogoutOutlined } from '@ant-design/icons'
import { Layout } from 'antd'
import { useMemo, useState } from 'react'
import { useUser } from '../../services'
import { useMerchantMemberProfileStore } from '../../stores'
import { AboutUniBee } from './about/aboutUniBee'
import { Logo } from './logo'
import { SideMenu } from './sideMenu'

export const Sidebar = () => {
  const merchantMemberProfile = useMerchantMemberProfileStore()
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useUser()
  const role = useMemo(
    () =>
      merchantMemberProfile.isOwner
        ? 'Owner'
        : merchantMemberProfile.MemberRoles.map(({ role }) => (
            <div key={role} className="flex justify-center">
              {role}
            </div>
          )),
    [merchantMemberProfile]
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
            <div className="text-xs text-white">
              {merchantMemberProfile.email}
            </div>
            <div className="text-white">{`${merchantMemberProfile.firstName} ${merchantMemberProfile.lastName}`}</div>
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
