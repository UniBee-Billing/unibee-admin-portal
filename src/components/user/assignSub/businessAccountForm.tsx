import { Form, FormInstance, Input } from 'antd'
import { forwardRef } from 'react'
import { IProfile } from '../../../shared.types'
import { CountrySelector } from '../../countrySelector'
import type { PreviewData } from './assignSubModal'

export type BusinessAccountValues = {
  companyName: string
  country: string
  city: string
  postalCode: string
  address: string
  registrationNumber: string
  vat: string
}

export interface BusinessAccountFormProps {
  user: IProfile
  loading: boolean
  previewData: PreviewData | undefined
  onValuesChange(
    changesValue: Record<string, unknown>,
    values: BusinessAccountValues
  ): void
}

export const getValidStatusByMessage = (message: string | undefined) =>
  message ? 'error' : ''

export const BusinessAccountForm = forwardRef<
  FormInstance,
  BusinessAccountFormProps
>(({ user, loading, onValuesChange, previewData }, ref) => {
  return (
    <Form
      ref={ref}
      name="basic"
      className="mt-4"
      disabled={loading}
      onValuesChange={onValuesChange}
    >
      <Form.Item
        label="Company name"
        name="companyName"
        rules={[{ required: true, message: 'Company name is required' }]}
        initialValue={user.companyName}
      >
        <Input placeholder="Company name"></Input>
      </Form.Item>

      <Form.Item
        label="Country name"
        name="country"
        rules={[{ required: true, message: 'Country is required' }]}
        initialValue={user.countryCode}
      >
        <CountrySelector className="w-full" />
      </Form.Item>

      <Form.Item
        label="City"
        name="city"
        rules={[{ required: true, message: 'City is required' }]}
        initialValue={user.city}
      >
        <Input placeholder="City"></Input>
      </Form.Item>

      <Form.Item
        label="Postal code"
        name="postalCode"
        rules={[{ required: true, message: 'Postal code is required' }]}
        initialValue={user.zipCode}
      >
        <Input placeholder="Postal code"></Input>
      </Form.Item>

      <Form.Item
        label="Address"
        name="address"
        rules={[{ required: true, message: 'Address is required' }]}
        initialValue={user.address}
      >
        <Input placeholder="Address"></Input>
      </Form.Item>

      <Form.Item
        initialValue={user.registrationNumber}
        label="Registration number"
        name="registrationNumber"
      >
        <Input placeholder="Registration number"></Input>
      </Form.Item>

      <Form.Item
        label="VAT"
        name="vat"
        initialValue={user.vATNumber}
        validateStatus={getValidStatusByMessage(
          previewData?.vatNumberValidateMessage
        )}
        help={previewData?.vatNumberValidateMessage}
      >
        <Input placeholder="VAT"></Input>
      </Form.Item>
    </Form>
  )
})
