/**
 * API 返回的景點資料類型（蛇形命名）
 */
export interface ApiAttraction {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string;  // API 使用下劃線
  video_url: string;  // API 使用下劃線
  opening_hours?: string;
  address?: string;
  city?: string;
  country?: string;
  tags?: string[];
  facilities?: string[];
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 統一的景點資料類型（駝峰命名，用於內部使用）
 */
export interface Attraction {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;  // 駝峰命名
  videoUrl: string;  // 駝峰命名
  openingHours?: string;
  address?: string;
  city?: string;
  country?: string;
  tags?: string[];
  facilities?: string[];
  // 本地資料欄位（兼容舊代碼）
  name?: string;
  area?: string;
  openTime?: string;
  feature?: string;
  image?: string;
  video?: string;
}

/**
 * API 回應 - 景點列表（使用 API 原始格式）
 */
export interface AttractionListResponse {
  items: ApiAttraction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * API 回應 - 使用者認證
 */
export interface AuthResponse {
  user_id: number;
  token: string;
}

/**
 * API 回應 - 收藏
 */
export interface BookmarkResponse {
  message: 'newly bookmarked' | 'already bookmarked' | 'newly deleted' | 'already deleted';
}

/**
 * API 回應 - 收藏列表
 */
export interface BookmarkListResponse {
  item_ids: number[];
}

/**
 * API 回應 - 錯誤
 */
export interface ErrorResponse {
  error: string;
}

/**
 * 繁化姬 API 回應
 */
export interface ZhConvertResponse {
  code: number;
  data: {
    text: string;
    diff?: string;
    jpTextStyles?: any;
  };
  msg: string;
  revisions: {
    build: string;
    msg: string;
    time: number;
  };
  execTime: number;
}

/**
 * 本地景點資料（遷移自原有代碼）
 */
export interface LocalAttraction {
  name: string;
  area: string;
  openTime: string;
  feature: string;
  image: string;
  video: string;
}

