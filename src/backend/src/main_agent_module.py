# coding: utf-8

"""
The Paho MQTT Client Backend Calculations Module Documentation.

Backend Agent that process Distances, RSSI & Activations (from an Antenna RF) calculations:
- Uses threading and queues to deal with the amount of received messages in broker.
- Subscribes to mqtt topic to get from received messages, the antennas, asset-points and anchors coordinates values to perform calculations. 
- Publishes a new message in another topic to be used by Predictor agent to predicts and return the processed values to frontend.  

"""

import paho.mqtt.client as mqtt
import numpy as np
import time
import csv
import math
import json
import geojson
import random
import threading
import queue
import urllib.request
import statistics
from turfpy import measurement
from turfpy.misc import line_segment, line_intersect
from geojson import Point, Feature, LineString, FeatureCollection
from shapely.geometry import Point
from scipy import interpolate
from scipy.optimize import curve_fit
from joblib import Parallel, delayed
from typing import Literal
from src.asset_classes_module import * 
import cProfile

# profiler to check performances
#profiler = cProfile.Profile()

# Set decimal places in geojson messages
# Source: http://wiki.gis.com/wiki/index.php/Decimal_degrees
geojson.geometry.Geometry.__init__.__defaults__ = (None, False, 8)

# save previous values to verify changes
previousValues = {}

# global var to get first msg
first_msg = []

# global dict to get walls_by_quadrants by session
walls_by_quadrants = {}

# global dict to get featuresType by session
featuresType = {}

# global domain_name_server
domain_name_server = "http://10.0.12.91/sdrt/"

# MQTT Variables
Connected = False           # Global var to set Connected STATE
broker_host = "10.0.12.91"  # Broker address
broker_port = 9001          # Broker port
broker_keepalive = 60       # Connection keepalive
user = "username"           # Connection username
password = "password"       # Connection password

# Subscription topic to receive messages
reception_topic_backend = "/topic_backend"      # Subscription topic

# Publish topic for predictions
publish_topic_predictor = "/topic_predictor"    # Publish topic for predictor
publish_topic_frontend = "/topic_simulator"     # Publish topic for frontend
# Publish topic for frontend csv file
publish_topic_to_csv_file = publish_topic_frontend

########## Queue worker ##########
# Deal with Mqtt message arrival frequency
def queueWorker():
    """
    Queue to deal with frequency of MQTT message arrival
    """
    lastIteration = time.time()
    item = None
    count = 0
    calculate_cache = {}

    while True:
        try:
            item = q.get(block=item is None)
            count += 1
            print("==========> Start of Iteration:", count, "<========== \n")

        except queue.Empty:
            #print ("Warning: Queue is Empty. \n")
            continue

        if time is None:
            continue
        
        # set timestap of loop start
        now = time.time()

        try:  
            # update god with received message data    
            for i in item[1]:
                if i == "uuid":
                    god.setSessionUUID(item[1][i])
                elif i == "map":
                    god.setMapId(item[1][i], item[1]["uuid"])
                elif i == "ap":
                    god.updateAssetPoint(item[1][i], item[1]["uuid"])
                elif i == "ant":
                    god.updateAntenna(item[1][i], item[1]["uuid"])
                elif i == "anchors":
                    god.updateAnchor(item[1][i], item[1]["uuid"])
                elif i == "algs":
                    god.setAlgorithms(item[1][i], item[1]["uuid"])
                elif i == "read_rate":
                    god.setReadRateParam(item[1][i], item[1]["uuid"])
                elif i == "rp":
                    god.setRssiParams(item[1][i], item[1]["uuid"])
                elif i == "status":
                    god.setStatus(item[1][i], item[1]["uuid"])

            # call calculate (calculate will send the mqtt messages to frontend and predictor)
            calculate(item[0], item[1]["uuid"], calculate_cache)

            # calculate queue wait time and worker loop time 
            wait_time = min((god.getReadRateParam(item[1]["uuid"]) / 1000), max(0, (god.getReadRateParam(item[1]["uuid"]) / 1000) - (now - lastIteration)))
            print("Queue wait time:", wait_time, "seconds |", "Worker loop time:", now - lastIteration, "seconds \n")
            lastIteration = now
            
            # sleep communication to the queue wait time
            time.sleep(wait_time)
            print("==========>  End of Iteration:", count, " <==========", "\n")
        except:
            print("Exception occurred: Possibly session uuid not recognized. Wait Full-Update message.")

#################### Distances and RSSI calculations ####################
# Apply RSSI calculations
def measure_RSSI(txPower: float, pathLossExpoent: float, constantFading: float, skewIndex: float, referenceDistance: float, distance: float, attenuation: float) -> float:
    """
    Function to perform RSSI calculations.

    Source: "Indoor Positioning Algorithm Based on the Improved RSSI Distance Model" - DOI: <https://doi.org/10.3390/s18092820> 
    
    $$
        RSSI = -10 n \\log(\\frac{d}{d_0}) + A + X_σ - (nr_{mwi} \\times a_{f[dBm]})
    $$

    where:
    - $d$ is the distance between the transmitter and the receiver.
    - $d_0$ is the reference distance (for convenience of calculation $d_0$ usually takes a value of $1$ $meter$).
    - $n$ is a path-loss parameter ($n = 2 .. 4$) related to the specific wireless transmission environment. The more obstacles there are, the larger $n$ will be.
    - $A$ is the RSSI with distance $d_0$ from the transmitter.
    - $X_σ$ is a Gaussian-distribution random variable with mean $0$ and variance $σ^{2}$.
    - $nr_{mwi}$ is number of signal intersections with map walls.
    - $a_f$ is the attenuation factor assumed of $1$ $dBm$.


    Since $X_σ$ has a mean of $0$, the distance-loss model can be obtained with:
    
    $$
        RSSI = -10 n \\log(d) + A - (nr_{mwi} \\times a_{f[dBm]})
    $$

    Args:
        txPower (float): Transmission Power of the Radio Frequency Signal Propagation of the Antenna object
        pathLossExpoent (float): Path Loss Expoent of the Radio Frequency Signal Propagation of the Antenna object
        constantFading (float): Constant of Fading of the Radio Frequency Signal Propagation of the Antenna object
        skewIndex (float): Skew Index of the Radio Frequency Signal Propagation of the Antenna object
        referenceDistance (float): Reference Distance of the Radio Frequency Signal Propagation of the Antenna object
        distance (float): Distance of the Measurement in the Radio Frequency Signal Propagation of the Antenna object
        attenuation (float): Attenuation Factor (1 dBm) by each wall between Antenna and Asset Point object
        
    Returns:
        float: Calculated RSSI value.
    """
    measuredRSSI = - (10 * pathLossExpoent * math.log10(distance / referenceDistance)) + txPower + random_gaussian_dist(-constantFading, constantFading, skewIndex) - attenuation

    if (measuredRSSI > 0):
        measuredRSSI = -0.99
    return measuredRSSI

# Generation the random value of Gaussian distribution - Xg
def random_gaussian_dist(min: float, max: float, skew: float) -> float:
    """
    Function generate a Random Gaussian Distribuition

    Args:
        min (float): minimum value of Gaussian Distribuition
        max (float): maximum value of Gaussian Distribuition
        skew (float): skew index value of Gaussian Distribuition
 
    Returns:
        float: A Random Gaussian Distribuition with applied noise.
    """
    u = 0
    v = 0
    while (u == 0):
        u = random.random()  # Converting (0,1) to (0,1)
    while (v == 0):
        v = random.random()

    num = math.sqrt(-2.0 * math.log(u)) * math.cos(2.0 * math.pi * v)

    num = num / 10.0 + 0.5  # Translate to 0 -> 1
    if (num > 1 or num < 0):
        # resample between 0 and 1 if out of range
        num = random_gaussian_dist(min, max, skew)
    else:
        num = math.pow(num, skew)  # Skew
        num *= max - min  # Stretch to fill range
        num += min  # Osffset to min
    return num

