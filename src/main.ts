/**
 * 主要應用程式邏輯
 * 整合 API 服務層
 */
import { LocalAttraction, Attraction } from './types';
import { localAttractions } from './data';
import {
  fetchAttractions,
  ApiError,
  login,
  signup,
  logout,
  isLoggedIn,
  checkAuth,
  addBookmark,
  removeBookmark,
  getBookmarks,
} from './api';

// 當前狀態
let items: (LocalAttraction | Attraction)[] = localAttractions;
let isLoading = false;
let useLocalData = true; // 控制使用本地數據還是 API 數據
let currentPage = 1;
let hasMoreData = true;
let isLoadingMore = false;

// 搜索和篩選狀態（用於載入更多時保持條件）
let currentSearch = '';
let currentCategory = '';

// 全屏載入器元素
let appLoader: HTMLElement | null = null;
let loaderMessage: HTMLElement | null = null;
let retryInfo: HTMLElement | null = null;
let retryText: HTMLElement | null = null;

// 認證狀態
let currentUsername: string | null = null;

// 收藏狀態
let bookmarkedItems: Set<number> = new Set(); // 存儲已收藏的項目 ID

// 預覽景點狀態
let previewItems: Attraction[] = []; // 存儲預覽景點
let previewRotationTimer: number | null = null; // 預覽景點輪換計時器

/**
 * 初始化全屏載入器
 */
function initAppLoader(): void {
  appLoader = document.getElementById('appLoader');
  loaderMessage = document.getElementById('loaderMessage');
  retryInfo = document.getElementById('retryInfo');
  retryText = document.getElementById('retryText');
}

/**
 * 更新載入器訊息
 */
function updateLoaderMessage(
  message: string,
  showRetry: boolean = false,
  retryMessage: string = ''
): void {
  if (loaderMessage) {
    loaderMessage.textContent = message;
  }

  if (retryInfo && retryText) {
    if (showRetry) {
      retryInfo.style.display = 'block';
      retryText.textContent = retryMessage;
    } else {
      retryInfo.style.display = 'none';
    }
  }
}

/**
 * 隱藏載入器並顯示應用內容
 */
function hideAppLoader(): void {
  const ionApp = document.querySelector('ion-app');

  if (appLoader) {
    // 添加淡出效果
    appLoader.classList.add('hidden');

    // 動畫完成後移除元素
    setTimeout(() => {
      if (appLoader && appLoader.parentNode) {
        appLoader.parentNode.removeChild(appLoader);
      }
    }, 500);
  }

  if (ionApp) {
    // 顯示主應用內容
    ionApp.classList.add('loaded');
  }
}

/**
 * 打開認證 Modal
 */
function openAuthModal(tab: 'login' | 'signup' = 'login'): void {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // 切換到指定標籤
  switchAuthTab(tab);
}

/**
 * 關閉認證 Modal
 */
function closeAuthModal(): void {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';

  // 清空表單
  const loginForm = document.getElementById(
    'loginFormElement'
  ) as HTMLFormElement;
  const signupForm = document.getElementById(
    'signupFormElement'
  ) as HTMLFormElement;
  if (loginForm) loginForm.reset();
  if (signupForm) signupForm.reset();
}

/**
 * 切換認證標籤
 */
function switchAuthTab(tab: 'login' | 'signup'): void {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabs = document.querySelectorAll('.auth-tab');

  tabs.forEach((t) => {
    if (t.getAttribute('data-tab') === tab) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  if (tab === 'login') {
    loginForm?.classList.remove('hidden');
    signupForm?.classList.add('hidden');
  } else {
    loginForm?.classList.add('hidden');
    signupForm?.classList.remove('hidden');
  }
}

/**
 * 處理登入
 */
async function handleLogin(event: Event): Promise<void> {
  event.preventDefault();

  const usernameInput = document.getElementById('loginUsername') as any;
  const passwordInput = document.getElementById('loginPassword') as any;
  const loginBtn = document.getElementById('loginBtn') as any;

  const username = usernameInput?.value?.trim();
  const password = passwordInput?.value;

  // 清除之前的錯誤
  hideFormError('loginError');

  if (!username || !password) {
    showFormError('loginError', '請輸入使用者名稱和密碼');
    return;
  }

  try {
    // 禁用按鈕並顯示載入狀態
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML =
        '<ion-spinner name="crescent"></ion-spinner> 登入中...';
    }

    await login(username, password);

    currentUsername = username;
    localStorage.setItem('username', username); // 保存用戶名

    await showSuccess(`歡迎回來，${username}！`);
    closeAuthModal();
    updateAuthUI();

    // 載入用戶的收藏列表
    await loadUserBookmarks();
  } catch (error) {
    if (error instanceof ApiError) {
      // 優化特定錯誤消息
      let errorMsg = error.message;
      let isNetworkError = false;

      if (
        errorMsg.includes('Invalid credentials') ||
        errorMsg.includes('not found')
      ) {
        errorMsg = '使用者名稱或密碼錯誤，請檢查後重試';
      } else if (errorMsg.includes('Error:')) {
        errorMsg = errorMsg.replace('Error: ', '');
      }

      // 判斷是否為網路錯誤（可重試）
      if (errorMsg.includes('testing purposes') || errorMsg.includes('網路')) {
        isNetworkError = true;
        errorMsg = '網路連接失敗，請點擊重試按鈕';
      }

      showFormError('loginError', errorMsg, isNetworkError, () => {
        hideFormError('loginError');
        handleLogin(event);
      });
    } else {
      showFormError(
        'loginError',
        '登入失敗，請檢查網路連接後重試',
        true,
        () => {
          hideFormError('loginError');
          handleLogin(event);
        }
      );
    }
  } finally {
    // 恢復按鈕狀態
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML =
        '<ion-icon name="log-in-outline" slot="start"></ion-icon> 登入';
    }
  }
}

