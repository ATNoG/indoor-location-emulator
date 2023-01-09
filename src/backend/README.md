# Indoor Location Emulator For Machine Learning Models Backend Module

That repository includes the Python modules of Indoor Location Emulator backend.

## Main features

- MQTT client for communication (paho-mqtt)
- Catching Map Walls (from static-files/config_maps)
- Distances calculations (between asset points and antennas)
- RSSI calculations (between asset points and antennas) using "rssi" features
- Activations calculations (between asset points points and antennas) using "activations" features
- Use of GOD Class (object that knows everything about the system)

The Dev environment implies the creation of a virtual environment (venv) whose dependencies come in the ```requirements.txt``` file.

### Usefull commands:
- install venv package: > ```sudo apt-get install python3-venv```
- remove .venv directory: > ```rm -Rfv .venv```
- create .venv directory: > ```python3 -m venv .venv```
- activate .venv: > ```source .venv/bin/activate```
- install dependencies on .venv from requiremnts.txt: > ```pip install -r requirements.txt```
- generate documentation using pdoc: > ```pdoc --math -d google -o docs src``` 
- show .venv ip routes: ```ip route```

### Documentation

Python Documentation of Backend Module, built with <em>pdoc</em>: [here](https://atnog.github.io/indoor-location-emulator-backend/).

---