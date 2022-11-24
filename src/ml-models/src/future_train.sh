# Model Training:
# The future_train.sh script was created as an easier and faster way to train all the models.
# To use it, there must be a dataset which name starts with "rssi_antennas" in the same dir as the script, where shouldn't be stored any important model with the same name as the new ones, otherwise they will be overwritten.
# The dir which the models will be moved into is the "somos_saude" by default, but it can be changed in the script.

python3 future_pos_train/future_random_forest_train.py
python3 future_pos_train/future_decision_tree_train.py
python3 future_pos_train/future_svr_train.py
python3 future_pos_train/future_grad_boost_regr_train.py
python3 future_pos_train/future_rnn_train.py

mv future_random_forest_model* somos_saude
mv future_svr_model* somos_saude
mv future_grad_boost_regr_model* somos_saude
mv future_decision_tree_model* somos_saude
mv future_rnn_model* somos_saude