import os
import sys

ROOT_DIR = '../../'
sys.path.append(os.path.join(os.path.dirname(__file__), ROOT_DIR + 'libs'))
import util

import mdm

util.append_system_path(__file__, ROOT_DIR + 'websys')
import web

#----------------------------------------------------------
def print_top_page_html():
    has_error = False
    try:
        schema_definition_list = mdm.load_schema_definition_list()
    except:
        has_error = True

    title = 'MDM'
    html = get_html_header(title)
    html += '''
<style>
#wrapper {
  position: relative;
  height: 100%;
  vartical-align: middle;
}

#content {
  position: absolute;
  margin-top: -50px;
  width: 300px;
  text-align: left;
}

#navi {
  position: absolute;
  top: 16px;
  left: 16px;
}

#doc {
  width: 580px;
  margin: 0;
  padding: 16px;
  font-size: 16px;
  font-family: Consolas, Monaco, Menlo, monospace, sans-serif;
}

#deader {
  position: absolute;
}
</style>
<script>
$onReady = function() {
  mdm.fadeInScreen();
};
</script>
</head>
<body>
<div id="fader">
<div id="wrapper">
<div id="navi">
<a href="../"><img src="./img/home.png"></a>
</div>
<div id="header">
<span style="position:absolute;top:4px;right:10px;"><img src="./img/question.png" class="pseudo-link" onclick="mdm.showHelp();"></span>
</div>
<div id="content">
<span style="font-size:32px;">MDM</span>
<div style="margin-top:24px;">
'''
    if has_error:
        html += '<span style="color:#e22;font-size:16px;">SCHEMA_LIST_LOAD_ERROR</span>'
    else:
        for scm_name in schema_definition_list:
            schema_definition = schema_definition_list[scm_name]
            display_name = schema_definition['name']
            html += '<img src="./img/db2.png" class="menu-item-img"><a href="./?scm=' + scm_name + '">' + display_name + '</a><br>'

    html += '''</div>
<div style="margin-top:24px;font-size:16px;">
</div>

<div style="margin-top:24px;font-size:16px;">
'''
    html += '<img src="./img/settings.png" class="menu-item-img" style="height:16px;"><a href="./?action=config">Shema config</a><br>'
    html += '''
</div>
</div>
</div>
</div>

<div id="holder" style="display:none;">
<pre id="doc">
APIs:

[Export]
./?scm=&lt;SCHEMA&gt;&master=&lt;MASTER&gt;&action=export

[Import]
./?scm=&lt;SCHEMA&gt;&master=&lt;MASTER&gt;&action=import&start=&lt;LINE&gt;

[Get record]
./?scm=&lt;SCHEMA&gt;&master=&lt;MASTER&gt;&action=get&pkey=&lt;PKEY&gt;
</pre>
</div>
</body>
</html>
'''
    util.send_html(html)

#----------------------------------------------------------
def print_master_menu_html(scm_name):
    has_error = False
    try:
        all_master_definition = mdm.load_master_definition(scm_name)
    except:
        has_error = True

    title = 'Master List (' + scm_name + ')'
    html = get_html_header(title)
    html += '''
<style>
#wrapper {
  position: relative;
  height: 100%;
  vartical-align: middle;
}

#content {
  position: absolute;
  width: 400px;
  text-align: left;
}

#navi {
  position: absolute;
  top: 16px;
  left: 16px;
}
</style>
<script>
$onReady = function() {
'''
    html += "mdm.scmId = '" + scm_name + "';"
    html += '''
    mdm.fadeInScreen();
};
</script>
<body>
<div id="fader">
<div id="wrapper">
<div id="navi">
<a href="../"><img src="./img/home.png"></a>
<span style="margin-left:8px;"><a href="./"><img src="./img/return.png"></a></span>
</div>
<div id="content">
<span style="font-size:32px;">Master Data</span>
<div style="margin-top:24px;">
'''
    if has_error:
        html += '<span style="color:#e22;font-size:16px;">MASTER_SCHEMA_LOAD_ERROR</span>'
    else:
        for  master_name in all_master_definition:
            master_definition = all_master_definition[master_name]
            display_name = master_definition['name']
            html += '<img src="./img/sheet.png" class="menu-item-img"><a href="./?scm=' + scm_name + '&master=' + master_name + '">' + display_name + '</a><br>'

    html += '''</div>
<div style="margin-top:24px;font-size:16px;">
'''
    html += '<img src="./img/folder.png" class="menu-item-img" style="height:16px;"><a href="./datax/' + scm_name + '/">Browse Data Exchange Points</a>'
    html += '<span class="pseudo-link" onclick="mdm.cleanDataxDir();" style="margin-left:8px;color:#00f;font-size:13px;"><img src="./img/delete.png" style="height:16px;" data-tooltip="Clear"></span>'
    html += '<br>'
    html += '''
</div>

<div style="margin-top:24px;font-size:16px;">
'''
    html += '<img src="./img/settings.png" class="menu-item-img" style="height:16px;"><a href="./?action=config&scm=' + scm_name + '">Master config</a><br>'
    html += '''
</div>

</div>
</div>
</div>
</body>
</html>
'''
    util.send_html(html)

