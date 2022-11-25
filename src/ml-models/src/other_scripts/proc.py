from operator import indexOf
import string
import sys
import glob
from tokenize import String
from collections import defaultdict
import matplotlib.pyplot as plt
import csv
import pandas as pd
from sklearn import neighbors
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor 
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error 
from math import sqrt
# 1648734594.331922, sdrt-health/mac:02010b41cdec/antenna/tag/e28068940000400386621d4f, 82

def nested_dict(n, type):
    if n == 1:
        return defaultdict(type)
    else:
        return defaultdict(lambda: nested_dict(n-1, type))

return_dict = {}
return_dict = nested_dict(5, float)
data_files = list(i.split("/")[-1] for i in glob.glob("power_var_data/*/*"))
print(len(data_files))
print("")
for data_file in data_files:
    file_lst = data_file.replace(".csv", "").split("_")
    dist = file_lst[1]
    pwr = file_lst[3]
    iter = file_lst[-1]
    # print(dist, pwr, iter)

    f = open(f'power_var_data/{dist} meters/{data_file}', 'r')

    tags = dict()
    ver = False
    cont = 0
    for line in f:
        cont+=1
        if 'antenna/tag/e2' in line:
            
            vl = line.split(", ")
            
            if(len(vl) == 3):

                ver = True
                
                tag = vl[1].split('/')[-1]
                rssi = int(vl[2])

                if tag not in tags:
                    tags[tag] = []

                tags[tag].append(rssi)

    if not ver:
        return_dict["e28068940000400386621d4f"][dist][pwr][iter]["activations"] = 0
        return_dict["e28068940000400386621d4f"][dist][pwr][iter]["rssi_min"] = 170
        return_dict["e28068940000400386621d4f"][dist][pwr][iter]["rssi_max"] = 170
        return_dict["e28068940000400386621d4f"][dist][pwr][iter]["rssi_avg"] = 170

    for tag in tags:
        # print(f"Tag: {tag} Min:{min(tags[tag])} Max:{max(tags[tag])} Count:{len(tags[tag])} Avg:{round(sum(tags[tag])/len(tags[tag]),2)}")

        return_dict[tag][dist][pwr][iter]["rssi_min"] = min(tags[tag])
        return_dict[tag][dist][pwr][iter]["rssi_max"] = max(tags[tag])
        return_dict[tag][dist][pwr][iter]["rssi_avg"] = round(sum(tags[tag])/len(tags[tag]),2)
        return_dict[tag][dist][pwr][iter]["activations"] = len(tags[tag])

        # if tag in return_dict:
        #     if dist in return_dict[tag]:
        #         if pwr in return_dict[tag][dist]:
        #             if iter in return_dict[tag][dist][pwr]:        
        #                 return_dict[tag][dist][pwr][iter]["rssi_min"] = min(tags[tag])
        #                 return_dict[tag][dist][pwr][iter]["rssi_min"] = max(tags[tag])
        #                 return_dict[tag][dist][pwr][iter]["rssi_avg"] = round(sum(tags[tag])/len(tags[tag]),2)
        #                 return_dict[tag][dist][pwr][iter]["activations"] = len(tags[tag])
        # else:
        #     return_dict[tag] = {}
    
# print(return_dict)
# print("Return: "+str(dict(return_dict["e28068940000400386621d4f"]["1.5"]["290"])))
dist_ar = []
activations_ar = []
cont = 0
data_to_csv = {"distance": []}
train_dict = {"distance": []}
test_dict = {"distance": []}
for tag in return_dict:
    for d in range(1, 9):
        dist = d/2
        dist_ar.append(dist)
        dist = str(dist)
        smpl_pwr_ar = []
        smpl_actv_ar = []
        for pwr in range(100, 310, 10):
            smpl_pwr_ar.append(pwr)
            pwr = str(pwr)
            iter_avg = []
            for iter in return_dict[tag][dist][pwr]:
                val = return_dict[tag][dist][pwr][iter]["activations"]
                iter_avg.append(val)
                cont += 1
                if iter == "3":
                    if pwr in test_dict:
                        test_dict[pwr].append(val)
                    else:
                        test_dict[pwr] = [val]
                else:
                    if pwr in train_dict:
                        train_dict[pwr].append(val)
                    else:
                        train_dict[pwr] = [val]
                
                if pwr == "300":
                    if iter == "3":
                        test_dict["distance"].append(float(dist))
                    else:
                        train_dict["distance"].append(float(dist))


            if pwr != "260" and pwr != "270":
                avg = round(sum(iter_avg)/len(iter_avg),2)
                activations_ar.append(avg)
                smpl_actv_ar.append(avg)
                if pwr in data_to_csv:
                    data_to_csv[pwr].append(avg)
                else:
                    print("\nPower:")
                    print(pwr)
                    data_to_csv[pwr] = [avg]
            else:
                activations_ar.append(activations_ar[-1])
                smpl_actv_ar.append(smpl_actv_ar[-1])
                
        data_to_csv["distance"].append(float(dist))

        plt.plot(smpl_pwr_ar, smpl_actv_ar, label = f'Distance = {dist}m')
        # plt.title(f'Distance = {dist}m')
        plt.xticks(smpl_pwr_ar, smpl_pwr_ar)
        # plt.show()

