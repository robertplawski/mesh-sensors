from datetime import datetime
from typing import Dict,List
from itertools import count
import os
from collections import defaultdict
from continuous_threading import PeriodicThread
from threading import Lock, Thread
import uvicorn
import json
import time
import struct
import sqlite3

from config import RECEIVE_DELAY, PASSWORD, SEND_DELAY
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from shared import *


DB_PATH = "telemetry.db"


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    #@conn.execute("""
    #CREATE TABLE IF NOT EXISTS tasks (
    #    id INTEGER PRIMARY KEY AUTOINCREMENT,
   # """)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS received (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER,
        server_timestamp INTEGER,
        temperature REAL,
        humidity REAL,
        pressure REAL,
        gas REAL,
        voc REAL,
        co2 REAL,
        name TEXT,
        lat REAL,
        lon REAL,
        node_id INTEGER,
        rssi INTEGER,
        frequency INTEGER,
        mode TEXT,
        motor BOOLEAN,
        buzzer BOOLEAN,
        motion BOOLEAN

    )
    """)

    conn.execute("""
    CREATE INDEX IF NOT EXISTS idx_server_timestamp
    ON received(server_timestamp)
    """)

    conn.commit()
    conn.close()


def insert_record(data):
    print(f"INSERTING {data}")
    conn = get_db()

    lat = None
    lon = None
    if not data:
        return
    lat = data.get("lat")
    lon = data.get("lon")
    rssi = data.get("rssi")
    frequency = data.get("frequency")

    print("DATA", data)
    conn.execute("""
        INSERT INTO received (
            timestamp, server_timestamp, temperature, humidity, pressure, gas, voc, co2,
            name, lat, lon, node_id, rssi, frequency, mode, motor, buzzer, motion 
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("timestamp"),
        data.get("server_timestamp"),
        data.get("temperature"),
        data.get("humidity"),
        data.get("pressure"),
        data.get("gas"),
        data.get("voc"),
        data.get("co2"),
        data.get("name"),
        lat,
        lon,
        data.get("node_id"),
        rssi,
        frequency,
        data.get("mode"),
        data.get("motor"),
        data.get("buzzer"),
        data.get("motion")
    ))

    print(data.get("server_timestamp"))
    conn.commit()
    conn.close()



init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/all_node_names")
def get_all_node_names():
    conn = get_db()

    rows = conn.execute("""
        SELECT DISTINCT name 
        FROM received 
    """).fetchall()

    records = [r["name"] for r in rows]
    records = [r for r in records if r]

    conn.close()
    return records

@app.get("/api/latest")
def get_latest():

    conn = get_db()

    rows = conn.execute("""
SELECT *
FROM received
WHERE server_timestamp = (
    SELECT MAX(server_timestamp)
    FROM received
);
    """).fetchall()

    records = [dict(r) for r in rows]

    conn.close()

    if not records:
        return {}

    # keep only newest record per node
    latest_per_node = {}

    for r in records:
        name = r["name"]
        r["coordinates"] = [r["lat"],r["lon"]]
        if name not in latest_per_node:
            latest_per_node[name] = r

    latest_group = list(latest_per_node.values())

    coords = [(r["lat"], r["lon"]) for r in latest_group if r["lat"] and r["lon"]]

    avg_lat = sum(c[0] for c in coords) / len(coords)
    avg_lon = sum(c[1] for c in coords) / len(coords)

    avg_temperature = sum(r["temperature"] for r in latest_group) / len(latest_group)
    avg_humidity = sum(r["humidity"] for r in latest_group) / len(latest_group)
    avg_pressure = sum(r["pressure"] for r in latest_group) / len(latest_group)

    avg_gas = sum(r["gas"] for r in latest_group) / len(latest_group)

    avg_voc = sum(r["voc"] for r in latest_group) / len(latest_group)
    avg_co2 = sum(r["co2"] for r in latest_group) / len(latest_group)
    
    server_timestamp =  max(r["server_timestamp"] for r in latest_group)

    if int(time.time()) - server_timestamp > 300:
        # DING DONG SOMETHINGS WRONG
        pass 
        

    result = {
        "server_timestamp":server_timestamp,
        "avg_lat": avg_lat,
        "avg_lon": avg_lon,
        "avg_temperature": round(avg_temperature, 2),
        "avg_humidity": round(avg_humidity, 2),
        "avg_pressure": round(avg_pressure*10, 2),
        "avg_gas": round(avg_gas,2),
        "avg_voc":round(avg_voc,2),
        "avg_co2":round(avg_co2,2),
        "count": len(latest_group),
        "records": latest_group
    }

    return result

def aggregate_array(arr: List[Dict[str, float]], target_length: int) -> List[Dict[str, float]]:
    chunk_size = len(arr) // (target_length)
    aggregated = []

    for i in range(target_length):
        chunk = arr[i * chunk_size:(i + 1) * chunk_size]
        aggregated_dict = {}
        keys = set().union(*chunk)
        for key in keys:
            values = [item[key] for item in chunk if key in item]
            if values:
                aggregated_dict[key] = sum(values) / len(values)
        aggregated.append(aggregated_dict)

    return aggregated