# Measure distances between point (asset point or anchor) and antennas
def measure_distances_to_antennas(points_data: list, antennas_data: list) -> list:
    """
    Measure Distances between a point (asset point or anchor) and the antennas.

    Args:
        points_data (list): List of Points data (Asset Points or Anchors)
        antennas_data (list): List of Antennas data
 
    Returns:
        list: All distances between a set of points (Asset Points or Anchors) and the Antennas in the Map
    """
    distances = []
    dists_by_point = []

    for point in points_data:
        pointLongLat = point.getCoords()

        for antenna in antennas_data:
            antennaLongLat = antenna.getCoords()

            start = Feature(geometry=Point(
                (float(pointLongLat[0]), float(pointLongLat[1]))))
            end = Feature(geometry=Point(
                (float(antennaLongLat[0]), float(antennaLongLat[1]))))

            # calculate the distance and convert Units from 'km' to 'm'
            line = measurement.distance(start, end)
            distance_value = round((line * 1000 * 100) / 100, 20)
            dists_by_point.append(round(distance_value, 2))

        distances.append(dists_by_point)
        dists_by_point = []

    return distances

# Return knowing angle of the line of sight
def get_line_of_sight_angle(line: list) -> float:
    """
    Get the Line of Sight Angle between a Point (Asset Points or Anchors) and the Antennas in the Map

    Args:
        line (list): List of Line points data
 
    Returns:
        float: Angle direction of line of sight between a Point (Asset Points or Anchors) and the Antennas in the Map
    """
    ap_coordinates = line.geometry.coordinates[0]
    antenna_coordinates = line.geometry.coordinates[1]

    delta_lat = ap_coordinates[1] - antenna_coordinates[1]
    delta_lng = ap_coordinates[0] - antenna_coordinates[0]

    radians = math.atan2(delta_lat, delta_lng)

    result_angle_degrees = radians * (180 / math.pi) - 90

    return result_angle_degrees

# Check Antenna Direction Intersection from line of sight
# passing the direction and opening angles
def check_antenna_direction_intersection(line_angle: float , antenna_direction_angle: float, antenna_opening_angle: float) -> bool:
    """
    Check if a Line of Sight is directionated with a specific Antenna Radio Frequency Signal Propagation 

    Args:
        line_angle (float): Angle Direction of the Line of Sight
        antenna_direction_angle (float): Angle Direction of the Radio Frequency Signal Propagation Lobe of the Antenna class object
        antenna_opening_angle (float): Angle opening of the Radio Frequency Signal Propagation Lobe of the Antenna class object
 
    Returns:
        bool: Result of the line of sight is or not directionated with a specific Antenna Radio Frequency Signal Propagation 
    """
    result_abs_angle = np.abs(line_angle - antenna_direction_angle)

    if result_abs_angle > 180:
        result_abs_angle = np.abs(result_abs_angle - 360)

    return (result_abs_angle - antenna_opening_angle/2 <= 0)

# Check Antenna Direction Intersection from line of sight
# passing the direction and opening angles
def check_asset_point_directions_intersections(line_angle: float, ap_large_lobe_direction_angle: float, ap_large_lobe_opening_angle: float, ap_small_lobe_direction_angle: float, ap_small_lobe_opening_angle: float) -> bool:
    """
    Check if a Line of Sight is directionated with a specific Asset Point Radio Frequency Signal Propagation Large or Small Lobe

    Args:
        line_angle (float): Angle Direction of the Line of Sight
        ap_large_lobe_direction_angle (float): Angle Direction of the Radio Frequency Signal Propagation Large Lobe of the Asset Point class object
        ap_large_lobe_opening_angle (float): Angle Opening of the Radio Frequency Signal Propagation Large Lobe of the Asset Point class object
        ap_small_lobe_direction_angle (float): Angle Direction of the Radio Frequency Signal Propagation Small Lobe of the Asset Point class object
        ap_small_lobe_opening_angle (float): Angle Opening of the Radio Frequency Signal Propagation Small Lobe of the Asset Point class object
 
    Returns:
        bool: Result of the line of sight is or not directionated with a specific Asset Point Radio Frequency Signal Propagation Large or Small Lobe
    """
    
    result_abs_large_angle = np.abs(line_angle - ap_large_lobe_direction_angle)
    result_abs_small_angle = np.abs(line_angle - ap_small_lobe_direction_angle) 

    if result_abs_large_angle > 180:
        result_abs_large_angle = np.abs(result_abs_large_angle - 360)

    if result_abs_small_angle > 180:
        result_abs_small_angle = np.abs(result_abs_small_angle - 360)

    result_large = (result_abs_large_angle - ap_large_lobe_opening_angle/2 <= 0)
    result_small = (result_abs_small_angle - ap_small_lobe_opening_angle/2 <= 0)
    
    if(result_large == True or result_small == True):
        result = True
    else:        
        result = False
    return result

# Get antenna directions intersections with lines of sight anchors
def catch_antenna_directions_intersections_with_anchors(anchor_line_points: list, antennas_data: list) -> list:
    """
    Check if Lines of Sights of the Anchors are directionated with the Antennas Radio Frequency Signal Propagation

    Args:
        lines (list): List of Points of a Line of Sight of an Anchor
        antennas_data (list): List of Antennas data
       
    Returns:
        list: Boolean results of lines of sight of an Anchor, if are or not directionated with the Antennas Radio Frequency Signal Propagation in the Map
    """

    dir_intersections = []

    for i in range(len(anchor_line_points.features)):
        line_angle = get_line_of_sight_angle(anchor_line_points.features[i])
        result_bool = bool(check_antenna_direction_intersection(line_angle, 
            float(antennas_data[i].direction), float(antennas_data[i].opening)))
        dir_intersections.append(result_bool)

    return dir_intersections

# Get antenna directions intersections with lines of sight asset points
def catch_antenna_directions_intersections_with_asset_points(ap_line_points: list, asset_point_data: list, antennas_data: list) -> list:
    """
    Check if Lines of Sight of the Asset Points Anchors are directionated with the Antennas Radio Frequency Signal Propagation

    Args:
        ap_lines (list): List of Points of a Line of Sight of an Asset Point
        asset_point_data (list): Asset point properties data
        antennas_data: List of Antennas data
       
    Returns:
        list: Boolean results of lines of sight of an Asset Point, if are or not directionated with the Antennas Radio Frequency Signal Propagation in the Map
    """
    dir_intersections = []

    for i in range(len(ap_line_points.features)):
        line_angle = get_line_of_sight_angle(ap_line_points.features[i])
        antenna_intersect_result_bool = bool(check_antenna_direction_intersection(
            line_angle, 
            float(antennas_data[i].direction), 
            float(antennas_data[i].opening))
        )
        
        asset_point_intersect_result_bool = bool(check_asset_point_directions_intersections(
            line_angle + 180, # add +180 degrees in that case
            float(asset_point_data.largeDirection), 
            float(asset_point_data.largeOpening), 
            float(asset_point_data.smallDirection), 
            float(asset_point_data.smallOpening))
        )

        if(antenna_intersect_result_bool == True and asset_point_intersect_result_bool == True):
            result = True
        else:        
            result = False

        dir_intersections.append(result)

    return dir_intersections

