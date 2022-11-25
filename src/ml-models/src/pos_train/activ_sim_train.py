import sys
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
from sklearn import neighbors
from sklearn.tree import DecisionTreeRegressor 
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR
from sklearn.ensemble import GradientBoostingRegressor

ANTENNA = "4"

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

def select_just_activ_info(df):
    for col in df.columns:
        if "AP1" not in col:
            df = df.drop([col], axis=1) # creates a copy - does not modify object
    return df

def select_just_antennas_4_5(df):
    for col in df.columns:
        if ("Antenna1" in col) or ("Antenna2" in col) or ("Antenna3" in col):
            df = df.drop([col], axis=1)
    return df

def select_just_antenna(df, i):
    for col in df.columns:
        if ("Antenna"+str(i) not in col) and ("Longitude" not in col) and ("Latitude" not in col) and ("dif" not in col):
            df = df.drop([col], axis=1)
    return df

def dist_from_antenna4(lng, lat, ant_lng = -8.500960698902418, ant_lat = 40.89703864175027):
    alt_lng_m = degrees_to_metres(ant_lng)
    alt_lat_m = degrees_to_metres(ant_lat)
    lng_m = degrees_to_metres(lng)
    lat_m = degrees_to_metres(lat)
    return sqrt((lng_m-alt_lng_m)**2+(lat_m-alt_lat_m)**2)

def add_activ_diff(df):
    for anchor in range(1,5):
        for pwr in ["280", "290", "300"]:
            df['AP1_activ_dif_pwr_'+pwr+'_anchor'+str(anchor)] = df.apply(lambda row: row["AP1_"+pwr+"_Antenna"+ANTENNA] - row["Anchor"+str(anchor)+"_"+pwr+"_Antenna"+ANTENNA], axis=1)
    return df

# Getting the dataset
data_file_name = glob.glob("antennas_multi_features*.csv")
df = pd.read_csv(data_file_name[0])

# Prints
# print(df.columns)
# print(df.columns)
# sys.exit(0)

# Coordinates conversion from degrees to metres
# lat_min = degrees_to_metres(min(df["AP1_Latitude"]))
# lng_min = degrees_to_metres(min(df["AP1_Longitude"]))

# Degrees to meters conversion
# for i in range(len(df["AP1_Latitude"])):
#     df["AP1_Latitude"][i] = degrees_to_metres(df["AP1_Latitude"][i]) # - lat_min
#     df["AP1_Longitude"][i] = degrees_to_metres(df["AP1_Longitude"][i]) # - lng_min

# Latitude and Longitude gaps
# lat_int = max(df["AP1_Latitude"]) - min(df["AP1_Latitude"])
# long_int = max(df["AP1_Longitude"]) - min(df["AP1_Longitude"])

df = add_activ_diff(df)
df = select_just_activ_info(df) # discard anchors
df = select_just_antenna(df, ANTENNA) # select just antena x
df['distance'] = df.apply(lambda row: dist_from_antenna4( row.AP1_Longitude, row.AP1_Latitude), axis=1)

# Prints
# print(df)
# print(df.columns)
# print(max(df["distance"]))
# print(mean(df["distance"]))
# sys.exit(0)

# Split the dataset into train and test
train_df, test_df = train_test_split(df, test_size=0.1, random_state=None)

# Discard testing (easy way)
train_df = df

# Split x and y

# Train with anchors
x_train = train_df.drop(["AP1_Latitude", "AP1_Longitude", "AP1_distance_Antenna"+ANTENNA, "distance"], axis=1)
x_test = test_df.drop(["AP1_Latitude", "AP1_Longitude", "AP1_distance_Antenna"+ANTENNA, "distance"], axis=1)

# Train with ricardo dist
# y_train = train_df["AP1_distance_Antenna"+ANTENNA]
# y_test = test_df["AP1_distance_Antenna"+ANTENNA]

# Train without anchors
# x_train = train_df[["AP1_280_Antenna4", "AP1_290_Antenna4", "AP1_300_Antenna4"]]
# x_test = test_df[["AP1_280_Antenna4", "AP1_290_Antenna4", "AP1_300_Antenna4"]]

# Train with rui dist
y_train = train_df["distance"]
y_test = test_df["distance"]

# Prints
print("x_train: ", x_train.keys())
print(y_train)
# with pd.option_context('display.max_rows', None, 'display.max_columns', None):
    # print(train_df)
    # print((test_df))

# Scale the training data
# scaler = StandardScaler()
# scaler = MinMaxScaler()
# x_train = pd.DataFrame(scaler.fit_transform(x_train))
# x_test = pd.DataFrame(scaler.transform(x_test))

# create a regressor object
models = [
    [neighbors.KNeighborsRegressor(n_neighbors = 1), "knn"],
    [DecisionTreeRegressor(random_state = 0), "dt"], 
    [RandomForestRegressor(), "rf"],
    [SVR(kernel = 'rbf'), "svr"],
    [GradientBoostingRegressor(), "gbr"]
    ]

# print(models)

for m in models:
    # fit the regressor with X and Y data
    m[0].fit(x_train.values, y_train.values)
    pred=m[0].predict(x_test.values) #make prediction on test set
    error = sqrt(mean_squared_error(y_test,pred)) #calculate rmse

    print("\n"+m[1])
    print("The error was "+"{:.2f}".format(error)+"m")

    # print("pred: \n"+str(pred))
    # print("y_test: \n"+str(y_test))

    # save the model to disk
    # filename = 'decision_tree_model.sav'
    pickle.dump(m[0], open(m[1]+"_activ_dif_antenna4_sim_calc_dist.sav", 'wb'))
    # pickle.dump(m[0], open(m[1]+"_activ_sim_calc_dist.sav", 'wb'))