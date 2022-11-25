import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit
from scipy import interpolate
import math
import pandas as pd
import csv
import statistics
from sklearn.ensemble import IsolationForest
from sklearn.covariance import EllipticEnvelope
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
import scipy.stats as stats
import urllib.request

# set folder to save results        
directory_name = "exponential_regression_tests"
pre_proc_id = 0

def pre_process_iterations(lst):
    # pre process activations over the iterations
    # identify outliers in the training dataset
    global pre_proc_id

    output = lst.copy()

    # try:
    #     # oi = IsolationForest(contamination=0.1); pre_proc_id = 1
    #     # oi = EllipticEnvelope(contamination=0.1); pre_proc_id = 2
    #     # oi = LocalOutlierFactor(); pre_proc_id = 3
    #     oi = OneClassSVM(); pre_proc_id = 4
    #     yhat = oi.fit_predict(pd.DataFrame(lst))
    #     # select all rows that are not outliers
    #     mask = yhat != -1
    #     output = pd.DataFrame(lst)[mask].values.reshape(-1).tolist()
    # except:
    #     print("Exception caught") # When there is just 1 or 0 elements on the list -> pass
    #     print(lst)
    #     print(output)

    # df = pd.DataFrame(lst)
    # # find absolute value of z-score for each observation
    # z = np.abs(stats.zscore(df))
    # # only keep rows in dataframe with all z-scores less than absolute value of 3 
    # output = df[(z<3).all(axis=1)].values.reshape(-1).tolist(); pre_proc_id = 5

    # df = pd.DataFrame(lst)
    # # find Q1, Q3, and interquartile range for each column
    # Q1 = df.quantile(q=.25)
    # Q3 = df.quantile(q=.75)
    # IQR = df.apply(stats.iqr)
    # #only keep rows in dataframe that have values within 1.5*IQR of Q1 and Q3
    # output = (df[~((df < (Q1-1.5*IQR)) | (df > (Q3+1.5*IQR))).any(axis=1)]).values.reshape(-1).tolist(); pre_proc_id = 6

    if not output:
        return lst

    # print(len(output)-len(lst))

    return output

# Read csv file and average values of multiple iterations
# delete irrelevant columns
def csv_to_avg_list(file):
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
    outlier_count = 0
    count = 0
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
            output[dist][key] = pre_process_iterations(output[dist][key])
            dif = dif - len(output[dist][key])
            if key == "300":
                if dif != 0:
                    outlier_count += 1
                count += 1

            # calculate the average
            output[dist][key] = statistics.mean(output[dist][key])
            # output[dist][key] = output[dist][key] / count

        output_dict[dist] = output[dist]

        # convert dicts to lists of values
        output[dist] = list(output[dist].values())

    print(f'Number of times outliers were removed: {outlier_count}/{count}')
    print("Outlier percentage:", (outlier_count/count)*100)

    return output, output_dict

# Read csv file to dict
def csv_to_dict(file):
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

def dict_mean_std(d):
    output = {}
    for key in d.keys():
        output[key] = {}
        for sub_key in d[key].keys():
            mean = sum(d[key][sub_key]) / len(d[key][sub_key])
            std = np.std(d[key][sub_key])
            output[key][sub_key] = {"mean": mean, "std": std}
    return output

def variance(data, ddof=0):
    n = len(data)
    mean = sum(data) / n
    return sum((x - mean) ** 2 for x in data) / (n - ddof)

def stdev(data):
    var = variance(data)
    std_dev = math.sqrt(var)
    return std_dev    

# Returns the maximum elem of a list of numbers no grater than a given value
def max_no_greater_value(lst, value):
    lst = sorted(lst)
    output = lst[0]
    for val in lst:
        if val > value:
            break
        output = val
    return output

# sigmoid function
# source: https://stackoverflow.com/questions/55725139/fit-sigmoid-function-s-shape-curve-to-data-using-python
def sigmoid(x, L, x0, k, b):
    '''
    The parameters optimized are L, x0, k, b, who are initially assigned in p0, the point the optimization starts from.
    - L is responsible for scaling the output range from [0,1] to [0,L]
    - b adds bias to the output and changes its range from [0,L] to [b,L+b]
    - k is responsible for scaling the input, which remains in (-inf,inf)
    - x0 is the point in the middle of the Sigmoid, i.e. the point where Sigmoid should originally output the value 1/2 [since if x=x0, we get 1/(1+exp(0)) = 1/2].
    '''
    y = L / (1 + np.exp(-k*(x-x0))) + b
    return y

