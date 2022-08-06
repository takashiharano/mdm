#=====================================
# MDM
# Copyright 2022 Takashi Harano
# Released under the MIT license
# https://github.com/takashiharano/mdm
#=====================================
import os
import sys

ROOT_DIR = '../'
sys.path.append(os.path.join(os.path.dirname(__file__), ROOT_DIR + 'libs'))
import util
import bsb64

BASE_PATH = '.'

EXTENSION_ENABLED = False
if EXTENSION_ENABLED:
  import mdm_ex

AUTO_INCREMENT = '[auto]'

#----------------------------------------------------------
def get_pkey_value(master_definition, record):
  pkey_col_name_list = get_pkey_col_name_list(master_definition)
  pkey_value = ''
  for i in range(len(pkey_col_name_list)):
    col_name = pkey_col_name_list[i]
    value = record[col_name]
    if i > 0:
      pkey_value += '|'
    pkey_value += value
  return pkey_value

def get_pkey_values(master_definition, record):
  pkey_col_name_list = get_pkey_col_name_list(master_definition)
  pkey_values = []
  for i in range(len(pkey_col_name_list)):
    col_name = pkey_col_name_list[i]
    pkey_value = {
      'name': col_name,
      'value': record[col_name]
    }
    pkey_values.append(pkey_value)

  return pkey_values

def get_pkey_col_name_list(master_definition):
  col_defs = master_definition['columns']
  pkey_col_name_list = []
  for i in range(len(col_defs)):
    col_def = col_defs[i]
    if 'pkey' in col_def and col_def['pkey']:
      pkey_col_name_list.append(col_def['name'])
  return pkey_col_name_list

#----------------------------------------------------------
def get_data_list(path):
  return util.read_text_file_as_list(path)

#----------------------------------------------------------
def get_next_id(data_list):
  ids = []
  for i in range(len(data_list)):
    data = data_list[i]
    fields = data.split('\t')
    id = fields[0]

    if util.is_int(id):
      n = int(id)
      ids.append(n)

  ids.sort()
  ids.reverse()
  if len(ids) > 0:
    max = ids[0]
  else:
    max = 0
  next_id = str(max + 1)

  return next_id

#----------------------------------------------------------
def record_exists(master_definition, data_list, pkey):
  for i in range(len(data_list)):
    data = data_list[i]
    fields = data.split('\t')
    record = build_record_dict(master_definition, fields)
    pkey_value = get_pkey_value(master_definition, record)
    if pkey_value == pkey:
      return True
  return False

#----------------------------------------------------------
def export(scm_name, master_definition, data_path):
  separator = util.get_request_param('separator', '')
  if separator == 'comma':
    sep = ','
  else:
    sep = '\t'

  output = util.get_request_param('output', '')
  if output != 'outbound':
    output = 'download'

  col_defs = master_definition['columns']
  out_list = []
  data_list = get_data_list(data_path)

  header = build_csv_header(master_definition, sep)
  out_list.append(header)

  for i in range(len(data_list)):
    data = data_list[i]
    fields = data.split('\t')
    record = build_record_dict(master_definition, fields)
    record = cleanse_data_for_export(col_defs, record)
    line = build_record_in_text_line(col_defs, record, sep)
    out_list.append(line)

  text = util.list2text(out_list, line_sep='\r\n')
  content = bytes(text, 'utf-8')

  master_id = master_definition['id']
  filename = master_id + '.txt'

  if output == 'outbound':
    count = len(out_list)
    odexp_path = get_odexp_path(scm_name)
    out_path = odexp_path + filename
    util.write_binary_file(out_path, content)
    util.send_result_json('OK', count)
  else:
    util.send_binary(content, filename)

#----------------------------
def cleanse_data_for_export(col_defs, record):
  for i in range(len(col_defs)):
    col_def = col_defs[i]
    col_name = col_def['name']
    col_type = col_def['type']
    value = record[col_name]
    if value == '':
      continue

    if col_type == 'DATE':
      timestamp = int(value)
      timestamp = util.milli_to_micro(timestamp)
      value = util.get_datetime_str(timestamp, '%Y-%m-%d')
      record[col_name] = value

  return record

#----------------------------------------------------------
def upload(scm_name, master_definition):
  form = util.get_field_storage()

  if 'file' in form:
    item = form['file']
    content = item.file
    filename = item.filename

    if content:
      save_filepath = get_import_data_path(scm_name, master_definition)
      util.write_file(save_filepath, content);
      result = 'OK'
    else:
      result = 'NO_FILE_CONTENT'

  else:
    result = 'NO_FILE_FIELD'

  util.send_response('text', result);

