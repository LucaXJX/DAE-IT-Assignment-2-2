/**
 * API 服務層
 * 封裝所有後端 API 調用
 */
import {
  AttractionListResponse,
  AuthResponse,
  BookmarkResponse,
  BookmarkListResponse,
  ErrorResponse,
} from './types';

// API 基礎端點
const API_BASE_URL = 'https://dae-mobile-assignment.hkit.cc/api';

// 主題資源端點（主題編號 9：公眾景點）
const RESOURCE_ENDPOINT = '/attractions';

/**
 * API 錯誤類別
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 延遲執行（用於重試機制）
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重試配置
 */
export interface RetryOptions {
  maxRetries?: number; // 最大重試次數，預設 3
  initialDelay?: number; // 初始延遲時間（毫秒），預設 1000
  maxDelay?: number; // 最大延遲時間（毫秒），預設 10000
  shouldRetry?: (error: any) => boolean; // 是否應該重試的判斷函數
}

/**
 * 重試包裝函數（使用指數退避策略）
 * 導出此函數以便在其他模組中使用
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error: any) => {
      // 預設：只對 5xx 錯誤重試（伺服器錯誤）
      if (error instanceof ApiError) {
        const status = error.statusCode || 0;
        return status >= 500 && status < 600;
      }
      return true; // 對網路錯誤也重試
    },
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 如果這是最後一次嘗試，或不應該重試，則拋出錯誤
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // 計算延遲時間（指數退避）
      const delayTime = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      console.warn(
        `⚠️ API 調用失敗（第 ${attempt + 1}/${maxRetries + 1} 次嘗試），` +
          `${delayTime}ms 後重試...`,
        error instanceof Error ? error.message : error
      );

      // 等待後重試
      await delay(delayTime);
    }
  }

  throw lastError;
}

/**
 * 處理 API 回應
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP 錯誤: ${response.status}`;

    try {
      const errorData: ErrorResponse = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // 如果無法解析錯誤訊息，使用預設訊息
    }

    throw new ApiError(errorMessage, response.status, response);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('無法解析回應資料');
  }
}

/**
 * 獲取儲存的 token
 */
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * 儲存 token
 */
export function saveToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * 清除 token
 */
export function clearToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
}

/**
 * 獲取景點列表
 * @param options 查詢參數
 * @returns 景點列表和分頁資訊
 */
export async function fetchAttractions(options?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<AttractionListResponse> {
  // 使用重試機制包裝 API 調用
  return withRetry(
    async () => {
      try {
        // 構建查詢參數
        const params = new URLSearchParams();

        if (options?.page) {
          params.append('page', options.page.toString());
        }

        if (options?.limit) {
          params.append('limit', options.limit.toString());
        }

        if (options?.search) {
          params.append('search', options.search);
        }

        if (options?.category) {
          params.append('category', options.category);
        }

        if (options?.sort) {
          params.append('sort', options.sort);
        }

        if (options?.order) {
          params.append('order', options.order);
        }

        const url = `${API_BASE_URL}${RESOURCE_ENDPOINT}${
          params.toString() ? '?' + params.toString() : ''
        }`;

        console.log('正在獲取景點資料:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await handleResponse<AttractionListResponse>(response);
        console.log('✅ 成功獲取景點資料:', data);

        return data;
      } catch (error) {
        console.error('獲取景點資料失敗:', error);

        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError(
          error instanceof Error ? error.message : '無法連接到伺服器'
        );
      }
    },
    {
      maxRetries: 5, // 最多重試 5 次（總共嘗試 6 次）
      initialDelay: 1000, // 第一次重試等待 1 秒
      maxDelay: 5000, // 最多等待 5 秒
    }
  );
}

/**
 * 使用者註冊
 * @param username 使用者名稱
 * @param password 密碼
 * @returns 使用者 ID 和 token
 */
export async function signup(
  username: string,
  password: string
): Promise<AuthResponse> {
  return withRetry(
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await handleResponse<AuthResponse>(response);

        // 自動儲存 token
        saveToken(data.token);
        localStorage.setItem('user_id', data.user_id.toString());

        console.log('✅ 註冊成功:', { user_id: data.user_id });
        return data;
      } catch (error) {
        console.error('註冊失敗:', error);

        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError(error instanceof Error ? error.message : '註冊失敗');
      }
    },
    {
      maxRetries: 2, // 註冊重試次數較少（總共嘗試 3 次）
      initialDelay: 1000,
    }
  );
}

