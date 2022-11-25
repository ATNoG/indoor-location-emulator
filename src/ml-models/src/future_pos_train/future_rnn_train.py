from sklearn.metrics import mean_squared_error 
from math import sqrt
import pandas as pd
import numpy as np
import math
import glob
import pickle
import random
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from collections import deque
from sklearn import preprocessing
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.layers import Dropout
from keras import backend as K
import matplotlib.pyplot as plt

past_iterations = 5 # number of past positions that are considered in the prediction
future_iterations = 2 # 0 corresponds to the prediction of the next position

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

lng_min = degrees_to_metres(-8.501361269440)
lng_max = degrees_to_metres(-8.500934076175)
lat_min = degrees_to_metres(40.896868043845)
lat_max = degrees_to_metres(40.897262711423)

# print("Min lng: "+str(lng_min))
# print("Min lat: "+str(lat_min))

def min_max_scale(df, min_val, max_val):

    print("Min unscaled value: "+str(min(df)))

    for i in range(len(df)):
        df[i] = (df[i]-min_val)/(max_val-min_val)

    # print("Min scaled value: "+str(min(df)))
    # print("Max scaled value: "+str(max(df)))

    return df

def reverse_min_max_scale(val, min_val, max_val):
    val = (val * (max_val-min_val))+min_val

    # print(str(min(df)))
    # print(str(max(df)))

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

    # print(df)

    df = scale(df)

    # print(df)
    
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
    train_df, test_df = train_test_split(sequential_data, test_size=0.2, random_state=None)

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
    df = df.drop(columns="RSSI_Antenna_"+str(i+1))

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
# nsamples, nx, ny = x_train.shape
# # print(x_train.shape)
# x_train = x_train.reshape((nsamples,nx*ny))
# print("x_train shape: "+str(x_train.shape))
# nsamples, nx, ny = x_test.shape
# # print(x_test.shape)
# x_test = x_test.reshape((nsamples,nx*ny))
# print("x_test shape: "+str(x_test.shape))

# print(x_train[0])
# print(y_train[0])

# create a regressor object

# model = keras.Sequential()
# Add an Embedding layer expecting input vocab of size 10, and
# output embedding dimension of size 2.
# model.add(layers.Embedding(input_dim=10, output_dim=2))
# model.add(layers.GRU(64, input_shape = [5, 2], activation = "swish", return_sequences = True))
# model.add(Dropout(0.2)) # Deactivate connections

# model.add(layers.Masking(mask_value=0.0))

# Add a LSTM layer with 128 internal units.
# model.add(layers.LSTM(128, return_sequences=True))
# model.add(layers.GRU(64, activation = "swish"))
# model.add(Dropout(0.2)) # Deactivate connections

# model.add(layers.Dense(128))
# model.add(Dropout(0.2)) # Deactivate connections

# normalização
# mais dados
# ajustar a função de custo (RMSE) DONE
# adicionar uma multilayer septor
# adicionar uma convulção
# testar transformer (?)
# matriz de correlação scikit learn e ciborg

# model.add(layers.LSTM(128))
# model.add(Dropout(0.2)) # Deactivate connections

# model.add(layers.Dense(32))
# model.add(Dropout(0.2)) # Deactivate connections

model = keras.Sequential()
model._name = 'inception'

model.add(layers.GRU(128, input_shape = [5, 2], activation = "swish", return_sequences = True))
# model.add(layers.GRU(128, input_shape = [10, 1], activation = "swish", return_sequences = True))
model.add(Dropout(0.2)) # Deactivate connections

model.add(layers.GRU(256, activation = "swish"))
model.add(Dropout(0.2))

model.add(layers.Dense(2))

model.compile(optimizer="adam", loss=root_mean_squared_error, metrics=[root_mean_squared_error])

# fit the regressor with X and Y data
history = model.fit(
    x_train, y_train, validation_data=(x_test, y_test), epochs=300
)
# # Plots
# plt.figure(figsize = (10, 6))
# plt.plot(history.history["loss"])
# plt.plot(history.history["val_loss"])
# plt.title("Model Train vs Validation Loss for " + "RNN")
# plt.ylabel("Loss")
# plt.xlabel("epoch")
# plt.legend(["Train loss", "Validation loss"], loc="upper right")
# plt.show()

# # Avaliar o modelo
# score = model.evaluate(x_test, y_test, verbose=0)
# print('Test loss:', score[0])
# print('Test accuracy:', score[1])

pred=model.predict(x_test) #make prediction on test set
pred = reverse_scale(pred)
y_test = reverse_scale(y_test)
# print(y_test)
# print(pred)
error = sqrt(mean_squared_error(y_test,pred)) #calculate rmse

print("The error was "+"{:.2f}".format(error)+"m")

# save the model to disk
# filename = 'future_rnn_model_'+str(future_iterations)+'.sav'
# pickle.dump(model, open(filename, 'wb'))

model.save('future_rnn_model_'+str(future_iterations)+'.h5')