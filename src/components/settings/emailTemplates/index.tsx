import { Button, Input, List, Modal, Select, Tooltip, Typography, message } from 'antd'
import { MailOutlined, DeleteOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { getSystemInformationReq } from '@/requests/systemService'
import { 
  getEmailTemplateListReq, 
  EmailTemplate, 
  saveEmailSenderSetupReq, 
  addTemplateVersionReq, 
  saveTemplateVersionReq, 
  activateTemplateVersionReq, 
  sendTestEmailReq, 
  deleteTemplateVersionReq 
} from '@/requests/emailService'
import './index.css'
import { writeClipboardText } from '@/utils/clipboard'

const { Title, Text } = Typography

interface SupportLanguage {
  code: string
  fullName: string
}

const EmailTemplateManagement = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [emailContent, setEmailContent] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [versionName, setVersionName] = useState('')

  const [isAddLanguageModalVisible, setIsAddLanguageModalVisible] = useState(false)
  const [supportedLanguages, setSupportedLanguages] = useState<SupportLanguage[]>([])
  const [availableLanguages, setAvailableLanguages] = useState<SupportLanguage[]>([])
  const [selectedNewLanguage, setSelectedNewLanguage] = useState<string | undefined>(undefined)
  const [loadingLanguages, setLoadingLanguages] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  
  const [isSenderSettingsModalVisible, setIsSenderSettingsModalVisible] = useState(false)
  const [senderEmail, setSenderEmail] = useState('')
  const [senderName, setSenderName] = useState('')
  const [savingSenderSettings, setSavingSenderSettings] = useState(false)

  const [isAddVersionModalVisible, setIsAddVersionModalVisible] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [addingVersion, setAddingVersion] = useState(false)
  
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteVersionModalVisible, setIsDeleteVersionModalVisible] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving' | 'Editing' | 'Hidden'>('Hidden')
  const saveStatusTimeoutRef = useRef<number | null>(null)

  const [activating, setActivating] = useState(false)

  const [isTestEmailModalVisible, setIsTestEmailModalVisible] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  const [activeLanguages, setActiveLanguages] = useState<SupportLanguage[]>([
    { code: 'en', fullName: 'English' },
  ])

  const quillRef = useRef<ReactQuill>(null)

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        window.clearTimeout(saveStatusTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setLoadingTemplates(true)
    getEmailTemplateListReq()
      .then(([data, error]) => {
        if (error) {
          return
        }
        if (data) {
          setTemplates(data.emailTemplateList)
          if (data.emailTemplateList.length > 0) {
            const firstTemplate = data.emailTemplateList[0]
            setSelectedTemplateId(firstTemplate.id)
            const activeVersion = firstTemplate.localizationVersions.find(v => v.activate)
            if (activeVersion) {
              setSelectedVersionId(activeVersion.versionId)
            } else {
              setSelectedVersionId('base-version')
            }
          }
        }
      })
      .finally(() => {
        setLoadingTemplates(false)
      })
  }, [])

  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplateId)
    if (template) {
      if (selectedVersionId === 'base-version') {
        setEmailContent(template.templateContent)
        setEmailSubject(template.templateTitle)
        setVersionName('Default Version')
      } else if (selectedVersionId) {
        const version = template.localizationVersions.find(v => v.versionId === selectedVersionId)
        if (version) {
          setVersionName(version.versionName)
        }
        const localization = version?.localizations.find(l => l.language === selectedLanguage)
        if (localization) {
          setEmailContent(localization.content)
          setEmailSubject(localization.title)
        } else {
          setEmailContent('')
          setEmailSubject('')
        }
      }
      
      setSaveStatus('Hidden')
      if (saveStatusTimeoutRef.current) {
        window.clearTimeout(saveStatusTimeoutRef.current)
        saveStatusTimeoutRef.current = null
      }
    }
  }, [selectedTemplateId, selectedVersionId, selectedLanguage, templates])

  const handleOpenAddLanguageModal = async () => {
    if (!isBaseVersionSelected) {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (!template) {
        message.error('Selected template not found')
        return
      }

      const version = template.localizationVersions.find(v => v.versionId === selectedVersionId)
      if (!version) {
        message.error('Selected version not found')
        return
      }

      const currentTitle = emailSubject.trim()
      const currentContent = emailContent.trim()
      const hasCurrentContent = currentTitle && currentContent && 
        currentContent !== '<p><br></p>' && currentContent !== '<p></p>'

      if (hasCurrentContent) {
        try {
          const validationErrors: string[] = []
          
          for (const lang of activeLanguages) {
            if (lang.code === selectedLanguage) {
              continue
            }
            
            const existingLocalization = version.localizations.find(l => l.language === lang.code)
            const title = existingLocalization?.title || ''
            const content = existingLocalization?.content || ''
            
            if (!title.trim()) {
              validationErrors.push(`Email subject cannot be empty for ${lang.fullName || lang.code}`)
            }
            
            if (!content.trim() || content.trim() === '<p><br></p>' || content.trim() === '<p></p>') {
              validationErrors.push(`Email content cannot be empty for ${lang.fullName || lang.code}`)
            }
          }
          
          if (validationErrors.length > 0) {
            message.error(validationErrors.join('; '))
            return
          }

          const localizations = activeLanguages.map(lang => {
            if (lang.code === selectedLanguage) {
              return {
                language: selectedLanguage,
                title: emailSubject,
                content: emailContent
              }
            } 
            
            const existingLocalization = version.localizations.find(l => l.language === lang.code)
            return {
              language: lang.code,
              title: existingLocalization?.title || '',
              content: existingLocalization?.content || ''
            }
          })

          const [, saveError] = await saveTemplateVersionReq({
            templateName: template.templateName,
            versionId: selectedVersionId!,
            versionName: versionName,
            localizations: localizations
          })
          
          if (saveError) {
            message.error(`Failed to save template before adding language: ${saveError.message}`)
            return
          }
          
          setSaveStatus('Saved')
          if (saveStatusTimeoutRef.current) {
            window.clearTimeout(saveStatusTimeoutRef.current)
          }
          saveStatusTimeoutRef.current = window.setTimeout(() => {
            setSaveStatus('Hidden')
            saveStatusTimeoutRef.current = null
          }, 3000)
          
          const [refreshedData] = await getEmailTemplateListReq()
          if (refreshedData) {
            setTemplates(refreshedData.emailTemplateList)
          }
          
        } catch {
          message.error('An unexpected error occurred while saving')
          return
        }
      } else {
        const missingFields: string[] = []
        if (!currentTitle) {
          missingFields.push('subject')
        }
        if (!currentContent || currentContent === '<p><br></p>' || currentContent === '<p></p>') {
          missingFields.push('content')
        }
        
        message.error(`Please fill in the email ${missingFields.join(' and ')} for the current language (${activeLanguages.find(lang => lang.code === selectedLanguage)?.fullName || selectedLanguage}) before adding a new language.`)
        return
      }
    }
    
    setIsAddLanguageModalVisible(true)
    if (!supportedLanguages.length) {
      setLoadingLanguages(true)
      getSystemInformationReq()
        .then(([systemInfo]) => {
          if (systemInfo && (systemInfo as Record<string, unknown>).supportLanguage) {
            setSupportedLanguages((systemInfo as Record<string, unknown>).supportLanguage as SupportLanguage[])
          }
        })
        .finally(() => {
          setLoadingLanguages(false)
        })
    }
  }

  useEffect(() => {
    const activeLangCodes = activeLanguages.map((l) => l.code)
    let available = supportedLanguages.filter((l) => !activeLangCodes.includes(l.code))
    if (activeLanguages.some((l) => l.fullName === '中文')) {
      available = available.filter((l) => l.fullName !== 'Chinese')
    }
    setAvailableLanguages(available)
  }, [activeLanguages, supportedLanguages])

  const handleAddLanguage = () => {
    if (selectedNewLanguage) {
      const language = supportedLanguages.find((l) => l.code === selectedNewLanguage)
      if (language && !activeLanguages.find((l) => l.code === language.code)) {
        setActiveLanguages((prev) => [...prev, language])
      }
    }
    setIsAddLanguageModalVisible(false)
    setSelectedNewLanguage(undefined)
  }

  const handleCancelAddLanguage = () => {
    setIsAddLanguageModalVisible(false)
    setSelectedNewLanguage(undefined)
  }

  const handleInsertVariable = (variable: string) => {
    writeClipboardText(variable, {
      successMsg: `${variable} copied to clipboard`
    })
  }

  const handleCloseSenderSettingsModal = () => {
    setIsSenderSettingsModalVisible(false)
  }

  const handleSaveSenderSettings = async () => {
    setSavingSenderSettings(true)
    try {
      const [, error] = await saveEmailSenderSetupReq({
        name: senderName,
        address: senderEmail
      })
      
      if (error) {
        message.error(`Failed to save sender settings: ${error.message}`)
      } else {
        message.success('Sender settings saved successfully')
        setIsSenderSettingsModalVisible(false)
      }
    } catch {
      message.error('An unexpected error occurred')
    } finally {
      setSavingSenderSettings(false)
    }
  }

  const handleOpenAddVersionModal = () => {
    setNewVersionName('')
    setIsAddVersionModalVisible(true)
  }

  const handleCloseAddVersionModal = () => {
    setIsAddVersionModalVisible(false)
  }

  const handleAddVersion = async () => {
    if (!selectedTemplateId || !newVersionName.trim()) {
      message.error('Template ID and version name are required')
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) {
      message.error('Selected template not found')
      return
    }

    setAddingVersion(true)
    try {
      const [, error] = await addTemplateVersionReq({
        templateName: template.templateName,
        versionName: newVersionName.trim(),
        localizations: [
          {
            language: 'en',
            title: '',
            content: ''
          }
        ]
      })
      
      if (error) {
        message.error(`Failed to add new version: ${error.message}`)
      } else {
        message.success('New version added successfully')
        setIsAddVersionModalVisible(false)
        
        const [refreshedData] = await getEmailTemplateListReq()
        if (refreshedData) {
          setTemplates(refreshedData.emailTemplateList)
          
          const updatedTemplate = refreshedData.emailTemplateList.find(t => t.id === selectedTemplateId)
          if (updatedTemplate) {
            const newVersion = updatedTemplate.localizationVersions.find(v => v.versionName === newVersionName.trim())
            if (newVersion) {
              setSelectedVersionId(newVersion.versionId)
            }
          }
        }
      }
    } catch {
      message.error('An unexpected error occurred')
    } finally {
      setAddingVersion(false)
    }
  }

  const handleSaveVersion = async () => {
    if (!selectedTemplateId || !selectedVersionId || selectedVersionId === 'base-version') {
      message.error('Cannot save the default version')
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) {
      message.error('Selected template not found')
      return
    }

    const version = template.localizationVersions.find(v => v.versionId === selectedVersionId)
    if (!version) {
      message.error('Selected version not found')
      return
    }

    const validationErrors: string[] = []
    
    for (const lang of activeLanguages) {
      let title = ''
      let content = ''
      
      if (lang.code === selectedLanguage) {
        title = emailSubject
        content = emailContent
      } else {
        const existingLocalization = version.localizations.find(l => l.language === lang.code)
        title = existingLocalization?.title || ''
        content = existingLocalization?.content || ''
      }
      
      if (!title.trim()) {
        validationErrors.push(`Email subject cannot be empty for ${lang.fullName || lang.code}`)
      }
      
      if (!content.trim() || content.trim() === '<p><br></p>' || content.trim() === '<p></p>') {
        validationErrors.push(`Email content cannot be empty for ${lang.fullName || lang.code}`)
      }
    }
    
    if (validationErrors.length > 0) {
      message.error(validationErrors.join('; '))
      return
    }

    setIsSaving(true)
    setSaveStatus('Saving')
    
    try {
      const localizations = activeLanguages.map(lang => {
        if (lang.code === selectedLanguage) {
          return {
            language: selectedLanguage,
            title: emailSubject,
            content: emailContent
          }
        } 
        
        const existingLocalization = version.localizations.find(l => l.language === lang.code)
        return {
          language: lang.code,
          title: existingLocalization?.title || '',
          content: existingLocalization?.content || ''
        }
      })

      const [, error] = await saveTemplateVersionReq({
        templateName: template.templateName,
        versionId: selectedVersionId,
        versionName: versionName,
        localizations: localizations
      })
      
      if (error) {
        message.error(`Failed to save template: ${error.message}`)
        setSaveStatus('Editing')
      } else {
        message.success('Template saved successfully')
        setSaveStatus('Saved')
        
        if (saveStatusTimeoutRef.current) {
          window.clearTimeout(saveStatusTimeoutRef.current)
        }
        saveStatusTimeoutRef.current = window.setTimeout(() => {
          setSaveStatus('Hidden')
          saveStatusTimeoutRef.current = null
        }, 3000)
        
        const [refreshedData] = await getEmailTemplateListReq()
        if (refreshedData) {
          setTemplates(refreshedData.emailTemplateList)
        }
      }
    } catch {
      message.error('An unexpected error occurred while saving')
      setSaveStatus('Editing')
    } finally {
      setIsSaving(false)
    }
  }

  const handleActivateVersion = async () => {
    if (!selectedTemplateId || !selectedVersionId) {
      message.error('Please select a template and version first')
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) {
      message.error('Selected template not found')
      return
    }

    setActivating(true)
    
    try {
      if (!isBaseVersionSelected) {
        if (!emailSubject.trim()) {
          message.error('Email subject cannot be empty')
          setActivating(false)
          return
        }
        
        if (!emailContent.trim() || emailContent.trim() === '<p><br></p>' || emailContent.trim() === '<p></p>') {
          message.error('Email content cannot be empty')
          setActivating(false)
          return
        }

        const version = template.localizationVersions.find(v => v.versionId === selectedVersionId)
        if (!version) {
          message.error('Selected version not found')
          setActivating(false)
          return
        }

        const validationErrors: string[] = []
        for (const lang of activeLanguages) {
          let title = ''
          let content = ''
          
          if (lang.code === selectedLanguage) {
            title = emailSubject
            content = emailContent
          } else {
            const existingLocalization = version.localizations.find(l => l.language === lang.code)
            title = existingLocalization?.title || ''
            content = existingLocalization?.content || ''
          }
          
          if (!title.trim()) {
            validationErrors.push(`Email subject cannot be empty for ${lang.fullName || lang.code}`)
          }
          
          if (!content.trim() || content.trim() === '<p><br></p>' || content.trim() === '<p></p>') {
            validationErrors.push(`Email content cannot be empty for ${lang.fullName || lang.code}`)
          }
        }
        
        if (validationErrors.length > 0) {
          message.error(validationErrors.join('; '))
          setActivating(false)
          return
        }

        const localizations = activeLanguages.map(lang => {
          if (lang.code === selectedLanguage) {
            return {
              language: selectedLanguage,
              title: emailSubject,
              content: emailContent
            }
          } 
          
          const existingLocalization = version.localizations.find(l => l.language === lang.code)
          return {
            language: lang.code,
            title: existingLocalization?.title || '',
            content: existingLocalization?.content || ''
          }
        })

        const [, saveError] = await saveTemplateVersionReq({
          templateName: template.templateName,
          versionId: selectedVersionId,
          versionName: versionName,
          localizations: localizations
        })
        
        if (saveError) {
          message.error(`Failed to save template before activation: ${saveError.message}`)
          setActivating(false)
          return
        }
        
        setSaveStatus('Saved')
        if (saveStatusTimeoutRef.current) {
          window.clearTimeout(saveStatusTimeoutRef.current)
        }
        saveStatusTimeoutRef.current = window.setTimeout(() => {
          setSaveStatus('Hidden')
          saveStatusTimeoutRef.current = null
        }, 3000)
      }

      const versionIdToActivate = selectedVersionId === 'base-version' ? '' : selectedVersionId!
      
      const [, error] = await activateTemplateVersionReq({
        templateName: template.templateName,
        versionId: versionIdToActivate
      })
      
      if (error) {
        message.error(`Failed to activate template version: ${error.message}`)
      } else {
        message.success('Template version activated successfully')
        
        const [refreshedData] = await getEmailTemplateListReq()
        if (refreshedData) {
          setTemplates(refreshedData.emailTemplateList)
        }
      }
    } catch {
      message.error('An unexpected error occurred while activating the template')
    } finally {
      setActivating(false)
    }
  }

  const handleOpenTestEmailModal = async () => {
    if (!selectedTemplateId || !selectedVersionId) {
      message.error('Please select a template and version first')
      return
    }

    if (!isBaseVersionSelected) {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (!template) {
        message.error('Selected template not found')
        return
      }

      const version = template.localizationVersions.find(v => v.versionId === selectedVersionId)
      if (!version) {
        message.error('Selected version not found')
        return
      }

      const validationErrors: string[] = []
      
      for (const lang of activeLanguages) {
        let title = ''
        let content = ''
        
        if (lang.code === selectedLanguage) {
          title = emailSubject
          content = emailContent
        } else {
          const existingLocalization = version.localizations.find(l => l.language === lang.code)
          title = existingLocalization?.title || ''
          content = existingLocalization?.content || ''
        }
        
        if (!title.trim()) {
          validationErrors.push(`Email subject cannot be empty for ${lang.fullName || lang.code}`)
        }
        
        if (!content.trim() || content.trim() === '<p><br></p>' || content.trim() === '<p></p>') {
          validationErrors.push(`Email content cannot be empty for ${lang.fullName || lang.code}`)
        }
      }
      
      if (validationErrors.length > 0) {
        message.error(validationErrors.join('; '))
        return
      }

      try {
        const localizations = activeLanguages.map(lang => {
          if (lang.code === selectedLanguage) {
            return {
              language: selectedLanguage,
              title: emailSubject,
              content: emailContent
            }
          } 
          
          const existingLocalization = version.localizations.find(l => l.language === lang.code)
          return {
            language: lang.code,
            title: existingLocalization?.title || '',
            content: existingLocalization?.content || ''
          }
        })

        const [, saveError] = await saveTemplateVersionReq({
          templateName: template.templateName,
          versionId: selectedVersionId,
          versionName: versionName,
          localizations: localizations
        })
        
        if (saveError) {
          message.error(`Failed to save template before sending test email: ${saveError.message}`)
          return
        }
        
        setSaveStatus('Saved')
        if (saveStatusTimeoutRef.current) {
          window.clearTimeout(saveStatusTimeoutRef.current)
        }
        saveStatusTimeoutRef.current = window.setTimeout(() => {
          setSaveStatus('Hidden')
          saveStatusTimeoutRef.current = null
        }, 3000)
        
        const [refreshedData] = await getEmailTemplateListReq()
        if (refreshedData) {
          setTemplates(refreshedData.emailTemplateList)
        }
        
      } catch {
        message.error('An unexpected error occurred while saving')
        return
      }
    }

    setIsTestEmailModalVisible(true)
  }

  const handleCloseTestEmailModal = () => {
    setIsTestEmailModalVisible(false)
    setTestEmailAddress('')
  }

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !selectedTemplateId || !selectedVersionId) {
      message.error('Email address, template and version are required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmailAddress)) {
      message.error('Please enter a valid email address')
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) {
      message.error('Selected template not found')
      return
    }

    setSendingTestEmail(true)
    try {
      const params = {
        email: testEmailAddress,
        templateName: template.templateName,
        versionId: selectedVersionId === 'base-version' ? '' : selectedVersionId,
        language: selectedLanguage,
      }

      const [, error] = await sendTestEmailReq(params)
      
      if (error) {
        message.error(`Failed to send test email: ${error.message}`)
      } else {
        message.success('Test email sent successfully')
        setIsTestEmailModalVisible(false)
        setTestEmailAddress('')
      }
    } catch {
      message.error('An unexpected error occurred while sending the test email')
    } finally {
      setSendingTestEmail(false)
    }
  }

  const handleDeleteVersion = async () => {
    if (!selectedTemplateId || !deletingVersionId) {
      message.error('Template ID and version ID are required')
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) {
      message.error('Selected template not found')
      return
    }
    setIsDeleting(true)

    try {
      const [, error] = await deleteTemplateVersionReq({
        templateName: template.templateName,
        versionId: deletingVersionId
      })
      
      if (error) {
        message.error(`Failed to delete version: ${error.message}`)
      } else {
        message.success('Version deleted successfully')
        
        const [refreshedData] = await getEmailTemplateListReq()
        if (refreshedData) {
          setTemplates(refreshedData.emailTemplateList)
          
          if (deletingVersionId === selectedVersionId) {
            const updatedTemplate = refreshedData.emailTemplateList.find(t => t.id === selectedTemplateId)
            if (updatedTemplate) {
              if (updatedTemplate.localizationVersions.length > 0) {
                const activeVersion = updatedTemplate.localizationVersions.find(v => v.activate)
                setSelectedVersionId(activeVersion ? activeVersion.versionId : updatedTemplate.localizationVersions[0].versionId)
              } else {
                setSelectedVersionId('base-version')
              }
            }
          }
        }
      }
    } catch {
      message.error('An unexpected error occurred')
    } finally {
      setDeletingVersionId(null)
      setIsDeleteVersionModalVisible(false)
      setIsDeleting(false)
    }
  }

  const handleOpenDeleteVersionModal = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingVersionId(versionId)
    setIsDeleteVersionModalVisible(true)
  }

  const handleCloseDeleteVersionModal = () => {
    setIsDeleteVersionModalVisible(false)
    setDeletingVersionId(null)
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
  const isBaseVersionSelected = selectedVersionId === 'base-version'
  
  const isSelectedVersionActivated = isBaseVersionSelected 
    ? !selectedTemplate?.localizationVersions.some(v => v.activate)
    : selectedTemplate?.localizationVersions.find(v => v.versionId === selectedVersionId)?.activate || false

  useEffect(() => {
    if (!selectedTemplateId || selectedVersionId === 'base-version') {
      setActiveLanguages([{ code: 'en', fullName: 'English' }])
      setSelectedLanguage(() => 'en')
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) {
      setActiveLanguages([{ code: 'en', fullName: 'English' }])
      setSelectedLanguage(() => 'en')
      return
    }

    const version = template.localizationVersions.find(v => v.versionId === selectedVersionId)
    if (!version || !version.localizations || version.localizations.length === 0) {
      setActiveLanguages([{ code: 'en', fullName: 'English' }])
      setSelectedLanguage(() => 'en')
      return
    }

    const availableLanguageCodes = [...new Set(version.localizations.map(l => l.language))]
    
    if (!availableLanguageCodes.includes('en')) {
      availableLanguageCodes.push('en')
    }
    
    const languages = availableLanguageCodes.map(code => {
      const supportedLang = supportedLanguages.find(l => l.code === code)
      return {
        code,
        fullName: supportedLang?.fullName || (
          code === 'en' ? 'English' : 
          code === 'cn' ? '中文' : 
          code === 'vi' ? 'Vietnamese' : 
          code === 'ru' ? 'Russian' : 
          code === 'es' ? 'Spanish' :
          code === 'fr' ? 'French' : 
          code === 'de' ? 'German' : 
          code === 'it' ? 'Italian' : 
          code === 'ja' ? 'Japanese' : 
          code === 'ko' ? 'Korean' : 
          code === 'pt' ? 'Portuguese' : 
          code === 'ar' ? 'Arabic' :
          code === 'hi' ? 'Hindi' :
          code
        )
      }
    })
    
    setActiveLanguages(languages)
    
    setSelectedLanguage((currentLanguage) => {
      if (!availableLanguageCodes.includes(currentLanguage) || !currentLanguage) {
        return 'en'
      }
      return currentLanguage
    })
  }, [selectedTemplateId, selectedVersionId, templates, supportedLanguages])

  return (
    <div className="email-template-container">
      <div className="email-template-header">
        <Title level={4} style={{ margin: 0, fontSize: '20px', fontWeight: 500 }}>Email Template</Title>
      </div>
      <div className="email-template-layout">
        <div className="template-list-panel">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5} className="template-list-title">Template List</Title>
          </div>
          <List
            loading={loadingTemplates}
            dataSource={templates}
            renderItem={template => (
              <List.Item
                className={`template-item ${selectedTemplateId === template.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTemplateId(template.id)
                  const activeVersion = template.localizationVersions.find(v => v.activate)
                  if (activeVersion) {
                    setSelectedVersionId(activeVersion.versionId)
                  } else {
                    setSelectedVersionId('base-version')
                  }
                }}
              >
                <Text strong>{template.templateName}</Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>{template.templateDescription}</Text>
                <div className="versions-list">
                  <div
                    key={'base-version'}
                    className={`version-item ${selectedVersionId === 'base-version' ? 'selected-version' : ''} ${!template.localizationVersions.some(v => v.activate) ? 'default-version' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTemplateId(template.id)
                      setSelectedVersionId('base-version')
                    }}
                  >
                    <MailOutlined className="version-icon" />
                    <Text className='version-name'>Default Version</Text>
                  </div>
                  {template.localizationVersions.map(version => (
                    <div
                      key={version.versionId}
                      className={`version-item ${selectedVersionId === version.versionId ? 'selected-version' : ''} ${version.activate ? 'default-version' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTemplateId(template.id)
                        setSelectedVersionId(version.versionId)
                      }}
                    >
                      <MailOutlined className="version-icon" />
                      <Text className='version-name'>{version.versionName}</Text>
                      <DeleteOutlined 
                        className="version-delete-icon" 
                        onClick={(e) => handleOpenDeleteVersionModal(version.versionId, e)} 
                        style={{ marginLeft: 'auto', fontSize: '14px', color: '#ff4d4f' }}
                      />
                    </div>
                  ))}
                   <div 
                    className="add-new-version-in-list"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTemplateId(template.id)
                      handleOpenAddVersionModal()
                    }}
                   >
                    + Add new version
                   </div>
                </div>
              </List.Item>
            )}
          />
        </div>

        <div className="editor-content-panel">
          <div className="editor-header">
            <Title level={5}>Edit: Email Template</Title>
          </div>
          <div className='editor-body'>
            <div className="editor-field">
              <Text>Template Version Name</Text>
              <Input 
                value={versionName} 
                onChange={e => {
                  setVersionName(e.target.value)
                  if (!isBaseVersionSelected) setSaveStatus('Editing')
                }} 
                readOnly={isBaseVersionSelected} 
              />
            </div>

            <div className="editor-field">
              <Text>Email Subject</Text>
              <Input 
                value={emailSubject} 
                onChange={e => {
                  setEmailSubject(e.target.value)
                  if (!isBaseVersionSelected) setSaveStatus('Editing')
                }} 
                readOnly={isBaseVersionSelected} 
              />
            </div>

            <div className="editor-field">
              <Text>Email Content</Text>
              <div className='editor-container'>
                <div id="toolbar">
                  <button className="ql-bold" />
                  <button className="ql-italic" />
                  <button className="ql-underline" />
                  <button className="ql-link" />
                  <button className="ql-list" value="ordered" />
                  <button className="ql-list" value="bullet" />
                  <button className="ql-image" />
                  <button className="ql-table" />
                </div>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={emailContent}
                  onChange={(content) => {
                    setEmailContent(content)
                    if (!isBaseVersionSelected) setSaveStatus('Editing')
                  }}
                  modules={{ toolbar: '#toolbar' }}
                  readOnly={isBaseVersionSelected}
                />
                <div className="editor-bottom-bar">
                  {saveStatus !== 'Hidden' && (
                    <Text type="secondary" className={`save-status ${saveStatus.toLowerCase()}`}>{saveStatus}</Text>
                  )}
                  <a onClick={() => {
                    setEmailContent('')
                    if (!isBaseVersionSelected) setSaveStatus('Editing')
                  }} className="clear-all-link">clear all</a>
                </div>
              </div>
            </div>

          </div>

          <div className="editor-footer">
            <div></div>
            <div className='footer-actions'>
              <Button 
                onClick={handleSaveVersion} 
                loading={isSaving} 
                disabled={isBaseVersionSelected}
              >
                Save
              </Button>
              {isSelectedVersionActivated ? (
                <Button 
                  style={{ backgroundColor: '#52c41a', color: 'white' }}
                  disabled={true}
                >
                  Activated
                </Button>
              ) : (
                <Button 
                  onClick={handleActivateVersion} 
                  loading={activating}
                >
                  Activate
                </Button>
              )}
              <Button 
                onClick={handleOpenTestEmailModal} 
                className="ant-btn-black"
                disabled={isBaseVersionSelected}
              >
                Send Test Email
              </Button>
            </div>
          </div>
        </div>

        <div className="sidebar-panel">
          <div className="language-settings">
            <Title level={5}>Language Settings</Title>
            <div className="language-pills">
              {activeLanguages.map((lang) => (
                <Button
                  key={lang.code}
                  className={selectedLanguage === lang.code ? 'selected' : ''}
                  onClick={() => setSelectedLanguage(lang.code)}
                >
                  {lang.fullName || lang.code}
                </Button>
              ))}
              <Button type="dashed" className="add-lang-btn" onClick={handleOpenAddLanguageModal}>
                Add Language +{' '}
              </Button>
            </div>
          </div>

          <div className="variables-section">
            <div className='variable-header'>
              <Title level={5}>Available Variables</Title>
            </div>
            {selectedTemplate?.VariableGroups.map(group => (
              <div className="variable-group" key={group.groupName}>
                <Text strong>{group.groupName}</Text>
                <div className="variable-tags-container">
                  {group.variables.map(v => 
                      <Tooltip title={`Click to copy: ${v.variableName}`} key={v.variableName}>
                          <div className="variable-tag" onClick={() => handleInsertVariable(`{${v.variableName}}`)}>
                            {`{${v.variableName}}`}
                          </div>
                      </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Modal
        title="Add Language"
        open={isAddLanguageModalVisible}
        onOk={handleAddLanguage}
        onCancel={handleCancelAddLanguage}
        destroyOnClose
        footer={[
          <Button key="back" onClick={handleCancelAddLanguage}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loadingLanguages}
            onClick={handleAddLanguage}
            disabled={!selectedNewLanguage}
          >
            Submit
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Text>Select Language</Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Please select a language"
            onChange={(value) => setSelectedNewLanguage(value)}
            loading={loadingLanguages}
            value={selectedNewLanguage}
          >
            {availableLanguages.map((lang) => (
              <Select.Option key={lang.code} value={lang.code}>
                {`${lang.fullName} (${lang.code})`}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>

      <Modal
        title="Template Setting"
        open={isSenderSettingsModalVisible}
        onCancel={handleCloseSenderSettingsModal}
        footer={null}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text>Sender Email</Text>
            <Input
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="support@company.com"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text>Sender Name</Text>
            <Input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Input Sender Name"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
            <Button onClick={handleCloseSenderSettingsModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSenderSettings}
              className="ant-btn-black"
              loading={savingSenderSettings}
            >
              Comfirm
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Add new Version"
        open={isAddVersionModalVisible}
        onCancel={handleCloseAddVersionModal}
        footer={null}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text>Template</Text>
            <Input value={selectedTemplate?.templateName || ''} disabled />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text>Template Version Name</Text>
            <Input
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="Input new template name"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
            <Button onClick={handleCloseAddVersionModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddVersion}
              className="ant-btn-black"
              loading={addingVersion}
              disabled={!newVersionName.trim()}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Send Test Email"
        open={isTestEmailModalVisible}
        onCancel={handleCloseTestEmailModal}
        footer={null}
        destroyOnClose
        className="test-email-modal"
      >
        <div>
          <div className="test-email-field">
            <Text>Template</Text>
            <Input value={selectedTemplate?.templateName || ''} disabled />
          </div>
          <div className="test-email-field">
            <Text>Version</Text>
            <Input value={isBaseVersionSelected ? 'Default Version' : selectedTemplate?.localizationVersions.find(v => v.versionId === selectedVersionId)?.versionName || ''} disabled />
          </div>
          <div className="test-email-field">
            <Text>Language</Text>
            <Input value={activeLanguages.find(lang => lang.code === selectedLanguage)?.fullName || selectedLanguage} disabled />
          </div>
          <div className="test-email-field">
            <Text>Recipient Email Address</Text>
            <Input
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="Enter recipient email address"
            />
          </div>
          <div className="test-email-actions">
            <Button onClick={handleCloseTestEmailModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendTestEmail}
              className="ant-btn-black"
              loading={sendingTestEmail}
              disabled={!testEmailAddress.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Delete Version"
        open={isDeleteVersionModalVisible}
        onCancel={handleCloseDeleteVersionModal}
        footer={null}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p>Are you sure you want to delete this version?</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
            <Button onClick={handleCloseDeleteVersionModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteVersion}
              danger
              type="primary"
              loading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EmailTemplateManagement
