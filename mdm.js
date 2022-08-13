var mdm = {};

mdm.scmId = null;
mdm.masterId = null;
mdm.masterDefinition = null;
mdm.win = null;

mdm.records = null;
mdm.currentRecord = null;
mdm.status = '';

mdm.listStatus = {
  sortIdx: 0,
  sortType: 1,
  selectedKey: null
};

$onLoad = function() {
  mdm.adjustLayout();
};

$onResize = function() {
  mdm.adjustLayout();
};

mdm.init = function(scmId, masterId) {
  mdm.scmId = scmId;
  mdm.masterId = masterId;
  util.addKeyHandler(27, 'down', mdm.onKeyDownEsc);
  util.addKeyHandler(83, 'down', mdm.onKeyDownS, {ctrl: true});
  var params = null;
  mdm.callApi('init', params, mdm.initCb);
  mdm.adjustLayout();
  mdm.loader.show();
};

mdm.initCb = function(xhr, res) {
  mdm.fadeInScreen();
  mdm.loader.hide();
  if (res.status == 'OK') {
    mdm.onInit(res);
  } else {
    var msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
    mdm.showInfotip(msg);
  }
  mdm.adjustLayout();
};

mdm.onInit = function(res) {
  mdm.masterDefinition = res.body;
  var masterName = mdm.masterDefinition['name'];
  document.title = masterName;
  $el('#master-name').innerText = masterName;
  mdm.drawTable(null);
  mdm.showRecord(null, 'read');
  mdm.reloadList();
};

mdm.adjustLayout = function() {
  $el('#content').center();
};

//=========================================================
//---------------------------------------------------------
mdm.reload = function() {
  mdm.showRecord(null, 'read');
  mdm.reloadList();
};

mdm.reloadList = function(cb) {
  mdm.listStatus.selectedKey = null;
  mdm.getRecords(cb);
};

//=========================================================
//---------------------------------------------------------
mdm.getRecords = function(chainedCb) {
  var params = null;
  var cb = mdm.getRecordsCb;
  var req = mdm.callApi('list', params, cb);
  req.chainedCb = chainedCb;
  mdm.loader.show();
};

mdm.getRecordsCb = function(xhr, res, req) {
  mdm.loader.hide();
  if (res.status == 'OK') {
    mdm.records = res.body;
    mdm.drawTable(mdm.records, mdm.listStatus.sortIdx, mdm.listStatus.sortType);
    if (req.chainedCb) req.chainedCb();
  } else {
    var msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
    mdm.showInfotip(msg);
  }
};

mdm.getRecord = function(pkey, cb) {
  var params = {
    pkey: pkey
  };
  mdm.callApi('get', params, cb);
  mdm.loader.show();
};

mdm.getRecordCb = function(xhr, res) {
  mdm.loader.hide();
  if (res.status != 'OK') {
    var msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
    mdm.showInfotip(msg);
    return;
  }
  var record = res.body;
  var columns = mdm.masterDefinition.columns;
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var colName = column['name'];
    $el('#' + colName).value = record[colName];
  }
};

mdm.drawTable = function(records, sortIdx, sortType) {
  var columns = mdm.masterDefinition.columns;
  var html = mdm.buildTableHeader(columns, sortIdx, sortType);

  if (!records) {
    html += '<tr><td colspan="5"><span class="loading progdot">Loading</span></td></tr>';
  } else if (records.length == 0) {
    html += '<tr><td colspan="5">No data</td></tr>';
  } else {
    records = util.copyObject(records);
    if (sortType > 0) {
      var sortColName = mdm.masterDefinition.columns[sortIdx].name;
      var desc = (sortType == 2);
      records = util.sortObject(records, sortColName, desc, true);
    }
    html += mdm.buildTableList(records);
  }

  html += '</table>';
  $el('#item-list').innerHTML = html;
  mdm.adjustLayout();
  mdm.onCheckboxChenge();
};

//---------------------------------------------------------
mdm.create = function() {
  mdm.currentRecord = null;
  mdm.showRecord(null, 'new');
};

mdm.update = function() {
  mdm.showRecord(mdm.currentRecord, 'edit');
};

mdm.copyEdit = function() {
  mdm.showRecord(mdm.currentRecord, 'copy-edit');
};

mdm.editCb = function(xhr, res) {
  mdm.loader.hide();
  var msg;
  if (res.status == 'OK') {
    msg = 'OK';
    var pkey = res.body;
    if (!mdm.currentRecord) {
      mdm.currentRecord = {};
    }
    mdm.currentRecord.pkey = pkey;
    mdm.reloadList(mdm.onReloadAfterEditCompleted);
  } else {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status;
    } else {
      msg += status;
    }
  }

  if (res.status == 'ALREADY_EXISTS') {
    msg = 'The record already exists';
  }

  mdm.showInfotip(msg);

  if (res.status == 'ALREADY_EXISTS') {
    mdm.showRecord(mdm.currentRecord, 'new');
  }
};

mdm.onReloadAfterEditCompleted = function() {
  var pkey = mdm.getPkeyValue(mdm.currentRecord);
  mdm.selectRecord(pkey, true);
};

//---------------------------------------------------------
mdm.delete = function(pkey) {
  mdm.confirm('Delete an item?\nPKEY: ' + pkey, mdm.deleteYesNoCb, pkey, true);
};

