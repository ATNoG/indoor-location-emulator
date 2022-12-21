#!/usr/bin/env bash

relativedirectory="$( dirname -- "$0"; )";
cd "$relativedirectory";
basedirectory="$( pwd; )";
echo "Your base directory is #${basedirectory}#";

sudo apt-get install python3-venv

# src/backend module
echo "open directory: src/backend";
cd $basedirectory/src/backend
python3 -m venv .venv
. "$basedirectory/src/backend/.venv/bin/activate"
pip install -r requirements.txt

# src/ml-models
echo "open directory: src/ml-models";
cd $basedirectory/src/ml-models
python3 -m venv .venv
. "$basedirectory/src/ml-models/.venv/bin/activate"
pip install -r requirements.txt