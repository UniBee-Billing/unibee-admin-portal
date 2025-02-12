const LogoWithAction = ({
  collapsed,
  clickHandler,
  text,
  logoColor,
  logo,
  height
}: {
  collapsed: boolean
  clickHandler?: () => void
  text: string
  logo?: React.ReactNode
  logoColor?: string
  height?: string
}) => (
  <div
    style={{ height: height ?? '40px' }}
    className={`relative flex w-full ${clickHandler != undefined && 'cursor-pointer'} items-center pl-7 opacity-80 hover:text-gray-900 hover:opacity-100`}
    onClick={clickHandler}
  >
    {logo != undefined && (
      <div
        className={`h-4 w-4 flex-shrink-0 ${logoColor} transition-all duration-300`}
      >
        {logo}
      </div>
    )}
    <div
      className={`${logo != undefined && 'ml-3'} flex-shrink-0 text-gray-100 ${
        collapsed ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-300`}
    >
      {text}
    </div>
  </div>
)

export default LogoWithAction

//         className="mb-1 mt-4 w-full cursor-pointer text-white opacity-75 transition duration-300 hover:opacity-100"