mdm.deleteYesNoCb = function(pkey) {
  mdm.deleteRecord(pkey);
};

mdm.deleteRecord = function(pkey) {
  var params = {
    pkey: pkey
  };
  mdm.callApi('delete', params, mdm.deleteCb);
  mdm.loader.show();
};

mdm.deleteCb = function(xhr, res) {
  mdm.loader.hide();
  var msg;
  if (res.status == 'OK') {
    msg = 'OK';
    mdm.showRecord(null, 'read');
    mdm.reloadList();
  } else {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
  }
  mdm.showInfotip(msg);
};
//---------------------------------------------------------
mdm.deleteMulti = function() {
  if (mdm.isAnyChecked()) {
    mdm.confirm('Delete the selected item?', mdm.deleteMultiRecordsYesNoCb, null, true);
  }
};

mdm.deleteMultiRecordsYesNoCb = function() {
  mdm.deleteMultiRecords();
};

mdm.deleteMultiRecords = function() {
  var keys = mdm.getCheckedKeys();
  var params = {
    keys: keys
  };
  mdm.callApi('delete_multi', params, mdm.deleteMultiRecordsCb);
  mdm.loader.show();
};

mdm.deleteMultiRecordsCb = function(xhr, res) {
  mdm.loader.hide();
  var msg;
  if (res.status == 'OK') {
    var detail = res.body;
    msg = 'OK: Deleted=' + detail['count_deleted'];
    if (detail['count_error'] > 0) {
      msg += ' Error=' + detail['count_error'];
    }
    mdm.showRecord(null, 'read');
    mdm.reloadList();
  } else {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
  }
  mdm.showInfotip(msg);
};

//---------------------------------------------------------
mdm.cancelEdit = function(pkey) {
  mdm.confirm('Cancel?', mdm.onCancelEdit, {pkey: pkey});
};

mdm.onCancelEdit = function(data) {
  mdm.status = '';
  mdm.selectRecord(data.pkey, true);
  mdm.finalizeEdit();
};

mdm.finalizeEdit = function() {
  mdm.status = '';
};

//---------------------------------------------------------
mdm.upload = function() {
  var winTitle = 'Upload';
  var html = '<div style="padding:8px;">';
  html += '<iframe id="iframe1" width="100%" height="100" src=""></iframe>';
  html += '<div style="margin-top:10px;text-align:center">';
  html += '<button onclick="mdm.closeWindow();">Close</button>';
  html += '</div>';

  mdm.win = mdm.openWindow(winTitle, 640, 210, html);

  var headHtml = '<link rel="stylesheet" href="./style.css" />';
  var bodyHtml = mdm.buildUploadWindowHtml();
  var iframe1 = $el('#iframe1').contentWindow.document;
  iframe1.head.innerHTML = headHtml;
  iframe1.body.innerHTML = bodyHtml;
};

mdm.buildUploadWindowHtml = function() {
  var html = '';
  html += '<form action="api.cgi" method="POST" enctype="multipart/form-data">';
  html += '<input type="hidden" name="scm" value="' + mdm.scmId + '">';
  html += '<input type="hidden" name="master" value="' + mdm.masterId + '">';
  html += '<input type="hidden" name="action" value="upload">';
  html += '<input name="file" type="file">';
  html += '<input type="submit" value="Upload">';
  html += '</form>';
  return html;
};

//---------------------------------------------------------
mdm.import = function() {
  var html = '<div style="padding:8px;">';
  html += 'Import data?<br><br>';
  html += 'Start row: <input type="text" id="start-row" style="width:50px;" value="2">\n';
  html += '<div style="margin-top:32px;text-align:center">';
  html += '<button onclick="mdm.startImport();">Yes</button>';
  html += '<button onclick="mdm.closeWindow();" style="margin-left:16px;">No</button>';
  html += '</div>';
  mdm.win = mdm.openWindow('Import', 400, 200, html);
};

mdm.startImport = function() {
  var startRow = $el('#start-row').value;
  params = {
    start: startRow
  };
  mdm.callApi('import', params, mdm.importCb);
  mdm.loader.show();
  mdm.closeWindow();
};

mdm.importCb = function(xhr, res) {
  mdm.loader.hide();
  var msg = res.status;
  if (res.status == 'OK') {
    var result = res.body;
    var createdCount = result['total_count_created'];
    var updatedCount = result['total_count_updated'];
    var errorCount = result['total_count_error'];
    msg += ': Created=' + createdCount + ' Updated=' + updatedCount + ' Error=' + errorCount;
  } else if (res.status == 'OK:NO_FILE_TO_IMPORT') {
      msg = 'No records to import';
  } else {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
  }
  mdm.showInfotip(msg);
  mdm.reloadList();
};