/**
 * 使用者登入
 * @param username 使用者名稱
 * @param password 密碼
 * @returns 使用者 ID 和 token
 */
export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  return withRetry(
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await handleResponse<AuthResponse>(response);

        // 自動儲存 token
        saveToken(data.token);
        localStorage.setItem('user_id', data.user_id.toString());

        console.log('✅ 登入成功:', { user_id: data.user_id });
        return data;
      } catch (error) {
        console.error('登入失敗:', error);

        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError(error instanceof Error ? error.message : '登入失敗');
      }
    },
    {
      maxRetries: 2, // 登入重試次數較少（總共嘗試 3 次）
      initialDelay: 1000,
    }
  );
}

/**
 * 檢查登入狀態
 * @returns 使用者 ID（如果已登入）
 */
export async function checkAuth(): Promise<{ user_id: number | null }> {
  try {
    const token = getToken();

    if (!token) {
      return { user_id: null };
    }

    const response = await fetch(`${API_BASE_URL}/auth/check`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<{ user_id: number | null }>(response);

    return data;
  } catch (error) {
    console.error('檢查登入狀態失敗:', error);

    // 如果檢查失敗，清除 token
    clearToken();

    return { user_id: null };
  }
}

/**
 * 使用者登出
 */
export function logout(): void {
  clearToken();
  console.log('已登出');
}

/**
 * 添加收藏
 * @param itemId 項目 ID
 * @returns 收藏結果
 */
export async function addBookmark(itemId: number): Promise<BookmarkResponse> {
  try {
    const token = getToken();

    if (!token) {
      throw new ApiError('請先登入', 401);
    }

    const response = await fetch(`${API_BASE_URL}/bookmarks/${itemId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<BookmarkResponse>(response);
    console.log('收藏成功:', data);

    return data;
  } catch (error) {
    console.error('收藏失敗:', error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(error instanceof Error ? error.message : '收藏失敗');
  }
}

/**
 * 移除收藏
 * @param itemId 項目 ID
 * @returns 移除結果
 */
export async function removeBookmark(
  itemId: number
): Promise<BookmarkResponse> {
  try {
    const token = getToken();

    if (!token) {
      throw new ApiError('請先登入', 401);
    }

    const response = await fetch(`${API_BASE_URL}/bookmarks/${itemId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<BookmarkResponse>(response);
    console.log('取消收藏成功:', data);

    return data;
  } catch (error) {
    console.error('取消收藏失敗:', error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(error instanceof Error ? error.message : '取消收藏失敗');
  }
}

/**
 * 獲取使用者收藏列表
 * @returns 收藏的項目 ID 列表
 */
export async function getBookmarks(): Promise<BookmarkListResponse> {
  return withRetry(
    async () => {
      try {
        const token = getToken();

        if (!token) {
          throw new ApiError('請先登入', 401);
        }

        const response = await fetch(`${API_BASE_URL}/bookmarks`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await handleResponse<BookmarkListResponse>(response);
        console.log('✅ 成功獲取收藏列表:', data);

        return data;
      } catch (error) {
        console.error('獲取收藏列表失敗:', error);

        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError(
          error instanceof Error ? error.message : '獲取收藏列表失敗'
        );
      }
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
    }
  );
}

/**
 * 檢查使用者是否已登入
 * @returns 是否已登入
 */
export function isLoggedIn(): boolean {
  return getToken() !== null;
}

/**
 * 獲取當前使用者 ID
 * @returns 使用者 ID 或 null
 */
export function getCurrentUserId(): number | null {
  const userId = localStorage.getItem('user_id');
  return userId ? parseInt(userId, 10) : null;
}