plt.xlabel('Power')
plt.ylabel('Activations')
plt.legend()
# plt.show()

print(return_dict["e28068940000400386621d4f"]["1.5"]["110"]["3"]["activations"])
print(cont)
print(dist_ar)
print(len(activations_ar))

for key in test_dict.keys():
    print(f'{key} - {len(test_dict[key])}')

df = pd.DataFrame(data_to_csv)
train_df = pd.DataFrame(train_dict)
test_df = pd.DataFrame(test_dict)
# print(train_df)
# print(test_df)

# with open('activations_data.csv', 'w') as f:
#     w = csv.DictWriter(f, data_to_csv.keys())
#     w.writeheader()
#     w.writerow(data_to_csv)

x_train = train_df.drop(["distance"], axis=1)
x_test = test_df.drop(["distance"], axis=1)
y_train = train_df[["distance"]]
y_test = test_df[["distance"]]

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

# Training model with the best K
k_min = 1 + min(range(len(rmse_val)), key=rmse_val.__getitem__)
model3 = neighbors.KNeighborsRegressor(n_neighbors = k_min)
# model = neighbors.KNeighborsRegressor(n_neighbors = k_min, metric = "manhattan")
model3.fit(x_train.values, y_train.values)  #fit the model
pred3=model3.predict(x_test.values) #make prediction on test set
error3 = sqrt(mean_squared_error(y_test,pred3)) #calculate rmse
error_per3 = (error3/3.5)*100

model1 = RandomForestRegressor() 
model1.fit(x_train.values, y_train.values)
pred1=model1.predict(x_test.values) #make prediction on test set
error1 = sqrt(mean_squared_error(y_test,pred1)) #calculate rmse
error_per1 = (error1/3.5)*100

model2 = DecisionTreeRegressor(random_state = 0) 
model2.fit(x_train.values, y_train.values)
pred2=model2.predict(x_test.values) #make prediction on test set
error2 = sqrt(mean_squared_error(y_test,pred2)) #calculate rmse
error_per2 = (error2/3.5)*100

model4 = GradientBoostingRegressor() 
model4.fit(x_train.values, y_train.values)
pred4=model4.predict(x_test.values) #make prediction on test set
error4 = sqrt(mean_squared_error(y_test,pred4)) #calculate rmse
error_per4 = (error4/3.5)*100

model5 = SVR(kernel = 'rbf')
model5.fit(x_train.values, y_train.values)
pred5=model5.predict(x_test.values) #make prediction on test set
error5 = sqrt(mean_squared_error(y_test,pred5)) #calculate rmse
error_per5 = (error5/3.5)*100

print("Errors:")
print("Random Forest: "+"{:.2f}".format(error1)+"m ("+"{:.1f}".format(error_per1)+" %)")
print("Decision Tree: "+"{:.2f}".format(error2)+"m ("+"{:.1f}".format(error_per2)+" %)")
print("Support Vector Regression: "+"{:.2f}".format(error5)+"m ("+"{:.1f}".format(error_per5)+" %)")
print("Gradient Boosting Regression: "+"{:.2f}".format(error4)+"m ("+"{:.1f}".format(error_per4)+" %)")
print("KNN with k = "+str(k_min)+": "+"{:.2f}".format(error3)+"m ("+"{:.1f}".format(error_per3)+" %)")


