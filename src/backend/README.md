# Indoor Location Emulator Backend Modules

That repository includes the Python modules of Indoor Location Emulator backend.

### Main features
- MQTT client for communication (paho-mqtt)
- Catching Map Walls
- Distances calculations (between points and antennas)
- RSSI calculations (between points and antennas)
- Use of GOD Class (object that knows everything about the system)

The Dev environment implies the creation of a virtual environment (venv) whose dependencies come in the requirements.txt file.

### Usefull commands:
- install venv package: > ```sudo apt-get install python3-venv```
- remove .venv directory: > ```rm -Rfv .venv```
- create .venv directory: > ```python3 -m venv .venv```
- activate .venv: > ```source .venv/bin/activate```
- install dependencies on .venv from requiremnts.txt: > ```pip install -r requirements.txt```
- generate documentation using pdoc: > ```pdoc --math -d google -o docs backend_emulator``` 

---

# Asset Classes Module
- GOD class (object that knows everything about the system, including Asset Points, Anchors and Antennas Classes)
- Asset Point class (object that save Asset Points information data)
- Anchors class (object that save Anchors information data)
- Anchors class (object that save Anchors information data)
- Antennas class (object that save Antennas information data)

---

# CI/CD Pipeline 

### Stages for deployment 
- pull-new-commit 
- build-container 
- deploy-container 

pull-new-commit: 
- This stage must print a message "Pulling new commits", change directory and pull the code to selected directory: 
    - echo "Pulling new commits" 
    - ssh atnog@10.0.12.91 "cd ~/git/backend-emulator; git pull;"

build-container: 
- This stage must print a message "Building new image on latest commit", change directory, build docker image with last commit: 
    - echo "Building new image on latest commit" 
    - ssh atnog@10.0.12.91 "cd ~/git/backend-emulator; sudo docker build -t sdrt/backend-emulator:$CI_COMMIT_SHORT_SHA .;" 

deploy-container: 
- This stage must print a message "Stopping and removing current container", stop docker image, remove docker image and run docker image with last commit: 
    - echo "Stopping and removing current container"
    - ssh atnog@10.0.12.91 "sudo docker stop backend-emulator; sudo docker rm backend-emulator; sudo docker run -d --name=backend-emulator sdrt/backend-emulator:$CI_COMMIT_SHORT_SHA;"

---
