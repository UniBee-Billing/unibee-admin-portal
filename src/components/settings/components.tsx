import { InputNumber, InputNumberProps, message, Skeleton, Switch } from 'antd'
import { isValidNumber } from '../../utils'

export interface ConfigComponentProps<T = unknown> {
  value: T | undefined
  update: (value: T) => void
  loading: boolean
}

export const Config = {
  Switch: (props: ConfigComponentProps<boolean>) => (
    <Switch {...props} onChange={(checked) => props.update(checked)} />
  ),
  InputNumber: (props: ConfigComponentProps<number> & InputNumberProps) =>
    props.loading ? (
      <Skeleton.Input />
    ) : (
      <InputNumber
        {...props}
        onBlur={(e) => {
          const value = +e.target.value

          if (!isValidNumber(value)) {
            message.error('Invalid number')
            return
          }

          props.update(value)
        }}
      />
    )
}
