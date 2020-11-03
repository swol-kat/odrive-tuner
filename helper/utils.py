import sys
import time
import threading
import platform
import subprocess
import os
from fibre.utils import Event
import odrive.enums
from odrive.enums import *


def dump_errors(odrv, clear=False):
    axes = [(name, axis) for name, axis in odrv._remote_attributes.items() if 'axis' in name]
    axes.sort()
    s = ''
    for name, axis in axes:
        s += name + '\n'
        # Flatten axis and submodules
        # (name, remote_obj, errorcode)
        module_decode_map = [
            (name, odrv, {k: v for k, v in odrive.enums.__dict__ .items() if k.startswith("AXIS_ERROR_")}),
            ('motor', axis, {k: v for k, v in odrive.enums.__dict__ .items() if k.startswith("MOTOR_ERROR_")}),
            ('encoder', axis, {k: v for k, v in odrive.enums.__dict__ .items() if k.startswith("ENCODER_ERROR_")}),
            ('controller', axis, {k: v for k, v in odrive.enums.__dict__ .items() if k.startswith("CONTROLLER_ERROR_")}),
        ]
        
        # Module error decode
        for name, remote_obj, errorcodes in module_decode_map:
            prefix = ' '*2 + name.strip('0123456789') + ": "
            if not hasattr(remote_obj, name):
                s += (prefix  + "not found" + '\n')
            elif getattr(remote_obj, name).error != 0:
                foundError = False
                s += (prefix  + "Error(s):" + '\n' )
                errorcodes_dict = {val: name for name, val in errorcodes.items() if 'ERROR_' in name}
                for bit in range(64):
                    if getattr(remote_obj, name).error & (1 << bit) != 0:
                        s += ("    " + errorcodes_dict.get((1 << bit), 'UNKNOWN ERROR: 0x{:08X}'.format(1 << bit)) +'\n')
                if clear:
                    getattr(remote_obj, name).error = 0
            else:
                s += (prefix  + "no error"  + '\n')
        
    return s