#----------------------------------------------------------
def build_record_dict(master_definition, fields):
  col_defs = master_definition['columns']
  record = {}
  for i in range(len(col_defs)):
    col_def = col_defs[i]
    col_name = col_def['name']
    if i < len(fields):
      value = fields[i]
      value = util.replace(value, '"(?!")', '')
    else:
      value = ''
    record[col_name] = value
  return record

#----------------------------------------------------------
def build_record_in_text_line(col_defs, data, sep='\t'):
  line = ''
  for i in range(len(col_defs)):
    col_def = col_defs[i]
    col_name = col_def['name']
    value = data[col_name]

    if util.match(value, sep):
      value = util.quote_csv_field(value, '"')

    if i > 0:
      line += sep
    line += value
  return line

#----------------------------------------------------------
def build_csv_header(master_definition, sep):
  col_defs = master_definition['columns']
  s = ''
  for i in range(len(col_defs)):
    col_def = col_defs[i]
    col_name = col_def['display_name']
    if util.match(col_name, sep):
      value = util.quote_csv_field(col_name, '"')
    if i > 0:
      s += sep
    s += col_name
  return s

#----------------------------------------------------------
def commit(data_path, data_list):
  util.write_text_file_from_list(data_path, data_list)

#==========================================================
#----------------------------------------------------------
def get_list(master_definition, data_path):
  data_list = get_data_list(data_path)

  records = []
  for i in range(len(data_list)):
    data = data_list[i]
    fields = data.split('\t')
    record = build_record_dict(master_definition, fields)
    records.append(record)

  util.send_result_json('OK', records)

#----------------------------------------------------------
def get_record(master_definition, data_path):
  status = 'RECORD_NOT_FOUND'
  target_pkey = util.get_request_param('pkey', '')
  data_list = get_data_list(data_path)

  target_record = None
  for i in range(len(data_list)):
    data = data_list[i]
    fields = data.split('\t')

    record = build_record_dict(master_definition, fields)
    pkey = get_pkey_value(master_definition, record)

    if pkey == target_pkey:
      status = 'OK'
      target_record = record
      break

  util.send_result_json(status, target_record)

#----------------------------------------------------------
def create(master_definition, data_path):
  col_defs = master_definition['columns']
  status = 'OK'

  new_data = {}
  record = {}
  for i in range(len(col_defs)):
    col_def = col_defs[i]
    col_name = col_def['name']
    new_data[col_name] = util.get_request_param(col_name, '')

  data_list = get_data_list(data_path)

  try:
    new_list = insert_data(master_definition, data_list, new_data)
    commit(data_path, new_list)
  except Exception as e:
    status = 'CREATE_ERROR_' + str(e)

  pkey = get_pkey_value(master_definition, new_data)

  util.send_result_json(status, pkey)

#----------------------------------------------------------
def insert_data(master_definition, data_list, new_data):
  col_defs = master_definition['columns']

  target_pkey = get_pkey_value(master_definition, new_data)
  pkey_values = get_pkey_values(master_definition, new_data)
  if len(pkey_values) == 1:
    if target_pkey == AUTO_INCREMENT:
      pkey_col = pkey_values[0]
      next_pkey = get_next_id(data_list)
      new_data[pkey_col['name']] = next_pkey
      target_pkey = next_pkey

  new_list = []
  for i in range(len(data_list)):
    data = data_list[i]
    fields = data.split('\t')

    record = build_record_dict(master_definition, fields)
    pkey = get_pkey_value(master_definition, record)

    if pkey == target_pkey:
      raise Exception('ALREADY_EXISTS(' + pkey + ')')
    else:
      new_list.append(data)

  new_data = cleanse_data(master_definition, new_data)
  new_record = build_record_in_text_line(col_defs, new_data)
  new_list.append(new_record)
  return new_list

#----------------------------------------------------------
def update(master_definition, data_path):
  col_defs = master_definition['columns']
  status = 'OK'

  new_data = {}
  for i in range(len(col_defs)):
    col_def = col_defs[i]
    col_name = col_def['name']
    new_data[col_name] = util.get_request_param(col_name, '')

  data_list = get_data_list(data_path)

  #try:
  new_list = update_data(master_definition, data_list, new_data)
  commit(data_path, new_list)
  #except Exception as e:
  #  status = 'UPDATE_ERROR_' + str(e)

  pkey = get_pkey_value(master_definition, new_data)

  util.send_result_json(status, pkey)