#----------------------------------------------------------
def print_master_html(scm_name, master_name):
    title = 'Master (' + scm_name + ':' + master_name + ')'

    master_definition = None
    delivery_enable = 'false'

    try:
        all_master_definition = mdm.load_master_definition(scm_name)
        master_definition = all_master_definition[master_name]

        if 'delivery' in master_definition and master_definition['delivery']:
            delivery_enable = 'true'
    except:
        pass

    html = get_html_header(title, scm_name)
    html += '''
<script>
$onReady = function() {
'''
    html += "mdm.init('" + scm_name + "', '" + master_name + "');"
    html += '''
    mdm.fadeInScreen();
};
'''
    html += 'mdm.deliveryEnable = ' + delivery_enable + ';'
    html += '''
</script>
<style>
#content {
  position: absolute;
  width: 1200px;
  text-align: left;
}
</style>
</head>
<body>'''

    if master_definition is None:
        html += '<span style="color:#e22;font-size:16px;">MASTER_SCHEMA_LOAD_ERROR</span>'
        html += '</body></html>'
        util.send_html(html)
        return

    html += '''<div id="fader">
<div id="wrapper">
  <div id="content">
    <div style="margin-bottom:20px;">
'''
    html += '  <a href="./?scm=' + scm_name + '"><img src="./img/return.png"></a>'

    if mdm.master_exists(scm_name, master_name):
        html += '''
      </div>
      <div style="margin-bottom:10px;">
      <span id="master-name"></span>
      </div>
      <div style="margin-bottom:10px;">
      <span class="pseudo-link" onclick="mdm.create();"><img src="./img/plus.png" data-tooltip="New"></span>
      <span class="pseudo-link" onclick="mdm.reload();"><img src="./img/reload.png" data-tooltip="Reload"></span>

      <span style="position:absolute;right:4px;">
        <span id="multi-delete-button" class="pseudo-link icon-disabled" style="margin-right:16px;" onclick="mdm.deleteMulti();"><img src="./img/delete.png" data-tooltip="Delete"></span>
        <span class="pseudo-link" onclick="mdm.upload();"><img src="./img/upload.png" data-tooltip="Upload"></span>
        <span class="pseudo-link" onclick="mdm.import();"><img src="./img/import.png" data-tooltip="Import"></span>
        <span style="margin-left:10px;">
          <span class="pseudo-link" onclick="mdm.export();"><img src="./img/export.png" data-tooltip="Export"></span>
        </span>
'''

        if delivery_enable == 'true':
            html += '''
      <span style="margin-left:10px;">
        <span class="pseudo-link" onclick="mdm.exportToUpstream();"><img src="./img/shipping.png" id="shipping-icon" data-tooltip="New Delivery\nCreates the selected item(s) in the upstream system."></span>
      </span>
    '''

        html += '''
    </span>
    </div>
    <div id="table-wrapper">
      <div id="item-list" class="data"></div>
    </div>
    <div id="data-detail-wrapper">
      <div id="data-detail"></div>
    </div>
'''
    else:
        html += '<span style="margin-left:16px;">ERR_NO_SUCH_MASTER (' + master_name + ')</span>'

    html += '''
  </div>
</div>
</div>
</body>
</html>
'''

    util.send_html(html)

#----------------------------------------------------------
def get_html_header(title, scm_name=None):
    html = '''<!DOCTYPE html>
<html>
<head>
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta charset="utf-8">
<meta name="robots" content="none">
'''
    html += '<title>' + title + '</title>';
    html += '''
<link rel="stylesheet" href="./style.css" />
'''
    if not scm_name is None:
        html += '<link rel="stylesheet" href="./scm/' + scm_name + '/style.css" />'

    html += '''
<script src="https://debugjs.net/debug.js"></script>
<script src="../libs/util.js"></script>
<script src="./mdm.js"></script>
<script src="./_config.js"></script>
'''
    return html

#----------------------------------------------------------
def print_auth_redirect_html():
    html = '''<!DOCTYPE html>
<html>
<head>
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta charset="utf-8">
<meta name="robots" content="none">
<meta name="referrer" content="no-referrer">
<meta name="referrer" content="never">
<script src="../libs/util.js"></script>
'''

    html += '''
<script src="../websys/websys.js"></script>
<script>
$onReady = function() {
  websys.authRedirection(location.href);
}
websys.init('../');
</script>
'''

    html += '''</head>
<body>
</body>
</html>
'''
    util.send_html(html)

#----------------------------------------------------------
def web_process(scm_name, master_name):
    context = web.on_access()
    if not context.is_authorized():
        print_auth_redirect_html()
        return

    if scm_name == '':
        print_top_page_html()
    elif master_name == '':
        print_master_menu_html(scm_name)
    else:
        print_master_html(scm_name, master_name)
