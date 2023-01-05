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
# input (prompt) number of antennas columns in header
nr_anchors = input("Enter the number of received signal Anchors: ")

# header row of the csv file
header  = []
# set header columns
for index_i in range(int(nr_antennas)):
    label_ant = 'Antenna'
    header += [
        'AP1_280_'+label_ant+str(index_i+1), 
        'AP1_290_'+label_ant+str(index_i+1), 
        'AP1_300_'+label_ant+str(index_i+1)]
for index_j in range(int(nr_anchors)):
    for index_k in range(int(nr_antennas)):
        label_anch = 'Anchor'
        header += [
            label_anch+str(index_j+1)+'_280_' + label_ant+str(index_k+1), 
            label_anch+str(index_j+1)+'_290_' + label_ant+str(index_k+1), 
            label_anch+str(index_j+1)+'_300_' + label_ant+str(index_k+1)]
for index_i in range(int(nr_antennas)):
    label_ant = 'Antenna'
    header += ['AP1_distance_'+label_ant+str(index_i+1)]

header += [
    'AP1_Longitude' , 
    'AP1_Latitude'
    ]
# csv filename
filename = os.path.join(path_file, "antennas_multi_features_" + dt_string + "_Ant#" + nr_antennas + ".csv")

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
    """
    on_connect method - Define MQTT on_connect event function. We shall subscribe to our Topic in this function.

    Args:
        client: The client object
        obj: The connection object 
        flags: The connection flags
        rc: The return code
    """
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
    """
    on_message method - Define MQTT on_message event function. This function will be invoked every time a new message arrives for the subscribed topic

    Args:
        client: The client object
        obj: The connection object 
        message: The message in MQTT transit communication
    """

    global csv_writer 
    array_data = []
    received_data = message.payload.decode("utf-8")
    jsonData = json.loads(received_data.replace("\'", "\""))

    print("Message received: ", jsonData,
            " | topic=",message.topic,
            " | qos=",message.qos,
            " | retain flag=",message.retain)

    if jsonData["from"] == "backend":
        activations_values = jsonData["ap-activ"]
        anch_activations_values = jsonData["anch-activ"]
        ap_distance_values = jsonData["ap-dist"]
        ap_coordinates = jsonData["ap-coords"]      
        
        for i in range(len(activations_values)):
            for j in range(len(activations_values[i])):
                for k in range(len(activations_values[i][j])):
                    array_data.append(activations_values[i][j][k])

        for i in range(len(anch_activations_values)):
            for j in range(len(anch_activations_values[i])):
                for k in range(len(anch_activations_values[i][j])):
                    array_data.append(anch_activations_values[i][j][k])

        for i in range(len(ap_distance_values)):
            for j in range(len(ap_distance_values[i])):
                    array_data.append(ap_distance_values[i][j])

        array_data.extend((
            ap_coordinates[0][0],
            ap_coordinates[0][1]
        ))

        # write the data
        csv_writer.writerow(array_data)
        csv_file.flush()

# Define on_subscribe event function.
def on_subscribe(client, obj, mid, granted_qos):
    """
    on_subscribe method - Define MQTT on_subscribe event function.

    Args:
        client: The client object
        obj: The connection object 
        mid: The message id in MQTT transit communication
        granted_qos: The Granted Quality of Service 
    """
    print("Subscribed to topic: " + topic +
            " | mid: "+ str(mid) + " | QoS: " + str(granted_qos))

# Define on_publish event function.
def on_publish(client, obj, mid):
    """
    on_publish method - Define MQTT on_publish event function.

    Args:
        client: The client object
        obj: The connection object 
        mid: The message id in MQTT transit communication
    """
    print("mid: " + str(mid))

# Define on_log event function.
def on_log(client, obj, level, string):
    """
    on_log method - Define MQTT on_log event function.

    Args:
        client: The client object
        obj: The connection object 
        level: The level of detail log
        string: The log string message
    """
    print(string)

# Define on_disconnect event function.
def on_disconnect(client, userdata, rc):
    """
    on_disconnect method - Define MQTT on_disconnect event function.

    Args:
        client: The client object
        userdata: The connection userdata 
        rc: The return code
    """
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