# Get walls from the map
def catch_map_walls(geojson_map: list, map_walls_filter_keywords: list, map_walls_filter_levels: list) -> list:
    """
    Get the walls features from the imported Map.

    Args:
        geojson_map (list): List GeoJSON map features
        session_uuid (str): Frontend session UUID
        map_walls_filter_keywords (list): List of keywords to filter walls of the map
        map_walls_filter_levels (list): List of floor levels to filter walls of the map 
       
    Returns:
        list: Features refered to map walls (filtered by some keywords)
    """
    walls_data = []

    for polygon in geojson_map.features:
        currentWallSet = []

        # convert polygon to line segments
        walls = line_segment(polygon)

        for level in map_walls_filter_levels:
            for keyword in map_walls_filter_keywords:
                for wall in walls.features:
                    wall.properties = polygon.properties

                    # apply filter data (only on level 0, for "room" and "area", and not for "stairs")
                    if ((str(level) in wall.properties['level']) and (keyword in wall.properties['name'])):
                        # populate array of currentWallSet
                        currentWallSet.append(wall)
                       

        if len(currentWallSet) > 0:
            # populate array of walls_data
            walls_data.append(currentWallSet)

    return walls_data

# catch the Lines Of Sight
def catch_lines_of_sight(some_point: Anchor or AssetPoint, antennas_data: list) -> FeatureCollection:
    """
    Get the lines of sight features between some Point (Asset Points or Anchors) and Antennas

    Args:
        some_point (Anchor or AssetPoint): Point (Asset Point or Anchor) properties data
        antennas_data (list): List of Antennas data
       
    Returns:
        FeatureCollection: Features with lines of sight of some_point (Anchor or AssetPoint)
    """
    lines_data = []

    for antenna in antennas_data:
        # create a line between some_point (Asset Points or Anchors) and all of 'geojson_antennas'
        line = Feature(geometry=LineString([(float(some_point.lng), float(
            some_point.lat)), (float(antenna.lng), float(antenna.lat))]))
        # populate array of lines_data
        lines_data.append(line)

    # parse to FeatureCollection
    lines = FeatureCollection(lines_data)
    return lines

# function to verify the Quadrants of a Point

def verify_point_in_quad(some_point: list) -> int:
    """
    Get the Quadrant where some point is.

    Quadrants order:
    #Q0 Q1
    #Q3 Q2

    Args:
        some_point (list): Point (Asset Point or Anchor) coordinates
       
    Returns:
        int: Value with result Quadrant where some point is
    """
    if some_point[0] >= matrix_quadrants_long:  # right
        if some_point[1] >= matrix_quadrants_lat:  # top
            return 1  # Q1
        else:  # bottom
            return 2  # Q2
    else:  # left
        if some_point[1] >= matrix_quadrants_lat:  # top
            return 0  # Q0
        else:  # bottom
            return 3  # Q3

# function organize Line Segment Walls by Quadrants
def get_line_segment_walls_by_quad(walls_array: FeatureCollection) -> list:
    """
    Get the line segments walls divided by Quadrants.

    Quadrants order:
    #Q0 Q1
    #Q3 Q2

    Args:
        walls_array (FeatureCollection): FeatureCollection with array of walls data
       
    Returns:
        list: The 4 Quadrants with respective divided walls
    """

    quadrants = [[], [], [], []]

    # iterate by walls_array
    for wall in walls_array:
        # iterate by wall
        for wallSection in wall:
            # get line segment coordinates
            line_seg = wallSection.geometry.coordinates
            # verify quadrant for the points
            quad_of_line_point1 = verify_point_in_quad(line_seg[0])
            quad_of_line_point2 = verify_point_in_quad(line_seg[1])
            # calculate difference module between quadrants of both points
            dif_abs = np.abs(quad_of_line_point1 - quad_of_line_point2)

            # verify results
            if dif_abs == 0:
                quadrants[quad_of_line_point1].append(wallSection)
            elif dif_abs == 1 or dif_abs == 3:
                quadrants[quad_of_line_point1].append(wallSection)
                quadrants[quad_of_line_point2].append(wallSection)
            else:
                quadrants[0].append(wallSection)
                quadrants[1].append(wallSection)
                quadrants[2].append(wallSection)
                quadrants[3].append(wallSection)

    return quadrants

# function to catch quadrants where lines of sight are pass
def get_quadrants_of_lines(lines_data: list) -> list:
    """
    get_quadrants_of_lines - Get the Lines of Sight divided by Quadrants.

    Quadrants order:
    #Q0 Q1
    #Q3 Q2

    Args:
        lines_data (list): Array of lines of sight data
       
    Returns:
        list: Lines of Sight with respective Quadrants where each line are passing
    """

    lines = []

    # iterate by lines_data.features object
    for feature in range(len(lines_data.features)):
        # append an empty array for each feature
        lines.append([])
        # get line segment coordinates
        line_seg = lines_data.features[feature].geometry.coordinates
        # verify quadrant for the points
        quad_of_line_point1 = verify_point_in_quad(line_seg[0])
        quad_of_line_point2 = verify_point_in_quad(line_seg[1])
        # calculate difference module between quadrants of both points
        dif_abs = np.abs(quad_of_line_point1 - quad_of_line_point2)

        # verify results
        if dif_abs == 0:
            lines[feature].append(quad_of_line_point1)
        elif dif_abs == 1 or dif_abs == 3:
            lines[feature].append(quad_of_line_point1)
            lines[feature].append(quad_of_line_point2)
        else:
            lines[feature].append(0)
            lines[feature].append(1)
            lines[feature].append(2)
            lines[feature].append(3)

    return lines

# Process Line function to deal with wall_intersections line by line in each quadrant array
def process_line_segment(line: list, quadrant_array: list, walls_by_quadrant: list) -> int:
    """
    Deal with wall intersections counter by line in each quadrant array
    
    Quadrants order:
    #Q0 Q1
    #Q3 Q2

    Args:
        line (list): Line of sight coordinates data 
        quadrant_array (list): Quadrant array with respective divided walls
        walls_by_quadrant (list): Array of walls data divided by quadrants
       
    Returns:
        int: Result value with the wall intersections counter by a line-of-sight
    """
    currentLine = []

    for quad in quadrant_array:
        for wall in walls_by_quadrant[quad]:
            intersection = line_intersect(line, wall)

            if len(intersection.features) > 0:
                # if intersection point is not already in currentLine
                if not intersection in currentLine:

                    # populate array of currentLine
                    currentLine.append(intersection)

    # count amout of wall Intersections
    counter = len(currentLine)

    return counter

# Catch the Wall Intersections in Lines Of Sight
def catch_wall_intersections(lines: list, lines_by_quad: list, walls_by_quad: list) -> list:
    """
    Catch the Wall Intersections in Lines Of Sight

    Args:
        lines (list): Array of lines of sight data
        lines_by_quad (list): Array of Lines divided by Quadrants
        walls_by_quad (list): Array of walls divided by Quadrants
       
    Returns:
        list: Intersections results integer divided by lines of sight 
    """
    tstart = time.time()
    num_cores = 8

    # use of Parallel for loop
    wall_intersections = Parallel(n_jobs=num_cores)(delayed(process_line_segment)(
        lines.features[line], lines_by_quad[line], walls_by_quad) for line in range(len(lines.features)))

    print("CatchWallIntersections time:", time.time() - tstart, "\n")

    return wall_intersections

