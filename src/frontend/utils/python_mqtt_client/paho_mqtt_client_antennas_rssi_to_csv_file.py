import csv
import random
import paho.mqtt.client as mqtt 
from datetime import datetime
import os
import json

# MQTT Variables
Connected = False           #global variable for the state of the connection
broker_host="mosquitto"    #Broker address
broker_port = 9001          #Broker port
broker_keepalive = 60       #Connection keepalive
user = "username"           #Connection username
password = "password"       #Connection password
topic = "/topic_simulator"  #Subscription topic

# datetime object containing current date and time
now = datetime.now()
# dd-mm-YY_HHMMSS
dt_string = now.strftime("%d-%m-%Y_%H%M%S")
# get current path
current_path = os.path.dirname(os.path.abspath(__file__))
# path to file
path_file = os.path.join(current_path, "results")
# input (prompt) number of antennas columns in header
nr_antennas = input("Enter the number of received signal Antennas: ")
# input (prompt) path loss Expoent of antennas to filename
pathLossExpoent = input("Enter the path Loss Expoent (n) of received signal Antennas: ")
# input (prompt) txPower of antennas to filename
txPower = input("Enter the TxPower [dBm] of received signal Antennas: ")
# input (prompt) standard deviation of gaussian distribuition
Xsigma = input("Enter the Gaussian Distribuition parameter (X\u03C3): ")
# input (prompt) standard deviation of gaussian distribuition
sigma = input("Enter the standard deviation (\u03C3) 'skew index' of gaussian distribuition: ")
# input (prompt) # of animation to filename
animation = input("Enter the # of animation: ")
# header row of the csv file
header  = []
# set header columns
for i in range(int(nr_antennas)):
    header += ['RSSI_Antenna_'+str(i+1)]
header += ['AssetPoint_Longitude' , 'AssetPoint_Latitude']
# csv filename
filename = os.path.join(path_file, "rssi_antennas_" + dt_string + "_Ant#" + nr_antennas + "_n" + pathLossExpoent + "_TxPwr" + txPower + "_Xsigma" + Xsigma +"_sigma" + sigma + "_Anim#" + animation + ".csv")

########## MQTT functions ##########
# return codes:
# 0: Connection successful
# 1: Connection refused – incorrect protocol version
# 2: Connection refused – invalid client identifier
# 3: Connection refused – server unavailable
# 4: Connection refused – bad username or password
# 5: Connection refused – not authorised
# 6-255: Currently unused.

# Define on connect event function
# We shall subscribe to our Topic in this function
def on_connect(client, obj, flags, rc):
    global topic
    if rc == 0:
        print(str(client._client_id.decode("utf-8"))+" is connected to MQTT Broker, with return code: " + str(rc))
        global Connected                #Use global variable
        Connected = True                #Signal connection
        
        # Subscribe the topic
        print("Subscribing to topic: ", topic)
        client.subscribe(topic, 0)
    else:
        print("Failed to connect, with return code: " + str(rc))

# Define on_message event function. 
# This function will be invoked every time,
# a new message arrives for the subscribed topic
def on_message(client, obj, message):
    global csv_writer 

    array_data = []
    received_data = message.payload.decode("utf-8")
    jsonData = json.loads(received_data.replace("\'", "\""))

    print("Message received: ", jsonData,
            " | topic=",message.topic,
            " | qos=",message.qos,
            " | retain flag=",message.retain)

    if jsonData["from"] == "backend":
        rssi_values = jsonData["rssi"]
        coordinates = jsonData["ap-coords"]
                
        for i in range(int(nr_antennas)):
            array_data.append(rssi_values[i])
        
        array_data.extend((
            coordinates[0][0],
            coordinates[0][1]
        ))

        # write the data
        csv_writer.writerow(array_data)
        csv_file.flush()
    
# Define on_subscribe event function.
def on_subscribe(client, obj, mid, granted_qos):
 print("Subscribed to topic: " + topic +
  " | mid: "+ str(mid) + " | QoS: " + str(granted_qos))

# Define on_publish event function.
def on_publish(client, obj, mid):
    print("mid: " + str(mid))

# Define on_log event function.
def on_log(client, obj, level, string):
    print(string)

# Define on_disconnect event function.
def on_disconnect(client, userdata, rc):
    if (rc != 0):
        global Connected                #Use global variable
        Connected = False               #Signal connection
        print(str(client._client_id.decode("utf-8"))+ " was unexpected disconnected. Will auto-reconnect. Return code: " + str(rc))

########## End of MQTT functions ##########

# Create a MQTT client
print("Creating new client instance...")
randomInt = random.randint(1,10000)
mqtt_client = mqtt.Client("clientPython-"+str(randomInt), transport="websockets") #create new instance websockets
mqtt_client.username_pw_set(user, password=password)    #set username and password

# Assign event callbacks
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message 
mqtt_client.on_subscribe = on_subscribe
mqtt_client.on_publish = on_publish
mqtt_client.on_disconnect = on_disconnect

# Uncomment to enable debug messages
#client.on_log = on_log

# Connect with MQTT Broker
print(f"Connecting to broker 'ws://{broker_host}:{broker_port}/mqtt'")
mqtt_client.connect(broker_host, broker_port, broker_keepalive) #connect to broker
   
#with open(filename, 'w', encoding='UTF8', newline='') as csvfile:
csv_file = open(filename, 'w', encoding='UTF8', newline='')
# creating a csv writer object
csv_writer = csv.writer(csv_file, lineterminator='\n')
# write the header
csv_writer.writerow(header)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
mqtt_client.loop_forever()
# Non blocking : client.loop_start()  #N.B. need a while True: statement

# client.loop_start()
# client.loop_stop()
# not called
print("Createad a csv file with name: ", filename)
csv_file.close()