#----------------------------------------------------------
def update_data(master_definition, data_list, new_data):
  col_defs = master_definition['columns']

  target_pkey = get_pkey_value(master_definition, new_data)

  new_list = []
  for i in range(len(data_list)):
    data = data_list[i]
    fields = data.split('\t')

    record = build_record_dict(master_definition, fields)
    pkey = get_pkey_value(master_definition, record)

    if pkey == target_pkey:
      new_data = cleanse_data(master_definition, new_data)
      new_record = build_record_in_text_line(col_defs, new_data)
      new_list.append(new_record)
    else:
      new_list.append(data)

  return new_list

#----------------------------------------------------------
def cleanse_data(master_definition, data):
  new_data = {}
  col_defs = master_definition['columns']
  for i in range(len(col_defs)):
    col_def = col_defs[i]
    col_name = col_def['name']
    value = data[col_name]

    if is_required_field(col_def):
      if value == '':
        raise Exception('REQUIRED_FIELD_IS_EMPTY')

    if col_name in data:
      if col_def['type'] == 'DATE':
        value = cleanse_to_date(value)
        value = str(value)
      new_data[col_name] = value
    else:
      new_data[col_name] = None

  return new_data

def is_required_field(col_def):
  if ('pkey' in col_def and col_def['pkey']) or ('required' in col_def and col_def['required']):
    return True
  return False

def cleanse_to_date(s):
  if (s == ''):
    return ''
  v = util.get_timestamp(s)
  v = util.micro_to_milli(v)
  return v

#----------------------------------------------------------
def delete(master_definition, data_path):
  status = 'RECORD_NOT_FOUND'
  target_pkey = util.get_request_param('pkey', '')
  data_list = get_data_list(data_path)

  new_list = []
  pkey = None
  for i in range(len(data_list)):
    data = data_list[i]
    fields = data.split('\t')
    record = build_record_dict(master_definition, fields)
    pkey = get_pkey_value(master_definition, record)

    if pkey == target_pkey:
      status = 'OK'
    else:
      new_list.append(data)

  if status != 'OK':
    util.send_result_json(status, None)
    return

  commit(data_path, new_list)
  util.send_result_json(status, pkey)

#----------------------------------------------------------
def import_records(scm_name, master_definition, data_path):
  p_start = util.get_request_param('start', '')
  start = 1
  if util.is_int(p_start):
    start = int(p_start)

  result = do_import_records(scm_name, master_definition, data_path, start)

  status = 'OK'
  if result is None:
    status = 'ERR_READ_IMPORT_DATA'

  util.send_result_json(status, result)

def do_import_records(scm_name, master_definition, data_path, start=2):
  start = start - 1
  if start < 0:
    start = 0

  data_list = get_data_list(data_path)

  import_data_path = get_import_data_path(scm_name, master_definition)
  try:
    new_data_list = get_data_list(import_data_path)
  except:
    return None

  count_created = 0
  count_updated = 0
  for i in range(start, len(new_data_list)):
    new_data = new_data_list[i]
    fields = new_data.split('\t')
    new_data = build_record_dict(master_definition, fields)

    pkey = get_pkey_value(master_definition, new_data)

    if record_exists(master_definition, data_list, pkey):
      data_list = update_data(master_definition, data_list, new_data)
      count_updated = count_updated + 1
    else:
      data_list = insert_data(master_definition, data_list, new_data)
      count_created = count_created + 1

  commit(data_path, data_list)

  delete_import_file(import_data_path)

  result = {
    'count_created': count_created,
    'count_updated': count_updated
  }
  return result

def get_dexp_path(scm_name):
  path = util.join_path(BASE_PATH, 'scm/') + scm_name + '/dexp/'
  return path

#----------------------------------------------------------
def get_import_data_path(scm_name, master_definition):
  master_id = master_definition['id']
  idexp_path = get_idexp_path(scm_name)
  import_data_path = idexp_path +  master_id + '.txt'
  return import_data_path

def get_idexp_path(scm_name):
  dexp_path = get_dexp_path(scm_name)
  path = dexp_path + 'inbound/'
  return path

