/**
 * 測試 msUpdate 函數的功能。
 */
function testMsUpdate() {
  Logger.log('開始測試 msUpdate 函數...');

  // --- 測試案例 1: 測試有效的 action (例如 ms1update) ---
  var actionToTest = 'ms1update'; // 您可以更改此處來測試不同的 action
  Logger.log('測試 action: ' + actionToTest);

  try {
    var result = msUpdate(actionToTest);

    // 檢查回傳值是否為陣列
    if (!Array.isArray(result)) {
      Logger.log('測試失敗：回傳值不是一個陣列。');
      return;
    }
    Logger.log('回傳值是陣列 (OK)');

    // 檢查陣列是否有元素 (假設您的試算表有資料)
    if (result.length === 0) {
      Logger.log('警告：回傳的陣列是空的。請確認 '+ actionToTest +' 對應的工作表有資料 (從第二列開始)。');
      // 雖然陣列為空，但還是可以視為某種程度的成功 (函數沒拋錯)
    } else {
      Logger.log('回傳陣列包含 ' + result.length + ' 個元素。');

      // 檢查第一個元素的結構
      var firstElement = result[0];
      var expectedKeys = ['class', 'name', 'englishName', 'score', 'rank'];
      var hasAllKeys = expectedKeys.every(function(key) { return key in firstElement; });

      if (!hasAllKeys) {
        Logger.log('測試失敗：陣列中的元素缺少必要的屬性。預期包含: ' + expectedKeys.join(', '));
        Logger.log('實際第一個元素: ' + JSON.stringify(firstElement));
        return;
      }
      Logger.log('陣列元素結構檢查通過 (OK)');

      // 檢查第一個元素的排名是否為數字或 Infinity
      if (typeof firstElement.rank !== 'number' && firstElement.rank !== Infinity) {
          Logger.log('測試失敗：第一個元素的 rank 屬性不是數字或 Infinity。');
          Logger.log('實際 rank 值: ' + firstElement.rank + ' (類型: ' + typeof firstElement.rank + ')');
          return;
      }
       Logger.log('第一個元素的 rank 屬性類型正確 (OK)');

      // 檢查排序 (抽樣檢查前幾個元素)
      var isSorted = true;
      for (var i = 0; i < Math.min(result.length - 1, 5); i++) { // 檢查前 5 個或更少
        // Infinity 應該排在後面，正常數字升序
        if (result[i].rank > result[i+1].rank) {
           // 允許 Infinity 排在數字後面
           if (result[i+1].rank === Infinity && typeof result[i].rank === 'number') continue;
           isSorted = false;
           Logger.log('測試失敗：陣列未按排名 (rank) 升序排序。');
           Logger.log('索引 ' + i + ' 的排名 ('+ result[i].rank +') 大於索引 ' + (i+1) + ' 的排名 ('+ result[i+1].rank + ')');
           break;
        }
      }
      if (isSorted) {
        Logger.log('陣列排序檢查通過 (OK)');
      }
    }

    Logger.log('測試 '+ actionToTest +' 成功完成！');

  } catch (error) {
    Logger.log('測試失敗：執行 msUpdate 時發生錯誤。');
    Logger.log('錯誤訊息: ' + error.message);
    Logger.log('堆疊追蹤: ' + error.stack);
  }

  // --- 您可以在此處添加更多測試案例，例如測試無效 action --- 
  /*
  Logger.log('\n測試無效 action: invalidAction');
  try {
    var invalidResult = msUpdate('invalidAction');
    // 檢查是否回傳預期的錯誤物件
    if (invalidResult && invalidResult.status === 'error') {
      Logger.log('無效 action 測試通過 (OK)');
    } else {
      Logger.log('測試失敗：無效 action 未回傳預期的錯誤物件。');
      Logger.log('實際回傳: ' + JSON.stringify(invalidResult));
    }
  } catch (error) {
     Logger.log('測試失敗：處理無效 action 時發生未預期的錯誤。');
     Logger.log('錯誤訊息: ' + error.message);
  }
  */

  Logger.log('\n所有測試執行完畢。');
} 