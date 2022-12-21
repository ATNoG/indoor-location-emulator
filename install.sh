sudo apt-get install python3-venv

cd ~/sdrt/Working/Simulator/github/indoor-location-emulator/src/backend
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt

cd ~/sdrt/Working/Simulator/github/indoor-location-emulator/src/ml-models
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt