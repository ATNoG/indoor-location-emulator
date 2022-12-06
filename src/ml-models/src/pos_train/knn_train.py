from numpy import zeros
from numpy.core.fromnumeric import mean
from sklearn import neighbors
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

# Split x and y
x_train = train_df.drop(["AssetPoint_Latitude", "AssetPoint_Longitude"], axis=1)
x_test = test_df.drop(["AssetPoint_Latitude", "AssetPoint_Longitude"], axis=1)
y_train = train_df[["AssetPoint_Latitude", "AssetPoint_Longitude"]]
y_test = test_df[["AssetPoint_Latitude", "AssetPoint_Longitude"]]

# print((df))
# print((train_df))
# print((test_df))

# Training model and checking the best K
rmse_val = [] #to store rmse values for different k
for K in range(y_test.shape[0]):
    K = K+1
    model = neighbors.KNeighborsRegressor(n_neighbors = K)
    # model = neighbors.KNeighborsRegressor(n_neighbors = K, metric = "manhattan")
    model.fit(x_train.values, y_train.values)  #fit the model
    pred=model.predict(x_test.values) #make prediction on test set
    error = sqrt(mean_squared_error(y_test,pred)) #calculate rmse
    rmse_val.append(error) #store rmse values
    print('RMSE value for k= ' , K , 'is:', error)

# Plot
# curve = pd.DataFrame(rmse_val) #elbow curve 
# curve.plot()
# plt.show()

# Training model with the best K
k_min = 1 + min(range(len(rmse_val)), key=rmse_val.__getitem__)
model = neighbors.KNeighborsRegressor(n_neighbors = k_min)
# model = neighbors.KNeighborsRegressor(n_neighbors = k_min, metric = "manhattan")
model.fit(x_train.values, y_train.values)  #fit the model
pred=model.predict(x_test.values) #make prediction on test set
error = sqrt(mean_squared_error(y_test,pred)) #calculate rmse

print("Latitude | Longitude gaps: "+"{:.2f} | ".format(lat_int)+"{:.2f}".format(long_int))
print("The best K value was "+str(k_min)+" with an error of "+"{:.2f}".format(error)+"m")

# print("pred: \n"+str(pred))
# print("y_test: \n"+str(y_test))

# save the model to disk
filename = 'knn_model.sav'
pickle.dump(model, open(filename, 'wb'))