# inverse sigmoid function
# source: https://stackoverflow.com/questions/43213069/fit-bipolar-sigmoid-python/43213692#43213692
def inv_sigmoid(x, a, b, c, d):
    ''' 
    General sigmoid function:
     - a adjusts amplitude; 
     - b adjusts y offset; 
     - c adjusts x offset; 
     - d adjusts slope 
    '''
    y = ((a-b) / (1 + np.exp(x-(c/2))**d)) + b
    return y

# test function 1
#def func(x, a, b):
#    return 1 / (a * x * np.exp(b))

# test function 2
#def func(x, a, b, c):
#    return a * np.exp(-b * x) + c
    
# method to apply exponential regression from 1 dimention array
def exponential_regression_1D_array(value, xData, yDataArray, dictOfStdsAvgs):
    out = []
    out_noised = []
    n = len(yDataArray[0]) # distances
    for i in range(n):
        x = np.linspace(np.min(xData), np.max(xData), len(xData))
        xc = np.linspace(np.max(xData), value, len(xData))
        y = yDataArray[ : , i ]

        # this is an mandatory initial guess
        p0_sig = [max(y), np.median(x), 1, min(y)] 
        p0_inv_sig = [max(y), min(y), max(x), 1.0] 
        # p0_inv_sig = [125, 0, 10, 0.001] 
        
        # curve_fit method call
        # print(x[:5])
        # print(x[15:])
        # print("x", np.concatenate((x[:5],x[15:])))
        # print("y", y[:5]+y[15:])
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
        if sum >= 0 :
            out_noised.append(sum)
        else:
            out_noised.append(0)

        # output value
        output_value = out_noised[i]

        a = round(popt[0],4)
        b = round(popt[1],4)
        c = round(popt[2],4)
        d = round(popt[3],4)
        
        # if i == 2:
        if True:
            # plt.figure()
            plt.plot(x,y,'-o', color='black', label="Raw Data")
            plt.plot(x, inv_sigmoid(x, *popt), 'g-', label=f"Fitted Curve")
            plt.plot(xc, inv_sigmoid(xc, *popt), 'r-', label="Selectable Fitted Curve")
            plt.plot(value, output_value, 'x', color='orange', label=f"output of {value}: {output_value}") 
            plt.title(f"Exponential regression of column {i}")
            plt.xlabel('Distance')
            plt.ylabel(f'data column {i}')
            plt.legend(loc='best')
            # plt.savefig(f"{directory_name}/regr_300_int_6_10_preproc_{pre_proc_id}.png")
            plt.show()
            # print(f"col {i} - The equation of the line is: y(x) = (({a} - {b}) / (1 + np.exp(x -({c}/2))**{d})) + {b})")
        
    return out_noised

# method to extrapolate data from 1 dimention array
def inter_extrapolate_1D_array(value, xData, yDataArray, dictOfStdsAvgs, kind):
    out = []
    out_noised = []
    n = len( yDataArray[0] )
    for i in range(n):
        x = np.linspace(np.min(xData), np.max(xData), 20)
        y = yDataArray[ : , i ]
        #std_y= stdev(y)
        #yn = y + 1.0*np.random.normal(size=len(x), scale=std_y)
        func = interpolate.interp1d( x, y, kind=kind, fill_value = "extrapolate")
        
        out.append(np.round( func( value ), 3))

        # get mean noise and standard deviations to gaussian distribuition noise
        if str(float(value)) not in dictOfStdsAvgs:     
            under_value = max_no_greater_value(xData, value)
            stdev_out = list(dictOfStdsAvgs[f'{under_value}'].values())[i]['std']
        else:
            stdev_out = list(dictOfStdsAvgs[f'{float(value)}'].values())[i]['std']
        
        noise = np.random.normal(0, stdev_out)
        sum = out[i] + noise

        if sum >= 0 :
            out_noised.append(sum)
        else:
            out_noised.append(0)

        # output value
        output_value = out_noised[i]

        # plt.figure()
        # plt.plot(x, y, 'o', color='black', label = 'Raw Data')
        # plt.plot(x, func(x), '-', color='green', label = f"Fit Data - {kind}") 
        # plt.plot(value, output_value, 'x', color='orange', label = f"output of {value}: {output_value}")
        # plt.title(f"Interpolation/Extrapolation: {kind}")
        # plt.xlabel('Distance')
        # plt.ylabel(f'data column {i}')
        # plt.legend()
        # plt.show()
        # plt.savefig(f"{directory_name}/5m_test_interp_extrapolation_col{i}.png")

    return out_noised