//---------------------------------------------------------
mdm.export = function() {
  var html = '<div style="padding:8px;">';
  html += 'Export all records?<br><br>';
  html += '<table>';
  html += '<tr>';
  html += '<td>Separator:</td>';
  html += '<td>';
  html += '<input type="radio" name="export-separator" id="export-separator-tab" value="tab" checked><label for="export-separator-tab">Tab</label>'
  html += '<input type="radio" name="export-separator" id="export-separator-comma" value="comma" style="margin-left:16px;"><label for="export-separator-comma">Comma</label>'
  html += '</td>';
  html += '</tr>';
  html += '<tr>';
  html += '<td>Output:</td>';
  html += '<td>';
  html += '<input type="radio" name="export-output" id="export-output-download" value="download" checked><label for="export-output-download">Download</label>'
  html += '<input type="radio" name="export-output" id="export-output-outbound" value="outbound" style="margin-left:16px;"><label for="export-output-outbound">Outbound</label>'
  html += '</td>';
  html += '</tr>';
  html += '</table>';
  html += '<div style="margin-top:32px;text-align:center">';
  html += '<button onclick="mdm.startExport();">Yes</button>';
  html += '<button onclick="mdm.closeWindow();" style="margin-left:16px;">No</button>';
  html += '</div>';
  mdm.win = mdm.openWindow('Export', 500, 240, html);
};

mdm.startExport = function() {
  var separator = 'tab';
  if ($el('#export-separator-comma').checked) {
    separator = 'comma';
  }

  var output = 'download';
  if ($el('#export-output-outbound').checked) {
    output = 'outbound';
  }

  mdm.closeWindow();

  params = {
    scm: mdm.scmId,
    master: mdm.masterId,
    separator: separator,
    output: output
  }

  if (output == 'outbound') {
    mdm.callApi('export', params, mdm.exportCb);
  } else {
    params.action = 'export';
    util.postSubmit('./api.cgi', params);
  }
};

mdm.exportCb = function(xhr, res) {
  mdm.loader.hide();
  var msg = res.status;
  if (res.status == 'OK') {
    var count = res.body;
    msg += ': ' + count + ' record(s) has been exported';
  } else {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
  }
  mdm.showInfotip(msg);
};

//---------------------------------------------------------
mdm.openWindow = function(title, width, height, html, onclose) {
  var opt = {
    name: 'win1',
    draggable: true,
    resizable: true,
    maximize: true,
    closeButton: true,
    width: width,
    height: height,
    pos: 'c',
    scale: 1.4,
    modal: true,
    hidden: false,
    title: {
      text: title
    },
    body: {
      style: {
        background: '#fff'
      }
    },
    onbeforeclose: onclose,
    content: html
  };
  var win = util.newWindow(opt);
  return win;
};

mdm.closeWindow = function() {
  if (mdm.win) {
    mdm.win.close();
    mdm.win = null;
  }
};

//---------------------------------------------------------
mdm.showInfotip = function(msg, duration) {
  if (!duration) {
    duration = 1500;
  }
  util.infotip.show(msg, duration, {style: {'font-size': '18px'}});
};

mdm.confirm = function(msg, cb, data, forcusNo) {
  var opt = {
    style: {
      'min-width': '350px'
    }
  };
  if (data){
    opt.data = data;
  }
  if (forcusNo) {
    opt.focus = 'no';
  }
  util.confirm(msg, cb, opt);
};

//---------------------------------------------------------
mdm.fadeInScreen = function() {
  util.fadeIn('#fader');
};

//---------------------------------------------------------
mdm.callApi = function(action, params, cb) {
  var param = {
    scm: mdm.scmId,
    master: mdm.masterId,
    action: action
  };

  for (var key in params) {
    param[key] = params[key];
  }

  var req = {
    url: 'api.cgi',
    method: 'POST',
    data: param,
    cb: cb
  };
  util.http(req);
  return req;
};

//---------------------------------------------------------
mdm.getPkeyColumnDefinitions = function() {
  var columns = mdm.masterDefinition.columns;
  var pkeyCols = [];
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    if (column['pkey']) {
      pkeyCols.push(column);
    }
  }
  return pkeyCols;
};

mdm.getPkeyValue = function(record) {
  if (!record) {
    return null;
  }
  if (record.pkey) {
    return record.pkey;
  }
  var pkeyDefs = mdm.getPkeyColumnDefinitions();
  var pkey = '';
  for (var i = 0; i < pkeyDefs.length; i++) {
    var pkeyDef = pkeyDefs[i];
    if (i > 0) {
      pkey += '|';
    }
    pkey += record[pkeyDef.name];
  }
  return pkey;
};

mdm.getPkeyValues = function(record) {
  if (!record) {
    return null;
  }
  var pkeyDefs = mdm.getPkeyColumnDefinitions();
  var pkeys = {};
  for (var i = 0; i < pkeyDefs.length; i++) {
    var pkeyDef = pkeyDefs[i];
    pkeys[pkeyDef.name] = record[pkeyDef.name];
  }
  return pkeys;
};

//---------------------------------------------------------
mdm.clearValidationMessage = function(columns) {
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var colName = column['name'];
    $el('#validation-' + colName).html('');
  }
};

