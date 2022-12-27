# Indoor Location Emulator For Machine Learning Models  

The <em>indoor-location-emulator</em> is a project that was designed to compile and provide a set of synthetic data from a simulated environment that would allow for the application, study, and evaluation of a set of real characteristic factors, and that would allow the creation of real automatic learning models in the future, using Machine Learning techniques, to be applied in a context of asset localization and prediction in an indoor environment, using passive RFID tags and the RSSI values obtained from RF antennas. Use a decoupled architecture with pluggable location modules, allow users to create routes, evaluate movement and train ML models. The communication between system modules is done through the MQTT protocol over websockets.

The mapping of indoor spaces was carried out through the plugin [map-gl-indoor](https://github.com/map-gl-indoor/map-gl-indoor).

## Main Modules

Inside the <em>src</em> directory are disposed the main modules:
- <em>frontend</em>: This module includes the frontend processing of Indoor Location Emulator 
(based on [Mapbox GL JS](https://www.mapbox.com/mapbox-gljs)) [Developed with HTML, Vanilla Javascript & CSS].
- <em>backend</em>: This module includes the backend processing of Indoor Location Emulator [Developed in Python].
- <em>ml-models</em>: This module includes Machine Learning scripts [Developed in Python]. 
- <em>static-files</em>: This module includes the Static Files objects used in Emulation.

For the communication of the system modules, an MQTT broker [mosquitto](https://mosquitto.org/download/) was configured. You are free to use a similar approach or any other MQTT broker.

## Documentation 

Documentation was created individually for each module and aggregated into a page that can be accessed [here](https://atnog.github.io/indoor-location-emulator/docs).

## Deployment 

Deploy the <em>eclipse-mosquitto</em> image <em>backend</em> and <em>ml-models</em> modules with docker compose:
<code>docker compose up</code>.

## Demo

Running the <em>backend</em> and <em>ml-models</em> modules, and configuring a mosquitto MQTT broker running locally, it is possible to run a demo of the emulator [here](https://atnog.github.io/indoor-location-emulator/src/frontend/).


<img src="https://atnog.github.io/indoor-location-emulator/src/static-files/icons/Screenshot_emulator_1.png" style="max-width:800px" />
