#!python
#!/usr/bin/python3

import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), './py'))
import mdm

#----------------------------------------------------------
def main():
    mdm.web_process()

if __name__ == '__main__':
    main()
