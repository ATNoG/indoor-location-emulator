"""
.. include:: ../README.md

## Predictor
- subscribes to mqtt toppic 
- gets the rssi/activations values and the model to use
- predicts and publishes the coordinates

---

"""

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

def worker():
    """
    Worker func that consumes the queue containing the received messages from the backend module.
    It calls the 'predict_from_rssi' or 'predict_from_activations' functions depending on the type of data.
    """
    while True:
        item = q.get()

        if item[1]["features"] == "activations":
            print("\nactiv")
            predict_from_activations(item[0], item[1])
        else:
            print("\nrssi")
            predict_from_rssi(item[0], item[1])
        
        q.task_done()

def degrees_to_metres(deg: float) -> float:
    """
    Coordinates degrees to meters conversor using the following formula:
    $$
    meters=\\frac{2 \\times \\pi \\times earthRadius \\times degrees}{360}
    $$

    Args:
        deg (float): coordinate in degrees

    Returns:
        float: coordinate in meters
    """
    return (2 * math.pi * 6371000 * deg) / 360

def metres_to_degrees(metres: float) -> float:
    """
    Coordinates meters to degrees conversor using the following formula:
    $$
    degrees=\\frac{360 \\times meters}{2 \\times \\pi \\times earthRadius}
    $$

    Args:
        metres (float): coordinate in degrees

    Returns:
        float: coordinate in degrees
    """
    return (metres * 360) / (2 * math.pi * 6371000)

def root_mean_squared_error(y_true: list, y_pred: list) -> float:
    """
    Root mean sequare error.

    Args:
        y_true (list): list of true values
        y_pred (list): list of predicted values

    Returns:
        float: rmse
    """
    return K.sqrt(K.mean(K.square(y_pred - y_true)))

lng_min = degrees_to_metres(-8.501361269440)
lng_max = degrees_to_metres(-8.500934076175)
lat_min = degrees_to_metres(40.896868043845)
lat_max = degrees_to_metres(40.897262711423)

def min_max_scale(val: float, min_val: float, max_val: float) -> float:
    """
    Min max scaler.

    Args:
        val (float): value to be scaled
        min_val (float): minimum value
        max_val (float): maximum value

    Returns:
        float: min_max_scaler
    """
    val = (val-min_val)/(max_val-min_val)
    return val

def reverse_min_max_scale(val: float, min_val: float, max_val: float) -> float:
    """
    Min max reverse scaler.

    Args:
        val (float): value to be unscaled
        min_val (float): minimum value
        max_val (float): maximum value

    Returns:
        float: reverse_min_max_scaler
    """
    val = (val * (max_val-min_val))+min_val
    return val

def get_avg_rssi(d: list) -> dict:
    """
    Makes an average of the rssi values in each iteration.

    Args:
        d (list): list of rssi values

    Returns:
        dict: average rssi values
    """
    # print("\nd: ",d)
    return_dict = {}
    for iter in d:
        for col in range(0, len(iter)):
            if iter[col] == None:
                iter[col] = -170
            if col in return_dict:
                return_dict[col] += float(iter[col])
            else:
                return_dict[col] = float(iter[col])
    for col in return_dict:
        return_dict[col] = return_dict[col] / len(d)
    return return_dict
  
def scale_sd(val:list) -> list:
    """
    Scales using the min and max coordinates.

    Args:
        val (list): coordinates to be scaled

    Returns:
        float: scaled coordinates
    """
    for i in range(len(val)):
        val[i][0] = min_max_scale(val[i][0], lng_min, lng_max)
        val[i][1] = min_max_scale(val[i][1], lat_min, lat_max)
    return val

def reverse_scale_val(val:list) -> list:
    """
    Unscales using the min and max coordinates.

    Args:
        val (list): coordinates to be unscaled

    Returns:
        float: real coordinates
    """
    val[0][0] = reverse_min_max_scale(val[0][0], lng_min, lng_max)
    val[0][1] = reverse_min_max_scale(val[0][1], lat_min, lat_max)
    return val

