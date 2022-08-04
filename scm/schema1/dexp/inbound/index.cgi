#!python
#!/usr/bin/python3.6

import os
import sys

ROOT_PATH = '../../../../../'
AUTH_REQUIRED = True
ALLOW_GUEST = True

sys.path.append(os.path.join(os.path.dirname(__file__), ROOT_PATH + 'libs'))
import util

util.append_system_path(__file__, ROOT_PATH)
util.append_system_path(__file__, ROOT_PATH + 'websys/bin')
import web
import dirlist
import file

#----------------------------------------------------------
# main
#----------------------------------------------------------
def main():
  web.set_root_path(ROOT_PATH)
  file_path = util.get_request_param('file')
  if file_path is None:
    dirlist.dir_list(ROOT_PATH, __file__, auth_required=AUTH_REQUIRED)
  else:
    file.main(ROOT_PATH, file_path, allow_guest=ALLOW_GUEST)

if __name__ == '__main__':
  main()
