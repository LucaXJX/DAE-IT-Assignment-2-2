/**
 * 景點資料類型定義
 */
export interface Attraction {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  videoUrl: string;
  // 本地資料欄位
  name?: string;
  area?: string;
  openTime?: string;
  feature?: string;
  image?: string;
  video?: string;
}

/**
 * API 回應 - 景點列表
 */
export interface AttractionListResponse {
  items: Attraction[];
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