//---------------------------------------------------------
mdm.buildTableHeader = function(columns, sortIdx, sortType) {
  var html = '<table id="list-table" class="list-table item-list">';
  html += '<tr class="item-list">';

  html += '<th class="item-list" style="width:32px;"><input type="checkbox" class="item-checkbox-all" onchange="mdm.selectAll();" data-tooltip="Select/Deselect all items"></th>';

  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var displayName = column['display_name'];
    var length = column['length'];
    var width = length / 2;
    if (width > 10) width = 10;

    var sortAscClz = '';
    var sortDescClz = '';
    var nextSortType = 1;
    if (i == sortIdx) {
      if (sortType == 1) {
        sortAscClz = 'sort-active';
      } else if (sortType == 2) {
        sortDescClz = 'sort-active';
      }
      nextSortType = sortType + 1;
    }

    var sortButton = '<span class="sort-button" ';
    sortButton += ' onclick="mdm.sortRecordList(' + i + ', ' + nextSortType + ');"';
    sortButton += '>';
    sortButton += '<span';
    if (sortAscClz) {
       sortButton += ' class="' + sortAscClz + '"';
    }
    sortButton += '>▲</span>';
    sortButton += '<br>';
    sortButton += '<span';
    if (sortDescClz) {
       sortButton += ' class="' + sortDescClz + '"';
    }
    sortButton += '>▼</span>';
    sortButton += '</span>';

    html += '<th class="item-list" style="min-width:' + width + 'em;"><span>' + displayName + '</span> ' + sortButton + '</th>';
  }

  html += '</tr>';
  return html;
};

mdm.sortRecordList = function(sortIdx, sortType) {
  if (sortType > 2) {
    sortType = 0;
  }
  mdm.listStatus.sortIdx = sortIdx;
  mdm.listStatus.sortType = sortType;
  mdm.drawTable(mdm.records, sortIdx, sortType);
  mdm.selectRecord(mdm.listStatus.selectedKey, true);
};

mdm.selectRecord = function(pkey, force) {
  if (mdm.isEditing()) {
    mdm.cancelEdit(pkey);
    return;
  }

  if (mdm.currentRecord) {
    var cPkey = mdm.getPkeyValue(mdm.currentRecord);
    if ((cPkey == pkey) && !force) {
      return;
    }
  }

  $el('.list-tr').removeClass('row-selected');
  $el('#tr-' + pkey).addClass('row-selected');
  mdm.listStatus.selectedKey = pkey;
  mdm.requestShowRecord(pkey);
};

mdm.isEditing = function() {
  if ((mdm.status == 'new') || (mdm.status == 'edit')) {
    return true;
  }
  return false;
};

mdm.buildTableList = function(records) {
  var columns = mdm.masterDefinition.columns;
  var html = '';
  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    var pkey = mdm.getPkeyValue(record);

    var trClass = 'row-even';
    if (i % 2 == 0) {
      trClass = 'row-odd';
    }
    html += '<tr id="tr-' + pkey + '" class="item-list list-tr ' + trClass +'">';
    html += '<td class="item-list' + tdClass + '"><input type="checkbox" class="item-checkbox" value="' + pkey + '" onchange="mdm.onCheckboxChenge();"></td>';
    for (var j = 0; j < columns.length; j++) {
      var column = columns[j];
      var colName = column['name'];
      var value = record[colName];
      var tdClass = '';
      if (column['type'] == 'NUMBER') {
        tdClass = ' td-number';
        value = mdm.formatNumber(value);
      } else if (column['type'] == 'DATE') {
        value = mdm.timestampToString(value);
      }
      html += '<td class="item-list' + tdClass + '" onclick="mdm.selectRecord(\'' + pkey + '\');">' + util.escHtml(value) + '</td>';
    }
    html += '</tr>';
  }
  return html;
};

mdm.requestShowRecord = function(pkey) {
  mdm.getRecord(pkey, mdm.requestShowRecordCb);
};

mdm.requestShowRecordCb = function(xhr, res) {
  mdm.loader.hide();
  var record = res.body;
  mdm.showRecord(record, 'read');
};