# Read csv file and average values of multiple iterations
# delete irrelevant columns
def csv_to_avg_list(file: str) -> dict:
    """
    Read csv file to a dictionary and average values of multiple iterations, delete irrelevant columns.

    Args:
        file (str): Dataset of experimental Antenna RF data
       
    Returns:
        dict: Experimental Antenna RF data with averaged values of multiple iterations, delete irrelevant columns
    """
    output = {} # dict of dicts
    count = 0 # number of iterations to make the average
    distance_list = [] # list of distances | first keys of the output dict
    
    csvReader = csv.DictReader(file) # reads the csv file
    
    # iterate over the csv file
    for row in csvReader: 
        # add the distance values to the list and counts the number of iterations
        if row['distance'] not in distance_list:
            # append row to list of distances
            distance_list.append(row['distance'])
            count = 1 
        else:
            # increment the counter
            count += 1

    # creates a dict in the output dict
    for dist in distance_list:
        output[dist] = {}

    # reset reader to the csv file start, re-reads the csv file
    csvReader = csv.DictReader(file) 
    
    # iterate over the csv file
    for row in csvReader:
        # for every distance key
        for key in row.keys():
            if key not in output[row['distance']]:
                # add the value of the field
                output[row['distance']][key] = [float(row[key])]
            else:
                # accumulates the values of each field
                output[row['distance']][key].append(float(row[key]))

    output_dict = {}

    # for each distance, it calculates the average of each field
    # delete irrelevant columns
    for dist in distance_list:
        keys_to_delete = []
        for key in output[dist].keys():
            if not key.isdigit():
                keys_to_delete.append(key)

        # # remove 'distance' from output dict
        # del output[dist]['distance']
        
        for key in keys_to_delete:
            del output[dist][key] 

        for key in output[dist].keys():
            if not key.isdigit():
                keys_to_delete.append(key)

            # remove outliers
            dif = len(output[dist][key])
            dif = dif - len(output[dist][key])

            # calculate the average
            output[dist][key] = statistics.mean(output[dist][key])
            # output[dist][key] = output[dist][key] / count

        output_dict[dist] = output[dist]

        # convert dicts to lists of values
        output[dist] = list(output[dist].values())

    return output #, output_dict

# Read csv file to dict
# Delete irrelevant columns
def csv_to_dict(file: str) -> dict:
    """
    Read csv file to a dictionary, delete irrelevant columns.

    Args:
        file (str): Dataset of experimental Antenna RF data
       
    Returns:
        dict: Experimental raw Antenna RF data, delete irrelevant columns
    """
    output = {}  # dict of dicts
    count = 0  # number of iterations to make the average
    distance_list = []  # list of distances | first keys of the output dict

    csvReader = csv.DictReader(file)  # reads the csv file

    # iterate over the csv file
    for row in csvReader:
        # add the distance values to the list and counts the number of iterations
        if row['distance'] not in distance_list:
            # append row to list of distances
            distance_list.append(row['distance'])
            count = 1
        else:
            # increment the counter
            count += 1

    # creates a dict in the output dict
    for dist in distance_list:
        output[dist] = {}

    # reset reader to the csv file start, re-reads the csv file
    csvReader = csv.DictReader(file)

    # iterate over the csv file
    for row in csvReader:
        # for every distance key
        for key in row.keys():
            if key not in output[row['distance']]:
                # creates a list of the field
                output[row['distance']][key] = [float(row[key])]
            else:
                # appends the values of each field
                output[row['distance']][key].append(float(row[key]))

    for dist in distance_list:
        keys_to_delete = []
        for key in output[dist].keys():
            if not key.isdigit():
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del output[dist][key] 

        # # remove 'distance' from output dict
        # del output[dist]['distance']

    return output

# dict of means and standard deviations
def dict_mean_std(dict: dict) -> dict:
    """
    Create a dictionary of means and standard deviations

    Args:
        dict (dict): Experimental Antenna RF data
       
    Returns:
        dict: Means and standard deviations of experimental Antenna RF data
    """
    
    output = {}
    for key in dict.keys():
        output[key] = {}
        for sub_key in dict[key].keys():
            mean = sum(dict[key][sub_key]) / len(dict[key][sub_key])
            std = np.std(dict[key][sub_key])
            output[key][sub_key] = {"mean": mean, "std": std}
    return output

# Returns the maximum element of a list of numbers no grater than a given value
def max_no_greater_value(data: list, value:float) -> float:
    """
    Returns the maximum element of a list of numbers no grater than a given value

    Args:
        data (list): A list of values
        value (float): the element itself
    Returns: 
        float: Value result of the maximum element of a list of numbers no grater than a given value
    """
    
    data = sorted(data)
    output = data[0]
    for val in data:
        if val > value:
            break
        output = val
    return output

# sigmoid function
# source: https://stackoverflow.com/questions/55725139/fit-sigmoid-function-s-shape-curve-to-data-using-python
def sigmoid(x: np.ndarray, L: float, x0: float, k: float, b: float) -> np.ndarray:
    """
    Sigmoid Function source: https://stackoverflow.com/questions/55725139/fit-sigmoid-function-s-shape-curve-to-data-using-python
    The parameters optimized are L, x0, k, b, who are initially assigned in p0, the point the optimization starts from.

    Args:
        x (np.array): Array of data to apply the optimization
        L (float): is responsible for scaling the output range from [0,1] to [0,L]
        x0 (float): is the point in the middle of the Sigmoid, i.e. the point where Sigmoid should originally output the value 1/2 [since if x=x0, we get 1/(1+exp(0)) = 1/2].
        k (float): is responsible for scaling the input, which remains in (-inf,inf)
        b (float): adds bias to the output and changes its range from [0,L] to [b,L+b]
    
    Returns:
        np.ndarray: The sigmoid function curve.
    """
   
    y = L / (1 + np.exp(-k*(x-x0))) + b
    return y

# inverse sigmoid function
# source: https://stackoverflow.com/questions/43213069/fit-bipolar-sigmoid-python/43213692#43213692
def inv_sigmoid(x: np.ndarray, a: float, b: float, c: float, d: float) -> np.ndarray:
    """
    Inverse Sigmoid Function source: https://stackoverflow.com/questions/43213069/fit-bipolar-sigmoid-python/43213692#43213692

    Args:
        x (np.ndarray): Array of data to apply the optimization
        a (float): adjusts amplitude; 
        b (float): adjusts y offset; 
        c (float): adjusts x offset; 
        d (float): adjusts slope
    
    Returns:
        np.ndarray: The inverse sigmoid function curve.
    """
    y = ((a-b) / (1 + np.exp(x-(c/2))**d)) + b
    return y

# to apply exponential regression from 1 Dimension array
def exponential_regression_1D_array(value: float, xData: np.ndarray, yDataArray: np.ndarray, dictOfStdsAvgs: dict) -> list:
    """
    Apply the exponential regression from 1 Dimension array

    Args:
        value (float): The value we must evaluate
        xData (np.ndarray): X-axis array values
        yDataArray (np.ndarray): Y-axis array values
        dictOfStdsAvgs (dict): A dictionary of Standard Deviations and Averages of experimental Antenna RF data
    
    Returns:
        list: The exponential regression array of values from 1 Dimension array for each antenna RF transmission power (280, 290, 300 mW)
    """
    out = []
    out_noised = []
    n = len(yDataArray[0])
    for i in range(n):
        x = np.linspace(np.min(xData), np.max(xData), len(xData))
        y = yDataArray[:, i]

        # this is an mandatory initial guess
        p0_sig = [max(y), np.median(x), 1, min(y)]
        p0_inv_sig = [max(y), min(y), max(x), 1.0]

        # curve_fit call
        popt, pcov = curve_fit(inv_sigmoid, np.concatenate((x[:6],x[10:])), np.concatenate((y[:6],y[10:])), p0_inv_sig, maxfev=10000, method='dogbox')

        # append result to out list
        out.append(np.round(inv_sigmoid(value, *popt), 4))

        # get standard deviation to gaussian distribuition noise
        if f'{float(value)}' not in dictOfStdsAvgs:
            under_value = max_no_greater_value(xData, value)
            stdev_out = list(dictOfStdsAvgs[f'{under_value}'].values())[i]['std']
        else:
            stdev_out = list(dictOfStdsAvgs[f'{float(value)}'].values())[i]['std']

        # calculate the gaussian distribuition noise of standard deviation
        noise = np.random.normal(0, stdev_out)

        # sum noise to output value and round to 4 decimal places
        sum = round(out[i] + noise, 4)

        # clip to 0 if value is negative, append result to out_noised list
        if sum >= 0:
            out_noised.append(sum)
        else:
            out_noised.append(0)

        '''
        # output value (Figures/Plots)
        output_value = out_noised[i]

        a = round(popt[0],4)
        b = round(popt[1],4)
        c = round(popt[2],4)
        d = round(popt[3],4)
        plt.figure()
        plt.plot(x,y,'o', color='black', label="Raw Data")
        plt.plot(x, inv_sigmoid(x, *popt), 'g-', label=f"Fitted Curve")
        plt.plot(xc, inv_sigmoid(xc, *popt), 'r-', label="Selectable Fitted Curve")
        plt.plot(value, output_value, 'x', color='orange', label=f"output of {value}: {output_value}") 
        plt.title(f"Exponential regression of column {i}")
        plt.xlabel('Distance')
        plt.ylabel(f'data column {i}')
        plt.legend(loc='best')
        plt.show()
        plt.savefig(f"test_data_exp_regr_col_{i}.png")
        print(f"col {i} - The equation of the line is: y(x) = (({a} - {b}) / (1 + np.exp(x -({c}/2))**{d})) + {b})")
        '''
    return out_noised

