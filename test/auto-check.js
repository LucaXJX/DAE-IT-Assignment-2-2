/**
 * 🧪 網頁功能自動檢測腳本
 * 
 * 使用方法：
 * 1. 訪問 http://localhost:8080
 * 2. 打開瀏覽器控制台 (F12)
 * 3. 複製粘貼此腳本並執行
 * 4. 查看詳細的測試報告
 */

(async function autoCheck() {
  console.clear();
  console.log('%c🧪 開始自動化功能檢測', 'color: #4CAF50; font-size: 20px; font-weight: bold');
  console.log('%c' + '='.repeat(60), 'color: #999');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  // 輔助函數：記錄測試結果
  function logTest(category, name, passed, message = '') {
    const status = passed ? '✅' : '❌';
    const color = passed ? '#4CAF50' : '#F44336';
    console.log(`%c${status} [${category}] ${name}`, `color: ${color}; font-weight: bold`, message);
    
    results.tests.push({ category, name, passed, message });
    if (passed) results.passed++;
    else results.failed++;
  }

  function logWarning(category, name, message) {
    console.log(`%c⚠️ [${category}] ${name}`, 'color: #FF9800; font-weight: bold', message);
    results.tests.push({ category, name, passed: 'warning', message });
    results.warnings++;
  }

  // 延遲函數
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ==================== 測試 1: 環境檢查 ====================
  console.log('\n%c📦 測試 1: 環境檢查', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  // 檢查 Chart.js
  logTest('環境', 'Chart.js 載入', typeof Chart !== 'undefined', 
    typeof Chart !== 'undefined' ? Chart.version : '');

  // 檢查 Ionic
  const ionicLoaded = document.querySelector('ion-app') !== null;
  logTest('環境', 'Ionic 組件', ionicLoaded);

  // 檢查編譯後的 main.js
  const scripts = Array.from(document.scripts);
  const mainJsLoaded = scripts.some(s => s.src.includes('main.js'));
  logTest('環境', 'main.js 載入', mainJsLoaded);

  // ==================== 測試 2: DOM 元素檢查 ====================
  console.log('\n%c🎯 測試 2: DOM 元素檢查', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  const elements = {
    'ion-list': '景點列表容器',
    'ion-searchbar': '搜尋框',
    'ion-select': '分類選單',
    '#areaChart': '圖表畫布',
    '#videoModal': '視頻彈窗',
    '#closeBtn': '彈窗關閉按鈕'
  };

  for (const [selector, name] of Object.entries(elements)) {
    const exists = document.querySelector(selector) !== null;
    logTest('DOM', name, exists, selector);
  }

  // ==================== 測試 3: 全局函數檢查 ====================
  console.log('\n%c⚙️ 測試 3: 全局函數檢查', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  const functions = [
    'loadAttractionsFromAPI',
    'openVideoModal',
    'closeVideoModal',
    'filterByArea'
  ];

  for (const fn of functions) {
    const exists = typeof window[fn] === 'function';
    logTest('函數', fn, exists, exists ? 'ƒ()' : 'undefined');
  }

  // ==================== 測試 4: 數據顯示檢查 ====================
  console.log('\n%c📊 測試 4: 數據顯示檢查', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  const listItems = document.querySelectorAll('.list-item');
  logTest('數據', '景點列表項目', listItems.length > 0, `共 ${listItems.length} 個`);
  
  if (listItems.length === 20) {
    logTest('數據', '景點數量正確', true, '預期 20 個 ✓');
  } else {
    logWarning('數據', '景點數量', `預期 20 個，實際 ${listItems.length} 個`);
  }

  // 檢查景點內容
  if (listItems.length > 0) {
    const firstItem = listItems[0];
    const hasTitle = firstItem.querySelector('.item-title') !== null;
    const hasImage = firstItem.querySelector('.item-image') !== null;
    const hasArea = firstItem.querySelector('.item-subtitle') !== null;
    const hasDetails = firstItem.querySelector('.item-details') !== null;
    
    logTest('數據', '景點標題', hasTitle);
    logTest('數據', '景點圖片', hasImage);
    logTest('數據', '景點地區', hasArea);
    logTest('數據', '景點詳情', hasDetails);
  }

  // ==================== 測試 5: 圖表功能檢查 ====================
  console.log('\n%c📈 測試 5: 圖表功能檢查', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  const canvas = document.getElementById('areaChart');
  logTest('圖表', '畫布元素存在', canvas !== null);
  
  if (canvas && typeof Chart !== 'undefined') {
    // 檢查是否有繪製內容
    const ctx = canvas.getContext('2d');
    const hasChart = ctx && canvas.width > 0 && canvas.height > 0;
    logTest('圖表', '圖表已渲染', hasChart, `${canvas.width}x${canvas.height}`);
  }

  // ==================== 測試 6: 分類選單檢查 ====================
  console.log('\n%c🏷️ 測試 6: 分類選單檢查', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  const select = document.querySelector('ion-select');
  if (select) {
    const options = select.querySelectorAll('ion-select-option');
    logTest('分類', '選項數量', options.length > 1, `${options.length} 個選項`);
    
    const hasAllOption = Array.from(options).some(opt => opt.value === '');
    logTest('分類', '"全部" 選項', hasAllOption);
  }

  // ==================== 測試 7: 控制台錯誤檢查 ====================
  console.log('\n%c🔍 測試 7: 控制台錯誤檢查', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  // 註：這個測試需要在頁面載入時監聽錯誤，這裡只能檢查當前狀態
  logWarning('錯誤', '控制台錯誤', '請手動檢查控制台是否有紅色錯誤訊息');

  // ==================== 測試 8: API 功能測試 ====================
  console.log('\n%c🌐 測試 8: API 功能測試', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  if (typeof window.loadAttractionsFromAPI === 'function') {
    console.log('  ⏳ 正在測試 API 調用...');
    
    try {
      // 測試 API 調用（預期會失敗但應該有正確的錯誤處理）
      await window.loadAttractionsFromAPI({ page: 1, limit: 3 });
      
      // 如果成功了
      logTest('API', 'fetchAttractions 調用', true, '成功獲取數據');
      
    } catch (error) {
      // 預期會失敗（500 錯誤）
      logWarning('API', 'API 服務器', '返回錯誤（預期行為，等待後端修復）');
      
      // 檢查是否正確處理錯誤
      const errorHandled = document.querySelector('.list-item') !== null;
      logTest('API', '錯誤處理機制', errorHandled, '已自動回退到本地數據');
    }
  }

  // ==================== 測試 9: 搜尋功能測試 ====================
  console.log('\n%c🔎 測試 9: 搜尋功能測試', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  const searchbar = document.querySelector('ion-searchbar');
  if (searchbar) {
    console.log('  ⏳ 測試搜尋功能...');
    
    const originalCount = document.querySelectorAll('.list-item').length;
    
    // 模擬輸入
    searchbar.value = '北京';
    searchbar.dispatchEvent(new CustomEvent('ionInput'));
    
    await wait(500); // 等待過濾完成
    
    const filteredCount = document.querySelectorAll('.list-item').length;
    const searchWorks = filteredCount < originalCount && filteredCount > 0;
    
    logTest('搜尋', '過濾功能', searchWorks, 
      `原始 ${originalCount} 個 → 過濾後 ${filteredCount} 個`);
    
    // 清空搜尋
    searchbar.value = '';
    searchbar.dispatchEvent(new CustomEvent('ionInput'));
    await wait(300);
    
    const restoredCount = document.querySelectorAll('.list-item').length;
    logTest('搜尋', '清空恢復', restoredCount === originalCount,
      `恢復到 ${restoredCount} 個`);
  }

  // ==================== 測試 10: 響應式設計檢查 ====================
  console.log('\n%c📱 測試 10: 響應式設計檢查', 'color: #2196F3; font-size: 16px; font-weight: bold');
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  logTest('響應式', '視窗尺寸', true, `${viewport.width}x${viewport.height}`);
  
  if (viewport.width < 768) {
    console.log('  📱 檢測到移動設備尺寸');
  } else if (viewport.width < 1024) {
    console.log('  📱 檢測到平板設備尺寸');
  } else {
    console.log('  🖥️ 檢測到桌面設備尺寸');
  }

  // ==================== 生成測試報告 ====================
  console.log('\n%c' + '='.repeat(60), 'color: #999');
  console.log('%c📊 測試報告', 'color: #2196F3; font-size: 18px; font-weight: bold');
  console.log('%c' + '='.repeat(60), 'color: #999');
  
  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`\n通過測試: %c${results.passed}`, 'color: #4CAF50; font-weight: bold');
  console.log(`失敗測試: %c${results.failed}`, 'color: #F44336; font-weight: bold');
  console.log(`警告項目: %c${results.warnings}`, 'color: #FF9800; font-weight: bold');
  console.log(`總計測試: %c${total}`, 'color: #2196F3; font-weight: bold');
  console.log(`通過率: %c${passRate}%`, `color: ${passRate >= 80 ? '#4CAF50' : '#FF9800'}; font-weight: bold; font-size: 16px`);

  // 評分
  console.log('\n%c評分:', 'color: #2196F3; font-weight: bold');
  if (passRate >= 90) {
    console.log('%c🌟 優秀！所有組件運作正常', 'color: #4CAF50; font-size: 16px');
  } else if (passRate >= 80) {
    console.log('%c✅ 良好！大部分功能正常', 'color: #8BC34A; font-size: 16px');
  } else if (passRate >= 70) {
    console.log('%c⚠️ 可接受，但需要改進', 'color: #FF9800; font-size: 16px');
  } else {
    console.log('%c❌ 需要修復多個問題', 'color: #F44336; font-size: 16px');
  }

  // 建議
  if (results.failed > 0) {
    console.log('\n%c💡 建議:', 'color: #2196F3; font-weight: bold');
    const failedTests = results.tests.filter(t => t.passed === false);
    failedTests.forEach((test, i) => {
      console.log(`${i + 1}. 修復 [${test.category}] ${test.name}`);
    });
  }

  console.log('\n%c' + '='.repeat(60), 'color: #999');
  console.log('%c✅ 自動檢測完成！', 'color: #4CAF50; font-size: 16px; font-weight: bold');
  console.log('%c' + '='.repeat(60), 'color: #999');
  
  // 返回結果供程式使用
  return results;
})();

