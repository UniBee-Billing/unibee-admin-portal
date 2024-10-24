import { Form, FormInstance } from 'antd'
import { forwardRef } from 'react'
import { IProfile } from '../../../shared.types'
import { CountrySelector } from '../../countrySelector'

export type PernsonalAccountValues = {
  country: string
}

interface PernsonalAccountFormProps {
  user: IProfile
  loading: boolean
  onValuesChange(
    changesValue: Record<string, unknown>,
    values: PernsonalAccountValues
  ): void
}

export const PernsonalAccountForm = forwardRef<
  FormInstance,
  PernsonalAccountFormProps
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
