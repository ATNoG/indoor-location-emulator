## Indoor Location Emulator For Machine Learning Models Frontend Module 

That repository includes the frontend Emulator of Indoor Positioning and Tracking (using Mapbox GL JS).

[Developed with HTML, vanilla JS & CSS]

---
## Main features:
- MQTT client for communication (paho-mqtt)
- Load Indoor Map
- Load Asset Points positions 
- Load Antennas positions 
- Load Pulsing Dots (ML Algorithms) positions
- Display lines of sight between Asset Points and Antennas
- Display intersection points with walls on each line of sight between Asset Points and Antennas
- Add and remove Asset Points, Anchors and Antennas to the Map
- Move the Asset Points in the map
- Move the Anchors in the map
- Move the Antennas in the map
- Turn the Antennas and Asset Points Directions
- Animate Asset Point with custom pre-loaded movements  
- Catch Lines of sight intersections with Directions
- Display Pulsing Dots (ML Algorithms) positions from predictor module

Includes also a python module to generate datasets (csv files): 
Main features:
- MQTT client for communication (paho-mqtt)
- Holding RSSI calculations for Antennas and Asset Point positions (Long, Lat) on a csv file

---

### Usefull command
- generate documentation using ```jsodc``` and ```better-docs``` or ```docdash```: 
```
jsdoc ./src/ --readme ./README.md -d docs -r -t ~/path_to_jsdoc/jsdoc/templates/better-docs/

OR

jsdoc ./src/ --readme ./README.md -d docs -r -t ~/path_to_jsdoc/jsdoc/templates/docdash/
```
---

## CI/CD Pipeline

### Stages for deployment
- deploy-prod

deploy-prod:
- This stage must print a message "This job deploys something from the $CI_COMMIT_BRANCH branch.", change directory and pull the code to selected directory: \
    - echo "This job deploys something from the $CI_COMMIT_BRANCH branch." \
    - ssh atnog@10.0.12.91 "cd ~/git/indoor-location-emulator-frontend; git pull;"
---

