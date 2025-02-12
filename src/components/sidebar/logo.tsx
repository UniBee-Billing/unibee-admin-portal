import { Image } from 'antd'
import { useMerchantInfoStore } from '../../stores'
import { withEnvBasePath } from '../../utils'
export const Logo = ({ collapsed }: { collapsed: boolean }) => {
  const merchantInfoStore = useMerchantInfoStore()

  return (
    <div className="my-4 flex justify-center text-white">
      <Image
        className={`${collapsed ? 'w-10' : 'w-20'} h-20 transition-all duration-300`}
        src={
          merchantInfoStore.companyLogo ||
          withEnvBasePath('/logoPlaceholder.png')
        }
      />
    </div>
  )
}