mdm.showRecord = function(record, mode) {
  var pkey = mdm.getPkeyValue(record);
  if (mode == 'new') {
    pkey = null;
  }

  mdm.currentRecord = record;
  mdm.status = mode;
  if (mode == 'copy-edit') {
    mdm.status = 'new';
  }
  var editing = ((mode == 'new') || (mode == 'edit') || (mode == 'copy-edit'));

  var html = '';
  html += '<div style="position:relative;height:1em;margin-bottom:10px;">';

  if (mdm.deliveryEnable) {
    html += '<span class="pseudo-link"';
    clz = ' icon-disabled';
    if ((mode == 'new') || (record && (mode == 'edit'))) {
      clz = '';
      html += ' onclick="mdm.collectFromUpstream(';
      if (pkey) {
        html += '\'' + pkey + '\'';
      }
      html += ');"';
    }
    html += ' style="margin-left:2px;margin-right:8px;">';
    html += '<img src="./img/delivery.png" id="delivery-from-icon" class="list-icon' + clz + '" data-tooltip="Collection from upstream">';
    html += '</span>';
  }

  if (mode =='loading') {
    html += '<span class="progdot">Loading</span>';
  }

  if (record && ((mode == 'read') || (mode == 'edit'))) {
    var createDate = parseInt(record['create_date']);
    var createdBy = record['created_by'];
    var lastUpdateDate = parseInt(record['last_update_date']);
    var updatedBy = record['updated_by'];
    var sCreateDate = util.getDateTimeString(createDate, '%YYYY-%MM-%DD %HH:%mm:%SS');
    var sLastUpdateDate = util.getDateTimeString(lastUpdateDate, '%YYYY-%MM-%DD %HH:%mm:%SS');
    html += '<div style="display:inline-block;position:relative;height:1em;top:-7px;font-size:14px;color:#888;">';
    html += '<span>Created: ' + sCreateDate + '</span>';
    html += '<span style="margin-left:8px;">by: ' + createdBy + '</span>';
    html += '<span style="margin-left:16px;">Last Updated: ' + sLastUpdateDate+ '</span>';
    html += '<span style="margin-left:8px;">by: ' + updatedBy + '</span>';
    html += '</div>';
  }

  html += '<span style="position:absolute;right:8px;">';

  html += '<span class="pseudo-link"';
  var clz = ' icon-disabled';
  if (record && (mode == 'read')) {
    clz = '';
    html += ' onclick="mdm.update();"';
  }
  html += '>';
  html += '<img src="./img/edit.png" class="list-icon' + clz + '" data-tooltip="Edit">';
  html += '</span>';

  html += '<span class="pseudo-link"';
  clz = ' icon-disabled';
  if (record && (mode == 'read')) {
    clz = '';
    html += ' onclick="mdm.copyEdit();"';
  }
  html += '>';
  html += '<img src="./img/edit-copy.png" class="list-icon' + clz + '" data-tooltip="Copy edit">';
  html += '</span>';

  html += '<span class="pseudo-link"';
  clz = ' icon-disabled';
  if (record && (mode == 'read')) {
    clz = '';
    html += ' onclick="mdm.delete(\'' + pkey + '\');"';
  }
  html += ' style="margin-left:8px;">';
  html += '<img src="./img/delete.png" class="list-icon' + clz + '" data-tooltip="Delete">';
  html += '</span>';

  if (mdm.deliveryEnable) {
    html += '<span class="pseudo-link"';
    clz = ' icon-disabled';
    if (record && (mode == 'read')) {
      clz = '';
      html += ' onclick="mdm.deliveryToUpstream(';
      if (pkey) {
        html += '\'' + pkey + '\'';
      }
      html += ');"';
    }
    html += ' style="margin-left:16px;">';
    html += '<img src="./img/delivery.png" id="delivery-to-icon" class="list-icon' + clz + '" data-tooltip="Delivery to upstream">';
    html += '</span>';
  }

  html += '</span>';
  html += '</div>';

  html += '<table>';
  var firstPkey = null;
  var columns = mdm.masterDefinition.columns;
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var colName = column['name'];
    var colDispName = column['display_name'];
    var isPkey = column['pkey'];
    var isRequired = column['required'];
    var value = (record ? record[colName] : '');

    var width = 16 * column['length'];
    if (width > 900) {
      width = 900;
    }

    html += '<tr style="vertical-align:top;">';
    html += '<td>';
    if (isPkey) {
      html += '<img src="img/key.png" data-tooltip="PKEY">';
    } else {
      html += '&nbsp;';
    }
    html += '</td>';

    html += '<td style="padding-right:16px;white-space:nowrap;">';
    html += colDispName;
    if (((mode == 'new') && isPkey) || (editing && isRequired)) {
      html += ' <span class="required" data-tooltip="Required">*</span>';
    }
    html += '</td>';
    html += '<td>';

    value = util.escHtml(value);
    var dispValue = value;1
    var placeholder = '';
    if (column['type'] == 'NUMBER') {
      dispValue = mdm.formatNumber(value);
    } else if (column['type'] == 'DATE') {
      value = mdm.timestampToString(value);
      dispValue = value;
      placeholder = 'YYYY-MM-DD';
    }
    if (!dispValue) {
      dispValue = '&nbsp;';
    }

    if (editing) {
      if (isPkey && (mode == 'edit')) {
        html += dispValue;
      } else {
        if (isPkey && (mode == 'copy-edit')) {
          value = '';
        }
        var inputId = 'input-' + colName;
        html += '<input type="text" id="' + inputId + '" class="edit-text" style="width:' + width + 'px;" spellcheck="false" value="' + value + '"';
        if (placeholder) {
          html += ' placeholder="' + placeholder + '"';
        }
        html += '">';
        if (isPkey && !firstPkey) {
          firstPkey = inputId;
          html += '<span id="auto-button" class="pseudo-link" style="margin-left:8px;color:#88a;font-size:14px;" onclick="mdm.setAutoIncrement(\'' + inputId + '\');" data-tooltip="Auto increment">[auto]</span>';
        }
      }
    } else {
      html += '<span style="display:inline-block;height:1.5em;">' + dispValue + '</span>';
      if (column['map'] && value) {
        html += mdm.showMap(value);
      }
    }

    html += '</td>';
    html += '</tr>';

    html += '<tr class="validation"><td>&nbsp;</td><td>&nbsp;</td><td><span id="validation-' + colName + '" class="validation"></span></td></tr>';
  }
  html += '</table>';

  html += '<div style="margin-top:10px;height:40px;text-align:center;">';
  if (editing) {
    html += '<button onclick="mdm.save();">Save</button>';
    html += '<button onclick="mdm.cancelEdit(\'' + pkey + '\');" style="margin-left:10px;">Cancel</button>';
  }
  html += '</div>';

  $el('#data-detail').innerHTML = html;
  mdm.adjustLayout();
};

