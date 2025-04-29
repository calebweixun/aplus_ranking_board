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

function podium(action) {
  var spreadsheet = SpreadsheetApp.openById('1ouA7Nh7_jKEc-VjYPxOcZlsbYmcLsGNPVet5b9pADjM');
  var podiumSheet = spreadsheet.getSheetById(116449973);

  if (!podiumSheet) {
    Logger.log('Podium sheet not found');
    return { status: 'error', message: 'Podium sheet not found' };
  }

  // 獲取資料範圍 (A2:J最後一列)
  var lastRow = podiumSheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No data rows found in podium sheet');
    return []; // 如果沒有資料列，返回空陣列
  }

  // getRange(起始列, 起始欄, 列數, 欄數)
  var range = podiumSheet.getRange(2, 1, lastRow - 1, 10);
  var values = range.getValues();

  // 過濾出有排名（1-3）的資料
  var filteredValues = values.filter(function(row) {
    var rankValue = parseFloat(row[9]); // J 欄 (索引 9) 是最終頒獎台
    return !isNaN(rankValue) && rankValue >= 1 && rankValue <= 3;
  });

  // 如果過濾後沒有資料列
  if (filteredValues.length === 0) {
    Logger.log('No podium data found');
    return []; // 返回空陣列
  }

  // 將資料轉換為物件陣列
  var data = filteredValues.map(function(row) {
    return {
      teacher: row[0],      // A 欄 (索引 0) - 教學老師
      class: row[1],        // B 欄 (索引 1) - 英語班級
      name: row[2],         // C 欄 (索引 2) - 姓名
      englishName: row[3],  // D 欄 (索引 3) - Eng.
      mission1: row[4],     // E 欄 (索引 4) - Mission 1
      mission2: row[5],     // F 欄 (索引 5) - Mission 2
      mission3: row[6],     // G 欄 (索引 6) - Mission 3
      mission4: row[7],     // H 欄 (索引 7) - Mission 4
      mission5: row[8],     // I 欄 (索引 8) - Mission 5
      rank: row[9]          // J 欄 (索引 9) - 最終頒獎台
    };
  });

  // 根據排名升序排序
  data.sort(function(a, b) {
    return a.rank - b.rank;
  });

  return data;
} 