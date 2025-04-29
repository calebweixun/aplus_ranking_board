// doGet 為被呼叫的主要程序，在經由action確認意圖並回應。
function doGet(e) {
  var action = e.parameter.action;

  // 如果是 OPTIONS 請求，直接返回空的回應
  if (e.method == "OPTIONS") {
    return ContentService.createTextOutput('');
  }

  // 根據 action 判斷請求的動作
  if (action === 'ms1update') {
    var result = msUpdate(action);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'ms2update') {
    var result = msUpdate(action);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'ms3update') {
    var result = msUpdate(action);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'ms4update') {
    var result = msUpdate(action);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'ms5update') {
    var result = msUpdate(action);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'podium') {
    var result = podium(action);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  }

  var errorResponse = {
    status: 'error',
    message: 'Invalid action'
  };
  return ContentService.createTextOutput(JSON.stringify(errorResponse))
    .setMimeType(ContentService.MimeType.JSON);
}