mdm.setAutoIncrement = function(elmId) {
  var el = $el('#' + elmId);
  var btn = $el('#auto-button');
  if (el.disabled) {
    el.value = '';
    el.disabled = false;
    btn.style.color = '#888';
    mdm.enableDeliveryFromUpstream(true);
  } else {
    el.value = '[auto]';
    el.disabled = true;
    btn.style.color = '#00c';
    mdm.enableDeliveryFromUpstream(false);
  }
};

mdm.showMap = function(value) {
  var html = '';
  if (mdm.GMAP_KEY) {
    html += '<iframe id="iframe-map" width="800" height="300" src="https://www.google.com/maps/embed/v1/place?key=' + mdm.GMAP_KEY + '&q=' + value + '"></iframe>';
  }
  return html;
};

mdm.save = function() {
  if (!mdm.isEditing()) {
    return;
  }

  var values = {};
  var columns = mdm.masterDefinition.columns;
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var colName = column['name'];
    //var colDispName = column['display_name'];
    //var isPkey = column['pkey'];
    var value = $el('#input-' + colName).value;
    values[colName] = value;
  }

  if (mdm.status == 'edit') {
    var pkeys = mdm.getPkeyValues(mdm.currentRecord);
    for (var k in pkeys) {
      values[k] = pkeys[k];
    }
  }

  mdm.clearValidationMessage(columns);
  var hasError = mdm.validateValues(values);
  if (hasError) {
    return;
  }

  mdm.confirm('Save?', mdm.applyEdit);
};

mdm.applyEdit = function() {
  var values = {};

  var columns = mdm.masterDefinition.columns;
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var colName = column['name'];
    //var colDispName = column['display_name'];
    //var isPkey = column['pkey'];
    var value = $el('#input-' + colName).value;
    values[colName] = value;
  }

  var action = 'create';
  if (mdm.status == 'edit') {
    action = 'update';
    var pkeys = mdm.getPkeyValues(mdm.currentRecord);
    for (var k in pkeys) {
      values[k] = pkeys[k];
    }
  }

  var params = {};
  for (k in values) {
    params[k] = values[k];
  }

  mdm.callApi(action, params, mdm.editCb);

  mdm.showRecord(null, 'loading');
  mdm.currentRecord = values;

  mdm.finalizeEdit();
};

mdm.closeDialog = function() {
  util.dialog.close();
};

//---------------------------------------------------------
mdm.validateValues = function(values) {
  var hasError = false;
  for (var colName in values) {
    var colDef = mdm.getColumnDefinition(colName);
    var value = values[colName];
    if (mdm.validate(colDef, colName, value)) {
      hasError = true;
    }
  }
  return hasError;
};

mdm.validate = function(colDef, colName, value) {
  var hasError = false;
  var msg = '';

  if (colDef['pkey'] || colDef['required']) {
    if (!value) {
      hasError = true;
      msg = 'Required field.';
    }
  }

  if (colDef['type'] == 'CHAR') {
    if (value && (value.length != colDef['length'])) {
      hasError = true;
      msg = 'Length shoule be ' + colDef['length'] + '.';
    }
  }

  if (colDef['type'] == 'VARCHAR') {
    if (value.length > colDef['length']) {
      hasError = true;
      msg = 'Max length is ' + colDef['length'] + '.';
    }
  }

  if (colDef['type'] == 'NUMBER') {
    if (value && !util.isNumeric(value)) {
      hasError = true;
      msg = 'Shuold be a numeric value.';
    }
  }

  if (colDef['type'] == 'DATE') {
    if (value) {
      var v = value.replace(/[-/]/g, '');
      if (!v.match(/^\d{8}$/)) {
        hasError = true;
        msg = 'Shuold be date format.';
      }
    }
  }

  if (hasError) {
    $el('#validation-' + colName).html(msg, 200);
  }

  return hasError;
};

//---------------------------------------------------------
mdm.exportToUpstream = function() {
  if (!mdm.isAnyChecked()) {
    return;
  }
  var html = '<div style="padding:8px;text-align:center;">';
  html += 'Export to upstream system?<br><br>';
  html += '<div style="display:inline-block;width:300px;margin:0;">';
  html += '<table>';
  html += '<tr><td>Username:</td><td><input type="text" id="username" style="width:150px;" spellcheck="false"></td></tr>';
  html += '<tr><td>Password:</td><td><input type="password" id="password" style="width:150px;" spellcheck="false"></td></tr>';
  html += '</table>';
  html += '</div>';
  html += '<div style="margin-top:32px;text-align:center">';
  html += '<button onclick="mdm._exportToUpstream();">Yes</button>';
  html += '<button onclick="mdm.closeWindow();" style="margin-left:16px;">No</button>';
  html += '</div>';
  mdm.win = mdm.openWindow('Export', 500, 250, html);
  setTimeout(mdm.focusElement, 250, '#username');
};
mdm._exportToUpstream = function() {
  var username = $el('#username').value.trim();
  var password = $el('#password').value.trim();

  mdm.closeWindow();
  if (!username || !password) {
    mdm.showInfotip('Username and Password are required.', 2000);
    return;
  }

  var keys = mdm.getCheckedKeys();
  username = util.encodeBSB64(username, 1);
  password = util.encodeBSB64(password, 1);
  params = {
    keys: keys,
    username: username,
    password: password
  };
  mdm.loader.show();
  mdm.callApi('new_delivery', params, mdm.exportToUpstreamCb);
};