def get_coord_from_dist(dist: float, antenna_coord: list, antenna_angle: float) -> tuple:
    """
    Estimates the asset coordinates using data regarding the distance to an antenna, its position and angle.

    Args:
        dist (float): distance from the tag to the antenna
        antenna_coord (list): coordinates of the antenna
        antenna_angle (float): angle of direction of the antenna

    Returns:
        tuple: asset coordinates
    """
    rad_angle = math.radians(antenna_angle)
    lng = degrees_to_metres(antenna_coord[0]) - math.sin(rad_angle) * dist
    lat = degrees_to_metres(antenna_coord[1]) + math.cos(rad_angle) * dist
    return lng, lat

def predict_using_anchors(model, ap_activ: list, anchors_activ: list) -> float:
    """
    Predicts the distance of an asset using anchors data its number of activations.

    Args:
        model: ML model
        ap_activ (list): activations of the asset
        anchors_activ (list): activations of the anchors

    Returns:
        float: distance between the asset and the antenna
    """
    model_data = ap_activ.copy()
    for anchor in anchors_activ:
        for i, antenna in enumerate(anchor):
            if i == 3: # just antenna 4
                for pwr_i in range(len(antenna)):
                    model_data.append(ap_activ[pwr_i] - antenna[pwr_i])
    return model.predict([model_data])

def predict_from_activations(client, json):
    """
    Predicts the position of an asset using data regarding the number of activations recorded.

    Args:
        client: client
        json (dict): dictionary containing muliple parameters received from the backend module

    """
    models = json["algo"]
    antennas_coords = json["ant-coords"]
    antennas_angles = json["ant-angles"]
    coordinates_multi = []
    dists_multi = []

    for ap in range(len(json["ap-activ"])):
        
        # rssi_values = json["ap-rssi"][ap]
        activations = json["ap-activ"][ap]
        filename = []
        coordinates = []
        dists = {}

        # for model in models:
        #     if model == "all":
        #         filename.extend(("knn.sav", "svr.sav", "gbr.sav", "rf.sav", "dt.sav"))
        #     else:
        #         filename.append(model+".sav")

        if models == ["all"]:
            models = ["knn", "svr", "gbr", "rf", "dt"]
        
        # rssi_dict = {}
        for i in range(len(models)):
            loaded_model = models_dict[models[i]]

            # # smaller names to send
            # algorithm = filename[i].replace(".sav", "")

            distances = []
            no_activations = True
            for j, antenna in enumerate(activations):
                if antenna == [0, 0, 0]:     
                    distances.append(-1)
                else:
                    no_activations = False  
                    if j == 3 and not models_based_on_experiments and use_anchors:
                        distances.append(predict_using_anchors(models_anchors_dict[models[i]], antenna, json["anch-activ"]))
                    else:
                        distances.append(loaded_model.predict([antenna]))

            # When all antenas don't read any activations, return 0, 0
            if no_activations:
                # coordinates.append([0, 0, algorithm])
                continue
                    
            min_dist = min(k for k in distances if k > 0)[0]
            min_dist_index = distances.index(min_dist)

            lng, lat = get_coord_from_dist(min_dist, antennas_coords[min_dist_index], antennas_angles[min_dist_index])
            lng = metres_to_degrees(lng)
            lat = metres_to_degrees(lat)
            
            return_model = models[i].upper()

            coordinates.append([lng, lat, return_model])
            # dists.append(min_dist)
            dists[return_model] = [lng, lat, distances]

        coordinates_multi.append(coordinates)
        dists_multi.append(dists)

    return_dict_frontend = {"uuid": json["uuid"], "from": "predictor", "coords": coordinates_multi}
    print("Processed Message to Frontend: \n", return_dict_frontend)
    client.publish(f'{publish_topic}/{json["uuid"]}', str(return_dict_frontend))

    if(len(dists)!= 0):
        return_dict_twins = {"uuid": json["uuid"], "from": "predictor", "dist": min_dist} # min(dists) - just use minimum distance of all algorithms
        print("Processed Message to Twins: \n", return_dict_twins)
        print("Distances per Antenna: {}".format(distances))
        client.publish(f'{publish_twins_topic}/create/{json["uuid"]}', str(return_dict_twins))  

