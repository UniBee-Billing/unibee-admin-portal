interface LicenseProps {
  data: string
}

export const License = ({ data }: LicenseProps) => {
  return <div className="rounded-xl bg-gray-100 p-4">{data}</div>
}
