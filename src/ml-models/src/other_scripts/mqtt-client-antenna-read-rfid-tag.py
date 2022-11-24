from multiprocessing.connection import wait
import random
from matplotlib import rc
import paho.mqtt.client as mqtt 
from datetime import datetime
import time
import queue
import json

wait_queue = queue.Queue()
power = 0
f = None

# input (prompt) distance of tag to antenna in centimeters
distance = input("Enter the distance of tag to antenna (in meters): ")

# Define on connect event function
# We shall subscribe to our Topic in this function
def on_connect(client, obj, flags, rc):
    wait_queue.put(rc) # Signal connection
    
    if rc == 0:
        print(str(client._client_id.decode("utf-8"))+" is connected to MQTT Broker, with return code: " + str(rc) +"\n")
    
        print("Subscribing topic: '#'")
        mqtt_client.subscribe("#", 0)
    else:
        print("Failed to connect, with return code: " + str(rc))

# Define on_message event function. 
# This function will be invoked every time,
# a new message arrives for the subscribed topic
def on_message(client, obj, message):
    global power
    global f

    received_data = message.payload.decode("utf-8")

    if f is not None:
        # datetime object containing current date and time
        now = datetime.now()
        msg = f"{now.timestamp()}, {message.topic}, {received_data}"
        
        print(f"power={power}, {msg}")
        f.write(msg+"\n")

    if "scan stopped" in received_data or 'no response' in received_data:
        wait_queue.put("stop")

# Define on_subscribe event function.
def on_subscribe(client, obj, mid, granted_qos):
    print("Subscribed to topic sucessfully."  +
        " | mid: "+ str(mid) + " | QoS: " + str(granted_qos))

# Define on_disconnect event function.
def on_disconnect(client, userdata, rc):
    if (rc != 0):
        print(str(client._client_id.decode("utf-8"))+ " was unexpected disconnected. Will auto-reconnect. Return code: " + str(rc))
        
    wait_queue.put(rc) # Signal connection

# MQTT Variables
broker_host="83.240.189.154"    # Broker address
broker_port = 9001              # Broker port
broker_keepalive = 60           # Connection keepalive
username = "sdrt_it"                # Connection username
password = "gd?6LJJz+x!+LnWm"   # Connection password

antenna_power_set_topic = "sdrt-health/mac:02010b41cdec/antenna/power/set" # Publish topic
antenna_tag_scan_topic = "sdrt-health/mac:02010b41cdec/antenna/tag/scan" # Publish topic

# Create a MQTT client
print("Creating new client instance...")
randomInt = random.randint(1,10000)
mqtt_client = mqtt.Client("Python_MQTT_Client_"+str(randomInt), transport="websockets") #create new instance websockets
mqtt_client.username_pw_set(username, password=password)    #set username and password

# mqtt loop start
mqtt_client.loop_start()

# Assign event callbacks
mqtt_client.on_connect = on_connect
mqtt_client.on_subscribe = on_subscribe
mqtt_client.on_message = on_message 
mqtt_client.on_disconnect = on_disconnect

# Uncomment to enable debug messages
#client.on_log = on_log

# Connect with MQTT Broker
print(f"Connecting to broker 'ws://{broker_host}:{broker_port}/mqtt'")
mqtt_client.connect(broker_host, broker_port, broker_keepalive) #connect to the broker

print("Waiting for connection...")
r = wait_queue.get()
if r != 0:
    print("Unable to connect: ", r)
    import sys
    sys.exit(0)

# set power value (decreasing 300 to 100, step = -10)
for power in range(300, 90, -10):
    # set iteration value (increasing 1 to 3, step = 1)
    for iteration in range(1,4):
        # set filename
        filename = f"dist_{distance}_pwr_{power}_iter_{iteration}.csv"
        
        # Opening the file
        print("Opening the file '" + filename + "'")
        f = open(filename, "w")
        
        # Publish to topic
        print("Set power:", power)
        mqtt_client.publish(antenna_power_set_topic, json.dumps(dict(power=power)))
        wait_queue.get()
        
        # Wait 5 seconds beafore scanning
        print("Wait 5 seconds...")
        time.sleep(5)
        
        # Publish to topic
        print("Starting scan for 60 seconds...")
        mqtt_client.publish(antenna_tag_scan_topic, json.dumps(dict(time=60000)))
        wait_queue.get()
        
        # Closing the file
        print("Closing the file '"+ filename +"'")
        f.close()

# mqtt loop stop
mqtt_client.loop_stop()
print("All done")

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
# Non blocking : client.loop_start()  #N.B. need a while True: statement
# mqtt_client.loop_forever()
# mqtt_client.loop_start()
# mqtt_client.loop_stop()