mdm.exportToUpstreamCb = function(xhr, res) {
  mdm.loader.hide();
  var msg = res.status;
  if (res.status != 'OK') {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
  }
  mdm.showInfotip(msg);
};

//---------------------------------------------------------
mdm.collectFromUpstream = function(pkey) {
  if (!pkey) {
    pkey = $el('#input-id').value.trim();
  }
  if (!pkey) {
    mdm.showInfotip('ID is required');
    return;
  }
  if (pkey == '[auto]') {
    return;
  }
  var html = '<div style="padding:8px;text-align:center;">';
  html += 'Collect from upstream system?<br><br>';
  html += '<div style="display:inline-block;width:300px;margin:0;">';
  html += '<table>';
  html += '<tr><td>Username:</td><td><input type="text" id="username" style="width:150px;" spellcheck="false"></td></tr>';
  html += '<tr><td>Password:</td><td><input type="password" id="password" style="width:150px;" spellcheck="false"></td></tr>';
  html += '</table>';
  html += '</div>';
  html += '<div style="margin-top:32px;text-align:center">';
  html += '<button onclick="mdm._collectFromUpstream(\'' + pkey + '\');">Yes</button>';
  html += '<button onclick="mdm.closeWindow();" style="margin-left:16px;">No</button>';
  html += '</div>';
  mdm.win = mdm.openWindow('Collection', 500, 250, html);
  setTimeout(mdm.focusElement, 250, '#username');
};
mdm._collectFromUpstream = function(pkey) {
  var username = $el('#username').value.trim();
  var password = $el('#password').value.trim();

  mdm.closeWindow();
  if (!username || !password) {
    mdm.showInfotip('Username and Password are required.', 2000);
    return;
  }

  username = util.encodeBSB64(username, 1);
  password = util.encodeBSB64(password, 1);
  params = {
    pkey: pkey,
    username: username,
    password: password
  };
  mdm.loader.show();
  mdm.callApi('collect', params, mdm.collectFromUpstreamCb);
};

mdm.collectFromUpstreamCb = function(xhr, res) {
  mdm.loader.hide();
  var msg = res.status;
  if (res.status != 'OK') {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      if (res.status.match('404')) {
        msg = 'No such object';
      } else {
        msg += res.status
      }
    }
    mdm.showInfotip(msg, 2500);
    return;
  }

  var values = res.body;
  for (var key in values) {
    var value = values[key];
    $el('#input-' + key).value = value;
  }

  mdm.showInfotip(msg);
};

//---------------------------------------------------------
mdm.deliveryToUpstream = function(pkey) {
  var html = '<div style="padding:8px;text-align:center;">';
  html += 'Delivery to upstream system?<br><br>';
  html += '<div style="display:inline-block;width:300px;margin:0;">';
  html += '<table>';
  html += '<tr><td>Username:</td><td><input type="text" id="username" style="width:150px;" spellcheck="false"></td></tr>';
  html += '<tr><td>Password:</td><td><input type="password" id="password" style="width:150px;" spellcheck="false"></td></tr>';
  html += '</table>';
  html += '</div>';
  html += '<div style="margin-top:32px;text-align:center">';
  html += '<button onclick="mdm._deliveryToUpstream(\'' + pkey + '\');">Yes</button>';
  html += '<button onclick="mdm.closeWindow();" style="margin-left:16px;">No</button>';
  html += '</div>';
  mdm.win = mdm.openWindow('Delivery', 500, 250, html);
  setTimeout(mdm.focusElement, 250, '#username');
};
mdm._deliveryToUpstream = function(pkey) {
  var username = $el('#username').value.trim();
  var password = $el('#password').value.trim();

  mdm.closeWindow();
  if (!username || !password) {
    mdm.showInfotip('Username and Password are required.', 2000);
    return;
  }

  username = util.encodeBSB64(username, 1);
  password = util.encodeBSB64(password, 1);
  params = {
    pkey: pkey,
    username: username,
    password: password
  };
  mdm.loader.show();
  mdm.callApi('delivery', params, mdm.deliveryToUpstreamCb);
};

mdm.deliveryToUpstreamCb = function(xhr, res) {
  mdm.loader.hide();
  var msg = res.status;
  if (res.status != 'OK') {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
  }
  mdm.showInfotip(msg);
};

//---------------------------------------------------------
mdm.selectAll = function() {
  var f = !mdm.isAllChecked();
  var chkboxes = $el('.item-checkbox');
  for (var i = 0; i < chkboxes.length; i++) {
    chkboxes[i].checked = f;
  }
  mdm.onCheckboxChenge();
};

mdm.onCheckboxChenge = function() {
  var checked = mdm.isAnyChecked();
  mdm.enableExportToUpstream(mdm.isAnyChecked);
  if (checked) {
    $el('#multi-delete-button').removeClass('icon-disabled');
  } else {
    $el('#multi-delete-button').addClass('icon-disabled');
  }
};

mdm.isAllChecked = function() {
  var chkboxes = $el('.item-checkbox');
  for (var i = 0; i < chkboxes.length; i++) {
    if (!chkboxes[i].checked) {
      return false;
    }
  }
  return true;
};

