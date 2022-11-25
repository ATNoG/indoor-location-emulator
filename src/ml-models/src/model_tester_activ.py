import sys
from numpy import zeros
from numpy.core.fromnumeric import mean
from sklearn.metrics import mean_squared_error 
from math import sqrt
import pandas as pd
import math
import glob
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA

ANTENNA = "4"

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

def select_just_activ_info(df):
    for col in df.columns:
        if "AP1" not in col:
            df = df.drop([col], axis=1) # creates a copy - does not modify object
    return df

def select_just_antenna(df, i):
    for col in df.columns:
        if ("Antenna"+str(i) not in col) and ("Longitude" not in col) and ("Latitude" not in col) and ("dif" not in col):
            df = df.drop([col], axis=1)
    return df

def drop_distances(df):
    for col in df.columns:
        if "distance" in col:
            df = df.drop([col], axis=1) # creates a copy - does not modify object
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

def get_coord_from_dist(dist, antenna_coord, antenna_angle):
    rad_angle = math.radians(antenna_angle)
    lng = degrees_to_metres(antenna_coord[0]) - math.sin(rad_angle) * dist
    lat = degrees_to_metres(antenna_coord[1]) + math.cos(rad_angle) * dist
    return [lng, lat]

def dist_2_points(p1, p2):
    return sqrt((p1[0]-p2[0])**2+(p1[1]-p2[1])**2)

def predict_using_anchors(model, ap_activ, x_row):
    for col in x_row.keys():
        if "Antenna4" not in col and "dif" not in col:
            x_row = x_row.drop([col])
    # print(x_row)
    return model.predict([x_row.values])[0]

# Antennas Info
antennas_lng = [-8.501325284692143, -8.50111192283839, -8.501123074490238, -8.500960698902418, -8.501073626657558, -8.501305841724843, -8.501202925271855, -8.501071442154796, -8.501118549969476]
antennas_lat = [40.897122305536556, 40.89719961439536, 40.89718266403685, 40.89703864175027, 40.896997403536886, 40.89709161419594, 40.897159324558885, 40.89706977899749, 40.89712226579502]
antennas_angles = [-67.50, 112.50, 157.00, 112.50, -67.50, -13.32, 86.19, -172.99, -147.07]

# Load ML models
algorithms = ["knn", "svr", "gbr", "rf", "dt"]
models_dict = {}
models_anchors_dict = {}
models_based_on_experiments = False # SWITCH MODELS
for alg in algorithms:
    if models_based_on_experiments:
        models_dict[alg] = pickle.load(open("activ_models/"+alg+".sav", 'rb')) # based on experiments
    else:
        # models_dict[alg] = pickle.load(open("activ_sim_models/"+alg+"_activ_sim.sav", 'rb')) # based on simulator - ricardo dist
        models_dict[alg] = pickle.load(open("activ_sim_models/"+alg+"_activ_sim_calc_dist.sav", 'rb')) # based on simulator - rui dist
    models_anchors_dict[alg] = pickle.load(open("activ_sim_models/"+alg+"_activ_dif_antenna4_sim_calc_dist.sav", 'rb')) # based on simulator - rui dist

# Getting the dataset
data_file_name = glob.glob("ss_rui_path_test*.csv")
df = pd.read_csv(data_file_name[0])

# Prints
# for col in df.columns:
#     print(col)
# print(df.iloc[[0]])
# sys.exit(0)

df['AP1_Longitude'] = df.apply(lambda row: degrees_to_metres(row.AP1_Longitude), axis=1)
df['AP1_Latitude'] = df.apply(lambda row: degrees_to_metres(row.AP1_Latitude), axis=1)
df = add_activ_diff(df) # diff between activations of AP and each anchor, regarding antenna 4
df = select_just_activ_info(df) # discard anchors
df = drop_distances(df) # drop distances from the AP to antennas
# df = select_just_antenna(df, ANTENNA) # select just antena x
# df['distance'] = df.apply(lambda row: dist_from_antenna4( row.AP1_Longitude, row.AP1_Latitude), axis=1)

# Prints
# print(df)
# print(df.columns)
# print(max(df["distance"]))
# print(mean(df["distance"]))
# sys.exit(0)

# Split x and y
x_df = df.drop(["AP1_Latitude", "AP1_Longitude"], axis=1)
y_df = df[['AP1_Longitude', "AP1_Latitude"]]

# Prints
# print(x_df.keys())
# print(y_df.keys())
# with pd.option_context('display.max_rows', None, 'display.max_columns', None):
    # print(train_df)
    # print((test_df))
# sys.exit(0)

# Scale the training data
# scaler = StandardScaler()
# scaler = MinMaxScaler()
# x_train = pd.DataFrame(scaler.fit_transform(x_train))
# x_test = pd.DataFrame(scaler.transform(x_test))

# Test the models
for model_i in range(len(algorithms)):
    loaded_model = models_dict[algorithms[model_i]]
    error_lst = []
    pred_coord = []
    true_coord = []
    for x_i, x_row in x_df.iterrows(): # iterate over the dataframe rows
        # print(x_i, x_row, y_df.iloc[[x_i]].values[0])
        dist_to_antennas = []
        for antenna in range(1, 10):
            model_data = [x_row["AP1_280_Antenna"+str(antenna)], x_row["AP1_290_Antenna"+str(antenna)], x_row["AP1_300_Antenna"+str(antenna)]]
            if model_data == [0, 0, 0]:
                dist_to_antennas.append(20)
            else:
                if antenna == 4 and not models_based_on_experiments:
                    dist_to_antennas.append(predict_using_anchors(models_anchors_dict[algorithms[model_i]], model_data, x_row))
                else:
                    dist_to_antennas.append(loaded_model.predict([model_data])[0])
        min_dist = min(dist_to_antennas)
        min_dist_i = dist_to_antennas.index(min_dist)
        asset_coords_predicted = get_coord_from_dist(min_dist, [antennas_lng[min_dist_i], antennas_lat[min_dist_i]], antennas_angles[min_dist_i])
        
        error = dist_2_points(asset_coords_predicted, y_df.iloc[[x_i]].values[0])
        if min_dist != 20:
            error_lst.append(error)
            pred_coord.append(asset_coords_predicted)
            true_coord.append(y_df.iloc[[x_i]].values[0])
        # print(min_dist_i, error)
    # print(pred_coord)
    rmse = sqrt(mean_squared_error(true_coord, pred_coord))
    print(algorithms[model_i])
    # print("Predicted rows:", predicted_rows)
    print("RMSE:", rmse)
    print("Average error:", mean(error_lst))


