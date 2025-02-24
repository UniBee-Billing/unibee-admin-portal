import { Result } from 'antd'

export default function NotFound() {
  return (
    <div className="flex justify-center">
      <Result
        status="404"
        title="404"
        subTitle="Oops! This page doesn’t seem to exist."
        // extra={<Button type="primary">Back Home</Button>}
      />
    </div>
  )
}
