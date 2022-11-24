# Future Model tester
# This tests all future position models.

import time
from timeit import default_timer as timer
import math
import pickle
import pandas as pd
import json
import queue
import glob
import argparse
import numpy as np
from collections import deque
from keras.models import load_model
from keras import backend as K
from sklearn.metrics import mean_squared_error 
from math import sqrt

parser = argparse.ArgumentParser(description="Predicts the location of a tag based on rssi values.")
parser.add_argument("--models", nargs="?", type=str, default="somos_saude", help="Enter the name of the models dir. default = somos_saude")
models_dir = parser.parse_args().models
parser.add_argument("--n_antennas", nargs="?", type=int, default=5, help="Enter the number of antennas. default = 5")
n_antennas = parser.parse_args().n_antennas

data_file_name = glob.glob("rssi_antennas*.csv")

filename = ["future_svr_model_2.sav", "future_grad_boost_regr_model_2.sav", "future_random_forest_model_2.sav", "future_decision_tree_model_2.sav"]
filename2 = ["future_rnn_model_2.h5"]

previous_pos_iterations = 5 
previous_pos_values = deque(maxlen=previous_pos_iterations)  # sequences used for future prediction

past_iterations = 5 # number of past positions that are considered in the prediction
future_iterations = 2 # 0 corresponds to the prediction of the next position

keys = [] # list that saves the df keys for the later recreation of the avg dict

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

def metres_to_degrees(metres):
    return (metres * 360) / (2 * math.pi * 6371000)

lng_min = degrees_to_metres(-8.501361269440)
lng_max = degrees_to_metres(-8.500934076175)
lat_min = degrees_to_metres(40.896868043845)
lat_max = degrees_to_metres(40.897262711423)

def min_max_scale(df, min_val, max_val):

    # print("Min unscaled value: "+str(min(df)))

    for i in range(len(df)):
        df[i] = (df[i]-min_val)/(max_val-min_val)

    # print("Min scaled value: "+str(min(df)))
    # print("Max scaled value: "+str(max(df)))

    return df

def reverse_min_max_scale(val, min_val, max_val):
    val = (val * (max_val-min_val))+min_val

    return val

def reverse_scale(df):
    for i in range(len(df)):
        df[i][1] = reverse_min_max_scale(df[i][1], lat_min, lat_max)
        df[i][0] = reverse_min_max_scale(df[i][0], lng_min, lng_max)
    return df

def root_mean_squared_error(y_true, y_pred):
        return K.sqrt(K.mean(K.square(y_pred - y_true)))

def scale(df):

    df["AssetPoint_Longitude"] = min_max_scale(df["AssetPoint_Longitude"], lng_min, lng_max)
    df["AssetPoint_Latitude"] = min_max_scale(df["AssetPoint_Latitude"], lat_min, lat_max)
    df["Future_Longitude"] = min_max_scale(df["Future_Longitude"], lng_min, lng_max)
    df["Future_Latitude"] = min_max_scale(df["Future_Latitude"], lat_min, lat_max)

    return df

# Func that receives a dataframe, normalizes and splits the data into sequences and returns them with their respective future value
def preprocess_df(df): 
    
    sequential_data = []  # list with the sequences
    previous_values = deque(maxlen=past_iterations)  # sequences
    
    # for i in df.values:
    for i in range(len(df.values)):
        previous_values.append([n for n in df.values[i][:-2]])  # it saves lat and lng values in the queue (not the future columns)
        if past_iterations == len(previous_values) and i+future_iterations < len(df.values): # when the queue is full, the values are saved
            # sequential_data.append([np.array(previous_values), i[-1], i[-2]])  # append of previous data sequence and future values
            sequential_data.append([np.array(previous_values), df.values[i+future_iterations][-1], df.values[i+future_iterations][-2]])  # append of previous data sequence and future values

    test_x = []
    test_y = []

    for sequence, future_lat, future_lng in sequential_data:
        test_x.append(sequence)
        test_y.append([future_lat, future_lng])

    return np.array(test_x), np.array(test_y) # retorna as sequências como numpy array e a lista de targets

