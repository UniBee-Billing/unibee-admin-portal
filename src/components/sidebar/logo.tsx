import { useMerchantInfoStore } from '../../stores'
import { withEnvBasePath } from '../../utils'

export const Logo = () => {
  const merchantInfoStore = useMerchantInfoStore()

  return (
    <div className="my-4 flex justify-center text-white">
      <img
        src={
          merchantInfoStore.companyLogo ||
          withEnvBasePath('/logoPlaceholder.png')
        }
        height={'80px'}
      />
    </div>
  )
}