/**
 * 處理註冊
 */
async function handleSignup(event: Event): Promise<void> {
  event.preventDefault();

  const usernameInput = document.getElementById('signupUsername') as any;
  const passwordInput = document.getElementById('signupPassword') as any;
  const confirmInput = document.getElementById('signupPasswordConfirm') as any;
  const signupBtn = document.getElementById('signupBtn') as any;

  const username = usernameInput?.value?.trim();
  const password = passwordInput?.value;
  const confirm = confirmInput?.value;

  // 清除之前的錯誤
  hideFormError('signupError');

  // 表單驗證（用戶輸入錯誤，不可重試）
  if (!username || !password || !confirm) {
    showFormError('signupError', '請填寫所有欄位');
    return;
  }

  if (username.length < 3) {
    showFormError('signupError', '使用者名稱至少需要 3 個字元');
    return;
  }

  if (password.length < 6) {
    showFormError('signupError', '密碼至少需要 6 個字元');
    return;
  }

  if (password !== confirm) {
    showFormError('signupError', '兩次輸入的密碼不一致');
    return;
  }

  try {
    // 禁用按鈕並顯示載入狀態
    if (signupBtn) {
      signupBtn.disabled = true;
      signupBtn.innerHTML =
        '<ion-spinner name="crescent"></ion-spinner> 註冊中...';
    }

    await signup(username, password);

    currentUsername = username;
    localStorage.setItem('username', username); // 保存用戶名

    await showSuccess(`註冊成功！歡迎，${username}！`);
    closeAuthModal();
    updateAuthUI();

    // 載入用戶的收藏列表（新用戶應該是空的）
    await loadUserBookmarks();
  } catch (error) {
    if (error instanceof ApiError) {
      // 優化特定錯誤消息
      let errorMsg = error.message;
      let isNetworkError = false;

      if (errorMsg.includes('already registered')) {
        errorMsg = '此使用者名稱已被註冊，請換一個試試';
      } else if (errorMsg.includes('Error:')) {
        errorMsg = errorMsg.replace('Error: ', '');
      }

      // 判斷是否為網路錯誤（可重試）
      if (errorMsg.includes('testing purposes') || errorMsg.includes('網路')) {
        isNetworkError = true;
        errorMsg = '網路連接失敗，請點擊重試按鈕';
      }

      showFormError('signupError', errorMsg, isNetworkError, () => {
        hideFormError('signupError');
        handleSignup(event);
      });
    } else {
      showFormError(
        'signupError',
        '註冊失敗，請檢查網路連接後重試',
        true,
        () => {
          hideFormError('signupError');
          handleSignup(event);
        }
      );
    }
  } finally {
    // 恢復按鈕狀態
    if (signupBtn) {
      signupBtn.disabled = false;
      signupBtn.innerHTML =
        '<ion-icon name="person-add-outline" slot="start"></ion-icon> 註冊';
    }
  }
}

/**
 * 處理登出
 */
async function handleLogout(): Promise<void> {
  logout();
  currentUsername = null;
  localStorage.removeItem('username'); // 清除用戶名

  // 清除收藏狀態
  bookmarkedItems.clear();

  updateAuthUI();

  // 更新所有收藏按鈕為未收藏狀態
  updateAllBookmarkButtons();

  await showSuccess('已成功登出');
}

/**
 * 處理收藏/取消收藏功能（步驟 17）
 */
async function handleBookmark(
  itemId: number,
  itemName: string,
  buttonElement: HTMLElement
): Promise<void> {
  // 檢查是否已登入
  if (!isLoggedIn()) {
    // 先顯示提示訊息（縮短時間到 2 秒）
    showError('請先登入才能使用收藏功能', 2000);

    // 延遲 1.2 秒後打開登入視窗，讓用戶有時間看到提示
    setTimeout(() => {
      openAuthModal('login');
    }, 1200);

    return;
  }

  const isBookmarked = bookmarkedItems.has(itemId);

  try {
    // 禁用按鈕，顯示載入狀態
    buttonElement.style.pointerEvents = 'none';
    buttonElement.style.opacity = '0.6';

    if (isBookmarked) {
      // 取消收藏
      const result = await removeBookmark(itemId);
      bookmarkedItems.delete(itemId);

      if (result.message === 'newly deleted') {
        await showSuccess(`已取消收藏 ${itemName}`);
      }

      // 更新按鈕為未收藏狀態
      updateBookmarkButton(buttonElement, false);
      console.log('✅ 取消收藏成功:', result);
    } else {
      // 添加收藏
      const result = await addBookmark(itemId);
      bookmarkedItems.add(itemId);

      if (result.message === 'newly bookmarked') {
        await showSuccess(`已收藏 ${itemName}`);
      } else if (result.message === 'already bookmarked') {
        await showSuccess(`${itemName} 已在收藏清單中`);
      }

      // 更新按鈕為已收藏狀態
      updateBookmarkButton(buttonElement, true);
      console.log('✅ 收藏成功:', result);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message.includes('請先登入')) {
        await showError('登入狀態已過期，請重新登入');
        openAuthModal('login');
      } else {
        await showError(`操作失敗：${error.message}`);
      }
    } else {
      await showError('操作失敗，請稍後再試');
    }
    console.error('收藏操作錯誤:', error);
  } finally {
    // 恢復按鈕狀態
    buttonElement.style.pointerEvents = '';
    buttonElement.style.opacity = '';
  }
}

/**
 * 更新收藏按鈕的視覺狀態（步驟 18）
 */
