import { request } from './client';

export interface EmailTemplate {
  id: number;
  merchantId: number;
  templateName: string;
  templateDescription: string;
  templateTitle: string;
  templateContent: string;
  templateAttachName: string;
  createTime: number;
  updateTime: number;
  status: string;
  gatewayTemplateId: string;
  languageData: {
    language: string;
    title: string;
    content: string;
  }[];
  localizationVersions: {
    versionId: string;
    versionName: string;
    activate: boolean;
    localizations: {
      language: string;
      title: string;
      content: string;
    }[];
  }[];
  VariableGroups: {
    groupName: string;
    variables: {
      variableName: string;
    }[];
  }[];
}

export interface EmailTemplateListResponse {
  emailTemplateList: EmailTemplate[];
  total: number;
}

export const getEmailTemplateListReq = async (): Promise<
  [EmailTemplateListResponse | null, Error | null]
> => {
  try {
    const res = await request.get('/merchant/email/template_list');
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export interface EmailSenderSetupParams {
  name: string;   // The name of email sender, like 'no-reply'
  address: string; // The address of email sender, like 'no-reply@unibee.dev'
}

export const saveEmailSenderSetupReq = async (params: EmailSenderSetupParams): Promise<
  [any | null, Error | null]
> => {
  try {
    const res = await request.post('/merchant/email/email_sender_setup', params);
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

export interface AddTemplateVersionParams {
  templateName: string;
  versionName: string;
  localizations: {
    language: string;
    title: string;
    content: string;
  }[];
}

export const addTemplateVersionReq = async (params: AddTemplateVersionParams): Promise<
  [any | null, Error | null]
> => {
  try {
    const res = await request.post('/merchant/email/template_add_localization_version', params);
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
}; 

export interface SaveTemplateVersionParams {
  templateName: string;
  versionId: string;
  versionName: string;
  localizations: {
    language: string;
    title: string;
    content: string;
  }[];
}

export const saveTemplateVersionReq = async (params: SaveTemplateVersionParams): Promise<
  [any | null, Error | null]
> => {
  try {
    const res = await request.post('/merchant/email/template_edit_localization_version', params);
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
}; 

export interface ActivateTemplateVersionParams {
  templateName: string;
  versionId: string;
}

export const activateTemplateVersionReq = async (params: ActivateTemplateVersionParams): Promise<
  [any | null, Error | null]
> => {
  try {
    const res = await request.post('/merchant/email/template_activate_localization_version', params);
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
}; 

export interface SendTestEmailParams {
  email: string;
  templateName: string;
  versionId: string;
  language: string;
}

export const sendTestEmailReq = async (params: SendTestEmailParams): Promise<
  [any | null, Error | null]
> => {
  try {
    const res = await request.post('/merchant/email/template_test_localization_version', params);
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
}; 

export interface DeleteTemplateVersionParams {
  templateName: string;
  versionId: string;
}

export const deleteTemplateVersionReq = async (params: DeleteTemplateVersionParams): Promise<
  [any | null, Error | null]
> => {
  try {
    const res = await request.post('/merchant/email/template_delete_localization_version', params);
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
}; 

export type TEmailHistory = {
  id: number
  merchantId: number
  email: string
  title: string
  content: string
  attachFile: string
  response: string
  createTime: number
  status: 0 | 1 | 2 // 0-pending, 1-success, 2-failure
}

export type TEmailHistoryStatistics = {
  totalSend: number
  totalSuccess: number
  totalFail: number
}

export interface EmailHistoryListResponse {
  emailHistories: TEmailHistory[]
  emailHistoryStatistics: TEmailHistoryStatistics
  total: number
}

export const getEmailHistoryListReq = async (params: {
  page: number
  count: number
  searchKey?: string
  status?: number[]
  createTimeStart?: number
  createTimeEnd?: number
  sortField?: string
  sortType?: string
}): Promise<[EmailHistoryListResponse | null, Error | null]> => {
  try {
    const res = await request.get('/merchant/email/history_list', { params })
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)]
    }
    return [res.data.data as EmailHistoryListResponse, null]
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error')
    return [null, e]
  }
}
