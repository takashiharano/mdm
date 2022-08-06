import sys
import os

BASE_PATH = '../'

sys.path.append(os.path.join(os.path.dirname(__file__), BASE_PATH))
import mdm

def get_arg(n, default=''):
    if n >= len(sys.argv):
        return default
    return sys.argv[n]

def main():
    batch_name = get_arg(1)
    schema_name = get_arg(2)
    master_name = get_arg(3)

    if batch_name == '' or schema_name == '' or master_name == '':
        print('Usage: python batch_exec.py <BATCH_NAME> <SCHEMA_NAME> <MASTER_NAME>')
        return

    mdm.set_base_path(BASE_PATH)
    mdm.exec_batch(batch_name, schema_name, master_name)

if __name__ == '__main__':
    main()