function updateBookmarkButton(
  buttonElement: HTMLElement,
  isBookmarked: boolean
): void {
  const icon = buttonElement.querySelector('ion-icon');
  const textNode = Array.from(buttonElement.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
  );

  if (isBookmarked) {
    // 已收藏狀態：實心紅心
    if (icon) icon.setAttribute('name', 'heart');
    if (textNode) textNode.textContent = ' 已收藏';
    buttonElement.style.setProperty('--background', '#eb445a');
    buttonElement.style.setProperty('--color', 'white');
  } else {
    // 未收藏狀態：空心紅心
    if (icon) icon.setAttribute('name', 'heart-outline');
    if (textNode) textNode.textContent = ' 收藏';
    buttonElement.style.setProperty('--background', 'transparent');
    buttonElement.style.setProperty('--color', '#eb445a');
  }
}

/**
 * 載入用戶的收藏列表（步驟 19）
 */
async function loadUserBookmarks(): Promise<void> {
  if (!isLoggedIn()) {
    console.log('用戶未登入，跳過載入收藏列表');
    bookmarkedItems.clear();
    return;
  }

  try {
    console.log('正在載入用戶收藏列表...');
    const response = await getBookmarks();

    // 更新收藏狀態
    bookmarkedItems = new Set(response.item_ids);
    console.log(`✅ 成功載入收藏列表，共 ${bookmarkedItems.size} 個項目`);

    // 更新所有收藏按鈕的視覺狀態
    updateAllBookmarkButtons();
  } catch (error) {
    console.error('❌ 載入收藏列表失敗:', error);
    // 載入失敗時清空收藏狀態
    bookmarkedItems.clear();
  }
}

/**
 * 更新所有收藏按鈕的視覺狀態
 */
function updateAllBookmarkButtons(): void {
  document.querySelectorAll('.bookmark-btn').forEach((button) => {
    const itemId = button.getAttribute('data-item-id');
    if (itemId) {
      const isBookmarked = bookmarkedItems.has(parseInt(itemId));
      updateBookmarkButton(button as HTMLElement, isBookmarked);
    }
  });
}

/**
 * 更新認證 UI
 */
function updateAuthUI(): void {
  const loginBtn = document.getElementById('loginHeaderBtn');
  const userBtn = document.getElementById('userHeaderBtn');
  const logoutBtn = document.getElementById('logoutHeaderBtn');
  const usernameDisplay = document.getElementById('usernameDisplay');

  if (isLoggedIn() && currentUsername) {
    // 已登入狀態
    if (loginBtn) loginBtn.style.display = 'none';
    if (userBtn) userBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (usernameDisplay) usernameDisplay.textContent = currentUsername;
  } else {
    // 未登入狀態
    if (loginBtn) loginBtn.style.display = 'block';
    if (userBtn) userBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

/**
 * 顯示載入狀態
 */
function showLoading(): void {
  isLoading = true;
  const list = document.querySelector('ion-list');
  if (!list) return;

  const loadingItem = document.createElement('ion-item');
  loadingItem.id = 'loading-indicator';
  loadingItem.innerHTML = `
    <div class="item-content" style="text-align:center; padding:2rem;">
      <ion-spinner name="crescent"></ion-spinner>
      <p style="margin-top:1rem;">載入中...</p>
    </div>
  `;
  list.appendChild(loadingItem);
}

/**
 * 隱藏載入狀態
 */
function hideLoading(): void {
  isLoading = false;
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

/**
 * 顯示錯誤訊息（使用 ion-toast）
 */
async function showError(
  message: string,
  duration: number = 3000
): Promise<void> {
  const toast = document.createElement('ion-toast') as any;
  toast.message = message;
  toast.duration = duration;
  toast.color = 'danger';
  toast.position = 'top';
  toast.buttons = [
    {
      text: '關閉',
      role: 'cancel',
    },
  ];

  document.body.appendChild(toast);
  await toast.present();
}

/**
 * 在表單內顯示錯誤訊息
 */
function showFormError(
  errorElementId: string,
  message: string,
  canRetry: boolean = false,
  retryCallback?: () => void
): void {
  const errorDiv = document.getElementById(errorElementId);
  if (!errorDiv) return;

  errorDiv.style.display = 'flex';
  errorDiv.innerHTML = `
    <ion-icon name="alert-circle"></ion-icon>
    <div class="error-content">
      <div class="error-message">${message}</div>
      ${canRetry && retryCallback ? '<button type="button" class="retry-btn">🔄 重試</button>' : ''}
    </div>
  `;

  // 添加重試按鈕事件
  if (canRetry && retryCallback) {
    const retryBtn = errorDiv.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', retryCallback);
    }
  }
}

/**
 * 隱藏表單錯誤訊息
 */
function hideFormError(errorElementId: string): void {
  const errorDiv = document.getElementById(errorElementId);
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.innerHTML = '';
  }
}

/**
 * 顯示成功訊息（使用 ion-toast）
 */
async function showSuccess(
  message: string,
  duration: number = 2000
): Promise<void> {
  const toast = document.createElement('ion-toast') as any;
  toast.message = message;
  toast.duration = duration;
  toast.color = 'success';
  toast.position = 'top';

  document.body.appendChild(toast);
  await toast.present();
}

/**
 * 從 API 載入景點資料
 * @param options 查詢參數
 * @param showErrorUI 是否顯示錯誤 UI（初始化時設為 false）
 * @param append 是否追加資料（用於分頁載入更多）
 */
async function loadAttractionsFromAPI(
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  },
  showErrorUI: boolean = true,
  append: boolean = false
): Promise<void> {
  try {
    if (!append) {
      showLoading();
    }

    const response = await fetchAttractions(options);

    // 將 API 資料轉換為統一格式（蛇形命名 → 駝峰命名）
    const newItems = response.items.map(
      (item) =>
        ({
          // API 原始欄位（駝峰命名）
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          imageUrl: item.image_url, // 蛇形 → 駝峰
          videoUrl: item.video_url, // 蛇形 → 駝峰
          openingHours: item.opening_hours,
          address: item.address,
          city: item.city,
          country: item.country,
          tags: item.tags,
          facilities: item.facilities,
          // 兼容本地資料欄位
          name: item.title,
          area: item.category,
          openTime: item.opening_hours || '請查詢官方資訊',
          feature: item.description,
          image: item.image_url,
          video: item.video_url,
        }) as Attraction
    );

    if (append) {
      // 追加模式：合併新舊資料
      items = [...items, ...newItems];
      console.log('成功載入更多景點:', newItems.length, '個');

      // 檢查是否還有更多資料
      hasMoreData =
        newItems.length > 0 && newItems.length === (options?.limit || 20);
    } else {
      // 替換模式：完全替換資料
      items = newItems;
      console.log('成功從 API 載入景點:', items.length, '個');
      currentPage = options?.page || 1;
      hasMoreData = true;
    }

    useLocalData = false; // 標記為使用 API 數據
    hideLoading();

    // 不需要在這裡填充分類，因為已在 initAreaChart() 中從圖表API獲取

    renderList(); // 渲染列表而不是調用 updateList
  } catch (error) {
    hideLoading();
    console.error('載入 API 資料失敗:', error);

    // 根據參數決定是否顯示錯誤 UI
    if (showErrorUI) {
      if (error instanceof ApiError) {
        await showError(`無法載入景點資料：${error.message}`);
      } else {
        await showError('網路連接錯誤，請檢查您的網路連接');
      }
    }

    // API 失敗時不回退到本地數據，直接拋出錯誤
    throw error;
  }
}

