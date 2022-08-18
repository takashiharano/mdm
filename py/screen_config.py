import os
import sys

ROOT_DIR = '../'
sys.path.append(os.path.join(os.path.dirname(__file__), ROOT_DIR + 'libs'))
import util

import mdm

#----------------------------------------------------------
def print_html(scm_name):
    html = '''
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta charset="utf-8">
<meta name="robots" content="none">
<title></title>
<link rel="stylesheet" href="./style.css" />
<script src="../libs/util.js"></script>
<script src="./mdm.js"></script>
<script>
$onReady = function() {
'''
    html += "mdm.config.init('" + scm_name + "');"
    html += '''
};
</script>
<style>
#content {
  position: absolute;
  width: 1200px;
  text-align: left;
}

#config-text {
  width: 100%;
  height: 800px;
  font-size: 16px;
}
</style>
</head>
<body>
<div id="wrapper">
  <div id="content">
    <div style="position:relative;margin-bottom:4px;">
'''
    html += '  <a href="./?scm=' + scm_name + '"><img src="./img/home.png" data-tooltip="Home"></a>'

    html += '''
    <span style="position:absolute;right:8px;">
      <button onclick="mdm.config.save();">Save</button>
    </span>
    </div>
    <div style="margin-bottom:10px;">
    <textarea id="config-text" spellcheck="false"></textarea>
    </div>
  </div>
</div>
</body>
</html>
'''
    util.send_html(html)

#----------------------------------------------------------
def get_definition(scm_name):
    if scm_name == '':
        path = mdm.get_schema_definitin_path()
    else:
        path = mdm.get_master_definitin_path(scm_name)

    try:
        text = util.read_text_file(path)
    except:
        text = ''
    b64text = util.encode_base64(text)
    util.send_result_json('OK', b64text)

#----------------------------------------------------------
def save_definition(scm_name):
    if scm_name == '':
        path = mdm.get_schema_definitin_path()
    else:
        path = mdm.get_master_definitin_path(scm_name)

    b64text = util.get_request_param('text', '')
    text = util.decode_base64(b64text)
    util.write_text_file(path, text)
    util.send_result_json('OK', None)

#----------------------------------------------------------
def web_process(action, scm_name):
    if action == 'config_getdef':
        get_definition(scm_name)
    elif action == 'config_save':
        save_definition(scm_name)
    elif action == 'config':
        print_html(scm_name)
