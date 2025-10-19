/**
 * 主要應用程式邏輯
 * 整合 API 服務層
 */
import { LocalAttraction, Attraction } from './types';
import { localAttractions } from './data';
import { convertText } from './zhconvert';
import { fetchAttractions, ApiError } from './api';

// 當前狀態
let items: (LocalAttraction | Attraction)[] = localAttractions;
let isLoading = false;
let useLocalData = true; // 控制使用本地數據還是 API 數據
let currentPage = 1;
let hasMoreData = true;
let isLoadingMore = false;

// 全屏載入器元素
let appLoader: HTMLElement | null = null;
let loaderMessage: HTMLElement | null = null;
let retryInfo: HTMLElement | null = null;
let retryText: HTMLElement | null = null;

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
 * 使用繁化姬 API 進行簡體到繁體轉換
 * @param text 要轉換的文字
 * @returns 轉換後的繁體文字
 */
async function simplifyToTraditional(text: string): Promise<string> {
  if (!text) return '';

  try {
    return await convertText(text, 'Taiwan');
  } catch (error) {
    console.error('轉換失敗，使用原文:', error);
    return text;
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

    // 將 API 資料轉換為本地格式以便顯示
    const newItems = response.items.map(
      (item) =>
        ({
          name: item.title,
          area: item.category,
          openTime: item.description,
          feature: item.description,
          image: item.imageUrl,
          video: item.videoUrl,
          // 保留 API 原始欄位
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          imageUrl: item.imageUrl,
          videoUrl: item.videoUrl,
        }) as any
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
    updateList();
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

    // 如果 API 失敗，確保使用本地數據
    if (items.length === 0 || useLocalData) {
      useLocalData = true;
      items = localAttractions;
      hasMoreData = false;
      updateList();
    }

    // 重新拋出錯誤，讓調用者知道失敗了
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

      await loadAttractionsFromAPI(
        { page: currentPage, limit: 20 },
        true, // 顯示錯誤 UI
        true // 追加模式
      );

      loadMoreBtn.textContent = originalText;
      loadMoreBtn.disabled = false;

      await showSuccess(`成功載入第 ${currentPage} 頁資料`);
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
 * 初始化分類選項（地區/分類）
 */
function populateCategories(): void {
  const categorySelect = document.querySelector('ion-select');
  if (!categorySelect) return;

  // 更新選單標籤（根據數據來源）
  const selectLabel = (categorySelect as any).label;
  if (selectLabel !== undefined) {
    (categorySelect as any).label = useLocalData ? '地區' : '分類';
  }

  // 清空現有選項（保留"全部"選項）
  const allOptions = categorySelect.querySelectorAll('ion-select-option');
  allOptions.forEach((opt) => {
    if ((opt as any).value !== '') {
      opt.remove();
    }
  });

  // 取得所有唯一地區/分類
  const areas = Array.from(
    new Set(items.map((item) => item.area || (item as any).category))
  );

  areas.forEach((area) => {
    if (!area) return;
    const option = document.createElement('ion-select-option');
    (option as any).value = area;
    option.textContent = area;
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
 * 更新清單顯示
 */
async function updateList(): Promise<void> {
  const list = document.querySelector('ion-list');
  if (!list) return;

  list.innerHTML = '';

  // 取得搜尋和分類條件
  const searchbar = document.querySelector('ion-searchbar') as any;
  const categorySelect = document.querySelector('ion-select') as any;
  const currentSearch = (searchbar?.value || '').trim().toLowerCase();

  // 將用戶輸入的簡體字轉換為繁體字
  const currentSearchTrad = await simplifyToTraditional(currentSearch);
  const currentArea = categorySelect?.value || '';

  // 過濾資料
  const filteredItems = items.filter((item) => {
    const itemArea = item.area || (item as any).category || '';
    const itemName = item.name || (item as any).title || '';
    const itemFeature = item.feature || (item as any).description || '';

    // 地區過濾
    const matchArea = currentArea ? itemArea === currentArea : true;

    // 搜尋過濾
    const matchSearch = currentSearch
      ? itemName.toLowerCase().includes(currentSearch) ||
        itemName.includes(currentSearchTrad) ||
        itemArea.toLowerCase().includes(currentSearch) ||
        itemArea.includes(currentSearchTrad) ||
        itemFeature.toLowerCase().includes(currentSearch) ||
        itemFeature.includes(currentSearchTrad)
      : true;

    return matchArea && matchSearch;
  });

  // 渲染過濾後的景點
  filteredItems.forEach((item) => {
    const itemName = item.name || (item as any).title || '未命名';
    const itemArea = item.area || (item as any).category || '未知';
    const itemImage = item.image || (item as any).imageUrl || '';
    const itemVideo = item.video || (item as any).videoUrl || '';
    const itemFeature = item.feature || (item as any).description || '暫無描述';
    const itemOpenTime = item.openTime || '請查詢官方資訊';

    const listItem = document.createElement('ion-item');
    listItem.className = 'list-item';

    // 根據數據來源決定標籤文字
    const areaLabel = useLocalData ? '地區' : '分類';

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
          <p>開放時間：${itemOpenTime}</p>
          <p>特色：${itemFeature}</p>
        </div>
        <!-- 標籤（地區/分類）和影片按鈕 -->
        <div class="tag-container">
          <ion-chip size="small" data-area="${itemArea}">${itemArea}</ion-chip>
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
        </div>
      </div>
    `;
    list.appendChild(listItem);
  });

  // 如果沒有結果顯示提示
  if (filteredItems.length === 0 && !isLoading) {
    const emptyItem = document.createElement('ion-item');
    emptyItem.innerHTML = `<div class="item-content" style="text-align:center; padding:1rem;">沒有找到符合條件的景點</div>`;
    list.appendChild(emptyItem);
  }

  // 添加「載入更多」按鈕（僅在使用 API 數據時顯示）
  if (!useLocalData && filteredItems.length > 0) {
    const loadMoreContainer = document.createElement('div');
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
 * 繪製地區分佈圖表
 */
function initAreaChart(): void {
  // 更新圖表標題（根據數據來源）
  const chartTitle = document
    .querySelector('#areaChart')
    ?.closest('ion-card')
    ?.querySelector('ion-card-title');
  if (chartTitle) {
    if (useLocalData) {
      chartTitle.textContent = '景點地區分佈（排名不分先後）';
    } else {
      chartTitle.textContent = '景點分類分佈（排名不分先後）';
    }
  }

  // 統計每個地區/分類的景點數量
  const areaCount: { [key: string]: number } = {};
  items.forEach((item) => {
    const area = item.area || (item as any).category || '未知';
    if (areaCount[area]) {
      areaCount[area]++;
    } else {
      areaCount[area] = 1;
    }
  });

  // 準備圖表數據
  const areas = Object.keys(areaCount);
  const counts = Object.values(areaCount);

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
    console.log('圖表已初始化');
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

  // 搜尋框事件監聽
  const searchbar = document.querySelector('ion-searchbar');
  if (searchbar) {
    searchbar.addEventListener('ionInput', () => updateList());
  }

  // 分類選單事件監聽
  const categorySelect = document.querySelector('ion-select');
  if (categorySelect) {
    categorySelect.addEventListener('ionChange', () => updateList());
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
  updateLoaderMessage('正在連接到服務器...');

  // 嘗試從 API 載入數據
  console.log('正在嘗試從 API 載入景點資料...');
  let apiSuccess = false;

  try {
    await loadAttractionsFromAPI({ page: 1, limit: 20 }, false); // 不顯示錯誤 UI
    console.log('✅ 成功從 API 載入數據');
    apiSuccess = true;
    updateLoaderMessage('資料載入成功，正在準備顯示...');
  } catch (error) {
    console.log('⚠️ API 載入失敗，使用本地數據');
    // API 失敗時使用本地數據
    items = localAttractions;
    useLocalData = true;
    hasMoreData = false;
    updateLoaderMessage('使用本地資料初始化...');
  }

  // 初始化 UI 組件（無論 API 成功或失敗）
  try {
    populateCategories();
    initAreaChart();
    updateList();
    console.log('UI 組件初始化完成');
  } catch (uiError) {
    console.error('⚠️ UI 初始化失敗:', uiError);
  }

  // 短暫延遲後隱藏載入器，讓用戶看到完整準備好的頁面
  setTimeout(() => {
    hideAppLoader();
    console.log('✅ 初始化完成！');

    if (!apiSuccess) {
      console.log('💡 提示：可在控制台執行 loadAttractionsFromAPI() 重試');
    }
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