/**
 * 載入更多資料（分頁）
 */
async function loadMoreAttractions(): Promise<void> {
  if (isLoadingMore || !hasMoreData || useLocalData) {
    return;
  }

  try {
    isLoadingMore = true;
    currentPage++;

    // 顯示載入按鈕的載入狀態
    const loadMoreBtn = document.getElementById('loadMoreBtn') as any;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      const originalText = loadMoreBtn.textContent;
      loadMoreBtn.innerHTML =
        '<ion-spinner name="crescent"></ion-spinner> 載入中...';

      // 使用保存的搜索和分類條件（修復 bug：保持篩選條件）
      await loadAttractionsFromAPI(
        {
          page: currentPage,
          limit: 20,
          search: currentSearch || undefined,
          category: currentCategory || undefined,
        },
        true, // 顯示錯誤 UI
        true // 追加模式
      );

      loadMoreBtn.textContent = originalText;
      loadMoreBtn.disabled = false;

      // 提示成功載入（不顯示技術細節的頁碼）
      await showSuccess(`成功載入更多景點`);
    }
  } catch (error) {
    // 錯誤已在 loadAttractionsFromAPI 中處理
    currentPage--; // 恢復頁碼
    console.error('載入更多資料失敗:', error);
  } finally {
    isLoadingMore = false;
  }
}

/**
 * 從分類列表填充分類選單
 */