# to interpolate or extrapolate data from 1 dimention array (Uncalled)
def interpolate_extrapolate_1D_array(value: float, xData: np.ndarray, yDataArray: np.ndarray, dictOfStdsAvgs: dict, kind: Literal['linear','quadratic', 'cubic']) -> list:
    """
    Apply the interpolation or extrapolation from 1 Dimension array

    Args:
        value (float): The value we must evaluate
        xData (np.ndarray): X-axis array values
        yDataArray (np.ndarray): Y-axis array values
        dictOfStdsAvgs (dict): A dictionary of Standard Deviations and Averages of experimental Antenna RF data
        kind (Literal['linear','quadratic', 'cubic']): Type o regression to apply (linear, quadratic, cubic)
    
    Returns:
        list: The interpolation or extrapolation regression array of values from 1 Dimension array for each antenna RF transmission power (280, 290, 300 mW)
    """
    out = []
    out_noised = []
    n = len(yDataArray[0])
    for i in range(n):
        x = np.linspace(np.min(xData), np.max(xData), 20)
        y = yDataArray[:, i]

        func = interpolate.interp1d(x, y, kind=kind, fill_value="extrapolate")

        out.append(np.round(func(value), 3))

        # get mean noise and standard deviations to gaussian distribuition noise
        if str(float(value)) not in dictOfStdsAvgs:
            under_value = max_no_greater_value(xData, value)
            stdev_out = list(dictOfStdsAvgs[f'{under_value}'].values())[i]['std']
        else:
            stdev_out = list(dictOfStdsAvgs[f'{float(value)}'].values())[i]['std']

        noise = np.random.normal(0, stdev_out)
        sum = out[i] + noise

        if sum >= 0:
            out_noised.append(sum)
        else:
            out_noised.append(0)
        '''
        # output value
        output_value = out_noised[i]

        plt.figure()
        plt.plot(x, y, 'o', color='black', label = 'Raw Data')
        plt.plot(x, func(x), '-', color='green', label = f"Fit Data - {kind}") 
        plt.plot(value, output_value, 'x', color='orange', label = f"output of {value}: {output_value}")
        plt.title(f"Interpolation/Extrapolation: {kind}")
        plt.xlabel('Distance')
        plt.ylabel(f'data column {i}')
        plt.legend()
        plt.show()
        plt.savefig(f"{directory_name}/test_interp_extrapolation_col{i}.png")
        '''
    return out_noised

