# Predictor agent that: 
# subscribes to mqtt toppic 
# gets the rssi values and the model to use
# predicts and publishes the coordinates

import random
import paho.mqtt.client as mqtt 
import math
import pickle
import pandas as pd
import json
import threading
import queue
import argparse
import numpy as np
from collections import deque
from keras.models import load_model
from keras import backend as K

parser = argparse.ArgumentParser(description="Predicts the location of a tag based on rssi values.")
parser.add_argument("--models", nargs="?", type=str, default="somos_saude", help="Enter the name of the models dir. default = somos_saude")
models_dir = parser.parse_args().models

algorithms = ["fp_rf", "fp_dt", "fp_rnn"]
q = queue.Queue() # backend messages

previous_pos_iterations = 5 
previous_pos_values = deque(maxlen=previous_pos_iterations)  # sequences used for future prediction

def worker():
    while True:
        item = q.get()
        predict(item[0], item[1])
        q.task_done()

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

def metres_to_degrees(metres):
    return (metres * 360) / (2 * math.pi * 6371000)

def root_mean_squared_error(y_true, y_pred):
        return K.sqrt(K.mean(K.square(y_pred - y_true)))

lng_min = degrees_to_metres(-8.501361269440)
lng_max = degrees_to_metres(-8.500934076175)
lat_min = degrees_to_metres(40.896868043845)
lat_max = degrees_to_metres(40.897262711423)

def min_max_scale(val, min_val, max_val):
    val = (val-min_val)/(max_val-min_val)
    return val

def reverse_min_max_scale(val, min_val, max_val):
    val = (val * (max_val-min_val))+min_val
    return val

def get_avr_rssi(d):
    return_dict = {}
    for iter in d:
        for col in iter:
            if col in return_dict:
                return_dict[col] += float(iter[col])
            else:
                return_dict[col] = float(iter[col])
    for col in return_dict:
        return_dict[col] = return_dict[col] / len(d)
    return return_dict

def scale_sd(sd):
    for i in range(len(sd)):
        sd[i][0] = min_max_scale(sd[i][0], lng_min, lng_max)
        sd[i][1] = min_max_scale(sd[i][1], lat_min, lat_max)
    return sd

def reverse_scale_val(val):
    val[0][0] = reverse_min_max_scale(val[0][0], lng_min, lng_max)
    val[0][1] = reverse_min_max_scale(val[0][1], lat_min, lat_max)
    return val

def predict(client, json):

    for item in json:
        models = item["algorithms"]
        rssi_values = item["rssi-values"]
        filename = []
        coordinates = []
        
        if len(previous_pos_values) == previous_pos_iterations:

            for model in models:
                if model == algorithms[0]:
                    filename.append("future_random_forest_model_2.sav")
                elif model == algorithms[1]:
                    filename.append("future_decision_tree_model_2.sav")
                if model == algorithms[2]:
                    filename.append("future_rnn_model_2.h5")
                elif model == "all":
                    filename.extend(("future_random_forest_model_2.sav", "future_decision_tree_model_2.sav", "future_rnn_model_2.h5"))
            
            for i in range(len(filename)):
                sequential_data = np.array(previous_pos_values)
                nx, ny = sequential_data.shape
                # Reshape to avoid error "ValueError: Found array with dim 3. Estimator expected <= 2."
                if filename[i] != "future_rnn_model_2.h5":
                    sequential_data_reshaped = sequential_data.reshape((nx*ny))
                    loaded_future_model = pickle.load(open(models_dir+"/"+str(filename[i]), 'rb'))
                    pred=loaded_future_model.predict([sequential_data_reshaped]) #make prediction on test set
                else:
                    sequential_data = scale_sd(sequential_data)
                    sequential_data_reshaped = sequential_data.reshape((1,nx,ny))
                    loaded_future_model = load_model(models_dir+"/"+"future_rnn_model_2.h5", custom_objects={'root_mean_squared_error': root_mean_squared_error})
                    pred=loaded_future_model.predict([sequential_data_reshaped])
                    pred = reverse_scale_val(pred)

                return_name = "FP_RF"
                if filename[i] == "future_random_forest_model_2.sav":
                    return_name = "FP_RF"
                elif filename[i] == "future_decision_tree_model_2.sav":
                    return_name = "FP_DT"
                elif filename[i] == "future_rnn_model_2.h5":
                    return_name = "FP_RNN"

                coordinates.append({pred[0], pred[1], return_name})

            return_dict = {"uuid": item["uuid"], "from": "predictor", "coords": coordinates}

            print("Processed Message: \n", return_dict)

            #client.publish(publish_topic, str(return_dict)) 
            client.publish(f'{publish_topic}/{item["uuid"]}', str(return_dict)) 
    
# MQTT Variables
Connected = False                       # Global variable for the state of the connection
broker_host="10.0.12.91"                # Broker address
broker_port = 9001                      # Broker port
broker_keepalive = 60                   # Connection keepalive
user = "username"                       # Connection username
password = "password"                   # Connection password
received_topic = "/topic_predictor"     # Subscription received topic
publish_topic = "/topic_simulator"      # Subscription publish topic

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
    global received_topic
    global publish_topic
    if rc == 0:
        print(str(client._client_id.decode("utf-8"))+" is connected to MQTT Broker, with return code: " + str(rc))
        global Connected                #Use global variable
        Connected = True                #Signal connection
        
        # Subscribe the topic
        print("Subscribing to topic: ", received_topic)
        client.subscribe(received_topic, 0)
    else:
        print("Failed to connect, with return code: " + str(rc))

# Define on_message event function. 
# This function will be invoked every time,
# a new message arrives for the subscribed topic
def on_message(client, obj, message): 
    if message.topic == received_topic:
        received_data = str(message.payload.decode("utf-8"))

        # array_data = received_data.split(', ')
        array_json = json.loads(received_data)

        # print("Message received: ", array_data,
        print("Message received: ", array_json,
            " | topic=",message.topic,
            " | qos=",message.qos,
            " | retain flag=",message.retain)

        print(array_json)
        # predict(client, array_data)
        q.put((client, array_json))
    
    
# Define on_subscribe event function.
def on_subscribe(client, obj, mid, granted_qos):
    #global publish_topic
    print("Subscribed to topic: " + received_topic +
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

# turn-on the worker thread
threading.Thread(target=worker, daemon=True).start()

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
   
# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
mqtt_client.loop_forever()
# Non blocking : client.loop_start()  #N.B. need a while True: statement

# block until all tasks are done
q.join()