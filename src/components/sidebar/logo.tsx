import { useMerchantInfoStore } from '../../stores'
import { withEnvBasePath } from '../../utils'

const LOGO_CONTAINER_HEIGHT = 56

export const Logo = () => {
  const merchantInfoStore = useMerchantInfoStore()

  return (
    <div
      style={{ height: LOGO_CONTAINER_HEIGHT + 'px', width: '100%' }}
      className="relative my-5 flex max-h-full max-w-full items-center justify-center"
    >
      <img
        className={`h-full w-full object-contain px-2 transition-all duration-300`}
        src={
          merchantInfoStore.companyLogo ||
          withEnvBasePath('/logoPlaceholder.png')
        }
      />
    </div>
  )
}