# 1 Calculate Distances & RSSI & Activations, using in-memory cache to increase process time
# 2 Get Values from LookUptable (Dictionary) with Experimental Data of Antenna RF
# 3 Publish Result Messages to the broker in respective defined topics
def calculate(client: mqtt.Client, session_uuid: str, calculate_cache: dict):
    """
    **Main function of backend caculations process, divided in stages:**

    1. Calculate Distances & RSSI & Activations, using in-memory cache to increase process time.
    2. Get Values from LookUptable (Dictionary) with Experimental Data of Antenna RF.
    3. Publish Result Messages to the broker in respective defined topics.

    Args:
        client (mqtt.Client): The client Id
        session_uuid (str): The Frontend session uuid
        calculate_cache (dict): In-memory cache dictionary used upgrade performance calculations
    """
    # profiler.enable()
    #t_start = time.time()

    global first_msg
    global geojson_map
    global featuresType
    global walls_by_quadrants
    global stdev_mean_dict
    global antenna_experimental_distances
    global antenna_experimental_values
    global matrix_quadrants_long
    global matrix_quadrants_lat
    global domain_name_server

    # verify if status (close) is on message
    if(god.getStatus(session_uuid) == "close"):
        previousValues[session_uuid] = []
        return 

    # verify if current_uuid was not saved previously
    if(session_uuid not in previousValues):
        previousValues[session_uuid] = []

    if(session_uuid not in first_msg):
        if(god.getMapId(session_uuid) == 0):
            # open config file
            config_file_url = urllib.request.urlopen(
                f"{domain_name_server}/static-objects/config_files/config-params-library-ua-floor2.json")
        elif(god.getMapId(session_uuid) == 1):
            # open config file
            config_file_url = urllib.request.urlopen(
                f"{domain_name_server}/static-objects/config_files/config-params-aveiro-it-building1.json")
        elif(god.getMapId(session_uuid) == 2):
            # open config file
            config_file_url = urllib.request.urlopen(
                f"{domain_name_server}/static-objects/config_files/config-params-sjm-policlinica-mario-martins.json")

        # read config data file
        config_data = config_file_url.read().decode('utf-8')
        # load to geojson
        config_json = json.loads(str(config_data))
        # read map_url, Long, Lat values to define a Matrix of Quadrants in the Map
        matrix_quadrants_long = config_json["map"]["map_center"][0]
        matrix_quadrants_lat = config_json["map"]["map_center"][1]
        map_path_name = config_json["map"]["map_url"]
        map_walls_filter_keywords = config_json["map"]["filter_walls_keywords"]
        map_walls_filter_levels = config_json["map"]["filter_walls_levels"]
        featuresType[session_uuid] = config_json["features"]

        # open file map
        map_file_url = urllib.request.urlopen(f"{domain_name_server}/{map_path_name}") 
        # read map data file
        map_data = map_file_url.read().decode('utf-8')
        # load to geojson
        geojson_map = geojson.loads(str(map_data))

        # catch walls from the map
        walls = catch_map_walls(geojson_map, map_walls_filter_keywords, map_walls_filter_levels)
        # get walls by quadrants
        walls_by_quadrants[session_uuid] = get_line_segment_walls_by_quad(walls)

        ########## Antenna RF Activations & Average Time of Readings ##########
        # Get Nr_Activations and AvgTimeReadings of Antenna data from csv file
        antenna_dataset_file_url = urllib.request.urlopen(
            f"{domain_name_server}/static-objects/antenna_datasets/antenna_experimental_dataset_10m.csv")
        # read antenna data file
        antenna_experimental_data_activations = antenna_dataset_file_url.read().decode('utf-8')

        # get dict of csv with average values for iterations
        # Split a string into a list where each line is a list item
        antenna_dict = csv_to_dict(antenna_experimental_data_activations.splitlines())
        # Split a string into a list where each line is a list item
        antenna_list_avg_values = csv_to_avg_list(antenna_experimental_data_activations.splitlines())
        #print("Dictionary from csv: \n",  antenna_dict)
        #print("List Avg Values from csv: \n",  antenna_list_avg_values)

        # get antenna dict data in a list
        antenna_list_distances = list(antenna_dict.keys())
        antenna_list_values = list(antenna_list_avg_values.values())

        # create a data array with antenna dict data
        antenna_experimental_distances = np.array(antenna_list_distances, float)
        antenna_experimental_values = np.array(antenna_list_values, float)

        # get dict of standard deviations means of values of each column in a dict
        stdev_mean_dict = dict_mean_std(antenna_dict)
        first_msg.append(session_uuid)

    # vars to list data by asset point or by anchor
    ap_lines_of_sight = []
    anchors_lines_of_sight = []
    ap_lines_by_quadrants = []
    anchor_lines_by_quadrants = []
    antennas_dir_ap_intersections = []
    antennas_dir_anchors_intersections = []
    ap_wall_intersections = []
    anchors_wall_intersections = []
    ap_distances_antennas = []
    anchors_distances_antennas = []
    memory_cache_ap_key = []
    memory_cache_anchors_key = []

    # create ap and anchors distance value lists
    ap_distance_values = []
    anchor_distance_values = [] 
    # create ap and anchor activations value lists
    ap_activation_values = []
    anchor_activation_values = []

    # create ap_distances_data list
    ap_distances_data = []
    # create ap_rssi_value list 
    ap_rssi_value = []
    # create ap_rssi_data list
    ap_rssi_data = []
        
    # create anchor_distances_data list
    anchor_distances_data = []
     # create anchor_rssi_value list 
    anchor_rssi_value = []
    # create anchor_rssi_data list
    anchor_rssi_data = []

    # create ap_activations_data list
    ap_activations_data = []
    # create anchor_activations_data list
    anchor_activations_data = []
    
    # create antenna direction angles list
    antenna_dir_angle = []
    # create antennas_dir_angles_data 
    antennas_dir_angles_data = []
    # create antennas_coords_data list
    antennas_coords_data = []

    # get antennas values from God
    antennas_data = list(god.getAntennas(session_uuid).values())
    # get asset point values from God
    asset_points_data = list(god.getAssetPoints(session_uuid).values())
    # get algorithms values from God
    algorithms = god.getAlgorithms(session_uuid)
    # get rssi parameters from GOD
    rssi_params = god.getRssiParams(session_uuid)

    # get rssi_parameters to apply calculations
    txPower = rssi_params["tx"]
    pathLossExpoent = rssi_params["ple(n)"]
    constantFading = rssi_params["cf"]
    skewIndex = rssi_params["skew"]
    referenceDistance = rssi_params["d0"]
    attenuationFactor = rssi_params["af"]

    # create processedMsgToPredictor
    processedMsgToPredictor = {
        "uuid": session_uuid,
        "ap-rssi": [],
        "ap-activ": [],
        "anch-rssi": [],
        "anch-activ": [],
        "ant-angles": [],
        "ant-coords": [],
        "algo": algorithms,
        "features": featuresType[session_uuid]
    }

    # create processedMsgToFrontend
    processedMsgToFrontend = {
        "uuid": session_uuid,
        "from": "backend",
        "ap-coords": [],
        "ap-dist": [],
        "ap-activ": [],
        "ap-rssi": [],
        "ap-wall-inter": [],
        "ant-dir-ap-inter": [],
        "anch-dist": [],
        "anch-activ": [],
        "anch-rssi": [],
        "anch-wall-inter": [],
        "ant-dir-anch-inter": []
    }

    # create antenna_data_flat variable to use in memory cache
    antenna_data_flat = ''

    # iterate over antennas_data
    for antenna in range(0, len(antennas_data)):
        # get antenna direction angle
        antenna_dir_angle = float(antennas_data[antenna].direction)
        # get antenna coords long lat
        antenna_coords = [antennas_data[antenna].lng, antennas_data[antenna].lat]
        # append values to the lists
        antennas_dir_angles_data.append(antenna_dir_angle)
        antennas_coords_data.append(antenna_coords)
        # var to hold antenna_data in flat string
        antenna_data_flat += ("," + \
                str((antennas_data[antenna].lng, antennas_data[antenna].lat, antennas_data[antenna].direction, antennas_data[antenna].opening, antennas_data[antenna].txPower)))         

    # append antennas data to processedMsgToPredictor
    processedMsgToPredictor["ant-angles"] = antennas_dir_angles_data
    processedMsgToPredictor["ant-coords"] = antennas_coords_data

    # if god has anchors do the respective calculations
    if(session_uuid in god.anchors):
        if(len(god.anchors[session_uuid]) > 0):
            # get anchors values from God
            anchors_data = list(god.getAnchors(session_uuid).values())
            
            # itereate over anchors_data
            for anchor_index in range(0, len(anchors_data)):
                # append empty array by each anchor_index
                anchors_lines_of_sight.append([])
                anchor_lines_by_quadrants.append([])
                anchors_distances_antennas.append([])
                anchor_distance_values.append([])
                anchor_rssi_value.append([])
                anchor_activation_values.append([])
                anchors_wall_intersections.append([])   
                antennas_dir_anchors_intersections.append([])
                memory_cache_anchors_key.append([])

                # catch lines of sight by anchor
                anchors_lines_of_sight[anchor_index] = catch_lines_of_sight(anchors_data[anchor_index], antennas_data)
                # catch quadrants where lines pass
                anchor_lines_by_quadrants[anchor_index] = get_quadrants_of_lines(anchors_lines_of_sight[anchor_index])
                # catch antenna directions intersections with lines of sight
                antennas_dir_anchors_intersections[anchor_index] = catch_antenna_directions_intersections_with_anchors(anchors_lines_of_sight[anchor_index], antennas_data)
                
                # set a key to store in memory cache (by anchor index)
                memory_cache_anchors_key[anchor_index] = session_uuid + "," + \
                    str((anchors_data[anchor_index].lng, anchors_data[anchor_index].lat)) + str(antenna_data_flat)

                # verify if key not exists in the calculate_cache
                if memory_cache_anchors_key[anchor_index] not in calculate_cache:
                    # catch wall Intersctions
                    anchors_wall_intersections[anchor_index] = catch_wall_intersections(
                        anchors_lines_of_sight[anchor_index], anchor_lines_by_quadrants[anchor_index], walls_by_quadrants[session_uuid])
    
                    # measure distances between anchors and antennas
                    anchors_distances_antennas = measure_distances_to_antennas(anchors_data, antennas_data)

                    # save distances to previousValues
                    previousValues[session_uuid] = anchors_distances_antennas

                    # Store to calculate_cache
                    calculate_cache[memory_cache_anchors_key[anchor_index]] = {
                        'ant_dir_anch_intersections': antennas_dir_anchors_intersections[anchor_index],
                        'anch_wall_intersections': anchors_wall_intersections[anchor_index],
                        'anch_distances_antennas': anchors_distances_antennas[anchor_index],
                        'antennas': antennas_data,
                    }
                else:
                    # Get values from cache
                    antennas_dir_anchors_intersections[anchor_index] = calculate_cache[memory_cache_anchors_key[anchor_index]]['ant_dir_anch_intersections']
                    anchors_wall_intersections[anchor_index] = calculate_cache[memory_cache_anchors_key[anchor_index]]['anch_wall_intersections']
                    anchors_distances_antennas[anchor_index] = calculate_cache[memory_cache_anchors_key[anchor_index]]['anch_distances_antennas']
                    antennas_data = calculate_cache[memory_cache_anchors_key[anchor_index]]['antennas']

                # iterate over antennas_data
                for antenna in range(0, len(antennas_data)):
                    # get distance value from distances array
                    anchor_distance_values[anchor_index] = round(anchors_distances_antennas[anchor_index][antenna], 3)
                    # calculate attenuation from intersections array and attenuation_factor
                    attenuation_value = anchors_wall_intersections[anchor_index][antenna] * float(attenuationFactor)

                    # if directionated to anchor, this is, 'true'
                    if(antennas_dir_anchors_intersections[anchor_index][antenna] == True):
                        # measure RSSI after calculated distance
                        anchor_rssi_value[anchor_index] = round(
                            measure_RSSI(float(txPower), float(pathLossExpoent), float(constantFading), float(skewIndex), float(referenceDistance), float(anchor_distance_values[anchor_index]), float(attenuation_value)), 2)

                        # if distance of anchor to antenna is smaller than 10 meters
                        if(float(anchor_distance_values[anchor_index]) <= 10):
                            # get activations of antennas from experimental data
                            anchor_activation_values[anchor_index] = exponential_regression_1D_array(
                                float(anchor_distance_values[anchor_index]), antenna_experimental_distances, antenna_experimental_values, stdev_mean_dict)
                        else:
                            # set activations_data = 0 (must be None values)
                            anchor_activation_values[anchor_index] = [0, 0, 0]

                        '''
                        # OR introduce some logic here:
                        # if distance_value is small than maximum of measured distances experimentally -> apply Interpolation (linear) to the data with stdev noise output
                        # else: distance_value is greater than maximum of measured distances experimentally -> apply Exponential Regression using inverse sigmoid function with stdev noise output
                        if float(distance_value) <= max(antenna_experimental_distances):
                            # get look up table values of activations of antennas RF readings
                            activations_data = interpolate_extrapolate_1D_array(
                                float(distance_value), antenna_experimental_distances, antenna_experimental_values, stdev_mean_dict, 'linear')
                        else:
                            activations_data = exponential_regression_1D_array(
                                float(distance_value), antenna_experimental_distances, antenna_experimental_values, stdev_mean_dict)
                        '''
                    else:
                        # set rssi = -170 (must be None value)
                        anchor_rssi_value[anchor_index] = None

                        # set activations_data = 0 (must be None values)
                        anchor_activation_values[anchor_index] = [0, 0, 0]

                    # append values by antenna to lists of data
                    anchor_distances_data.append(anchor_distance_values[anchor_index])
                    anchor_activations_data.append(anchor_activation_values[anchor_index])
                    anchor_rssi_data.append(anchor_rssi_value[anchor_index])

                # populate processedMsgToFrontend with data
                processedMsgToFrontend["anch-dist"].append(anchor_distances_data)
                processedMsgToFrontend["anch-activ"].append(anchor_activations_data)
                processedMsgToFrontend["anch-rssi"].append(anchor_rssi_data)

                processedMsgToFrontend["anch-wall-inter"].append(anchors_wall_intersections[anchor_index])
                processedMsgToFrontend["ant-dir-anch-inter"].append(antennas_dir_anchors_intersections[anchor_index])
                
                # populate processedMsgToPredictor with data
                processedMsgToPredictor["anch-activ"].append(anchor_activations_data)
                processedMsgToPredictor["anch-rssi"].append(anchor_rssi_data)

                # empty lists of data
                anchor_distances_data = []
                anchor_activations_data = []
                anchor_rssi_data = []

    # iterate over asset_points_data
    for asset_point_index in range(0, len(asset_points_data)):
        # append empty array by each asset_point_index
        ap_lines_of_sight.append([])
        ap_lines_by_quadrants.append([])
        ap_distances_antennas.append([])
        ap_distance_values.append([])
        ap_rssi_value.append([])
        ap_activation_values.append([])
        ap_wall_intersections.append([])     
        antennas_dir_ap_intersections.append([])
        memory_cache_ap_key.append([])

        # catch lines of sight by asset point (use in memory cache)
        ap_lines_of_sight[asset_point_index] = catch_lines_of_sight(asset_points_data[asset_point_index], antennas_data)
        # catch quadrants where lines pass
        ap_lines_by_quadrants[asset_point_index] = get_quadrants_of_lines(ap_lines_of_sight[asset_point_index])
        # catch antenna directions intersections with lines of sight
        antennas_dir_ap_intersections[asset_point_index] = catch_antenna_directions_intersections_with_asset_points(ap_lines_of_sight[asset_point_index], asset_points_data[asset_point_index], antennas_data)

        # set a key to store in memory cache (by asset point index)
        memory_cache_ap_key[asset_point_index] = session_uuid + "," + \
            str((
                asset_points_data[asset_point_index].lng, 
                asset_points_data[asset_point_index].lat, 
                asset_points_data[asset_point_index].largeDirection,
                asset_points_data[asset_point_index].largeOpening,
                asset_points_data[asset_point_index].smallDirection,
                asset_points_data[asset_point_index].smallOpening
            )) + str(antenna_data_flat)

        # verify if key not exists in the calculate_cache
        if memory_cache_ap_key[asset_point_index] not in calculate_cache:
            # catch wall Intersctions
            ap_wall_intersections[asset_point_index] = catch_wall_intersections(
                ap_lines_of_sight[asset_point_index], ap_lines_by_quadrants[asset_point_index], walls_by_quadrants[session_uuid])

            # measure distances between asset point and antennas
            ap_distances_antennas = measure_distances_to_antennas(asset_points_data, antennas_data)

            # save distances to previousValues
            previousValues[session_uuid] = ap_distances_antennas

            # Store to calculate_cache
            calculate_cache[memory_cache_ap_key[asset_point_index]] = {
                'ant_dir_ap_intersections': antennas_dir_ap_intersections[asset_point_index],
                'ap_wall_intersections': ap_wall_intersections[asset_point_index],
                'ap_distances_antennas': ap_distances_antennas[asset_point_index],
                'antennas': antennas_data,
            }
        else:
            # Get values from cache
            antennas_dir_ap_intersections[asset_point_index] = calculate_cache[memory_cache_ap_key[asset_point_index]]['ant_dir_ap_intersections']
            ap_wall_intersections[asset_point_index] = calculate_cache[memory_cache_ap_key[asset_point_index]]['ap_wall_intersections']
            ap_distances_antennas[asset_point_index] = calculate_cache[memory_cache_ap_key[asset_point_index]]['ap_distances_antennas']
            antennas_data = calculate_cache[memory_cache_ap_key[asset_point_index]]['antennas']

        # iterate over antennas_data
        for antenna in range(0, len(antennas_data)):
            # get distance value from distances array
            ap_distance_values[asset_point_index] = round(ap_distances_antennas[asset_point_index][antenna], 3)
            # calculate attenuation from intersections array and attenuation_factor
            attenuation_value = ap_wall_intersections[asset_point_index][antenna] * float(attenuationFactor)

            # if directionated to asset point, this is, 'true'
            if(antennas_dir_ap_intersections[asset_point_index][antenna] == True):
                # measure RSSI after calculated distance
                ap_rssi_value[asset_point_index] = round(
                    measure_RSSI(float(txPower), float(pathLossExpoent), float(constantFading), float(skewIndex), float(referenceDistance), float(ap_distance_values[asset_point_index]), float(attenuation_value)), 2)

                # if distance of asset point to antenna is smaller than 10 meters
                if(float(ap_distance_values[asset_point_index]) <= 10):
                    # get activations of antennas from experimental data
                    ap_activation_values[asset_point_index] = exponential_regression_1D_array(
                        float(ap_distance_values[asset_point_index]), antenna_experimental_distances, antenna_experimental_values, stdev_mean_dict)
                else:
                    # set activations_data = 0 (must be None values)
                    ap_activation_values[asset_point_index] = [0, 0, 0]

                '''
                # OR introduce some logic here:
                # if distance_value is small than maximum of measured distances experimentally -> apply Interpolation (linear) to the data with stdev noise output
                # else: distance_value is greater than maximum of measured distances experimentally -> apply Exponential Regression using inverse sigmoid function with stdev noise output
                if float(distance_value) <= max(antenna_experimental_distances):
                    # get look up table values of activations of antennas RF readings
                    activations_data = interpolate_extrapolate_1D_array(
                        float(distance_value), antenna_experimental_distances, antenna_experimental_values, stdev_mean_dict, 'linear')
                else:
                    activations_data = exponential_regression_1D_array(
                        float(distance_value), antenna_experimental_distances, antenna_experimental_values, stdev_mean_dict)
                '''
            else:
                # set rssi = -170 (must be None value)
                ap_rssi_value[asset_point_index] = None

                # set activations_data = 0 (must be None values)
                ap_activation_values[asset_point_index] = [0, 0, 0]

            # append values by antenna to lists of data
            ap_distances_data.append(ap_distance_values[asset_point_index])
            ap_activations_data.append(ap_activation_values[asset_point_index])
            ap_rssi_data.append(ap_rssi_value[asset_point_index])

        # populate processedMsgToFrontend with data
        processedMsgToFrontend["ap-dist"].append(ap_distances_data)
        processedMsgToFrontend["ap-activ"].append(ap_activations_data)
        processedMsgToFrontend["ap-rssi"].append(ap_rssi_data)

        processedMsgToFrontend["ap-coords"].append([asset_points_data[asset_point_index].getCoords()[0], asset_points_data[asset_point_index].getCoords()[1]])
        processedMsgToFrontend["ap-wall-inter"].append(ap_wall_intersections[asset_point_index])
        processedMsgToFrontend["ant-dir-ap-inter"].append(antennas_dir_ap_intersections[asset_point_index])

        # populate processedMsgToPredictor with rssi-values and activations_data
        processedMsgToPredictor["ap-activ"].append(ap_activations_data)
        processedMsgToPredictor["ap-rssi"].append(ap_rssi_data)

        # empty lists of data
        ap_distances_data = []
        ap_activations_data = []
        ap_rssi_data = []

    # attach dicts with respective msgs
    return_dict_predictor = json.dumps(processedMsgToPredictor)
    return_dict_frontend = json.dumps(processedMsgToFrontend)

    #print("Processed Message to Predictor: \n", return_dict_predictor, "\n")
    client.publish(publish_topic_predictor, return_dict_predictor)

    #print("Processed Message to Frontend: \n", return_dict_frontend, "\n")
    client.publish(f'{publish_topic_frontend}/{session_uuid}', return_dict_frontend)

    #print("Processed Message to Frontend (to CSV file): \n", return_dict_frontend, "\n")
    client.publish(publish_topic_to_csv_file, return_dict_frontend) #(used only with rssi, not with activations)

    #t_end = time.time()
    #print("Calculate Time:", (t_end - t_start), "\n")

    # profiler.disable()
    # profiler.print_stats()