@app.get("/api/chart/{key}")
def get_chart(key:str, seconds: int =3600,n=50):

    if key not in ["humidity", "temperature", "pressure","gas","voc","co2"]:
        return []


    conn = get_db()

    rows = conn.execute("""
   SELECT *
FROM received
WHERE server_timestamp >= strftime('%s','now') - ? 
ORDER BY server_timestamp ASC;    """, (seconds,)).fetchall()

    records = [dict(r) for r in rows]

    grouped = defaultdict(list)

    for record in records:
        grouped[record["server_timestamp"]].append(record)

    result = []

    for ts, recs in grouped.items():
        entry = {
            "timestamp": ts
        }

        multiplier = 10 if key == "pressure" else 1
        for rec in recs:
            entry[rec["name"]] = round(rec[key] * multiplier, 2)


        avg_val = sum(rec[key] * multiplier for rec in recs) / len(recs)
        entry["average"] = round(avg_val, 2)

        result.append(entry)

    conn.close()

    aggregated = aggregate_array(result,min(n,len(result)))
    try:
        return aggregated
    except:
        return []

@app.get("/api/received")
def get_received():

    conn = get_db()

    rows = conn.execute("""
        SELECT *
        FROM received
        ORDER BY server_timestamp DESC
    """).fetchall()

    records = [dict(r) for r in rows]

    conn.close()

    return {"records": records}


def insert_to_db(timestamp,last_response=None):
    try:
        if not last_response:
            if len(responses) > 0:
                last_response = responses.pop()
        if last_response:
            sensor_data = sensor_csv_to_json(last_response["payload"]["command"])
            merged = sensor_data | last_response["payload"] | last_response 
            merged["server_timestamp"] = timestamp #int(time.time())
            merged["timestamp"] = timestamp #int(time.time())
            insert_record(merged)
            #print(bool(int(bool(merged["buzzer"]))),"buzz")
            #merged["buzzer"] = #bool(merged["buzzer"].strip(" "))
            #merged["motor"] = #bool(merged["motor"].strip(" "))
            
            return merged
    except Exception as e:
        print(f"INSERT TO DB ERROR {e}")

from pydantic import BaseModel

class LoginRequest(BaseModel):
    password: str

class SendCommandRequest(LoginRequest):
    command: str
    address: int

@app.post("/api/send_command")
async def api_send_command(sendCommandRequest: SendCommandRequest):
    if sendCommandRequest.password != PASSWORD:
        return {"success":False, "message":"Invalid password"}
    try:
        send_command(sendCommandRequest.command,False,0,sendCommandRequest.address,False)
        return {"success":True}
        #result = blocking_send_command(command,addr,False,0)
        #sensor_data = sensor_csv_to_json(result["payload"]["command"])
        #merged = sensor_data | result["payload"] | result
        #merged["server_timestamp"] = timestamp #int(time.time())
        #merged["timestamp"] = timestamp #int(time.time())
        #return merged
    except:
        return {"success":False,"message":"Error sending command"}


@app.post("/api/login")
def login(loginRequest: LoginRequest):
    if loginRequest.password == PASSWORD:
        return {"success":True}
    else:
        return {"success":False}


def command_send_loop():
    while True:
        current_cmd_id = 0 
        send_command("sensors,read",False,0,1,True)
        i = 0
        while True:
            latest = command_receive_loop()
            if i > 1:
                send_command("sensors,read",False,0,1,True)
            if latest:
                break
            time.sleep(3)
            i+=1
        
        try:
            timestamp = int(time.time())
            records = []

            local_sensor_data = read_local_sensor()
            if local_sensor_data:
                local_command = unpack_command(pack_command(local_sensor_data,True,1))
                local_request = {"payload":local_command}
                records.append(insert_to_db(timestamp))
                local_record = insert_to_db(timestamp,local_request)
                local_record["node_id"] = NODE_ID
                records.append(local_record)
            else:
                records.append(insert_to_db(timestamp))


            for record in records:
                gas_thresh = 30_000
           
                if record["gas"] < gas_thresh and record["node_id"] == 1 and not record["buzzer"]: 
                    send_command("buzzer,800",False,0,1,False)
                    send_command("motor,on",False,0,0,False)
                if record["gas"] >= gas_thresh and record["node_id"] == 1 and record["buzzer"]: 
                    send_command("buzzer,0",False,0,1,False)
                    send_command("motor,off",False,0,0,False)

            
                """
                cmd_to_send =  None
                co2_thresh = 600

                if record["co2"] > co2_thresh and not bool(record["buzzer"]):
                    cmd_to_send="buzzer,800"
                if record["co2"] <= co2_thresh and bool(record["buzzer"]):
                    cmd_to_send="buzzer,0"

                if cmd_to_send:
                    send_command(cmd_to_send,False,0,record["node_id"],False)
                    time.sleep(1)

                cmd_to_send = None
                temp_thresh = 24
                if record["temperature"] > temp_thresh and not record["motor"]:
                    cmd_to_send="motor,on"
                if record["temperature"] <= temp_thresh and record["motor"]:
                    cmd_to_send="motor,off"
                    
                if cmd_to_send:
                    send_command(cmd_to_send,False,0,record["node_id"],False)
                """

        except Exception as e:
            print(f"SEND LOOP ERROR {e}")

if __name__ == "__main__":
    command_send_loop_thread = Thread(target=command_send_loop)
    command_send_loop_thread.start()

    uvicorn.run("server:app", host="0.0.0.0", port=8000)