function populateCategoriesFromList(categories: string[]): void {
  const categorySelect = document.querySelector('ion-select');
  if (!categorySelect) return;

  // 更新選單標籤
  (categorySelect as any).label = '分類';

  // 清空現有選項（保留"全部"選項）
  const allOptions = categorySelect.querySelectorAll('ion-select-option');
  allOptions.forEach((opt) => {
    if ((opt as any).value !== '') {
      opt.remove();
    }
  });

  // 添加分類選項
  categories.forEach((category) => {
    if (!category) return;
    const option = document.createElement('ion-select-option');
    (option as any).value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

/**
 * 打開視頻彈窗
 */
function openVideoModal(videoUrl: string, title: string): void {
  const modal = document.getElementById('videoModal');
  const videoContainer = document.getElementById('videoContainer');
  const modalTitle = document.getElementById('modalTitle');

  if (!modal || !videoContainer || !modalTitle) return;

  modalTitle.textContent = title;

  // 處理 YouTube 鏈接
  let embedUrl = videoUrl;
  if (videoUrl.includes('youtube.com/watch?v=')) {
    const videoId = videoUrl.split('v=')[1].split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (videoUrl.includes('youtu.be/')) {
    const videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  videoContainer.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * 關閉視頻彈窗
 */
function closeVideoModal(): void {
  const modal = document.getElementById('videoModal');
  const videoContainer = document.getElementById('videoContainer');

  if (!modal || !videoContainer) return;

  videoContainer.innerHTML = '';
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * 顯示列表加載動畫
 */
function showListLoading(): void {
  const list = document.querySelector('ion-list');
  if (!list) return;

  const loadingItem = document.createElement('div');
  loadingItem.id = 'list-loading-indicator';
  loadingItem.className = 'load-more-container';
  loadingItem.style.cssText = 'text-align:center; padding:2rem;';
  loadingItem.innerHTML = `
    <ion-spinner name="crescent"></ion-spinner>
    <p style="margin-top:1rem; color: #666;">正在搜尋...</p>
  `;

  // 插入到列表開頭
  if (list.firstChild) {
    list.insertBefore(loadingItem, list.firstChild);
  } else {
    list.appendChild(loadingItem);
  }
}

/**
 * 隱藏列表加載動畫
 */
function hideListLoading(): void {
  const loadingIndicator = document.getElementById('list-loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

/**
 * 載入隨機預覽景點
 */
async function loadRandomPreviewItems(): Promise<void> {
  try {
    console.log('📋 正在載入隨機預覽景點...');

    // 從 API 隨機獲取 3 個景點（使用 limit=3 和隨機 page）
    const randomPage = Math.floor(Math.random() * 5) + 1; // 隨機頁碼 1-5
    const response = await fetchAttractions({
      page: randomPage,
      limit: 3,
    });

    // 將 API 資料轉換為統一格式
    previewItems = response.items.map(
      (item) =>
        ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          imageUrl: item.image_url,
          videoUrl: item.video_url,
          openingHours: item.opening_hours,
          address: item.address,
          city: item.city,
          country: item.country,
          tags: item.tags,
          facilities: item.facilities,
          name: item.title,
          area: item.category,
          openTime: item.opening_hours || '請查詢官方資訊',
          feature: item.description,
          image: item.image_url,
          video: item.video_url,
        }) as Attraction
    );

    console.log('✅ 成功載入預覽景點:', previewItems.length, '個');

    // 重新渲染搜索提示（包含預覽景點）
    showSearchPrompt();
  } catch (error) {
    console.error('❌ 載入預覽景點失敗:', error);
    // 失敗時仍然顯示搜索提示（但不顯示預覽）
    previewItems = [];
    showSearchPrompt();
  }
}

/**
 * 開始預覽景點輪換
 */
function startPreviewRotation(): void {
  // 清除現有計時器
  if (previewRotationTimer !== null) {
    window.clearInterval(previewRotationTimer);
  }

  // 設置定時器：每 8 秒更換一次
  previewRotationTimer = window.setInterval(() => {
    console.log('🔄 更換預覽景點...');
    loadRandomPreviewItems();
  }, 8000);

  console.log('✅ 預覽景點輪換已啟動（每 8 秒更換一次）');
}

/**
 * 停止預覽景點輪換
 */
function stopPreviewRotation(): void {
  if (previewRotationTimer !== null) {
    window.clearInterval(previewRotationTimer);
    previewRotationTimer = null;
    console.log('🛑 預覽景點輪換已停止');
  }
}

/**
 * 渲染預覽景點卡片
 */
function renderPreviewItem(item: Attraction): string {
  const itemName = item.name || item.title || '未命名';
  const itemArea = item.area || item.category || '未知';
  const itemImage = item.image || item.imageUrl || '';
  const itemFeature = item.feature || item.description || '暫無描述';
  const shortFeature =
    itemFeature.length > 60
      ? itemFeature.substring(0, 60) + '...'
      : itemFeature;

  return `
    <div class="preview-card" style="background: white; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1); transition: transform 0.2s ease; cursor: pointer;" 
         data-preview-id="${item.id}">
      <div class="image-container" style="height: 150px; overflow: hidden;">
        <img src="${itemImage}" alt="${itemName}" 
             style="width: 100%; height: 100%; object-fit: cover;"
             onload="this.style.display='block'"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div style="width: 100%; height: 100%; background: #f0f0f0; display: none; align-items: center; justify-content: center; color: #666;">
          圖片載入中
        </div>
      </div>
      <div style="padding: 1rem;">
        <div style="font-size: 1.1rem; font-weight: 600; color: #2d3243; margin-bottom: 0.5rem;">
          ${itemName}
        </div>
        <div style="font-size: 0.85rem; color: #667eea; margin-bottom: 0.5rem;">
          📍 ${itemArea}
        </div>
        <div style="font-size: 0.9rem; color: #666; line-height: 1.4;">
          ${shortFeature}
        </div>
      </div>
    </div>
  `;
}

/**
 * 顯示搜索提示（初始狀態）+ 預覽景點
 */
function showSearchPrompt(): void {
  const list = document.querySelector('ion-list');
  if (!list) return;

  list.innerHTML = '';

  const promptItem = document.createElement('div');
  promptItem.className = 'load-more-container';
  promptItem.style.cssText = 'text-align:center; padding:3rem 1.5rem 1.5rem;';
  promptItem.innerHTML = `
    <ion-icon name="search-outline" style="font-size: 4rem; color: #667eea; margin-bottom: 1rem;"></ion-icon>
    <h2 style="color: #2d3243; margin: 1rem 0;">開始探索景點</h2>
    <p style="color: #666; font-size: 1rem; line-height: 1.6; max-width: 500px; margin: 0 auto;">
      使用上方的搜尋框輸入關鍵字，或選擇分類來查看景點資料
    </p>
    <div style="margin-top: 2rem; padding: 1rem; background: #f0f4ff; border-radius: 0.5rem; max-width: 400px; margin-left: auto; margin-right: auto;">
      <ion-icon name="information-circle-outline" style="font-size: 1.5rem; color: #667eea; vertical-align: middle;"></ion-icon>
      <span style="color: #667eea; margin-left: 0.5rem;">輸入景點名稱、地區或特色開始搜尋</span>
    </div>
  `;

  list.appendChild(promptItem);

  // 如果有預覽景點，顯示它們
  if (previewItems.length > 0) {
    const previewSection = document.createElement('div');
    previewSection.className = 'preview-section';
    previewSection.style.cssText = 'padding: 1rem;';

    const previewHeader = document.createElement('div');
    previewHeader.style.cssText = 'text-align: center; margin-bottom: 1.5rem;';
    previewHeader.innerHTML = `
      <h3 style="color: #2d3243; margin: 0 0 0.5rem; font-size: 1.3rem;">
        ✨ 精選景點推薦
      </h3>
      <p style="color: #666; font-size: 0.9rem; margin: 0;">
        每 8 秒自動更換 • 點擊卡片查看分類
      </p>
    `;
    previewSection.appendChild(previewHeader);

    const previewGrid = document.createElement('div');
    previewGrid.className = 'preview-grid';
    previewGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    `;

    previewItems.forEach((item) => {
      const cardWrapper = document.createElement('div');
      cardWrapper.innerHTML = renderPreviewItem(item);
      const card = cardWrapper.firstElementChild as HTMLElement;

      // 添加懸停效果
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 0.5rem 1.5rem rgba(0, 0, 0, 0.15)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 0.25rem 0.75rem rgba(0, 0, 0, 0.1)';
      });

      // 添加點擊事件：點擊卡片自動填充該景點的分類到搜索
      card.addEventListener('click', () => {
        const attraction = previewItems.find((i) => i.id === item.id);
        if (attraction) {
          const category = attraction.category || attraction.area;
          if (category) {
            // 更新分類選單
            const categorySelect = document.querySelector('ion-select') as any;
            if (categorySelect) {
              categorySelect.value = category;
            }
            // 停止輪換
            stopPreviewRotation();
            // 觸發搜索
            updateList();
          }
        }
      });

      previewGrid.appendChild(card);
    });

    previewSection.appendChild(previewGrid);
    list.appendChild(previewSection);
  }
}

/**
 * 渲染清單（純粹的渲染函數，不包含搜索邏輯）
 */
function renderList(): void {
  const list = document.querySelector('ion-list');
  if (!list) return;

  list.innerHTML = '';
  const filteredItems = items;

  // 渲染景點
  filteredItems.forEach((item) => {
    const attraction = item as Attraction;
    const itemName = item.name || attraction.title || '未命名';
    const itemArea = item.area || attraction.category || '未知';
    const itemImage = item.image || attraction.imageUrl || '';
    const itemVideo = item.video || attraction.videoUrl || '';
    const itemFeature = item.feature || attraction.description || '暫無描述';
    const itemOpenTime =
      item.openTime || attraction.openingHours || '請查詢官方資訊';
    const itemAddress = attraction.address || '';
    const itemCity = attraction.city || '';
    const itemTags = attraction.tags || [];
    const itemFacilities = attraction.facilities || [];

    const listItem = document.createElement('ion-item');
    listItem.className = 'list-item';

    // 根據數據來源決定標籤文字
    const areaLabel = useLocalData ? '地區' : '分類';

    // 構建地址信息
    const addressInfo =
      itemCity || itemAddress
        ? `<p>📍 ${itemCity ? itemCity + (itemAddress ? ' - ' : '') : ''}${itemAddress}</p>`
        : '';

    // 構建設施信息
    const facilitiesInfo =
      itemFacilities.length > 0
        ? `<p>🏢 設施：${itemFacilities.slice(0, 4).join('、')}${itemFacilities.length > 4 ? '...' : ''}</p>`
        : '';

    listItem.innerHTML = `
      <div class="item-content">
        <!-- 景點圖片 -->
        <div class="image-container">
          <img src="${itemImage}" alt="${itemName}" class="item-image"
               onload="this.parentElement.classList.remove('error')"
               onerror="this.parentElement.classList.add('error')">
          <div class="image-fallback-text">圖片載入失敗</div>
        </div>
        <!-- 景點名稱 -->
        <div class="item-title">${itemName}</div>
        <!-- 地區/分類 -->
        <div class="item-subtitle">${areaLabel}：${itemArea}</div>
        <!-- 開放時間和特色 -->
        <div class="item-details">
          <p>⏰ 開放時間：${itemOpenTime}</p>
          ${addressInfo}
          <p>✨ 特色：${itemFeature}</p>
          ${facilitiesInfo}
        </div>
        <!-- 標籤（地區/分類）、影片按鈕和收藏按鈕 -->
        <div class="tag-container">
          <ion-chip size="small" data-area="${itemArea}">${itemArea}</ion-chip>
          ${itemTags
            .slice(0, 3)
            .map(
              (tag) => `<ion-chip size="small" outline="true">${tag}</ion-chip>`
            )
            .join('')}
          ${
            itemVideo
              ? `
          <ion-chip size="small" color="primary" data-video="${itemVideo}" data-title="${itemName} 導覽影片">
            <ion-icon name="play" slot="start"></ion-icon>
            導覽影片
          </ion-chip>
          `
              : ''
          }
          <!-- 收藏按鈕 -->
          <ion-chip size="small" color="danger" class="bookmark-btn" data-item-id="${attraction.id || ''}" data-item-name="${itemName}">
            <ion-icon name="heart-outline" slot="start"></ion-icon>
            收藏
          </ion-chip>
        </div>
      </div>
    `;
    list.appendChild(listItem);
  });

  // 如果沒有結果顯示提示
  if (filteredItems.length === 0 && !isLoading) {
    const emptyItem = document.createElement('ion-item');
    emptyItem.className = 'empty-state';
    emptyItem.innerHTML = `<div class="item-content" style="text-align:center; padding:1rem;">沒有找到符合條件的景點</div>`;
    list.appendChild(emptyItem);
  }

  // 添加「載入更多」按鈕（僅在使用 API 數據時顯示）
  if (!useLocalData && filteredItems.length > 0) {
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.className = 'load-more-container';
    loadMoreContainer.style.cssText = 'text-align:center; padding:1.5rem;';

    if (hasMoreData) {
      loadMoreContainer.innerHTML = `
        <ion-button id="loadMoreBtn" expand="block" fill="outline" style="max-width: 300px; margin: 0 auto;">
          <ion-icon name="arrow-down-circle-outline" slot="start"></ion-icon>
          載入更多
        </ion-button>
      `;
    } else {
      loadMoreContainer.innerHTML = `
        <div style="color: #666; font-size: 0.9rem; padding: 1rem;">
          <ion-icon name="checkmark-circle" style="font-size: 1.5rem; vertical-align: middle;"></ion-icon>
          已載入全部資料（共 ${filteredItems.length} 個景點）
        </div>
      `;
    }

    list.appendChild(loadMoreContainer);
  }

  // 為新加入的元素添加事件監聽器
  attachEventListeners();

  // 更新收藏按鈕的視覺狀態
  updateAllBookmarkButtons();
}

/**
 * 為清單項目添加事件監聽器
 */
function attachEventListeners(): void {
  // 地區標籤點擊事件
  document.querySelectorAll('ion-chip[data-area]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const area = chip.getAttribute('data-area');
      if (area) filterByArea(area);
    });
  });

  // 影片按鈕點擊事件
  document.querySelectorAll('ion-chip[data-video]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const video = chip.getAttribute('data-video');
      const title = chip.getAttribute('data-title');
      if (video && title) openVideoModal(video, title);
    });
  });

  // 載入更多按鈕點擊事件
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreAttractions);
  }

  // 收藏按鈕點擊事件
  document.querySelectorAll('.bookmark-btn').forEach((chip) => {
    chip.addEventListener('click', async () => {
      const itemId = chip.getAttribute('data-item-id');
      const itemName = chip.getAttribute('data-item-name');
      if (itemId) {
        await handleBookmark(
          parseInt(itemId),
          itemName || '景點',
          chip as HTMLElement
        );
      }
    });
  });
}

/**
 * 防抖計時器
 */
let searchDebounceTimer: number | null = null;

/**
 * 更新清單顯示（判斷是否需要調用 API）
 */
async function updateList(): Promise<void> {
  // 取得搜尋和分類條件
  const searchbar = document.querySelector('ion-searchbar') as any;
  const categorySelect = document.querySelector('ion-select') as any;
  const searchValue = (searchbar?.value || '').trim();
  const categoryValue = categorySelect?.value || '';

  // 保存到全局變量（用於載入更多時使用）
  currentSearch = searchValue;
  currentCategory = categoryValue;

  // 判斷是否需要調用 API（有搜尋詞或有分類選擇）
  const shouldCallAPI = currentSearch.length > 0 || currentCategory.length > 0;

  if (shouldCallAPI) {
    // 停止預覽輪換（用戶開始搜索）
    stopPreviewRotation();

    // 調用 API 搜尋
    try {
      // 顯示加載動畫
      showListLoading();

      // 重置分頁狀態
      currentPage = 1;
      hasMoreData = true;

      // 調用 API
      await loadAttractionsFromAPI(
        {
          page: 1,
          limit: 20,
          search: currentSearch || undefined,
          category: currentCategory || undefined,
        },
        true, // 顯示錯誤
        false // 不追加，替換資料
      );

      hideListLoading();
    } catch (error) {
      hideListLoading();
      console.error('搜尋失敗:', error);
      // 錯誤已在 loadAttractionsFromAPI 中處理
    }
  } else {
    // 沒有搜尋條件，顯示搜索提示
    items = [];
    useLocalData = false;
    hasMoreData = false;

    // 重新啟動預覽輪換
    if (previewItems.length > 0) {
      startPreviewRotation();
    }

    showSearchPrompt();
  }
}

/**
 * 帶防抖的更新清單（用於搜尋框輸入）
 */
function updateListDebounced(): void {
  // 清除之前的計時器
  if (searchDebounceTimer !== null) {
    window.clearTimeout(searchDebounceTimer);
  }

  // 設置新的計時器（500ms 延遲）
  searchDebounceTimer = window.setTimeout(() => {
    updateList();
    searchDebounceTimer = null;
  }, 500);
}

/**
 * 點擊標籤過濾（地區）
 */
function filterByArea(area: string): void {
  // 更新分類選單的值
  const categorySelect = document.querySelector('ion-select') as any;
  if (categorySelect) {
    categorySelect.value = area;
  }

  // 更新清單顯示
  updateList();
}

// 儲存圖表實例以便後續更新或銷毀
let chartInstance: any = null;

/**
 * 繪製地區分佈圖表（從服務器API獲取數據）
 */
async function initAreaChart(): Promise<void> {
  try {
    console.log('📊 正在從服務器獲取圖表數據...');

    // 調用服務器API獲取圖表數據
    const response = await fetch('/api/chart-data');

    if (!response.ok) {
      throw new Error(`獲取圖表數據失敗: ${response.status}`);
    }

    const chartData = await response.json();
    console.log('✅ 成功獲取圖表數據:', chartData);

    // 填充分類選單（使用圖表API返回的分類）
    if (chartData.categories && chartData.categories.length > 0) {
      populateCategoriesFromList(chartData.categories);
      console.log('✅ 分類選單已填充:', chartData.categories);
    }

    // 更新圖表標題
    const chartTitle = document
      .querySelector('#areaChart')
      ?.closest('ion-card')
      ?.querySelector('ion-card-title');
    if (chartTitle) {
      chartTitle.textContent = `景點分類分佈（共 ${chartData.total} 個景點）`;
    }

    // 準備圖表數據
    const areas = chartData.labels;
    const counts = chartData.data;

    // 隨機生成顏色
    const backgroundColors = areas.map(
      () =>
        `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
          Math.random() * 255
        }, 0.7)`
    );

    // 繪製圖表
    const canvas = document.getElementById('areaChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (typeof (window as any).Chart !== 'undefined') {
      // 如果已經存在圖表實例，先銷毀它
      if (chartInstance) {
        try {
          chartInstance.destroy();
          console.log('舊圖表已銷毀');
        } catch (e) {
          console.warn('銷毀舊圖表失敗:', e);
        }
      }

      // 創建新的圖表實例
      chartInstance = new (window as any).Chart(ctx, {
        type: 'pie',
        data: {
          labels: areas,
          datasets: [
            {
              label: '景點數量',
              data: counts,
              backgroundColor: backgroundColors,
              borderColor: 'rgba(255, 255, 255, 0.8)',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                font: {
                  size: 12,
                },
                padding: 15,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context: any) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce(
                    (a: number, b: number) => a + b,
                    0
                  );
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value}個 (${percentage}%)`;
                },
              },
            },
          },
        },
      });
      console.log('✅ 圖表已初始化');
    }
  } catch (error) {
    console.error('❌ 初始化圖表失敗:', error);

    // 圖表初始化失敗時，顯示錯誤提示
    const chartCard = document.querySelector('#areaChart')?.closest('ion-card');
    if (chartCard) {
      const cardContent = chartCard.querySelector('ion-card-content');
      if (cardContent) {
        cardContent.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #666;">
            <ion-icon name="alert-circle-outline" style="font-size: 3rem; color: #eb445a;"></ion-icon>
            <p style="margin-top: 1rem;">無法載入圖表數據</p>
            <p style="font-size: 0.9rem;">請稍後再試</p>
          </div>
        `;
      }
    }
  }
}

/**
 * 初始化事件監聽器
 */
function initEventListeners(): void {
  // 關閉按鈕事件
  const closeBtn = document.getElementById('closeBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeVideoModal);
  }

  // 點擊彈窗外部關閉
  const videoModal = document.getElementById('videoModal');
  if (videoModal) {
    videoModal.addEventListener('click', function (e) {
      if (e.target === this) {
        closeVideoModal();
      }
    });
  }

  // 搜尋框事件監聽（使用防抖）
  const searchbar = document.querySelector('ion-searchbar');
  if (searchbar) {
    searchbar.addEventListener('ionInput', () => updateListDebounced());
  }

  // 分類選單事件監聽（不需要防抖，立即執行）
  const categorySelect = document.querySelector('ion-select');
  if (categorySelect) {
    categorySelect.addEventListener('ionChange', () => updateList());
  }

  // 認證相關事件監聽
  const loginHeaderBtn = document.getElementById('loginHeaderBtn');
  if (loginHeaderBtn) {
    loginHeaderBtn.addEventListener('click', () => openAuthModal('login'));
  }

  const authCloseBtn = document.getElementById('authCloseBtn');
  if (authCloseBtn) {
    authCloseBtn.addEventListener('click', closeAuthModal);
  }

  const logoutHeaderBtn = document.getElementById('logoutHeaderBtn');
  if (logoutHeaderBtn) {
    logoutHeaderBtn.addEventListener('click', handleLogout);
  }

  // 認證標籤切換
  const authTabs = document.querySelectorAll('.auth-tab');
  authTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabType = tab.getAttribute('data-tab') as 'login' | 'signup';
      if (tabType) switchAuthTab(tabType);
    });
  });

  // 登入表單提交
  const loginFormElement = document.getElementById('loginFormElement');
  if (loginFormElement) {
    loginFormElement.addEventListener('submit', handleLogin);
  }

  // 註冊表單提交
  const signupFormElement = document.getElementById('signupFormElement');
  if (signupFormElement) {
    signupFormElement.addEventListener('submit', handleSignup);
  }

  // 點擊 Modal 外部關閉
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.addEventListener('click', function (e) {
      if (e.target === this) {
        closeAuthModal();
      }
    });
  }
}

/**
 * 初始化應用程式
 */
async function init(): Promise<void> {
  console.log('=== 應用程式初始化 ===');

  // 初始化全屏載入器
  initAppLoader();

  // 監聽 API 重試事件
  window.addEventListener('api-retry', ((event: CustomEvent) => {
    const { attempt, maxRetries, delayTime } = event.detail;
    updateLoaderMessage(
      '正在載入景點資料...',
      true,
      `第 ${attempt}/${maxRetries} 次嘗試失敗，${(delayTime / 1000).toFixed(1)} 秒後重試...`
    );
  }) as EventListener);

  // 初始化事件監聽器
  initEventListeners();

  // 更新載入訊息
  updateLoaderMessage('正在初始化應用程式...');

  // 初始化為空狀態（完全不使用本地數據）
  console.log('初始化應用程式（等待用戶搜索）');
  items = [];
  useLocalData = false;
  hasMoreData = false;

  // 初始化 UI 組件
  try {
    await initAreaChart(); // 餅狀圖通過服務器API獲取（同時填充分類選單）

    // 載入預覽景點並啟動輪換
    updateLoaderMessage('正在載入精選景點...');
    await loadRandomPreviewItems(); // 初次加載預覽景點
    startPreviewRotation(); // 啟動定時輪換

    console.log('✅ UI 組件初始化完成');
  } catch (uiError) {
    console.error('⚠️ UI 初始化失敗:', uiError);
    // 即使失敗也顯示搜索提示
    showSearchPrompt();
  }

  // 檢查用戶登入狀態並驗證 token 有效性
  if (isLoggedIn()) {
    console.log('檢測到本地 token，正在驗證...');
    try {
      const authResult = await checkAuth();
      if (authResult.user_id) {
        // Token 有效，恢復用戶狀態
        currentUsername = localStorage.getItem('username');
        console.log('✅ Token 驗證成功，用戶已登入:', currentUsername);
      } else {
        // Token 無效，清除狀態
        console.log('⚠️ Token 已失效，清除登入狀態');
        currentUsername = null;
        localStorage.removeItem('username');
      }
    } catch (error) {
      console.error('❌ Token 驗證失敗:', error);
      currentUsername = null;
      localStorage.removeItem('username');
    }
  } else {
    console.log('未檢測到 token，用戶未登入');
  }

  // 更新認證 UI
  updateAuthUI();

  // 載入用戶收藏列表（步驟 19）
  await loadUserBookmarks();

  // 短暫延遲後隱藏載入器，讓用戶看到完整準備好的頁面
  setTimeout(() => {
    hideAppLoader();
    console.log('✅ 初始化完成！使用搜尋功能來查詢 API 資料');
  }, 500);
}

// 當 DOM 載入完成後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 導出函數供全域使用
(window as any).openVideoModal = openVideoModal;
(window as any).closeVideoModal = closeVideoModal;
(window as any).filterByArea = filterByArea;
(window as any).loadAttractionsFromAPI = loadAttractionsFromAPI; // 導出供測試使用
(window as any).loadMoreAttractions = loadMoreAttractions; // 導出供測試使用
