import { request } from './client';
import { CreditNoteListRequest, CreditNoteListResponse } from '../components/refund/types';

/**
 * Get Credit Note list
 * @param params Search parameters
 * @returns Promise<[CreditNoteListResponse['data'] | null, Error | null]>
 */
export const getCreditNoteListReq = async (params: CreditNoteListRequest): Promise<
  [CreditNoteListResponse['data'] | null, Error | null]
> => {
  try {
    const res = await request.post('/merchant/invoice/credit_note/list', params);
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
};

/**
 * Upload CSV file for bulk search
 * @param file CSV file
 * @param params Other search parameters
 * @returns Promise<[CreditNoteListResponse['data'] | null, Error | null]>
 */
export const uploadCSVAndSearchReq = async (
  file: File, 
  params: Omit<CreditNoteListRequest, 'file'>
): Promise<[CreditNoteListResponse['data'] | null, Error | null]> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v.toString()));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const res = await request.post('/merchant/invoice/credit_note/list', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (res.data.code !== 0) {
      return [null, new Error(res.data.message)];
    }
    return [res.data.data, null];
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown error');
    return [null, e];
  }
}; 