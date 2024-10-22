import { FormInstance } from 'antd'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { AccountType, IProfile } from '../../../shared.types'
import { PanelSwitch } from '../../panelSwitch'
import { AccountTypeSwitch } from './accountTypeSwitch'
import type { PreviewData } from './assignSubModal'
import {
  BusinessAccountForm,
  BusinessAccountValues
} from './businessAccountForm'
import {
  PernsonalAccountForm,
  PernsonalAccountValues
} from './personalAccountForm'

interface AccountTypeProps {
  user: IProfile
  loading: boolean
  previewData: PreviewData | undefined
  onFormValuesChange(
    values: BusinessAccountValues | PernsonalAccountValues,
    accountType: AccountType
  ): void
}

export interface AccountTypeFormInstance {
  submit: () => Promise<BusinessAccountValues & PernsonalAccountValues>
}

export const AccountTypeForm = forwardRef<
  AccountTypeFormInstance,
  AccountTypeProps
>(({ user, onFormValuesChange, loading, previewData }, ref) => {
  const [prevAccountType, setPrevAccountType] = useState(user.type)
  const [selectedAccountType, setSelectedAccountType] =
    useState(prevAccountType)
  const businessAccountFormRef = useRef<FormInstance>(null)
  const pernsonalAccountFormRef = useRef<FormInstance>(null)
  const formRef = useMemo(
    () =>
      selectedAccountType === AccountType.BUSINESS
        ? businessAccountFormRef
        : pernsonalAccountFormRef,
    [selectedAccountType]
  )

  if (prevAccountType !== user.type) {
    setPrevAccountType(user.type)
    setSelectedAccountType(user.type)
  }

  const validate = async () => {
    if (
      !!previewData?.vatNumberValidateMessage ||
      !!previewData?.discountMessage
    ) {
      throw new Error('Invalid discount code or VAT number')
    }

    await formRef.current?.validateFields()
  }

  useImperativeHandle(ref, () => ({
    submit: async () => {
      await validate()

      return formRef.current?.getFieldsValue()
    }
  }))

  const updateFormValues = useDebouncedCallback(
    (values, selectedAccountType) => {
      onFormValuesChange(values, selectedAccountType)
    },
    500,
    {
      leading: false,
      trailing: true
    }
  )

  useEffect(() => {
    const values = formRef.current?.getFieldsValue()

    onFormValuesChange(values, selectedAccountType)
  }, [formRef, selectedAccountType])

  const FORM_DISPATCHER = {
    [AccountType.BUSINESS]: (
      <BusinessAccountForm
        ref={businessAccountFormRef}
        previewData={previewData}
        user={user}
        loading={loading}
        onValuesChange={(_, values) =>
          updateFormValues(values, selectedAccountType)
        }
      />
    ),
    [AccountType.PERSONAL]: (
      <PernsonalAccountForm
        ref={pernsonalAccountFormRef}
        loading={loading}
        user={user}
        onValuesChange={(_, values) =>
          updateFormValues(values, selectedAccountType)
        }
      />
    )
  }

  return (
    <div>
      <AccountTypeSwitch
        onAccountTypeChange={(type) => {
          setSelectedAccountType(type)
        }}
        accountType={selectedAccountType}
      />
      <PanelSwitch panels={FORM_DISPATCHER} activeKey={selectedAccountType} />
    </div>
  )
})