df = pd.read_csv(data_file_name[0])
keys = df.keys()
mtx = []
x_test = []
y_test = []

for i in range(len(df.columns)-2):
    df = df.drop("RSSI_Antenna_"+str(i+1), 1)

# Coordinates conversion from degrees to metres
for i in range(len(df["AssetPoint_Latitude"])):
    df["AssetPoint_Latitude"][i] = degrees_to_metres(df["AssetPoint_Latitude"][i]) # - lat_min
    df["AssetPoint_Longitude"][i] = degrees_to_metres(df["AssetPoint_Longitude"][i]) # - lng_min

# Two new columns are created with the future lat and lng value after x iterations
df['Future_Latitude'] = df['AssetPoint_Latitude'].shift(-past_iterations) 
df['Future_Longitude'] = df['AssetPoint_Longitude'].shift(-past_iterations)

df.dropna(inplace=True) # Drops lines with NaN (mainly from Future lat/lng)

# print(df)

x_test, y_test = preprocess_df(df)

# print(x_test)
# print(y_test)

# print(x_train.shape)
nsamples, nx, ny = x_test.shape
# print(x_test.shape)
x_test = x_test.reshape((nsamples,nx*ny))

print("\nBasic Algorithms:")

print("\nTimes:")
mse_dict = {}
for i in range(len(filename)):
    loaded_model = pickle.load(open(models_dir+"/"+str(filename[i]), 'rb'))
    total = 0
    n = 300
    for j in range(n):
        t1 = timer()
        loaded_model.predict([x_test[0]])
        t2 = timer()
        loaded_model.predict([x_test[0]])
        loaded_model.predict([x_test[0]])
        t3 = timer()
        total += (t3 - t2) - (t2 - t1) 
    exec_time = total/n
    print(f'{filename[i].replace(".sav","")} - '+"{:.4f}".format(1000*(exec_time))+"ms")


print("\nErrors:")
mse_dict = {}
for i in range(len(filename)):
    loaded_model = pickle.load(open(models_dir+"/"+str(filename[i]), 'rb'))
    pred = loaded_model.predict(x_test)
    error = sqrt(mean_squared_error(y_test,pred)) #calculate rmse
    mse_dict[filename[i]] = error
    print(f'{filename[i].replace(".sav","")} - '+"{:.2f}".format(error)+"m")
    

# print(mse_dict)
# for k in mse_dict.keys():
#     print("The error was "+"{:.2f}".format(error)+"m")


x_test, y_test = preprocess_df(scale(df))

# print(x_train.shape)
nsamples, nx, ny = x_test.shape
test_value = x_test[0].reshape((1,nx,ny))
# print(x_test.shape)
# x_test = x_test.reshape((nsamples,nx*ny))

print("\nNeural Networks")

print("\nTimes:")
mse_dict = {}
for i in range(len(filename2)):
    loaded_model = load_model(models_dir+"/"+str(filename2[i]), custom_objects={'root_mean_squared_error': root_mean_squared_error})
    total = 0
    n = 100
    for j in range(n):
        t1 = timer()
        loaded_model.predict([test_value])
        t2 = timer()
        loaded_model.predict([test_value])
        loaded_model.predict([test_value])
        t3 = timer()
        total += (t3 - t2) - (t2 - t1) 
    exec_time = total/n
    print(f'{filename2[i].replace(".sav","")} - '+"{:.4f}".format(1000*(exec_time))+"ms")


print("\nErrors:")
mse_dict = {}
for i in range(len(filename2)):
    loaded_model = load_model(models_dir+"/"+str(filename2[i]), custom_objects={'root_mean_squared_error': root_mean_squared_error})
    pred = loaded_model.predict(x_test)
    pred = reverse_scale(pred)
    y_test = reverse_scale(y_test)
    error = sqrt(mean_squared_error(y_test,pred)) #calculate rmse
    mse_dict[filename[i]] = error
    print(f'{filename2[i].replace(".sav","")} - '+"{:.2f}".format(error)+"m")