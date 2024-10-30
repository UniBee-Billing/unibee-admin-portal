import { Form, FormInstance } from 'antd'
import { forwardRef } from 'react'
import { IProfile } from '../../../shared.types'
import { CountrySelector } from '../../countrySelector'

export type PersonalAccountValues = {
  country: string
}

interface PersonalAccountFormProps {
  user: IProfile
  loading: boolean
  onValuesChange(
    changesValue: Record<string, unknown>,
    values: PersonalAccountValues
  ): void
}

export const PersonalAccountForm = forwardRef<
  FormInstance,
  PersonalAccountFormProps
>(({ user, onValuesChange, loading }, ref) => (
  <Form
    ref={ref}
    className="mt-4"
    onValuesChange={onValuesChange}
    disabled={loading}
  >
    <Form.Item
      label="Country name"
      name="country"
      initialValue={user.countryCode}
      rules={[{ required: true, message: 'Country is required' }]}
    >
      <CountrySelector />
    </Form.Item>
  </Form>
))