def predict_from_rssi(client, json):
    """
    Predicts the position of an asset using RSSI data.

    Args:
        client: client
        json (dict): dictionary containing muliple parameters received from the backend module

    """
    models = json["algo"]

    coordinates_multi = []

    for ap in range(len(json["ap-rssi"])):

        rssi_values = json["ap-rssi"][ap]
        filename = []
        coordinates = []
        
        previous_rssi_values.append(rssi_values)
        if len(previous_rssi_values) == previous_rssi_iterations:
            rssi_values = get_avg_rssi(previous_rssi_values)
            previous_rssi_values.clear()

            for model in models:
                if model == algorithms[0]:
                    filename.append("knn_model.sav")
                elif model == algorithms[1]:
                    filename.append("svr_model.sav")
                elif model == algorithms[2]:
                    filename.append("grad_boost_regr_model.sav")
                elif model == algorithms[3]:
                    filename.append("random_forest_model.sav")
                elif model == algorithms[4]:
                    filename.append("decision_tree_model.sav")
                elif model == "all":
                    filename.extend(("knn_model.sav", "svr_model.sav", "grad_boost_regr_model.sav", "random_forest_model.sav", "decision_tree_model.sav"))
            
            rssi_dict = {}
            for i in range(len(filename)):
                loaded_model = pickle.load(open(models_dir+"/"+str(filename[i]), 'rb'))
                # rssi_dict2 = {"RSSI_Antenna_1": [rssi_values["Antenna 1"]], "RSSI_Antenna_2": [rssi_values["Antenna 2"]], "RSSI_Antenna_3": [rssi_values["Antenna 3"]], "RSSI_Antenna_4": [rssi_values["Antenna 4"]]}
                # for antenna in range(len(rssi_values)):
                for antenna in range(n_antennas):
                    if antenna in rssi_values:
                        if rssi_values[antenna] == "None":
                            rssi_values[antenna] = -170
                        rssi_dict["RSSI_Antenna_"+str(antenna+1)] = [rssi_values[antenna]]
                    else:
                        rssi_dict["RSSI_Antenna_"+str(antenna+1)] = [-170]
                df = pd.DataFrame(rssi_dict)
                result = loaded_model.predict(df.values)
                
                # Future position prediction
                # The 1st model's predicted coordinates are used to predict de future position
                if (i == 0):
                    previous_pos_values.append([result[0][1], result[0][0]])

                    if previous_pos_iterations == len(previous_pos_values):
                        filename2 = []
                        for model in models:
                            if model == algorithms2[0]:
                                filename2.append("future_random_forest_model_2.sav")
                            elif model == algorithms2[1]:
                                filename2.append("future_decision_tree_model_2.sav")
                            if model == algorithms2[2]:
                                filename2.append("future_rnn_model_2.h5")
                            elif model == "all":
                                filename2.extend(("future_random_forest_model_2.sav", "future_decision_tree_model_2.sav", "future_rnn_model_2.h5"))
                        
                        # print(f"\nFilename: {filename2}")

                        for j in range(len(filename2)):
                            sequential_data = np.array(previous_pos_values)
                            nx, ny = sequential_data.shape
                            # Reshape to avoid error "ValueError: Found array with dim 3. Estimator expected <= 2."
                            if filename2[j] != "future_rnn_model_2.h5":
                                sequential_data_reshaped = sequential_data.reshape((nx*ny))
                                loaded_future_model = pickle.load(open(models_dir+"/"+str(filename2[j]), 'rb'))
                                pred=loaded_future_model.predict([sequential_data_reshaped]) #make prediction on test set
                            else:
                                sequential_data = scale_sd(sequential_data)
                                sequential_data_reshaped = sequential_data.reshape((1,nx,ny))
                                loaded_future_model = load_model(models_dir+"/"+"future_rnn_model_2.h5", custom_objects={'root_mean_squared_error': root_mean_squared_error})
                                pred=loaded_future_model.predict([sequential_data_reshaped])
                                pred = reverse_scale_val(pred)

                            return_name = "FP_RF"
                            if filename2[j] == "future_random_forest_model_2.sav":
                                return_name = "FP_RF"
                            elif filename2[j] == "future_decision_tree_model_2.sav":
                                return_name = "FP_DT"
                            elif filename2[j] == "future_rnn_model_2.h5":
                                return_name = "FP_RNN"

                            pred = [metres_to_degrees(pred[0][0]), metres_to_degrees(pred[0][1])]
                            coordinates.append([pred[0], pred[1], return_name])


                
                lat = metres_to_degrees(result[0][0])
                lng = metres_to_degrees(result[0][1])  

                # smaller names to send
                algorithm = filename[i].replace("_model.sav", "")
                
                if algorithm == "knn":
                    algorithm = "KNN"
                elif algorithm == "svr":
                    algorithm = "SVR"
                elif algorithm == "grad_boost_regr":
                    algorithm = "GBR"
                elif algorithm == "random_forest":
                    algorithm = "RF"
                elif algorithm == "decision_tree":
                    algorithm = "DT"

                # coordinates.append({"longitude": lng, "latitude": lat, "algorithm": algorithm})
                coordinates.append([lng, lat, algorithm])
            
            coordinates_multi.append(coordinates)

            return_dict = {"uuid": json["uuid"], "from": "predictor", "coords": coordinates_multi}

            print("Processed Message: \n", return_dict)

            #client.publish(publish_topic, str(return_dict)) 
            client.publish(f'{publish_topic}/{json["uuid"]}', str(return_dict))
    
