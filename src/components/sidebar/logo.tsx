import { useMerchantInfoStore } from '../../stores'
import { withEnvBasePath } from '../../utils'
export const Logo = ({ collapsed }: { collapsed: boolean }) => {
  const merchantInfoStore = useMerchantInfoStore()

  return (
    <div className="static my-4 flex h-14 items-center justify-center">
      <img
        height={`${collapsed ? '70%' : '100%'}  `}
        className={`p-2 transition-all duration-300`}
        src={
          merchantInfoStore.companyLogo ||
          withEnvBasePath('/logoPlaceholder.png')
        }
      />
    </div>
  )
}
