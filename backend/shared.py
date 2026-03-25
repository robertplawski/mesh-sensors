from serial import Serial
from itertools import count
import os
from continuous_threading import PeriodicThread
from config import NAME,LAT,LON,MODE,RECEIVE_DELAY,SEND_DELAY,NODE_ID
import json
import struct
import time

from sx126x import sx126x

node = sx126x(
    serial_num="/dev/ttyS0",
    freq=868,
    addr=NODE_ID,
    power=22,
    rssi=True,
    air_speed=2400,
    relay=False
)


ARDUINO_SERIAL_PORT = "/dev/ttyACM0"
ARDUINO_BAUD_RATE = 9600

try:
    serial =Serial(ARDUINO_SERIAL_PORT, ARDUINO_BAUD_RATE, timeout=1)
except:
    print("[ERROR] ARDUINO NOT CONNECTED")

header_line = "temperature,humidity,pressure,gas,voc,co2,motor,buzzer,motion,armed"
headers = header_line.split(",")



#def pack_with_rpc(payload):
#    header = struct.pack(RPC_HEADER_FORMAT, 1, 1 ,1)
#    return header + payload
                         #                         pass

##def pack_data(data: dict, call_type: str = "sensor"):
#    if call_type == "sensor":
#        payload = pack_sensor_data(data)
#        return pack_with_rpc(payload)
    
#def unpack_data(data: bytes, call_type: str = "sensor"):
#    if call_type == "sensor":
#        payload = unpack_with_rpc(data)
#        return unpack_sensor_data(payload)
    



"""
def unpack_data(data: bytes):
    sensor, timestamp, temperature, humidity, pressure,gas,voc,co2, name, lat, lon = struct.unpack(">?Lfffddd8sdd", data)
    return {
        "sensor": sensor,
        "timestamp": timestamp,
        "temperature": temperature,
        "humidity": humidity, 
        "pressure": pressure, 
        "gas":gas,
        "voc":voc,
        "co2":co2,
        "name": name.decode().strip().replace('\u0000', ''),
        "coordinates": [lat, lon]
    }

def pack_data(data: dict, sensor= True):
    return struct.pack(
        ">?Lfffddd8sdd",
        sensor,
        int(time.time()),
        data["temperature"],
        data["humidity"],
        data["pressure"],
        data["gas"],
        data["voc"],
        data["co2"],
        data["name"].encode() if "name" in data else NAME.encode(), 
        LAT,
        LON
    )
"""


def sensor_csv_to_json(line: str):
    timestamp = int(time.time())

    values = line.split(",")

    data = dict(zip(headers, values))

    # Optional: convert numeric fields
    for key in data:
        if not key in ["buzzer","motor","armed","motion"]:
            data[key] = float(data[key])
        else:
            data[key] = (data[key] == "True" or data[key] == '1') # bool(int(data[key]))

    data["pressure"] = data["pressure"]# * 10
    data["mode"] = "client" #mode 
    return data


def local_read_serial(mode="client",timestamp=int(time.time())):
    line = serial.readline().decode().strip()

    data = sensor_csv_to_json(line)

    #data = unpack_data(pack_data(data))
    #print(data)

    data["server_timestamp"] =  timestamp
    print(f"[LOG] {str(line)} ")
    print(f"[LOG] Local data: {str(data)}")

    return data 

"""
def receive_loop():
    try:
        receive = node.receive()
        timestamp = int(time.time())

        if receive:
            print(f"[LOG] Received {len(receive)} bytes")
            print(f"[LOG] Received data {str(receive)}")

            unpacked_data = unpack_data(receive["payload"])

            print(f"[LOG] Unpacked data: {str(unpacked_data)}")

            unpacked_data["node_id"] = receive["node_id"]
            unpacked_data["rssi"] = receive["rssi"]
            unpacked_data["frequency"] = receive["frequency"]
            unpacked_data["mode"] = "client"
            unpacked_data["server_timestamp"] = timestamp 
            
            return unpacked_data

    except Exception as e:
         print(f"[Error] {e}")
"""

def local_execute_command_on_arduino(command:str):
    serial.write(f"{command}\n".encode())
    return serial.readline().decode()

def read_local_sensor():
    try:
        return local_execute_command_on_arduino("sensors,read")
    except Exception as e:
        print(f"[LOCAL SENSOR ERROR] {e}")


responses = []
cmd_id = 0  #count(0)

