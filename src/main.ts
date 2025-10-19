/**
 * 主要應用程式邏輯
 * 整合 API 服務層
 */
import { LocalAttraction, Attraction } from './types';
import { localAttractions } from './data';
import { convertText } from './zhconvert';
import { fetchAttractions, ApiError } from './api';

// 當前狀態
let currentArea = '';
let items: (LocalAttraction | Attraction)[] = localAttractions;
let currentPage = 1;
let isLoading = false;
let useLocalData = true; // 控制使用本地數據還是 API 數據

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
 * 顯示錯誤訊息
 */
function showError(message: string): void {
  const list = document.querySelector('ion-list');
  if (!list) return;

  const errorItem = document.createElement('ion-item');
  errorItem.className = 'list-item';
  errorItem.style.cssText = 'background: #ffe6e6; border-left: 4px solid #ff4444;';
  errorItem.innerHTML = `
    <div class="item-content" style="padding:1rem;">
      <ion-icon name="alert-circle" color="danger" style="font-size:2rem; margin-bottom:0.5rem;"></ion-icon>
      <p style="color:#cc0000; font-weight:bold;">錯誤</p>
      <p style="color:#666;">${message}</p>
      <ion-button size="small" onclick="location.reload()" style="margin-top:1rem;">
        重新載入
      </ion-button>
    </div>
  `;
  list.appendChild(errorItem);
}

/**
 * 從 API 載入景點資料
 */
async function loadAttractionsFromAPI(options?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}): Promise<void> {
  try {
    showLoading();
    
    const response = await fetchAttractions(options);
    
    // 將 API 資料轉換為本地格式以便顯示
    items = response.items.map((item) => ({
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
    } as any));

    console.log('成功從 API 載入景點:', items.length, '個');
    hideLoading();
    updateList();
  } catch (error) {
    hideLoading();
    console.error('載入 API 資料失敗:', error);
    
    if (error instanceof ApiError) {
      showError(`無法載入景點資料：${error.message}`);
    } else {
      showError('網路連接錯誤，請檢查您的網路連接');
    }
    
    // 如果 API 失敗，切換回本地數據
    useLocalData = true;
    items = localAttractions;
    updateList();
  }
}

/**
 * 初始化分類選項（地區）
 */
function populateCategories(): void {
  const categorySelect = document.querySelector('ion-select');
  if (!categorySelect) return;

  // 取得所有唯一地區
  const areas = Array.from(
    new Set(items.map((item) => item.area || item.category))
  );
  
  areas.forEach((area) => {
    if (!area) return;
    const option = document.createElement('ion-select-option');
    option.value = area;
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
    const itemArea = item.area || item.category || '';
    const itemName = item.name || item.title || '';
    const itemFeature = item.feature || item.description || '';
    
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
    const itemName = item.name || item.title || '未命名';
    const itemArea = item.area || item.category || '未知';
    const itemImage = item.image || item.imageUrl || '';
    const itemVideo = item.video || item.videoUrl || '';
    const itemFeature = item.feature || item.description || '暫無描述';
    const itemOpenTime = item.openTime || '請查詢官方資訊';
    
    const listItem = document.createElement('ion-item');
    listItem.className = 'list-item';
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
        <!-- 地區 -->
        <div class="item-subtitle">地區：${itemArea}</div>
        <!-- 開放時間和特色 -->
        <div class="item-details">
          <p>開放時間：${itemOpenTime}</p>
          <p>特色：${itemFeature}</p>
        </div>
        <!-- 標籤（地區）和影片按鈕 -->
        <div class="tag-container">
          <ion-chip size="small" data-area="${itemArea}">${itemArea}</ion-chip>
          ${itemVideo ? `
          <ion-chip size="small" color="primary" data-video="${itemVideo}" data-title="${itemName} 導覽影片">
            <ion-icon name="play" slot="start"></ion-icon>
            導覽影片
          </ion-chip>
          ` : ''}
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
}

/**
 * 點擊標籤過濾（地區）
 */
function filterByArea(area: string): void {
  currentArea = area;

  // 更新分類選單的值
  const categorySelect = document.querySelector('ion-select') as any;
  if (categorySelect) {
    categorySelect.value = area;
  }

  // 更新清單顯示
  updateList();
}

/**
 * 繪製地區分佈圖表
 */
function initAreaChart(): void {
  // 統計每個地區的景點數量
  const areaCount: { [key: string]: number } = {};
  items.forEach((item) => {
    const area = item.area || item.category || '未知';
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
    new (window as any).Chart(ctx, {
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
  console.log('使用本地數據模式');
  
  // 先顯示本地數據
  populateCategories();
  initAreaChart();
  updateList();
  initEventListeners();
  
  console.log('初始化完成！');
  console.log('提示：如需測試 API，請在控制台執行: loadAttractionsFromAPI()');
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
