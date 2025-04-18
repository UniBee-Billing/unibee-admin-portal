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
  PersonalAccountForm,
  PersonalAccountValues
} from './personalAccountForm'

interface AccountTypeProps {
  user: IProfile
  loading: boolean
  previewData: PreviewData | undefined
  onFormValuesChange(
    changedValues: Record<string, unknown>,
    values: BusinessAccountValues | PersonalAccountValues,
    accountType: AccountType
  ): void
}

export interface AccountTypeFormInstance {
  submit: () => Promise<BusinessAccountValues & PersonalAccountValues>
}

export const AccountTypeForm = forwardRef<
  AccountTypeFormInstance,
  AccountTypeProps
>(({ user, onFormValuesChange, loading, previewData }, ref) => {
  const [prevAccountType, setPrevAccountType] = useState<AccountType>(
    user.type === AccountType.NONE ? AccountType.PERSONAL : user.type
  )
  const [selectedAccountType, setSelectedAccountType] =
    useState(prevAccountType)
  const businessAccountFormRef = useRef<FormInstance>(null)
  const personalAccountFormRef = useRef<FormInstance>(null)
  const formRef = useMemo(
    () =>
      selectedAccountType === AccountType.BUSINESS
        ? businessAccountFormRef
        : personalAccountFormRef,
    [selectedAccountType]
  )

  if (prevAccountType !== user.type && user.type !== AccountType.NONE) {
    setPrevAccountType(user.type)
    setSelectedAccountType(user.type)
  }

  const validate = async () => {
    if (previewData?.vatNumberValidateMessage) {
      throw new Error('Invalid VAT number')
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
    (changedValues, values, selectedAccountType) => {
      onFormValuesChange(changedValues, values, selectedAccountType)
    },
    500,
    {
      leading: false,
      trailing: true
    }
  )

  useEffect(() => {
    const values = formRef.current?.getFieldsValue()

    onFormValuesChange({}, values, selectedAccountType)
  }, [formRef, selectedAccountType])

  const FORM_DISPATCHER = {
    [AccountType.BUSINESS]: (
      <BusinessAccountForm
        ref={businessAccountFormRef}
        previewData={previewData}
        user={user}
        loading={loading}
        onValuesChange={(changedValues, values) =>
          updateFormValues(changedValues, values, selectedAccountType)
        }
      />
    ),
    [AccountType.PERSONAL]: (
      <PersonalAccountForm
        ref={personalAccountFormRef}
        loading={loading}
        user={user}
        onValuesChange={(changedValues, values) =>
          updateFormValues(changedValues, values, selectedAccountType)
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
