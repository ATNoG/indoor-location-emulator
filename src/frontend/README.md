## Indoor Location Emulator For Machine Learning Models Frontend Module 

That repository includes the frontend Emulator of Indoor Positioning (using Mapbox GL JS).

[Developed with HTML, vanilla JS & CSS]

## Main features
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

Includes also a python module to generate datasets (csv files).

Main features:
- MQTT client for communication (paho-mqtt)
- Holding RSSI calculations for Antennas and Asset Point positions (Long, Lat) on a csv file

---

### Usefull commands
- install ```jsdoc``` using ```npm```:
```
npm install -g jsdoc
```

- install ```better-docs``` or ```docdash``` using ```npm``` :
```
npm install --save-dev better-docs
```

OR

```
npm install docdash
```

- generate documentation using ```jsodc``` and ```better-docs``` or ```docdash```: 
```
jsdoc ./src/ --readme ./README.md -d docs -r -t ./node_modules/better-docs
```

OR

```
jsdoc ./src/ --readme ./README.md -d docs -r -t path/to/docdash
```
---