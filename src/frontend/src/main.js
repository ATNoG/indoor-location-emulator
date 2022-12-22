/**
 * Main Function definition 
 * @module main */

/**
 * Main function to start the scene after the Map selection
 */
function mainMethod() {
    // var to hold config Json File Path
    var configJsonFilePath;
    // Get Selected Map Index from Splash Page Map Options DropDownList
    var selectedMapIndex = document.getElementById("map_select").selectedIndex;

    if (selectedMapIndex == 0) {
        // path to JSON  (Library - Aveiro University, Aveiro, Portugal)
        configJsonFilePath = '../static-files/config_files/config-params-library-ua-floor2.json';
    }

    if (selectedMapIndex == 1) {
        // path to JSON  (IT Aveiro Building 1, Aveiro, Portugal)
        configJsonFilePath = '../static-files/config_files/config-params-aveiro-it-building1.json';
    }

    if (selectedMapIndex == 2) {
        // path to JSON  (Policlínica Dr. Mário Martins, São João da Madeira, Portugal)
        configJsonFilePath = '../static-files/config_files/config-params-sjm-policlinica-mario-martins.json';
    }
    
    // path to antenna_icon and anchor_icon png files
    var antenna_icon = '../static-files/icons/antenna_icon.png'
    var anchor_icon = '../static-files/icons/anchor_icon.png'

    // generate a UUID and show it on 'session-uuid' HTML element (Connect Broker options)
    var session_uuid = generateUUID();
    document.getElementById("session-uuid").innerHTML = session_uuid;

    // generate a random clientID: "clientJS-XXXXX" and show it on 'clientjs-id' HTML element (Connect Broker options)
    var rndm = Math.floor(Math.random() * 10000);
    var client_id = "clientJS-" + rndm;
    document.getElementById("clientjs-id").innerHTML = client_id;

    // ========== Map configurations ========== //
    // Global map, map_url, mapFeaturesData,filter_walls, filter_walls_level vars
    var map, map_url, mapFeaturesData, filter_walls_keywords, filter_walls_levels;

    // Maptiler (Maplibre GL JS) style map and api key (unused)
    var maptiler_apiKey;
    const maptiler_styleMap = 'basic';
    const maptiler_style = `https://api.maptiler.com/maps/${maptiler_styleMap}/style.json?key=${maptiler_apiKey}`;
    // ========== End of Map configurations ========== //

    // save previous asset points lobes angle directions
    var prev_large_lobe_angle_direction, prev_small_lobe_angle_direction;

    // var to set animation speed factor, default = 1
    var animation_speed_factor = 1;

    // register time of last frame rendered. To limit CPU usage.
    var last_frame = 0;

    // CPU frame rate (Limit to 10 = 100/10 updates per second)
    const cpu_frame_rate = 50

    // const decimal places in transit geojson messages - Source: http://wiki.gis.com/wiki/index.php/Decimal_degrees
    const geojson_precison_decimal_places = 8; // decimal places: 8, degrees: 0.00000001, distance: 1.11 mm

    // This array pulsing_dots_layers_IDs will contain a list used to filter against.
    const pulsing_dots_layers_IDs = [];
    const pulsing_dots_layers_sources = [];

    // array to hold click coordinates
    var clickCoords = [];

    // vars of mqtt connection
    var mqtt_hostname;
    var mqtt_port;
    var reconnect_timeout;
    var clientUsername;
    var clientPassword;
    var ssl_flag = false;

    // string object to hold message to send to MQTT Broker (Publish Message)
    var messageToSend = "";

    // Define the topic susbscription
    var mqttTopicToReceivePredictions;
    var mqttTopicToReceiveCalculations;

    // object to hold received_uuid
    var received_uuid = "";

    /***** Indoor specific *****/
    // Where the indoor layers will be inserted. Here, 'housenum-label' comes from streets-v10
    const beforeLayerId = 'housenum-label';

    // const to avoid unwanted overlap from streets-v10 layers, some layers are hidden when an indoor map is shown
    const layersToHide = ['poi-scalerank4-l15', 'poi-scalerank4-l1', 'poi-scalerank3', 'road-label-small'];

    // filter colors (uncalled)
    const layers = [{
        "filter": [
            "filter-==",
            "indoor",
            "room"
        ],
        "id": "indoor-rooms",
        "type": "fill",
        "source": "indoor",
        "paint": {
            "fill-color": "#00ff00",
            "fill-opacity": 0.5
        }
    },
    {
        "filter": [
            "filter-==",
            "indoor",
            "area"
        ],
        "id": "indoor-areas",
        "type": "fill",
        "source": "indoor",
        "paint": {
            "fill-color": "#ff0000",
            "fill-opacity": 0.5
        }
    },
    {
        "filter": [
            "filter-==",
            "name",
            "Outdoor glass"
        ],
        "id": "name-glass",
        "type": "fill",
        "source": "indoor",
        "paint": {
            "fill-color": "#0000ff",
            "fill-opacity": 0.5
        }
    }]

    /**
     * Construct the Mapbox Geocoder with forwardGeocoder
     */
    let geocoder = new MapboxGeocoder({
        localGeocoderOnly: true,
        localGeocoder: (query) => forwardGeocoder(query, mapFeaturesData),
        zoom: 20,
        placeholder: 'Enter search e.g. Room',
        mapboxgl: mapboxgl,
        marker: true,
    });

    /**  
     * Event when geocoder get the result
     */
    geocoder.on("result", (result) => {
        printableMessage = 'result.result.properties: ' + JSON.stringify(result.result.properties, null, 2);

        // print to console and to console_debugger
        console.log(printableMessage);
        printOnConsoleDebugger(printableMessage);
        try {
            map.indoor.setLevel(parseInt(result.result.properties.level));
        }
        catch (err) {
            // print to console and to console_debugger
            console.log(err.message);
            printOnConsoleDebugger(err.message);
        }
    })

    /**
     * Create a custom popup, but don't add it to the map yet.
     */
    const popup = new mapboxgl.Popup({
        offset: 15,
        closeButton: true,
        closeOnClick: true
    });

    /**
     * Create a set of Draggable antennas with popups (Antennas) 
     */ 
    const geojson_antennas = {
        'type': 'FeatureCollection',
        'features': []
    };

    /**
     *  Create a Draggable Point with popups (Asset Point) 
     */
    const geojson_asset_points = {
        'type': 'FeatureCollection',
        'features': []
    };

    /**
     * Create Pulsing-Dot Points (Asset Predictions and Tracking) 
     */ 
    const geojson_pulsing_dots_points = {
        'type': 'FeatureCollection',
        'features': []
    };

    /**
     * Create a FeatureCollection to hold Anchors with popups  
     */ 
    const geojson_anchors = {
        'type': 'FeatureCollection',
        'features': []
    };

    /** 
     * Create a FeatureCollection to hold wall_intersections_points in geojson
     */ 
    const wall_intersections_points = {
        'type': 'FeatureCollection',
        'features': []
    };

    /**
     * Create a FeatureCollection to hold Line-of-Sight lineStrings in geojson
     */
    const geojson_lines_of_sight = {
        'type': 'FeatureCollection',
        'features': []
    };

    /**
     * Create a FeatureCollection to hold walls of indoor map
     */
    const geojson_walls = {
        'type': 'FeatureCollection',
        'features': []
    };

    /**
     * Create a FeatureCollection to hold geojson_antennas_diriections in geojson
     */
    const geojson_antennas_directions = {
        'type': 'FeatureCollection',
        'features': []
    };

    /**
     * Create a FeatureCollection to hold geojson_assetpoints_directions in geojson
     */
    const geojson_assetpoints_directions = {
        'type': 'FeatureCollection',
        'features': []
    };

    /**
     * Instantiate new control button with custom event handler to toggle Coordinates Asset Point Container
     */
    const controlCoordinatesPointContainer = new MapboxGLButtonControl({
        className: 'my-custom-control-coordinates-point',
        title: "Asset Point Coordinates",
        textContent: "Point Coordinates",
        id: "coordinates-point",
        eventHandler: toggleCoordinatesAssetPointContainer,
    });
    
    /**
     * Instantiate new control button with custom event handler to toggle Distance Rssi Container
     */
    const controlDistanceRssiContainer = new MapboxGLButtonControl({
        className: 'my-custom-control-distance-container',
        title: "Distances & RSSI Measurements",
        textContent: "Distances & RSSI",
        id: "distance-rssi-container",
        eventHandler: toggleDistanceRssiContainer,
    });

    /**
     * Instantiate new control button with custom event handler to toggle Animation Options Container
     */
    const controlAnimationOptionsContainer = new MapboxGLButtonControl({
        className: 'my-custom-control-antimation-options-container',
        title: "Animation Options",
        textContent: "Animation Options",
        id: "animation-options-container",
        eventHandler: toggleAnimationOptionsContainer,
    });

    /**
     * Instantiate new control button with custom event handler to toggle Console Debug Container
     */
    const controlConsoleDebuggerContainer = new MapboxGLButtonControl({
        className: 'my-custom-control-console-debugger',
        title: "Console Debugger",
        textContent: "Console Debugger",
        id: "console-debugger-container",
        eventHandler: toggleConsoleDebugContainer,
    });

    /**
     * Instantiate new control button with custom event handler to toggle Rssi Path Loss Model Container
     */
    const controlRssiPathLossModelContainer = new MapboxGLButtonControl({
        className: 'my-custom-control-rssi-pathlossmodel-container',
        title: "RSSI Path-Loss Model",
        textContent: "RSSI Path-Loss Model",
        id: "rssi-variables-container",
        eventHandler: toggleRssiPathLossModelContainer,
    });

    /**
     * Instantiate new control button with custom event handler to toggle ML Agents Container
     */
    const controlMlAgentsContainer = new MapboxGLButtonControl({
        className: 'my-custom-control-ml-agents-container',
        title: "Select ML Agents",
        textContent: "Select ML Agents",
        id: "ml-agents-container",
        eventHandler: toggleMlAgentsContainer,
    });

    // fetch config json file
    fetch(configJsonFilePath)
        .then(result => result.json())
        .then(data => {
            // mapbox_acess_token from json file
            const mapboxgl_accessToken = data.apis.mapbox_access_token
            // mapbox style map
            const mapbox_style = data.apis.mapbox_style_map
            // words to filter walls of the map
            filter_walls_keywords = data.map.filter_walls_keywords
            // level to filter walls of the map
            filter_walls_levels = data.map.filter_walls_levels
            // map url from json file
            map_url = data.map.map_url
            // maptiler_apiKey from json file (unused)
            //maptiler_apiKey = data.apis.maptiler_apiKey
            // maptiler style map (unused)
            //mapbox_style = maptiler_style

            // load Assets for the map
            map = loadMapAssets(
                configJsonFilePath,
                selectedMapIndex, mapbox_style, mapboxgl_accessToken,
                controlCoordinatesPointContainer, controlDistanceRssiContainer, controlAnimationOptionsContainer,
                controlConsoleDebuggerContainer, controlRssiPathLossModelContainer, controlMlAgentsContainer,
                geojson_asset_points, geojson_antennas, geojson_pulsing_dots_points,
                geojson_assetpoints_directions, geojson_antennas_directions, geojson_lines_of_sight,
                geojson_anchors, geojson_walls, wall_intersections_points,
                geojson_precison_decimal_places, pulsing_dots_layers_IDs, pulsing_dots_layers_sources,
                popup, cpu_frame_rate, last_frame,
                geocoder, clickCoords, animation_speed_factor,
                prev_large_lobe_angle_direction, prev_small_lobe_angle_direction,
                data.map.asset_point_animations,
                data.map.anchors_url, data.map.antennas_url, data.map.assets_url, data.map.pulsing_dot_points,
                data.map.map_center, data.map.map_zoom, data.map.map_pitch, data.map.map_bearing,
                data.map.map_max_long, data.map.map_min_long, data.map.map_max_lat, data.map.map_min_lat,
                data.map.marker_point, data.map.marker_logo, data.map.marker_info,
                antenna_icon, anchor_icon,
                client_id, mqtt_hostname, mqtt_port,
                reconnect_timeout, clientUsername, clientPassword,
                ssl_flag, messageToSend,
                mqttTopicToReceivePredictions, mqttTopicToReceiveCalculations,
                received_uuid
            );
        }).then(async () => {
            // Retrieve the geojson 2D indoor Map from the path and add the map
            await fetch(map_url)
                .then(result => result.json())
                .then(geojson_map => {
                    // Add map to the indoor handler
                    map.indoor.addMap(
                        // Create indoor map from geojson and options
                        mapgl_indoor.IndoorMap.fromGeojson(geojson_map, { beforeLayerId, layersToHide })
                    );
                    // hold features data from geojson map
                    mapFeaturesData = geojson_map;
                    // catch Walls Of Map Features Data
                    catchWallsOfMapFeaturesData(mapFeaturesData, geojson_walls, filter_walls_keywords, filter_walls_levels)
                });
        });
}
// =========== End of Main Function =========== //