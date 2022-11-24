import random
import os
import math
import pickle
import numpy as np
import pandas as pd

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

def metres_to_degrees(metres):
    return (metres * 360) / (2 * math.pi * 6371000)

filename = "grad_boost_regr_model.sav"
loaded_model = pickle.load(open(filename, 'rb'))

df = pd.DataFrame({"RSSI_Antenna_1": [-50.119], "RSSI_Antenna_2": [-53.924], "RSSI_Antenna_3": [-49.978], "RSSI_Antenna_4": [-30.543]})
result = loaded_model.predict(df.values)


print("Lat: "+str(metres_to_degrees(result[0][0])))
print("Lng: "+str(metres_to_degrees(result[0][1])))

# array = [1, 2, 3, 4, 5, 6]
# print(array[:-2])