import numpy as np

def dict_mean_std(d):
    output = {}
    for key in d.keys():
        output[key] = {}
        for sub_key in d[key].keys():
            mean = sum(d[key][sub_key]) / len(d[key][sub_key])
            std = np.std(d[key][sub_key])
            output[key][sub_key] = {"mean": mean, "std": std}
    return output

# Returns the maximum elem of a list of numbers no grater than a given value
def max_no_greater_value(lst, value):
    lst = sorted(lst)
    output = lst[0]
    for val in lst:
        if val > value:
            break
        output = val
    return output


di = {"0.5":{"280": [1, 2, 3], "290": [1, 3, 5]}, "2.5":{"280": [1, 2, 3], "290": [1, 3, 5]}}
# print(dict_mean_std(di))
# {'0.5': {'280': {'mean': 2.0, 'std': 0.816496580927726}, '290': {'mean': 3.0, 'std': 1.632993161855452}}, \
#  '2.5': {'280': {'mean': 2.0, 'std': 0.816496580927726}, '290': {'mean': 3.0, 'std': 1.632993161855452}}}

# Test max_no_greater_value() function
number_lst = [1, 2, 3, 4, 5]
print(max_no_greater_value(number_lst, 0))
print(max_no_greater_value(number_lst, 1.5))
print(max_no_greater_value(number_lst, 6))