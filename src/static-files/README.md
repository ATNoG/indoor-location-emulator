# Static Objects

Static Files used in Emulator

That repository includes the static-files used in <em>frontend</em> and <em>backend</em> modules:
1. antenna_datasets folder with: 
    - Experimental data collected from an antenna RF and RFID passive tags from 0.5 meters until 10.0 meters with steps of 0.5 meters.
        - Look up table data to estimate activations of each antenna in the emulator using "activations" features from configuration file.

2. config_files folder with:
    - configuration file for each map, includes (loaded by <em>frontend</em> and <em>backend</em> modules):
        - API Mapbox connection parameters.
        - Map configurations including paths for files loaded in the emulation: 
            - map_url, antennas_url, anchors_url, assets_url, pulsing_dot_points, asset_point_animations.
            - filter keywords and level for map.
            - map center, zoom, pitch and boundaries parameters.
            - map marker point coordinates, image name path and marker info data.
        - MQTT broker connection parameters.
        - Machine Learning Agents parameters descriptions.
        - RSSI Path Loss Model parameters.
        - Features to apply calculations: "rssi" or "activations"
            - "rssi" will produce results (Pulsing Dots Coordinates) of the one asset point in map from <em>ml-models</em>, using data previously collected from the emulator by use asset point animations and trained to generate Machine Learning Models based on RSSI.
            - "activations" will produce results (Pulsing Dots Coordinates) of multiple asset points in map from <em>ml-models</em> using a Look Up table data previously collected from an antenna RF and RFID passive tags.

3. geojson_objs folder with:
    - Geojson Maps 
    - Geojson of asset points positions
    - Geojson of antennas positions
    - Geojson of anchors positions
    - Geojson of pulsing dots positions
    - Geojson of custom move animations

4. icons folder with:
    - icons/images used in the emulator
