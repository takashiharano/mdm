#!python
#!/usr/bin/python3.6

import os
import sys

ROOT_DIR = '../'
sys.path.append(os.path.join(os.path.dirname(__file__), ROOT_DIR + 'libs'))
import util

APP_ROOT_DIR = './'
sys.path.append(os.path.join(os.path.dirname(__file__), APP_ROOT_DIR))
import mdm

#----------------------------------------------------------
def main():
    mdm.exec_action()

if __name__ == '__main__':
    main()
