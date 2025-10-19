/**
 * 主要應用程式邏輯
 * 遷移自 index.html 的 JavaScript 代碼
 */
import { LocalAttraction } from './types';
import { localAttractions } from './data';
import { convertText } from './zhconvert';

// 當前狀態
let currentArea = '';
let items: LocalAttraction[] = localAttractions;

/**
 * 使用繁化姬 API 進行簡體到繁體轉換
 * @param text 要轉換的文字
 * @returns 轉換後的繁體文字
 */
async function simplifyToTraditional(text: string): Promise<string> {
  if (!text) return '';
  
  try {
    // 使用繁化姬 API 進行台灣化轉換
    return await convertText(text, 'Taiwan');
  } catch (error) {
    console.error('轉換失敗，使用原文:', error);
    return text;
  }
}

/**
 * 初始化分類選項（地區）
 */
function populateCategories(): void {
  const categorySelect = document.querySelector('ion-select');
  if (!categorySelect) return;

  // 取得所有唯一地區
  const areas = Array.from(new Set(items.map((item) => item.area)));
  
  areas.forEach((area) => {
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

  // 處理 YouTube 鏈接，轉換為嵌入格式
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

  // 過濾資料：同時滿足搜尋和地區條件
  const filteredItems = items.filter((item) => {
    // 地區過濾：如果有選中地區，只顯示該地區景點
    const matchArea = currentArea ? item.area === currentArea : true;
    
    // 搜尋過濾：名稱/地區/特色包含搜尋詞（不分大小寫）
    const matchSearch = currentSearch
      ? item.name.toLowerCase().includes(currentSearch) ||
        item.name.includes(currentSearchTrad) ||
        item.area.toLowerCase().includes(currentSearch) ||
        item.area.includes(currentSearchTrad) ||
        item.feature.toLowerCase().includes(currentSearch) ||
        item.feature.includes(currentSearchTrad)
      : true;
    
    return matchArea && matchSearch;
  });

  // 渲染過濾後的景點
  filteredItems.forEach((item) => {
    const listItem = document.createElement('ion-item');
    listItem.className = 'list-item';
    listItem.innerHTML = `
      <div class="item-content">
        <!-- 景點圖片 -->
        <div class="image-container">
          <img src="${item.image}" alt="${item.name}" class="item-image"
               onload="this.parentElement.classList.remove('error')"
               onerror="this.parentElement.classList.add('error')">
          <div class="image-fallback-text">圖片載入失敗</div>
        </div>
        <!-- 景點名稱 -->
        <div class="item-title">${item.name}</div>
        <!-- 地區 -->
        <div class="item-subtitle">地區：${item.area}</div>
        <!-- 開放時間和特色 -->
        <div class="item-details">
          <p>開放時間：${item.openTime}</p>
          <p>特色：${item.feature}</p>
        </div>
        <!-- 標籤（地區）和影片按鈕 -->
        <div class="tag-container">
          <ion-chip size="small" data-area="${item.area}">${item.area}</ion-chip>
          <ion-chip size="small" color="primary" data-video="${item.video}" data-title="${item.name} 導覽影片">
            <ion-icon name="play" slot="start"></ion-icon>
            導覽影片
          </ion-chip>
        </div>
      </div>
    `;
    list.appendChild(listItem);
  });

  // 如果沒有結果顯示提示
  if (filteredItems.length === 0) {
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
    if (areaCount[item.area]) {
      areaCount[item.area]++;
    } else {
      areaCount[item.area] = 1;
    }
  });

  // 準備圖表數據
  const areas = Object.keys(areaCount);
  const counts = Object.values(areaCount);

  // 隨機生成顏色（增強可視化效果）
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

  // 使用 Chart.js（需要在 HTML 中引入）
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
function init(): void {
  populateCategories();
  initAreaChart();
  updateList();
  initEventListeners();
}

// 當 DOM 載入完成後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 導出函數供全域使用（向後兼容）
(window as any).openVideoModal = openVideoModal;
(window as any).closeVideoModal = closeVideoModal;
(window as any).filterByArea = filterByArea;

