import { Radio } from 'antd'
import { AccountType } from '../../../shared.types'

export interface AccountTypeSwitchProps {
  onAccountTypeChange(accountType: AccountType): void
  accountType: AccountType
}

export const AccountTypeSwitch = ({
  onAccountTypeChange,
  accountType
}: AccountTypeSwitchProps) => (
  <Radio.Group
    onChange={(e) => onAccountTypeChange(e.target.value)}
    value={accountType}
  >
    <Radio value={AccountType.PERSONAL}>Individual</Radio>
    <Radio value={AccountType.BUSINESS}>Business</Radio>
  </Radio.Group>
)
