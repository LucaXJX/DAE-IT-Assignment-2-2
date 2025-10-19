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
    console.log('成功獲取景點資料:', data);
    
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
    
    console.log('註冊成功:', { user_id: data.user_id });
    return data;
  } catch (error) {
    console.error('註冊失敗:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : '註冊失敗'
    );
  }
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
    
    console.log('登入成功:', { user_id: data.user_id });
    return data;
  } catch (error) {
    console.error('登入失敗:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : '登入失敗'
    );
  }
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
    
    throw new ApiError(
      error instanceof Error ? error.message : '收藏失敗'
    );
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
    
    throw new ApiError(
      error instanceof Error ? error.message : '取消收藏失敗'
    );
  }
}

/**
 * 獲取使用者收藏列表
 * @returns 收藏的項目 ID 列表
 */
export async function getBookmarks(): Promise<BookmarkListResponse> {
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
    console.log('成功獲取收藏列表:', data);
    
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

