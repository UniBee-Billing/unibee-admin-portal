import { request } from './client';
import { CreditNoteListRequest, CreditNoteListResponse } from '../components/refund/types';

/**
 * 获取Credit Note列表
 * @param params 搜索参数
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
 * 上传CSV文件进行批量搜索
 * @param file CSV文件
 * @param params 其他搜索参数
 * @returns Promise<[CreditNoteListResponse['data'] | null, Error | null]>
 */
export const uploadCSVAndSearchReq = async (
  file: File, 
  params: Omit<CreditNoteListRequest, 'file'>
): Promise<[CreditNoteListResponse['data'] | null, Error | null]> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // 添加其他参数
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