# Model tester
# This tests all position models.
# It takes a testing dataset and creates another with the average of the n previous values, as it's done in the predictor
# 

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

filename = ["knn_model.sav", "svr_model.sav", "grad_boost_regr_model.sav", "random_forest_model.sav", "decision_tree_model.sav"]

previous_rssi_iterations = 3
previous_rssi_values = deque(maxlen=previous_rssi_iterations)  # sequences used for the average rssi

keys = [] # list that saves the df keys for the later recreation of the avg dict

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

def metres_to_degrees(metres):
    return (metres * 360) / (2 * math.pi * 6371000)

def get_avg_to_dict(lst):
    return_dict = {}
    for item in lst:
        for i in range(len(item)):
            # print(keys)
            if keys[i] in return_dict:
                return_dict[keys[i]] += item[i]
            else:
                return_dict[keys[i]] = item[i]
    for col in return_dict:
        return_dict[col] = return_dict[col] / len(lst)
    return return_dict
    
def get_avg_to_lst(lst):
    return_lst = lst[0]
    for row in range(1,len(lst)):
        for col in range(len(lst[row])):
            return_lst[col] += lst[row][col]
    for col in range(len(return_lst)):
        return_lst[col] = return_lst[col] / len(lst)
    return return_lst

def append_lst_to_df(df, lst, k):
    new_dict = {}
    for i in range(len(lst)):
        new_dict[k[i]] = lst[i]
    # return df.append(new_dict, ignore_index = True)
    return pd.concat(df, new_dict)
    
def append_lst_to_matrix(lst, mtx):
    if not mtx:
        for i in range(len(lst)):
            mtx.append([lst[i]])
    else:
        for i in range(len(lst)):
            mtx[i].append(lst[i])
    return mtx

df = pd.read_csv(data_file_name[0])
keys = df.keys()
mtx = []
x_test = []
y_test = []

# Coordinates conversion from degrees to metres
for i in range(len(df["AssetPoint_Latitude"])):
    df["AssetPoint_Latitude"][i] = degrees_to_metres(df["AssetPoint_Latitude"][i]) # - lat_min
    df["AssetPoint_Longitude"][i] = degrees_to_metres(df["AssetPoint_Longitude"][i]) # - lng_min

# print(df.head)
df_test = pd.DataFrame()
for i in range(len(df.values)):
    # print(f'Row:\n {df.values[i]}')
    previous_rssi_values.append(df.values[i])
    if len(previous_rssi_values) == previous_rssi_iterations:
        avg_lst = (get_avg_to_lst(previous_rssi_values))
        x_test.append(avg_lst[:-2])
        y_test.append([avg_lst[-1], avg_lst[-2]])
        # mtx = append_lst_to_matrix(avg_lst, mtx)
        # if i == 6:
        #     print(mtx)
        # df_test = append_lst_to_df(df_test, avg_lst, keys)
# print(len(mtx[0]))

# x_test = mtx[:-2]
# y_test = [mtx[-2], mtx[-1]]

# print(len(x_test))
# print(len(y_test))
# print(df.values)
# print(len(df.values))

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
