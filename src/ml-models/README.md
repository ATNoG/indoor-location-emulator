# Machine Learning Models

This repository includes machine learning modules for the SDRT project.
It contains 2 main directories:

uji - ML techniques for positioning prediction of tags in a multi building and floor environment. It is based on the UJIIndoorLoc database, created in the Universitat Jaume I. More info here:
https://archive.ics.uci.edu/ml/datasets/ujiindoorloc

simulator_predictor - ML techniques based on the SDRT simulator. It contains python scripts for model training, stored in the corresponding location directory and a python script "predictor.py" that contains a MQTT agent responsible for communicating with the simulator and predict the location of assets based on their rssi values and the previously trained ml models.

By default, the predictor.py script will make predictions based on the models stored in the "somos_saude" dir but this could be changed by running with --models "name of another folder": python3 predictor.py --models it

Model Training:
The train.sh script was created as an easier and faster way to train all the models.
To use it, there must be a dataset which name starts with "rssi_antennas" in the same dir as the script, where shouldn't be stored any important model with the same name as the new ones, otherwise they will be overwritten.
The dir which the models will be moved into is the "somos_saude" by default, but it can be changed in the script.

Main features:
- MQTT client for communication (predictor)
- Model trainning
- Asset location prediction based on stored models

It implies the creation of a virtual environment (venv) whose dependencies come in the requirements.txt file.

### Usefull commands:
- install venv package: > ```sudo apt-get install python3-venv```
- remove .venv directory: > ```rm -Rfv .venv```
- create .venv directory: > ```python3 -m venv .venv```
- activate .venv: > ```source .venv/bin/activate```
- install dependencies on .venv from requirements.txt: > ```pip install -r requirements.txt```
- generate documentation using pdoc: > ```pdoc --math -d google -o docs predictor.py```

---

## CI/CD Pipeline

### Stages for deployment
- pull-new-commit 
- build-container 
- deploy-container 

pull-new-commit: 
- This stage must print a message "Pulling new commits", change directory and pull the code to selected directory: \
    - echo "Pulling new commits" \
    - ssh atnog@10.0.12.115 "cd ~/git/ml_models; git pull;"


build-container: 
- This stage must print a message "Building new image on latest commit", change directory, build docker image with last commit: \
    - echo "Building new image on latest commit" \
    - ssh atnog@10.0.12.115 "cd ~/git/ml_models/src; sudo docker build -t sdrt/ml_models:$CI_COMMIT_SHORT_SHA .;"


deploy-container: 
- This stage must print a message "Stopping and removing current container", stop docker image, remove docker image and run docker image with last commit: \
    - echo "Stopping and removing current container" \
    - ssh atnog@10.0.12.115 "sudo docker stop ml_models; sudo docker rm ml_models; sudo docker run -d --name=ml_models sdrt/ml_models:$CI_COMMIT_SHORT_SHA;"

---