SENSOR_FORMAT = "!ffffff????"
COMMAND_FORMAT = "!??h8sdd32s"

def pack_payload(payload, cmd_type: int):
    # 0 raw 1 sensor
    if cmd_type == 0:
        return payload.encode()
    if cmd_type == 1:
        sensor_data = sensor_csv_to_json(payload)
        return struct.pack(SENSOR_FORMAT,sensor_data["temperature"],sensor_data["humidity"],sensor_data["pressure"],sensor_data["gas"],sensor_data["voc"],sensor_data["co2"],sensor_data["motor"],sensor_data["buzzer"],sensor_data["motion"],sensor_data["armed"]) 

def unpack_payload(payload,cmd_type:int = 0):
    if cmd_type == 0:
        return payload.decode().strip("\x00")
    if cmd_type == 1: 
        temperature, humidity, pressure, gas, voc, co2, motor, buzzer,motion,armed = struct.unpack(SENSOR_FORMAT,payload[0:struct.calcsize(SENSOR_FORMAT)])
        #motor = bool(motor)
        #buzzer = bool(buzzer)
        #motion = bool(motion)
        #armed = #bool(armed)
        arr = [temperature,humidity,pressure,gas,voc,co2,motor,buzzer,motion,armed]
        print(f"UNPACKED ARR {arr}")
        return ",".join([str(a) for a in arr])#str(arr).strip("[").strip("]").replace("'","").replace(", ",",") # ",".join(arr)



def pack_command(command: str,is_response = False,cmd_id=0,need_response=True):
    return struct.pack(COMMAND_FORMAT,is_response,need_response,cmd_id, NAME.encode(), LAT, LON, pack_payload(command,cmd_id) )

def unpack_command(data:bytes):
    is_response,need_response,cmd_id, name, lat, lon, command = struct.unpack(COMMAND_FORMAT, data)
    
    #print(command,cmd_id)
    
    return {"cmd_id":cmd_id,"need_response":need_response if not is_response else False, "is_response":is_response,"name":name.decode().strip("\x00"),"lat":lat,"lon":lon,"command":unpack_payload(command,cmd_id)}


def send_command(command:str, is_response=False,cmd_id=0,address:int = 0, need_response=True, frequency:int = 868):
    print(f"[SEND_COMMAND] Sending command {command} {cmd_id} to address {address} frequency {frequency}")
    if address == NODE_ID:
        result = local_execute_command_on_arduino(command)
        data = unpack_command(pack_command(result,True,1))
        responses.append(data)
    else:
        packed_command = pack_command(command,is_response,cmd_id,need_response)
        node.send_bytes(address,frequency,packed_command)
    time.sleep(1)

def execute_command_on_arduino(command:str,cmd_id:int,need_response=True):
    try: 
        result = local_execute_command_on_arduino(command)
        if need_response:
            send_command(result, True, 1)

    except Exception as e:
        print(f"[EXECUTE_ARDUINO_ERROR] {e}")

   

def command_receive_loop():
    try:
        data = node.receive()

        if data:
            payload = data["payload"]
            unpacked_data = unpack_command(payload)
            #data["payload"] = unpadata["payload"] #unpack_payload(data["payload"],"sensor" if unpacked_data["is_response"] else "string")
            command = unpacked_data['command'] 
            cmd_id = unpacked_data["cmd_id"]
            data["payload"] = unpacked_data

            if unpacked_data["is_response"]:
                print(f"[RECEIVE_RESPONSE] {cmd_id} Received response from {unpacked_data['name']} {unpacked_data['command']}")
                responses.append(data)

            if not unpacked_data["is_response"]:
                print(f"[RECEIVE_COMMAND] {cmd_id} Received command from {unpacked_data['name']} at addr {data['node_id']} {unpacked_data['command']}")
                if command == "reboot":
                    os.system("sudo reboot")
                    return

                
                execute_command_on_arduino(command,1,unpacked_data["need_response"])
            return data
                
    except Exception as e:
        print(f"[COMMAND_RECEIVE_LOOP_ERROR] {e}")

def json_from_csv(csv: str):
    values = csv.split()


def blocking_send_command(command:str, address:int,response=False,current_id=0):
    send_command(command,response,current_id,address)
    retries = 0
    max_retries = 10
    while not response:
        latest = command_receive_loop()
        if latest["payload"]["is_response"]:
            return latest
  
        if retries > 5:
            send_command(command,response,current_id,address)

        if retries > max_retries:
            break

        retries+=1
        time.sleep(2)