'''
# approximate taylor polynomial
def taylor_approx_poly_1D_array(xData, yDataArray):
    x = np.linspace(np.min(xData), np.max(xData), 20)
    y = yDataArray[ : , 0 ]

    func = interpolate.interp1d(x, y, kind='linear', fill_value = "extrapolate")
    plt.plot(x, func(x), label="original data")

    for degree in np.arange(1, 16, step=2):
        taylor_approx = interpolate.approximate_taylor_polynomial(func, 0, degree, 1, order=None)
        plt.plot(x, taylor_approx(x), label=f"degree={degree}")
    plt.title(f"Taylor Approximation: ")
    plt.xlabel('Distance')
    plt.ylabel(f'Activations 280 [mW]')
    plt.legend(bbox_to_anchor=(0.80, 1), loc='upper left', borderaxespad=0.0, shadow=True)
    plt.axis([0, 6, -150, 1200])
    plt.show()
    plt.savefig(f"taylor_approx_col.png")   
'''

#antenna_dataset_file_url =urllib.request.urlopen("http://10.0.12.91/sdrt/static-objects/antenna_datasets/antenna_experimental_dataset_5m.csv")
antenna_dataset_file_url = urllib.request.urlopen("http://10.0.12.91/sdrt/static-objects/antenna_datasets/antenna_experimental_dataset_10m.csv")

# read antenna data file
antenna_data = antenna_dataset_file_url.read().decode('utf-8')

# get dict of csv with average values for iterations
antenna_dict = csv_to_dict(antenna_data.splitlines()) # Split a string into a list where each line is a list item
antenna_list_avg_values, antenna_dict_avg_values = csv_to_avg_list(antenna_data.splitlines()) # Split a string into a list where each line is a list item

# get dict of standard deviations means of values of each column in a dict
stdev_mean_dict = dict_mean_std(antenna_dict)

antenna_list_distances = list(antenna_dict.keys())
antenna_list_values = list(antenna_list_avg_values.values())

# create a data array with antenna dict data 
antenna_array_distances = np.array(antenna_list_distances, float)
antenna_array_values = np.array(antenna_list_values, float)

# print("antenna_array_distances: ",antenna_array_distances)
# print("antenna_array_values: ", antenna_array_values)

val2 = 11.0
val1 = 3.5

activations_exp_data = exponential_regression_1D_array(val2, antenna_array_distances, antenna_array_values, stdev_mean_dict) 
#activations_interp_data = inter_extrapolate_1D_array(val1, antenna_array_distances, antenna_array_values, stdev_mean_dict, 'linear')
#taylor_approx_poly_1D_array(antenna_array_distances,antenna_array_values)

###### Mário Stuff #######
'''
import numpy as np
import matplotlib.pyplot as plt
from scipy.interpolate import approximate_taylor_polynomial, interp1d


x = np.linspace(-5, 5, 25)
y = 1/(1+np.exp(-x))
x_hat = np.linspace(-5, 5, 50)
# Calculates the center of the function
center = int(len(x)/2)+1
# Compute the right scale for the fit
scale = max(x)-min(x)
# This could be improved
func = interp1d(x,y,kind = 'linear', fill_value= 'extrapolate')
for k in range(10):
    taylor = approximate_taylor_polynomial(func, x[center], k, scale = scale, order=k + 2)
    plt.plot(x,y, c='blue')
    plt.plot(x_hat, taylor(x_hat), label=f"degree={k}")
    plt.legend(bbox_to_anchor=(0.80, 1), loc='upper left', borderaxespad=0.0, shadow=True)
    plt.ylim([0, 1])
    #plt.pause(2)
    
plt.show()
plt.savefig(f"taylor_approx_example.png")  

# approximate taylor polynomial
def taylor_approximation_poly_1D_array(xData, yDataArray):
    x = xData
    y = yDataArray[ : , 0 ]

    # Calculates the center of the function
    center = int(len(x)/2)+1
    # Compute the right scale for the fit
    scale = max(x)-min(x)
        
    plt.plot(x,y, c='blue', label=f"Original data")

    # This could be improved
    func = interp1d(x,y,kind = 'linear', fill_value= 'extrapolate')

    for k in np.arange(0, 32, step=2):
        taylor = approximate_taylor_polynomial(func, x[center], k, scale = scale, order=k + 2)
        plt.plot(x, taylor(x), label=f"taylor degree={k}")
    plt.title(f"Taylor Approximation: ")
    plt.xlabel('Distance')
    plt.ylabel(f'Activations 280 [mW]')
    plt.legend(bbox_to_anchor=(0.75, 1.15), loc='upper left', borderaxespad=0.0, shadow=True)
    plt.axis([0, 7.5, -300, 2000])
    #plt.pause(2)
        
    plt.show()
    plt.savefig(f"taylor_approx_example_our_data.png")  

taylor_approximation_poly_1D_array(antenna_array_distances,antenna_array_values)
'''