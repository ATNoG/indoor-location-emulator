# Based on https://www.alanzucconi.com/2017/03/13/positioning-and-trilateration/

import math
import random
import numpy as np
from scipy.optimize import minimize

def degrees_to_metres(degress):
    return (2 * math.pi * 6371000 * degress) / 360

def metres_to_degrees(metres):
    return (metres * 360) / (2 * math.pi * 6371000)

def antennasDegreesToMetres(antennas):
    for i in range(len(antennas)):
        antennas[i][0] = degrees_to_metres(antennas[i][0])
        antennas[i][1] = degrees_to_metres(antennas[i][1])

def antennasMetresToDegrees(antennas):
    for i in range(len(antennas)):
        antennas[i][0] = metres_to_degrees(antennas[i][0])
        antennas[i][1] = metres_to_degrees(antennas[i][1])

# Func used in the simulator that converts distance into rssi
# def measureRSSI(txPower, pathLossExpoent, constantFading, skewIndex, referenceDistance, distance, attenuation):
#     measuredRSSI = - (10 * pathLossExpoent * math.log10(distance / referenceDistance) + txPower - randn_bm(-constantFading, constantFading, skewIndex) + attenuation)
def measureRSSI(txPower, pathLossExpoent, referenceDistance, distance):
    measuredRSSI = - 10 * pathLossExpoent * math.log10(distance / referenceDistance) + txPower
    if (measuredRSSI > 0):
        measuredRSSI = 0
    return measuredRSSI

# Apply RSSI calculations 
def measureRSSIWithErrors(txPower, pathLossExpoent, constantFading, skewIndex, referenceDistance, distance, attenuation):
    measuredRSSI = - (10 * pathLossExpoent * math.log10(distance / referenceDistance)) + txPower + randn_bm(-constantFading, constantFading, skewIndex) - attenuation
    if (measuredRSSI > 0):
        measuredRSSI = -0.99
    return measuredRSSI

# Generation random value of Gaussian distribution - Xg
def randn_bm(min, max, skew) :
    u = 0 
    v = 0
    while (u == 0): 
        u = random.random()  # Converting (0,1) to (0,1)
    while (v == 0): 
        v = random.random()
     
    num = math.sqrt(-2.0 * math.log(u)) * math.cos(2.0 * math.pi * v)

    num = num / 10.0 + 0.5 # Translate to 0 -> 1
    if (num > 1 or num < 0):
        num = randn_bm(min, max, skew) # resample between 0 and 1 if out of range

    else :
        num = math.pow(num, skew) # Skew
        num *= max - min # Stretch to fill range
        num += min # Osffset to min
    return num

# Converts rssi into distance
def measureDistance(txPower, pathLossExpoent, referenceDistance, rssi):
    print("Static RSSI: "+str(rssi))
    # measuredDistance = referenceDistance * (pow(10, ((txPower - rssi) / (10 * pathLossExpoent))))
    measuredDistance = referenceDistance * (pow(10, ((txPower - rssi) / (10 * pathLossExpoent))))
    print("Calculated Distance: "+str(measuredDistance))
    print("Calculated RSSI without errors: "+str(measureRSSI(txPower, pathLossExpoent, referenceDistance, measuredDistance)))
    print("Calculated RSSI with errors: "+str(measureRSSIWithErrors(txPower, pathLossExpoent, 2.5, 14.1, referenceDistance, measuredDistance, 5)))
    return measuredDistance

# Converts multiple rssis into distances
def measureDistances(txPower, pathLossExpoent, referenceDistance, rssi_values):
    distances = []
    for i in range(len(rssi_values)):
        antenna = "Antenna "+str(i+1)
        distances.append(measureDistance(txPower, pathLossExpoent, referenceDistance, rssi_values[antenna]))
    return distances

# Trilateration func
def euclidean_distance(x1, y1, x2, y2):
    p1 = np.array((x1 ,y1))
    p2 = np.array((x2, y2))
    return np.linalg.norm(p1 - p2)

# Trilateration func
# Mean Square Error
# locations: [ (lat1, long1), ... ]
# distances: [ distance1, ... ]
def mse(x, locations, distances):
    mse = 0.0
    for location, distance in zip(locations, distances):
        distance_calculated = euclidean_distance(x[0], x[1], location[0], location[1])
        mse += math.pow(distance_calculated - distance, 2.0)
    return mse / len(distances)

# Trilateration func
def trilateration(antennas, distances):
    # Initial point: the point with the closest distance
    min_distance     = float('inf')
    closest_location = None
    for antenna, distance in zip(antennas, distances):
        # A new closest point!
        if distance < min_distance:
            min_distance = distance
            closest_location = antenna
    initial_location = closest_location

    # initial_location: (lat, long)
    # locations: [ (lat1, long1), ... ]
    # distances: [ distance1,     ... ] 
    result = minimize(
        mse,                         # The error function
        initial_location,            # The initial guess
        args=(antennas, distances),  # Additional parameters for mse
        method='L-BFGS-B',           # The optimisation algorithm
        options={
            'ftol':1e-5,         # Tolerance
            'maxiter': 1e+7      # Maximum iterations
        })
    return result.x

def predict():
    # antennas = d["antennas"]
    # rssi_values = d["rssi-values"]

    antennas = [[-8.660231131718291, 40.634156553095071], [-8.659936488924075, 40.634380295310024], [-8.659637007890638, 40.634152521271941], [-8.659926306174583, 40.633920592431621]]
    txPower = -20
    pathLossExpoent = 2.6
    referenceDistance = 1

    rssi_values = {"Antenna 1": -70.49, "Antenna 2": -71.84, "Antenna 3": -62.7, "Antenna 4": -57.07}

    distances = measureDistances(txPower, pathLossExpoent, referenceDistance, rssi_values)
    # print(distances)
    antennas = antennasDegreesToMetres(antennas)

    location = trilateration(antennas, distances)

    print(location)

    # TODO 

    return 0

predict()