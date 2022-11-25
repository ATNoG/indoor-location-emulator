from sklearn.metrics import mean_squared_error 
from math import sqrt
import pandas as pd
import numpy as np
import math
import glob
import pickle
import random
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from collections import deque
from sklearn import preprocessing

past_iterations = 5 # number of past positions that are considered in the prediction
future_iterations = 2 # 0 corresponds to the prediction of the next position

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

# Func that receives a dataframe, normalizes and splits the data into sequences and returns them with their respective future value
def preprocess_df(df): 

    # Scaling
    # for coluna in df.columns:  # percorrer as colunas
    #     if coluna != "target":  # nomalizar tudo exceto o target
    #         df[coluna] = df[coluna].pct_change()  # em vez da coluna apresentar o valor, apresenta a precentagem de subida/descida
    #         df.dropna(inplace=True)  # elimina os NAS deixados pela função pct_change()
    #         df[coluna] = preprocessing.scale(df[coluna].values)  # converte em valores entre 0 e 1
    
    # df.dropna(inplace=True)
    sequential_data = []  # list with the sequences
    previous_values = deque(maxlen=past_iterations)  # sequences
    
    # for i in df.values:
    for i in range(len(df.values)):
        previous_values.append([n for n in df.values[i][:-2]])  # it saves lat and lng values in the queue (not the future columns)
        if past_iterations == len(previous_values) and i+future_iterations < len(df.values): # when the queue is full, the values are saved
            # sequential_data.append([np.array(previous_values), i[-1], i[-2]])  # append of previous data sequence and future values
            sequential_data.append([np.array(previous_values), df.values[i+future_iterations][-1], df.values[i+future_iterations][-2]])  # append of previous data sequence and future values

    # print(sequential_data)

    random.shuffle(sequential_data)
    # Split the dataset into train and test
    train_df, test_df = train_test_split(sequential_data, test_size=0.05, random_state=None)

    train_x = []
    train_y = []
    test_x = []
    test_y = []

    for sequence, future_lat, future_lng in train_df:
        train_x.append(sequence)
        train_y.append([future_lat, future_lng])
    for sequence, future_lat, future_lng in test_df:
        test_x.append(sequence)
        test_y.append([future_lat, future_lng])

    return np.array(train_x), np.array(train_y), np.array(test_x), np.array(test_y) # retorna as sequências como numpy array e a lista de targets

# Getting the dataset
data_file_name = glob.glob("rssi_antennas*.csv")
df = pd.read_csv(data_file_name[0])

for i in range(len(df.columns)-2):
    df = df.drop("RSSI_Antenna_"+str(i+1), 1)

# Coordinates conversion from degrees to metres
lat_min = degrees_to_metres(min(df["AssetPoint_Latitude"]))
lng_min = degrees_to_metres(min(df["AssetPoint_Longitude"]))

for i in range(len(df["AssetPoint_Latitude"])):
    df["AssetPoint_Latitude"][i] = degrees_to_metres(df["AssetPoint_Latitude"][i]) # - lat_min
    df["AssetPoint_Longitude"][i] = degrees_to_metres(df["AssetPoint_Longitude"][i]) # - lng_min

# Two new columns are created with the future lat and lng value after x iterations
df['Future_Latitude'] = df['AssetPoint_Latitude'].shift(-past_iterations) 
df['Future_Longitude'] = df['AssetPoint_Longitude'].shift(-past_iterations)

df.dropna(inplace=True) # Drops lines with NaN (mainly from Future lat/lng)

# print(df)

x_train, y_train, x_test, y_test = preprocess_df(df)

# Reshape to avoid error "ValueError: Found array with dim 3. Estimator expected <= 2."
nsamples, nx, ny = x_train.shape
# print(x_train.shape)
x_train = x_train.reshape((nsamples,nx*ny))
# print(x_train.shape)
nsamples, nx, ny = x_test.shape
# print(x_test.shape)
x_test = x_test.reshape((nsamples,nx*ny))
# print(x_test.shape)

# print(x_train[0])
# print(y_train[0])

# create a regressor object
model = RandomForestRegressor() 

# fit the regressor with X and Y data
model.fit(x_train, y_train)
pred=model.predict(x_test) #make prediction on test set
error = sqrt(mean_squared_error(y_test,pred)) #calculate rmse

print("The error was "+"{:.2f}".format(error)+"m")

# save the model to disk
filename = 'future_random_forest_model_'+str(future_iterations)+'.sav'
pickle.dump(model, open(filename, 'wb'))