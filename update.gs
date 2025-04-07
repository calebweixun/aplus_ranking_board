function msUpdate(action) {
  var spreadsheet = SpreadsheetApp.openById('1ouA7Nh7_jKEc-VjYPxOcZlsbYmcLsGNPVet5b9pADjM');
  var ms1 = spreadsheet.getSheetById(0);
  var ms2 = spreadsheet.getSheetById(1919218559);
  var ms3 = spreadsheet.getSheetById(1854183038);
  var ms4 = spreadsheet.getSheetById(1823871533);
  var ms5 = spreadsheet.getSheetById(1182409321);

  var targetSheet;

  // 根據 action 選擇目標工作表
  switch (action) {
    case 'ms1update':
      targetSheet = ms1;
      break;
    case 'ms2update':
      targetSheet = ms2;
      break;
    case 'ms3update':
      targetSheet = ms3;
      break;
    case 'ms4update':
      targetSheet = ms4;
      break;
    case 'ms5update':
      targetSheet = ms5;
      break;
    default:
      // 如果 action 無效，返回錯誤訊息 (雖然 doGet 應該會先處理)
      Logger.log('Invalid action received in msUpdate: ' + action);
      return { status: 'error', message: 'Invalid action in msUpdate' };
  }

  if (!targetSheet) {
     Logger.log('Sheet not found for action: ' + action);
     return { status: 'error', message: 'Sheet not found for action: ' + action };
  }

  // 獲取資料範圍 (B2:F最後一列)
  var lastRow = targetSheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No data rows found in sheet for action: ' + action);
    return []; // 如果沒有資料列 (只有標頭或為空)，返回空陣列
  }
  // getRange(起始列, 起始欄, 列數, 欄數)
  var range = targetSheet.getRange(2, 2, lastRow - 1, 5);

  // 獲取值
  var values = range.getValues();

  // 根據 action 決定最低分數要求
  var minScore;
  switch (action) {
    case 'ms1update': minScore = 7; break;
    case 'ms2update': minScore = 14; break;
    case 'ms3update': minScore = 21; break;
    case 'ms4update': minScore = 28; break;
    case 'ms5update': minScore = 36; break;
    default:
      // 理論上 doGet 已處理，但以防萬一設為 0 或記錄錯誤
      Logger.log('Unexpected action in minScore determination: ' + action);
      minScore = 0;
  }

  // 根據最低分數過濾資料列 (E 欄, 索引 3 是分數)
  var filteredValues = values.filter(function(row) {
    var scoreValue = parseFloat(row[3]);
    // 確保分數是有效數字且大於等於最低要求
    return !isNaN(scoreValue) && scoreValue >= minScore;
  });

  // 如果過濾後沒有資料列
  if (filteredValues.length === 0) {
    Logger.log('No data rows met the minimum score (' + minScore + ') for action: ' + action);
    return []; // 返回空陣列
  }

  // 將 *過濾後的* 二維陣列轉換為物件陣列，並處理排名欄位
  var data = filteredValues.map(function(row) {
    // 嘗試將排名轉換為數字，若失敗則設為 Infinity 以便排序時排在後面
    var rankValue = parseFloat(row[4]); // F 欄 (索引 4) 是排名
    return {
      class: row[0],        // B 欄 (索引 0)
      name: row[1],         // C 欄 (索引 1)
      englishName: row[2],  // D 欄 (索引 2)
      score: row[3],        // E 欄 (索引 3)
      rank: isNaN(rankValue) ? Infinity : rankValue
    };
  });

  // 根據 rank (排名) 升序排序
  data.sort(function(a, b) {
    return a.rank - b.rank;
  });

  // 返回排序後的資料陣列
  return data;
} 