# This script creates a new geojson file from another but it mirrors the positions of the points, making the dataset two times bigger.

import json

jsonfile = open('somos_saude_policlinica_dr_mario_martins_custom_move4.geojson','r')
json_data = json.load(jsonfile)
# print(json_data)

json_data["features"][0]["geometry"]["coordinates"] = json_data["features"][0]["geometry"]["coordinates"][:-1] + json_data["features"][0]["geometry"]["coordinates"][::-1]

with open('somos_saude_policlinica_dr_mario_martins_custom_move4_2.geojson', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=4)

# inputs = [
#    ['a', 'b', 'c'],
#    ['d', 'e', 'f'],
#    ['g', 'h', 'i'],
# ]

# print(inputs[:-1] + (inputs[::-1]))