########## End of Distances and RSSI calculations ##########

########## MQTT functions ##########

# Define on connect event function
# We shall subscribe to our Topic in this function
def on_connect(client: mqtt.Client, obj: mqtt.Client.connect, flags: dict, rc: int):
    """
    Define MQTT on_connect event function. We shall subscribe to our Topic in this function.

    Args:
        client (mqtt.Client): The MQTT client object
        obj (mqtt.Client.connect): The connection object 
        flags (dict): The connection flags
        rc (int): The return code
    
    *Return codes - rc:*

        0: Connection successful 
        1: Connection refused: incorrect protocol version 
        2: Connection refused: invalid client identifier 
        3: Connection refused: server unavailable 
        4: Connection refused: bad username or password 
        5: Connection refused: not authorised 
        6-255: Currently unused. 
    """
    if rc == 0:
        print(str(client._client_id.decode("utf-8")) +
              " is connected to MQTT Broker, with return code: " + str(rc))
        global Connected  # Use global variable
        Connected = True  # Signal connection

        # Subscribe the topic
        print("Subscribing to topic: ", reception_topic_backend)
        client.subscribe(reception_topic_backend, 0)
    else:
        print("Failed to connect, with return code: " + str(rc))

# Define on_message event function.
# This function will be invoked every time
# a new message arrives for the subscribed topic
def on_message(client: mqtt.Client, obj: mqtt.Client.connect, message: mqtt.MQTTMessage):
    """
    Define MQTT on_message event function. This function will be invoked every time a new message arrives for the subscribed topic

    Args:
        client (mqtt.Client): The MQTT client object
        obj (mqtt.Client.connect): The connection object 
        message (str): The message in MQTT transit communication
    """
    # parse string message payload
    received_data = str(message.payload.decode("utf-8"))
    # load recevied data in a JSON object
    array_json = json.loads(received_data)

    # print received message
    '''print("Message received:\n", array_json,
          "| topic =", message.topic,
          "| qos =", message.qos,
          "| retain flag =", message.retain,
          "\n")'''

    q.put((client, array_json))

