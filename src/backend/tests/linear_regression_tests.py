import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import csv
import urllib.request
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

# Read csv file and average values of multiple iterations
def csv_dict_avg(file):
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
                output[row['distance']][key] = float(row[key])
            else:
                # accumulates the values of each field
                output[row['distance']][key] += float(row[key])
                
    # for each distance, it calculates the average of each field
    for dist in distance_list:
        for key in output[dist].keys():
            # calculate the average
            output[dist][key] = output[dist][key] / count
        # remove 'distance' from output dict
        #del output[dist]['distance']

        # convert dicts to lists of values
        output[dist] = list(output[dist].values())

    return output

antenna_dataset_file_url =urllib.request.urlopen("http://10.0.12.91/sdrt/static-objects/antenna_datasets/antenna_experimental_dataset_5m.csv")
# read antenna data file
antenna_data = antenna_dataset_file_url.read().decode('utf-8')

# get dict of csv with average values for iterations
antenna_dict = csv_dict_avg(antenna_data.splitlines()) # Split a string into a list where each line is a list item
antenna_dict_distances = list(antenna_dict.keys())
antenna_dict_values = list(antenna_dict.values())

# create a data array with antenna dict data 
antenna_array_distances = np.array(antenna_dict_distances, float)
antenna_array_values = np.array(antenna_dict_values, float)

print("antenna_array_distances: ",antenna_array_distances)
print("antenna_array_values: ", antenna_array_values)

value = 7.0

X = antenna_array_values[:,0:1]
y = antenna_array_values[:,1]

print("X: ",X)
print("y:",y)

############ start linear regression ############
lin_reg = LinearRegression()
lin_reg.fit(X,y)

output_value = lin_reg.predict([[value]])

plt.scatter(X,y, color='red')
plt.plot(X, lin_reg.predict(X),color='orange')
plt.plot(value, output_value, 'x', color='orange')
plt.title("Truth or Bluff(Linear)")
plt.xlabel('Distance')
plt.ylabel('Activations 280 mW')
plt.legend()
plt.show()
plt.savefig("linear regression degree1.png")
 
# polynomial regression model
poly_reg1 = PolynomialFeatures(degree=1)
X_poly1 = poly_reg1.fit_transform(X)
  
print("X_poly1: ",X_poly1)     # prints X_poly
 
lin_reg1 = LinearRegression()
lin_reg1.fit(X_poly1,y)

output_value = lin_reg1.predict(poly_reg1.fit_transform([[value]]))

X_grid = np.arange(min(X),max(X),0.1)
X_grid = X_grid.reshape(len(X_grid),1)

# visualising polynomial regression degree2
plt.scatter(X,y, color='red')   
plt.plot(X_grid, lin_reg1.predict(poly_reg1.fit_transform(X_grid)),color='yellow') 
plt.plot(value, output_value, 'x', color='yellow')
plt.title("Truth or Bluff(Polynomial Regression degree 1)")
plt.xlabel('Distance')
plt.ylabel('Activations 280 mW')
plt.legend()
plt.show()
plt.savefig("polynomial regression degree1.png")

poly_reg2 = PolynomialFeatures(degree=2)
X_poly2 = poly_reg2.fit_transform(X)
  
print("X_poly2: ",X_poly2)     # prints X_poly2
 
lin_reg2 = LinearRegression()
lin_reg2.fit(X_poly2,y)

output_value = lin_reg2.predict(poly_reg2.fit_transform([[value]]))

X_grid = np.arange(min(X),max(X),0.1)
X_grid = X_grid.reshape(len(X_grid),1)

# visualising polynomial regression degree2
plt.scatter(X,y, color='red')   
plt.plot(X_grid, lin_reg2.predict(poly_reg2.fit_transform(X_grid)),color='blue') 
plt.plot(value, output_value, 'x', color='blue')
plt.title("Truth or Bluff(Polynomial Regression degree 2)")
plt.xlabel('Distance')
plt.ylabel('Activations 280 mW')
plt.legend()
plt.show()
plt.savefig("polynomial regression degree2.png")

poly_reg3 = PolynomialFeatures(degree=3)
X_poly3 = poly_reg3.fit_transform(X)

print("X_poly3: ",X_poly3)     # prints X_poly3

lin_reg3 = LinearRegression()
lin_reg3.fit(X_poly3,y)

output_value = lin_reg3.predict(poly_reg3.fit_transform([[value]]))

X_grid = np.arange(min(X),max(X),0.1)
X_grid = X_grid.reshape(len(X_grid),1) 

plt.scatter(X,y, color='red')   
plt.plot(X_grid, lin_reg3.predict(poly_reg3.fit_transform(X_grid)),color='green')
plt.plot(value, output_value, 'x', color='green') 
plt.title("Truth or Bluff(Polynomial Regression degree 3)")
plt.xlabel('Distance')
plt.ylabel('Activations 280 mW')
plt.legend()
plt.show()
plt.savefig("polynomial regression degree3.png")

poly_reg4 = PolynomialFeatures(degree=4)
X_poly4 = poly_reg4.fit_transform(X)

print("X_poly4: ",X_poly4)     # prints X_poly4

lin_reg4 = LinearRegression()
lin_reg4.fit(X_poly4,y)

output_value = lin_reg4.predict(poly_reg4.fit_transform([[value]]))
  
X_grid = np.arange(min(X),max(X),0.1)
X_grid = X_grid.reshape(len(X_grid),1) 

plt.scatter(X,y, color='red')   
plt.plot(X_grid, lin_reg4.predict(poly_reg4.fit_transform(X_grid)),color='purple')
plt.plot(value, output_value, 'x', color='purple') 
plt.title("Truth or Bluff(Polynomial Regression degree 4)")
plt.xlabel('Distance')
plt.ylabel('Activations 280 mW')
plt.legend()
plt.show()
plt.savefig("polynomial regression degree4.png")

poly_reg5 = PolynomialFeatures(degree=5)
X_poly5 = poly_reg5.fit_transform(X)

print("X_poly4: ",X_poly5)     # prints X_poly4

lin_reg5 = LinearRegression()
lin_reg5.fit(X_poly5,y)

output_value = lin_reg4.predict(poly_reg4.fit_transform([[value]]))

X_grid = np.arange(min(X),max(X),0.1)
X_grid = X_grid.reshape(len(X_grid),1) 

plt.scatter(X,y, color='red')   
plt.plot(X_grid, lin_reg5.predict(poly_reg5.fit_transform(X_grid)),color='pink')
plt.plot(value, output_value, 'x', color='pink') 
plt.title("Truth or Bluff(Polynomial Regression degree 5)")
plt.xlabel('Distance')
plt.ylabel('Activations 280 mW')
plt.legend()
plt.show()
plt.savefig("polynomial regression degree5.png")


