# Model Training:
# The train.sh script was created as an easier and faster way to train all the models.
# To use it, there must be a dataset which name starts with "rssi_antennas" in the same dir as the script, where shouldn't be stored any important model with the same name as the new ones, otherwise they will be overwritten.
# The dir which the models will be moved into is the "somos_saude" by default, but it can be changed in the script.

python3 pos_train/knn_train.py
python3 pos_train/random_forest_train.py
python3 pos_train/svr_train.py
python3 pos_train/grad_boost_regr_train.py
python3 pos_train/decision_tree_train.py

mv knn_model.sav somos_saude
mv random_forest_model.sav somos_saude
mv svr_model.sav somos_saude
mv grad_boost_regr_model.sav somos_saude
mv decision_tree_model.sav somos_saude
