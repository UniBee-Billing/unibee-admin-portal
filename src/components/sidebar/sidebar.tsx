import { LogoutOutlined } from '@ant-design/icons'
import { Divider, Layout } from 'antd'
import { useMemo, useState } from 'react'
import { useUser } from '../../services'
import { useMerchantMemberProfileStore } from '../../stores'
import { AboutUniBee } from './about/aboutUniBee'
import { Logo } from './logo'
import LogoWithAction from './logoWithAction'
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
      // trigger={null}
      theme="dark"
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div>
          <Logo />
          <SideMenu />
        </div>

        <div className="absolute bottom-20 w-full">
          <div className="flex flex-col items-center">
            <AboutUniBee collapsed={collapsed} />
            <LogoWithAction
              collapsed={collapsed}
              clickHandler={() => logout('login')}
              text="Logout"
              logo={<LogoutOutlined className="mr-2" />}
              logoColor="text-red-400"
            />
          </div>
          <div className="flex w-full items-center justify-center">
            <div className="flex w-[82%]">
              <Divider style={{ borderColor: '#595959', margin: '16px 0' }} />
            </div>
          </div>

          <LogoWithAction
            collapsed={collapsed}
            height="20px"
            text={merchantMemberProfile.email}
          />

          <LogoWithAction
            collapsed={collapsed}
            height="20px"
            text={`${merchantMemberProfile.firstName} ${merchantMemberProfile.lastName}`}
          />

          <LogoWithAction
            collapsed={collapsed}
            height="20px"
            text={role as string}
          />
        </div>
      </div>
    </Layout.Sider>
  )
}
