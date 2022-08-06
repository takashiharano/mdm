import sys
import os

BASE_PATH = '../'

sys.path.append(os.path.join(os.path.dirname(__file__), BASE_PATH))
import mdm

mdm.set_base_path(BASE_PATH)
mdm.exec_batch('import_data', 'schema1', 'product')
