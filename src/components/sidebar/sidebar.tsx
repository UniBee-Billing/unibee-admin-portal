import { ArrowLeftOutlined, LogoutOutlined } from '@ant-design/icons'
import { Divider, Layout } from 'antd'
import { useMemo, useState } from 'react'
import UserInfoSvg from '../../assets/user.svg?react'
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
      trigger={
        <ArrowLeftOutlined
          style={{
            color: 'gray',
            fontSize: '18px',
            transition: 'all 0.3s ease-in-out',
            transform: `rotate(${collapsed ? 180 : 0}deg)`
          }}
        />
      }
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

        <div className="absolute bottom-16 w-full">
          <div className="flex w-full items-center justify-center">
            <div className="flex w-[82%]">
              <Divider style={{ borderColor: '#595959', margin: '0 0' }} />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <AboutUniBee collapsed={collapsed} />
            <LogoWithAction
              collapsed={collapsed}
              text="Account Info"
              logo={<UserInfoSvg />}
              logoColor="text-gray-400"
              popoverText={
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-14 text-sm text-gray-500">Name:</div>
                    <div>
                      {merchantMemberProfile.firstName}{' '}
                      {merchantMemberProfile.lastName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-14 text-sm text-gray-500">Email:</div>
                    <div>{merchantMemberProfile.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-14 text-sm text-gray-500">Role:</div>
                    <div>{role}</div>
                  </div>
                </div>
              }
            />
            <LogoWithAction
              collapsed={collapsed}
              clickHandler={() => logout('login')}
              text="Log out"
              logo={<LogoutOutlined className="mr-2" />}
              logoColor="text-red-400"
            />
          </div>
        </div>
      </div>
    </Layout.Sider>
  )
}