def get_odexp_path(scm_name):
  dexp_path = get_dexp_path(scm_name)
  path = dexp_path + 'outbound/'
  return path

def delete_import_file(import_data_path):
  util.delete_file(import_data_path)

#----------------------------------------------------------
def init_screen(master_definition):
  util.send_result_json('OK', master_definition)

def load_master_definition(scm_name):
  path = get_master_definitin_path(scm_name)
  return util.load_dict(path, {})

def get_master_definitin_path(scm_name):
  return util.join_path(BASE_PATH, 'scm/') + scm_name + '/master.json'

#----------------------------------------------------------
def load_schema_definition_list():
  path = get_schema_definitin_path()
  return util.load_dict(path, {})

def get_schema_definitin_path():
  return 'schemas.json'

#----------------------------------------------------------
def clean_dexp(scm_name):
  base_dir = get_idexp_path(scm_name)
  filename_list = util.list_files(base_dir)
  clean_directory(base_dir, filename_list)

  base_dir = get_odexp_path(scm_name)
  filename_list = util.list_files(base_dir)
  clean_directory(base_dir, filename_list)

  util.send_result_json('OK', None)

def clean_directory(base_dir, filename_list):
  for i in range(len(filename_list)):
    filename = filename_list[i]
    file_path = base_dir + filename
    if filename != 'index.cgi':
      util.delete_file(file_path)

#----------------------------------------------------------
def master_exists(scm_name, master_name):
  all_master_definition = load_master_definition(scm_name)
  if master_name in all_master_definition:
    return True
  return False

#----------------------------------------------------------
def get_data_path(scm_name, master_name):
  data_path = util.join_path(BASE_PATH, 'scm/') + scm_name + '/mst_' + master_name + '/data.txt'
  return data_path

#----------------------------------------------------------
def set_base_path(path):
  global BASE_PATH
  BASE_PATH = path

#----------------------------------------------------------
def exec_batch(batch_name, scm_name, master_name):
  if batch_name == 'import_data':
    result = import_data_batch(scm_name, master_name)
  else:
    result = 'Illegal batch name'
  print(result)

#----------------------------------------------------------
def import_data_batch(scm_name, master_name):
  all_master_definition = load_master_definition(scm_name)

  if not master_name in all_master_definition:
    return 'NO_SUCH_MASTER (' + master_name + ')'

  master_definition = all_master_definition[master_name]
  master_definition['id'] = master_name
  data_path = get_data_path(scm_name, master_name)

  ret = do_import_records(scm_name, master_definition, data_path)
  if ret is None:
    result = 'ERR_READ_IMPORT_DATA'
  else:
    result = 'OK: Created=' + str(ret['count_created']) + ' Updated=' + str(ret['count_updated']) 

  return result

#----------------------------------------------------------
def exec_action():
  scm_name = util.get_request_param('scm', '')
  if scm_name == '':
    util.send_result_json('SCM_ERROR(' + scm_name + ')', None)
    return

  action = util.get_request_param('action', '')
  if action == 'clean_dexp':
    clean_dexp(scm_name)
    return

  master_name = util.get_request_param('master', '')

  all_master_definition = load_master_definition(scm_name)
  master_definition = None

  if not master_name in all_master_definition:
    util.send_result_json('NO_SUCH_MASTER(' + master_name + ')', None)
    return

  master_definition = all_master_definition[master_name]
  master_definition['id'] = master_name
  data_path = get_data_path(scm_name, master_name)

  if action == 'get':
    get_record(master_definition, data_path)
  elif action == 'list':
    get_list(master_definition, data_path)
  elif action == 'create':
    create(master_definition, data_path)
  elif action == 'update':
    update(master_definition, data_path)
  elif action == 'delete':
    delete(master_definition, data_path)
  elif action == 'export':
    export(scm_name, master_definition, data_path)
  elif action == 'import':
    import_records(scm_name, master_definition, data_path)
  elif action == 'upload':
    upload(scm_name, master_definition)
  elif action == 'init':
    init_screen(master_definition)

  elif EXTENSION_ENABLED:
    if action == 'new_delivery':
      mdm_ex.new_delivery(scm_name, master_definition, data_path)
    elif action == 'collect':
      mdm_ex.collect(scm_name, master_definition, data_path)
    elif action == 'delivery':
      mdm_ex.delivery(scm_name, master_definition, data_path)

  else:
    util.send_result_json('NO_SUCH_ACTION(' + action + ')', None)
