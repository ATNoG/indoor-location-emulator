from numpy import zeros
from numpy.core.fromnumeric import mean
from sklearn.metrics import mean_squared_error 
from math import sqrt
import matplotlib.pyplot as plt
import pandas as pd
import math
import glob
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import GradientBoostingRegressor

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

# Getting the dataset
data_file_name = glob.glob("rssi_antennas*.csv")
df = pd.read_csv(data_file_name[0])

# Coordinates conversion from degrees to metres
lat_min = degrees_to_metres(min(df["AssetPoint_Latitude"]))
lng_min = degrees_to_metres(min(df["AssetPoint_Longitude"]))

for i in range(len(df["AssetPoint_Latitude"])):
    df["AssetPoint_Latitude"][i] = degrees_to_metres(df["AssetPoint_Latitude"][i]) # - lat_min
    df["AssetPoint_Longitude"][i] = degrees_to_metres(df["AssetPoint_Longitude"][i]) # - lng_min

# Latitude and Longitude gaps
lat_int = max(df["AssetPoint_Latitude"]) - min(df["AssetPoint_Latitude"])
long_int = max(df["AssetPoint_Longitude"]) - min(df["AssetPoint_Longitude"])

# Split the dataset into train and test
train_df, test_df = train_test_split(df, test_size=0.05, random_state=None)

# Discard testing (easy way)
train_df = df

# Split x and y
x_train = train_df.drop(["AssetPoint_Latitude", "AssetPoint_Longitude"], axis=1)
x_test = test_df.drop(["AssetPoint_Latitude", "AssetPoint_Longitude"], axis=1)
y_train = train_df[["AssetPoint_Latitude", "AssetPoint_Longitude"]]
y_test = test_df[["AssetPoint_Latitude", "AssetPoint_Longitude"]]

# print((df))
# print((train_df))
# print((test_df))

# create a regressor object
model = GradientBoostingRegressor() 
regr = MultiOutputRegressor(model) # added because of the error "ValueError: y should be a 1d array, got an array of shape (1059, 2) instead."

# fit the regressor with X and Y data
regr.fit(x_train.values, y_train.values)
pred=regr.predict(x_test.values) #make prediction on test set
error = sqrt(mean_squared_error(y_test,pred)) #calculate rmse

print("Latitude | Longitude gaps: "+"{:.2f} | ".format(lat_int)+"{:.2f}".format(long_int))
print("The error was "+"{:.2f}".format(error)+"m")

# print("pred: \n"+str(pred))
# print("y_test: \n"+str(y_test))

# save the model to disk
filename = 'grad_boost_regr_model.sav'
pickle.dump(regr, open(filename, 'wb'))