from sx126x import sx126x
from continuous_threading import PeriodicThread
from threading import Lock
import json
from shared import *
from config import SEND_DELAY
from serial import Serial
import time
import struct


command_receive_loop_thread = PeriodicThread(RECEIVE_DELAY, command_receive_loop)
command_receive_loop_thread.start()
while True:
    pass