mdm.isAnyChecked = function() {
  var chkboxes = $el('.item-checkbox');
  for (var i = 0; i < chkboxes.length; i++) {
    if (chkboxes[i].checked) {
      return true;
    }
  }
  return false;
};

mdm.getCheckedKeys = function() {
  var chkboxes = $el('.item-checkbox');
  var keys = '';
  for (var i = 0; i < chkboxes.length; i++) {
    var chkbox = chkboxes[i];
    if (chkbox.checked) {
      var key = chkbox.value;
      if (keys) {
        keys += ',';
      }
      keys += key;
    }
  }
  return keys;
};

mdm.enableExportToUpstream = function(f) {
  if (f) {
    $el('#shipping-icon').setStyle('opacity', '1');
  } else {
    $el('#shipping-icon').setStyle('opacity', '0.5');
  }
};

mdm.enableDeliveryFromUpstream = function(f) {
  if (f) {
    $el('#delivery-from-icon').setStyle('opacity', '1');
  } else {
    $el('#delivery-from-icon').setStyle('opacity', '0.5');
  }
};

//---------------------------------------------------------
mdm.cleanDataxDir = function() {
  mdm.confirm('Clean Data Exchange Directory?', mdm.doCleanDataxDir);
};

mdm.doCleanDataxDir = function() {
  params = null;
  mdm.callApi('clean_datax_dir', params, mdm.cleanDataxDirCb);
  mdm.loader.show();
};

mdm.cleanDataxDirCb = function(xhr, res) {
  mdm.loader.hide();
  var msg = res.status;
  if (res.status == 'OK') {
    msg = 'OK';
  } else {
    msg = 'Error: ';
    if (xhr.status != 200) {
      msg += 'HTTP' + xhr.status
    } else {
      msg += res.status
    }
  }
  mdm.showInfotip(msg);
};

//---------------------------------------------------------
mdm.getColumnDefinition = function(name) {
  var columns = mdm.masterDefinition.columns;
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var colName = column['name'];
    if (colName == name) return column;
  }
  return null;
};

mdm.formatNumber = function(value) {
  return util.formatNumber(value);
};

mdm.timestampToString = function(ts) {
  if (!ts) {
    return '';
  }
  if (util.isNumeric(ts)) {
    ts = parseInt(ts);
  }
  return util.getDateTimeString(ts, '%YYYY-%MM-%DD');
};

mdm.focusElement = function(selector) {
  $el(selector).focus()
};

mdm.onKeyDownEsc = function(e) {
  e.preventDefault();
  mdm.closeDialog();
};

mdm.onKeyDownS = function(e) {
  e.preventDefault();
  mdm.save();
};

//---------------------------------------------------------
mdm.showHelp = function() {
  var html = '<div id="winbody"><div id="wincontent"></div>';
  html += '</div>';
  mdm.win = mdm.openWindow('Help', 620, 300, html, mdm.closeHelpWindow);
  $el('#wincontent').appendChild($el('#doc'));
};

mdm.closeHelpWindow = function() {
  $el('#holder').appendChild($el('#doc'));
};

//=============================================================================
mdm.loader = {};
mdm.loader.show = function() {
  //util.loader.show();
};
mdm.loader.hide = function() {
  //util.loader.hide();
};

//=============================================================================
mdm.config = {};
mdm.config.init = function(scmId) {
  mdm.scmId = scmId;
  util.addKeyHandler(27, 'down', mdm.onKeyDownEsc);
  util.addKeyHandler(83, 'down', mdm.config.onKeyDownS, {ctrl: true});
  var params = null;
  mdm.config.callApi('getdef', params, mdm.config.initCb);
  mdm.adjustLayout();
  mdm.loader.show();
};

mdm.config.initCb = function(xhr, res) {
  mdm.loader.hide();
  if (res.status == 'OK') {
    mdm.config.onInit(res);
  } else {
    var msg = 'Error: ' + res.status
    mdm.showInfotip(msg);
  }
  mdm.adjustLayout();
};

mdm.config.onInit = function(res) {
  var text = util.decodeBase64(res.body);
  $el('#config-text').value = text;
};

//---------------------------------------------------------
mdm.config.save = function() {
  mdm.confirm('Save?', mdm.config.applyEdit);
};

mdm.config.applyEdit = function() {
  var text = $el('#config-text').value;
  var b64text = util.encodeBase64(text);
  var params = {
    text: b64text
  };
  mdm.config.callApi('save', params, mdm.config.editCb);
  mdm.loader.show();
};

mdm.config.editCb = function(xhr, res) {
  mdm.loader.hide();
  var msg;
  if (res.status == 'OK') {
    msg = 'OK';
  } else {
    msg = 'Error: ' + res.status
  }
  mdm.showInfotip(msg);
};

//---------------------------------------------------------
mdm.config.callApi = function(action, params, cb) {
  var param = {
    scm:   mdm.scmId,
    action: action
  };

  for (var key in params) {
    param[key] = params[key];
  }

  var req = {
    url: 'config.cgi',
    method: 'POST',
    data: param,
    cb: cb
  };
  util.http(req);
  return req;
};

mdm.config.onKeyDownS = function(e) {
  mdm.config.save();
  e.preventDefault();
};