# MQTT Variables
Connected = False                       # Global variable for the state of the connection
broker_host="10.0.12.91"                # Broker address
broker_port = 9001                      # Broker port
broker_keepalive = 60                   # Connection keepalive
user = "username"                       # Connection username
password = "password"                   # Connection password
received_topic = "/topic_predictor"     # Subscription received topic
publish_topic = "/topic_simulator"      # Subscription publish topic
publish_twins_topic = "/topic_mqtt_agents"    # Subscription publish topic

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

        # print received message
        print("Message received: ", array_json,
            " | topic=",message.topic,
            " | qos=",message.qos,
            " | retain flag=",message.retain) 

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

def main():
    global q, models_dict, models_anchors_dict, use_anchors, models_based_on_experiments, previous_pos_values
    global n_antennas, models_dir, previous_rssi_values, previous_rssi_iterations, algorithms, algorithms2
    global previous_pos_iterations

    parser = argparse.ArgumentParser(description="Predicts the location of a tag based on rssi values.")
    parser.add_argument("-m", "--models", nargs="?", type=str, default="src/it", help="Enter the name of the rssi models dir. default = it. other = somos_saude")
    parser.add_argument("-n", "--n_antennas", nargs="?", type=int, default=4, help="Enter the number of antennas. default = 4")
    models_dir = parser.parse_args().models
    n_antennas = parser.parse_args().n_antennas

    algorithms = ["knn", "svr", "gbr", "rf", "dt"]
    algorithms2= ["fp_rf", "fp_dt", "fp_rnn"]
    q = queue.Queue() # backend messages

    previous_pos_iterations = 5 
    previous_pos_values = deque(maxlen=previous_pos_iterations)  # sequences used for future prediction

    previous_rssi_iterations = 3
    previous_rssi_values = deque(maxlen=previous_rssi_iterations)  # sequences used for the average rssi

    # Load ML models
    models_dict = {}
    models_anchors_dict = {}
    use_anchors = False # ANCHORS SWITCH
    models_based_on_experiments = False # SWITCH MODELS
    for alg in algorithms:
        if models_based_on_experiments:
            models_dict[alg] = pickle.load(open("./src/activ_models/"+alg+".sav", 'rb')) # based on experiments
        else:
            # models_dict[alg] = pickle.load(open("./src/activ_sim_models/"+alg+"_activ_sim.sav", 'rb')) # based on simulator
            models_dict[alg] = pickle.load(open("./src/activ_sim_models/"+alg+"_activ_sim_calc_dist.sav", 'rb'))
        models_anchors_dict[alg] = pickle.load(open("./src/activ_sim_models/"+alg+"_activ_dif_antenna4_sim_calc_dist.sav", 'rb')) # based on simulator

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
    #q.join()

if __name__ == "__main__":
    main()