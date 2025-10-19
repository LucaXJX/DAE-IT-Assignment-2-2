/**
 * 繁化姬 API 服務
 * 文檔：https://docs.zhconvert.org/
 */
import { ZhConvertResponse } from './types';

const ZHCONVERT_API = 'https://api.zhconvert.org';

/**
 * 轉換模式
 * - Traditional: 繁體化
 * - Taiwan: 台灣化
 * - China: 簡體化
 */
export type ConvertMode = 'Traditional' | 'Taiwan' | 'China';

/**
 * 使用繁化姬 API 進行繁簡轉換
 * @param text 要轉換的文字
 * @param converter 轉換模式，預設為 'Taiwan'（台灣化）
 * @returns 轉換後的文字
 */
export async function convertText(
  text: string,
  converter: ConvertMode = 'Taiwan'
): Promise<string> {
  try {
    // 如果文字為空，直接返回
    if (!text || text.trim() === '') {
      return text;
    }

    // 構建請求參數
    const params = new URLSearchParams({
      text: text,
      converter: converter,
    });

    // 發送 POST 請求到繁化姬 API
    const response = await fetch(`${ZHCONVERT_API}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`);
    }

    const result: ZhConvertResponse = await response.json();

    // 檢查 API 回應的錯誤碼
    if (result.code !== 0) {
      console.warn('繁化姬 API 回應錯誤:', result.msg);
      return text; // 返回原文
    }

    // 返回轉換後的文字
    return result.data.text;
  } catch (error) {
    console.error('繁化姬轉換失敗:', error);
    // 如果 API 失敗，返回原文
    return text;
  }
}

/**
 * 批量轉換文字陣列
 * @param texts 要轉換的文字陣列
 * @param converter 轉換模式
 * @returns 轉換後的文字陣列
 */
export async function convertTextBatch(
  texts: string[],
  converter: ConvertMode = 'Taiwan'
): Promise<string[]> {
  // 使用 Promise.all 並行處理所有轉換
  return Promise.all(texts.map((text) => convertText(text, converter)));
}