# Define on_subscribe event function.
def on_subscribe(client: mqtt.Client, obj: mqtt.Client.connect, mid: int, granted_qos: tuple):
    """
    Define MQTT on_subscribe event function.

    Args:
        client (mqtt.Client): The MQTT client object
        obj (mqtt.Client.connect): The connection object 
        mid (int): The message id in MQTT transit communication
        granted_qos (tuple): (The MQTT Granted Quality of Service, )
    """
    print("Subscribed successfully." +
          " | mid: " + str(mid) + " | QoS: " + str(granted_qos))

# Define on_publish event function.
def on_publish(client: mqtt.Client, obj: mqtt.Client.connect, mid: int):
    """
    Define MQTT on_publish event function.

    Args:
        client (mqtt.Client): The MQTT client object
        obj (mqtt.Client.connect): The connection object  
        mid (int): The message id in MQTT transit communication
    """
    print("Published message." +
          " | mid: " + str(mid) + "\n")

# Define on_log event function (uncalled).
def on_log(client: mqtt.Client, obj: mqtt.Client.connect, level: int, string: str):
    """
    Define MQTT on_log event function.

    Args:
        client (mqtt.Client): The MQTT client object
        obj (mqtt.Client.connect): The connection object 
        level (int): The level of detail log
        string (str): The log string message
    """
    print("On log: " + string)

# Define on_disconnect event function.
def on_disconnect(client: mqtt.Client, userdata: mqtt.Client.user_data_set, rc: int):
    """
    Define MQTT on_disconnect event function.

    Args:
        client (mqtt.Client): The MQTT client object
        userdata (mqtt.Client.user_data_set): The connection userdata 
        rc (int): The return code
    
    *Return codes - rc:*

        0: Connection successful 
        1: Connection refused: incorrect protocol version 
        2: Connection refused: invalid client identifier 
        3: Connection refused: server unavailable 
        4: Connection refused: bad username or password 
        5: Connection refused: not authorised 
        6-255: Currently unused. 
    """
    if (rc != 0):
        global Connected  # Use global variable
        Connected = False  # Signal connection
        print(str(client._client_id.decode("utf-8")) +
              " was unexpected disconnected. Will auto-reconnect. Return code: " + str(rc))

########## End of MQTT functions ##########

# Definition of main function.
def main():
    """
    Definition of main function.
    """
    global god
    global q

    # Define GOD object
    god = GOD()

    # Define a queue object
    q = queue.Queue()

    # Turn-on the worker thread
    threading.Thread(target=queueWorker, daemon=True).start()

    # Create a MQTT client with new instance websockets
    print("Creating new client instance using websockets...")
    randomInt = random.randint(1, 10000)
    mqtt_client = mqtt.Client("SDRT_Backend_Python_Client_"+str(randomInt), transport="websockets")

    # set username and password
    mqtt_client.username_pw_set(user, password=password)

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
    mqtt_client.connect(broker_host, broker_port, broker_keepalive)  # Connect to the broker

    # Blocking call that processes network traffic, dispatches callbacks and
    # handles reconnecting.
    # Other loop*() functions are available that give a threaded interface and a
    # manual interface.
    mqtt_client.loop_forever()
    # Non blocking : client.loop_start()  #N.B. need a while True: statement

    # block until all tasks are done
    # q.join()

# call main() execution
if __name__ == "__main__": 
    main()