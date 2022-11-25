/**
 * Custom Buttons Controls Class and functions definitons
 * @module button */

/**
 * Button Control implemented as ES6 class 
 * @constructor
 */
class MapboxGLButtonControl {
    /**
     * Create a Mapbox GL Button object.
     * @param {string} className - The className value.
     * @param {string} title - The title value.
     * @param {string} textContent - The textContent value.
     * @param {string} id - The id value.
     * @param {event} eventHandler - The eventHandler value.
     */
    constructor(
        {
            className = "",
            title = "",
            textContent = "",
            id = "",
            eventHandler = evtHndlr
        }) {
        this._className = className;
        this._title = title;
        this._textContent = textContent;
        this._id = id;
        this._eventHandler = eventHandler;
    }
     /**
     * On Add function.
     * @param {map} map The map object.
     * @return {HTMLDivElement} The this.container div element.
     */
    onAdd(map) {
        this._map = map;
        this._btn = document.createElement("button");
        this._btn.className = this._className;
        this._btn.type = "button";
        this._btn.id = this._id;
        this._btn.title = this._title;
        this._btn.textContent = this._textContent;
        this._btn.onclick = this._eventHandler;

        this._container = document.createElement("div");
        this._container.className = "mapboxgl-ctrl " + this._className;
        this._container.appendChild(this._btn);

        return this._container;
    }
    /**
     * On Remove function.
     */
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

// ========== Buttons Controls Event Handlers ========== //
/**
 * Connect event handler 
 * @param {event} event 
 */
function doConnect(event) {
    if (!connectedFlag) {
        toggleMqttVariablesContainer();
    }
    else {
        printableMessage = event.target.textContent + ":" + "\r\n" + "The client is already connected to the broker!";
        // show window alert message
        alert(printableMessage);
        // print to console and to console_debugger
        console.log(printableMessage);
        printOnConsoleDebugger(printableMessage);
    }
}

/**
 * Disconnect event handler 
 * @param {event} event 
 * @param {string} client_id 
 * @param {string} connection_string 
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {number} geojson_precison_decimal_places Vaule of precison decimal places
 * @param {number} selectedMapIndex index of selected Map
 * @param {string} messageToSend MQTT message to send to the broker
 * @param {Array} pulsing_dots_layers_IDs Pulsing Dots IDs Array
 */
function doDisconnect(
    event,
    client_id,
    connection_string,
    geojson_asset_points,
    geojson_antennas,
    geojson_anchors,
    geojson_precison_decimal_places,
    selectedMapIndex,
    messageToSend,
    pulsing_dots_layers_IDs
) {
    if (connectedFlag) {
        printableMessage = event.target.textContent + ":" + "\r\n" + "The client will disconnect from the broker...";
        // show window alert message
        alert(printableMessage);
        // print to console and to console_debugger
        console.log(printableMessage);
        printOnConsoleDebugger(printableMessage);
        // call MQTTdisconnect() function
        disconnectFromMqttBroker(
            client_id,
            connection_string,
            geojson_asset_points,
            geojson_antennas,
            geojson_anchors,
            geojson_precison_decimal_places,
            selectedMapIndex,
            messageToSend,
            pulsing_dots_layers_IDs
        );
    }
    else {
        printableMessage = event.target.textContent + ":" + "\r\n" + "The client is already disconnected from the broker!";
        // show window alert message
        alert(printableMessage);
        // print to console and to console_debugger
        console.log(printableMessage);
        printOnConsoleDebugger(printableMessage);
    }
}

/**
 * Toggle Coordinates Point Container
 */
function toggleCoordinatesAssetPointContainer() {
    if (coordinatesPointContainerFlag == 1) {
        coordinates_point_container.style.display = '';
        coordinatesPointContainerFlag = 0;
    }
    else {
        coordinates_point_container.style.display = 'block';
        coordinatesPointContainerFlag = 1;
    }
}

/**
 * Toggle Distance & RSSI Point Container
 */
function toggleDistanceRssiContainer() {
    if (distanceRssiContainerFlag == 1) {
        distance_rssi_container.style.display = '';
        distanceRssiContainerFlag = 0;
    }
    else {
        distance_rssi_container.style.display = 'block';
        distanceRssiContainerFlag = 1;

    }
}

/**
 * Toggle Animation Options Container
 */
function toggleAnimationOptionsContainer() {
    if (animationOptionsContainerFlag == 1) {
        animation_options_container.style.display = '';
        animationOptionsContainerFlag = 0;
    }
    else {
        animation_options_container.style.display = 'block';
        animationOptionsContainerFlag = 1;

        // close ml_agents container
        ml_agents_container.style.display = '';
        mlAgentsContainerFlag = 0;

        // close mqtt variables container
        mqtt_variables_container.style.display = '';
        mqttVariablesContainerFlag = 0;
    }
}

/**
 * Toggle ML Agents Container
 */
function toggleMlAgentsContainer() {
    if (mlAgentsContainerFlag == 1) {
        ml_agents_container.style.display = '';
        mlAgentsContainerFlag = 0;
    }
    else {
        ml_agents_container.style.display = 'block';
        mlAgentsContainerFlag = 1;

        // close mqtt variables container
        mqtt_variables_container.style.display = '';
        mqttVariablesContainerFlag = 0;

        // close animations options container
        animation_options_container.style.display = '';
        animationOptionsContainerFlag = 0;
    }
}

/**
 * Toggle Console Debugger Container
 */
function toggleConsoleDebugContainer() {
    if (consoleDebuggerContainerFlag == 1) {
        console_debugger.style.display = '';
        consoleDebuggerContainerFlag = 0;
    }
    else {
        console_debugger.style.display = 'block';
        consoleDebuggerContainerFlag = 1;
    }
}

/**
 * Toggle RSSI Path Loss Model Container
 */
function toggleRssiPathLossModelContainer() {
    if (rssiPathLossModelContainerFlag == 1) {
        rssi_pathlossmodel_container.style.display = '';
        rssiPathLossModelContainerFlag = 0;
    }
    else {
        rssi_pathlossmodel_container.style.display = 'block';
        rssiPathLossModelContainerFlag = 1;
    }
}

/**
 * Toggle Mqtt Variables Container
 */
function toggleMqttVariablesContainer() {
    if (mqttVariablesContainerFlag == 1) {
        mqtt_variables_container.style.display = '';
        mqttVariablesContainerFlag = 0;
    }
    else {
        mqtt_variables_container.style.display = 'block';
        mqttVariablesContainerFlag = 1;

        // close animations options container
        animation_options_container.style.display = '';
        animationOptionsContainerFlag = 0;

        // close ml_agents container
        ml_agents_container.style.display = '';
        mlAgentsContainerFlag = 0;
    }
}

/**
 * Add a new Asset Point Marker to the Map 
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_assetpoints_directions Asset Points Directions FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 * @param {Array} pulsing_dots_layers_IDs Pulsing Dots IDs Array
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {number} map_max_long Maximum value of Map Longitude
 * @param {number} map_min_long Minimum value of Map Longitude
 * @param {number} map_max_lat Maximum value of Map Latitude
 * @param {number} map_min_lat Minimum value of Map Latitude
 */
function addAssetPointMarkerToMap(
    geojson_antennas,
    geojson_asset_points,
    geojson_assetpoints_directions,
    geojson_anchors,
    geojson_lines_of_sight,
    wall_intersections_points,
    geojson_walls,
    pulsing_dots_layers_IDs,
    pulsing_dots_layers_sources,
    map_max_long,
    map_min_long,
    map_max_lat,
    map_min_lat
) {
    var random_long = getRandomArbitrary(map_min_long, map_max_long);
    var random_lat = getRandomArbitrary(map_min_lat, map_max_lat);

    animatingAssetPointFlags.push(false);

    const new_ap_index = geojson_asset_points.features.length;

    const new_asset_point_collection = {
        'type': 'FeatureCollection',
        'features': [{
            'type': 'Feature',
            'properties': {
                'id': new_ap_index,
                'title': `Asset Point ${new_ap_index + 1}`,
                'description': `Asset Point ${new_ap_index + 1} description`,
                'label': `AP${new_ap_index + 1}`,
                'angle_direction_large_lobe': 0,
                'angle_direction_small_lobe': 180,
                'angle_opening_large_lobe': 120,
                'angle_opening_small_lobe': 120,
                'draggable': true,
                'show_lines': false,
                'show_predictions': false

            },
            'geometry': {
                'type': 'Point',
                'coordinates': [random_long, random_lat]
            }
        }]
    }

    // get all layers of map styles    
    const layers = map.getStyle().layers;

    // Find the index of the first symbol layer in the map style
    let firstAssetPointsLayerId;
    for (const layer of layers) {
        if (layer.id === 'layer-with-asset-points') {
            firstAssetPointsLayerId = layer.id;
            break;
        }
    }

    // for the firsts pulsing dots = 8 
    const pulsing_dots_fixed_size = pulsing_dots_layers_sources[0].features.length;
    // Deep clone copy source data without reference
    const geojson_pulsing_dots_points_new_add = JSON.parse(JSON.stringify(pulsing_dots_layers_sources[0]));

    // Add GeoJSON source of pulsing-dot-points to the map.   
    map.addSource(`pulsing-dot-points-${new_ap_index + 1}`, {
        'type': 'geojson',
        'data': geojson_pulsing_dots_points_new_add
    });
    // push new source to pulsing_dots_layers_sources
    pulsing_dots_layers_sources.push(geojson_pulsing_dots_points_new_add);

    // for first 8 pulsing dots 
    for (let i = 0; i < pulsing_dots_fixed_size; i++) {
        const pulsing_dot_feature = pulsing_dots_layers_sources[0].features[i];
        const new_pulsing_dot_index = pulsing_dots_layers_sources[0].features.length * (new_ap_index) + i;
        const algo = pulsing_dot_feature.properties.algorithm.toUpperCase();
        const basecolor = pulsing_dot_feature.properties.basecolor;
        const pulsing_dot_imageID = `pulsing-dot-ap${new_ap_index + 1}-rgb-${basecolor}`;
        const layerID = `layer-with-pulsing-dot-ap${new_ap_index + 1}-${algo}`;

        // Generate Animated Image withe a basecolor
        var animatedPulsingDot = generateAnimatedImage(basecolor);

        // for the APs bigger than 1 update pulsing dot data in the collection
        const new_pulsing_dot_collection = {
            'type': 'FeatureCollection',
            'features': [{
                "type": "Feature",
                "properties": {
                    "id": new_pulsing_dot_index,
                    "title": `Dot-Pulsing Point ${new_pulsing_dot_index + 1}`,
                    "description": `Dot-Pulsing point${new_pulsing_dot_index + 1} description`,
                    "algorithm": `${algo}`,
                    "basecolor": `${pulsing_dot_feature.properties.basecolor}`,
                    "draggable": false
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        0,
                        0
                    ]
                }
            }]
        }
        // update values of added source data
        pulsing_dots_layers_sources[pulsing_dots_layers_sources.length - 1].features[i] = (new_pulsing_dot_collection.features[0]);

        // Add a layer for this layerID if it hasn't been added already.
        if (!map.getLayer(layerID)) {
            // check if the pulsing_dot_imageID already exists on the map
            if (!map.hasImage(pulsing_dot_imageID)) {
                // Add an animated image to the map, with a specific ID with some options
                map.addImage(pulsing_dot_imageID, animatedPulsingDot, { pixelRatio: 3 });
            }

            // Add pulsing-dot-points layer to the map (type: symbol)
            map.addLayer({
                'id': layerID,
                'type': 'symbol',
                'source': `pulsing-dot-points-${new_ap_index + 1}`,
                'layout': {
                    'icon-image': ['concat', `pulsing-dot-ap${new_ap_index + 1}-rgb-`, ['get', 'basecolor']],
                    'icon-allow-overlap': true,
                    "icon-ignore-placement": true,
                    'text-field': ['get', 'algorithm'],
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    "text-padding": 0,
                    'text-size': 10,
                    'text-offset': [0, 0],
                    'text-anchor': 'center',
                    'text-justify': 'auto',
                    "text-allow-overlap": false,
                    "text-ignore-placement": false,
                    "text-optional": true,
                    'visibility': 'none'
                },
                'paint': {
                    "text-color": "black",
                    "text-halo-color": "white",
                    "text-halo-width": 1,
                    "text-halo-blur": 1
                },
                'filter': ['==', 'algorithm', algo]
            }, firstAssetPointsLayerId);

            // push layerID to list of layers
            pulsing_dots_layers_IDs.push(layerID);
        }
    }

    // update source 
    map.getSource(`pulsing-dot-points-${new_ap_index + 1}`).setData(pulsing_dots_layers_sources[new_ap_index]);

    // push new markers to 'geojson_asset_points' FeatureCollection
    geojson_asset_points.features.push(new_asset_point_collection.features[0]);

    // update source 'asset-points'
    map.getSource('asset-points').setData(geojson_asset_points);

    // create asset points directions by index, with a given rotation of 0
    createAssetPointLobesDirection(new_asset_point_collection.features[0], geojson_assetpoints_directions);

    // Call setData to the source layer `assetpoints_directions` on it.
    map.getSource('assetpoints_directions').setData(geojson_assetpoints_directions);

    // set printable Message
    printableMessage = `'${geojson_asset_points.features[new_ap_index].properties.title}'` + " has been added to the Map.";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);

    // add header message to print on console and on Distances & RSSI container (?)
    var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
        ` &#8226; Asset Point added. Connect to MQTT to know the measurements.`;

    // Update container innerHTML 
    updateContainerInnerHtml(distance_rssi_container, messageToContainer)

    // Start the LinesOfSight animation.
    animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
    // Start the IntersectionPoints animation.
    animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
    // Start the pulsingDotPoints animation.
    animatePulsingDotPoints(pulsing_dots_layers_sources);
}

/**
 * Delete the last Asset Point Marker from the Map 
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_assetpoints_directions Asset Points Directions FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 * @param {Array} pulsing_dots_layers_IDs Pulsing Dots IDs Array
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 */
function deleteLastAssetPointMarkerFromMap(
    geojson_antennas,
    geojson_asset_points,
    geojson_assetpoints_directions,
    geojson_anchors,
    geojson_lines_of_sight,
    wall_intersections_points,
    geojson_walls,
    pulsing_dots_layers_IDs,
    pulsing_dots_layers_sources
) {
    // verify if have more than one asset point 
    if (geojson_asset_points.features.length > 1) {
        // and if any asset point is not animating 
        if (!animatingAssetPointFlags[geojson_asset_points.features.length - 1]) {

            animatingAssetPointFlags.pop();

            // Call event to close all open popups
            map.fire('closeAllPopups');

            const ap_number = geojson_asset_points.features.length;
            const sourceID = `pulsing-dot-points-${ap_number}`;

            for (const pulsing_dot_source of pulsing_dots_layers_sources[pulsing_dots_layers_sources.length - 1].features) {
                const algo = pulsing_dot_source.properties.algorithm.toUpperCase();
                const basecolor = pulsing_dot_source.properties.basecolor;
                const pulsing_dot_imageID = `pulsing-dot-ap${ap_number}-rgb-${basecolor}`;
                const layerID = `layer-with-pulsing-dot-ap${ap_number}-${algo}`;

                // Check if map has already pulsing_dot_imageID
                if (map.hasImage(pulsing_dot_imageID)) {
                    // remove image                       
                    map.removeImage(pulsing_dot_imageID);
                    // Check if map has already layerID
                    if (map.getLayer(layerID)) {
                        // remove layer
                        map.removeLayer(layerID);
                        // remove layer from list of layers
                        pulsing_dots_layers_IDs = removeItemAll(pulsing_dots_layers_IDs, layerID);
                    }
                }
            }

            // Check if map has already sourceID
            if (map.getSource(sourceID)) {
                //remove source
                map.removeSource(sourceID)
                // remove source from list of sources
                pulsing_dots_layers_sources.pop();
            }

            // remove (pop) the last marker from 'geojson_antennas' FeatureCollection
            geojson_asset_points.features.pop();

            // update source 'antennas'
            map.getSource('asset-points').setData(geojson_asset_points);

            // remove (splice) the direction at currentFeatureId from 'geojson_assetpoints_directions' FeatureCollection (x2 for asset_points_directions)
            geojson_assetpoints_directions.features.splice((geojson_asset_points.features.length * 2), 2);
            // Call setData to the source layer `assetpoints_directions` on it.
            map.getSource('assetpoints_directions').setData(geojson_assetpoints_directions);

            // set printable Message
            printableMessage = `'${geojson_asset_points.features[geojson_asset_points.features.length - 1].properties.title}'` + " has been removed from the Map.";

            // print to console and to console_debugger
            console.log(printableMessage);
            printOnConsoleDebugger(printableMessage);

            // add header message to print on console and on Distances & RSSI container (?)
            var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
                ` &#8226; Asset Point removed. Connect to MQTT to know the measurements.`;

            // Update container innerHTML
            updateContainerInnerHtml(distance_rssi_container, messageToContainer)

            // Start the LinesOfSight animation.
            animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
            // Start the IntersectionPoints animation.
            animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
            // Start the pulsingDotPoints animation.
            animatePulsingDotPoints(pulsing_dots_layers_sources);
        }
    }
    else {
        // populate message to print
        var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
            ` &#8226; Keep at least one Asset Point, to measure Distances and RSSI. \n Connect to MQTT to know the measurements.`;

        // print to console and to console_debugger
        console.log(messageToContainer);
        printOnConsoleDebugger(messageToContainer);

        // Update container innerHTML
        updateContainerInnerHtml(distance_rssi_container, messageToContainer);
    }
}

/**
 * Add a new Antenna Marker to the Map 
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_antennas_directions Antennas Directions FeatureCollection
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {number} map_max_long Maximum value of Map Longitude
 * @param {number} map_min_long Minimum value of Map Longitude
 * @param {number} map_max_lat Maximum value of Map Latitude
 * @param {number} map_min_lat Minimum value of Map Latitude
 */
function addAntennaMarkerToMap(
    geojson_antennas,
    geojson_antennas_directions,
    geojson_asset_points,
    geojson_anchors,
    geojson_lines_of_sight,
    wall_intersections_points,
    geojson_walls,
    pulsing_dots_layers_sources,
    map_max_long,
    map_min_long,
    map_max_lat,
    map_min_lat,
) {
    var random_long = getRandomArbitrary(map_min_long, map_max_long);
    var random_lat = getRandomArbitrary(map_min_lat, map_max_lat);
    const new_index = geojson_antennas.features.length;
    const new_antenna_collection = {
        'type': 'FeatureCollection',
        'features': [{
            'type': 'Feature',
            'properties': {
                'id': new_index,
                'title': `Antenna ${new_index + 1}`,
                'description': `Antenna ${new_index + 1} description`,
                'tx_power': 300,
                'angle_direction': 45,
                'angle_opening': 90,
                'draggable': true,
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [random_long, random_lat]
            }
        }]
    }
    // push new markers to 'geojson_antennas' FeatureCollection
    geojson_antennas.features.push(new_antenna_collection.features[0]);

    // update source 'antennas'
    map.getSource('antennas').setData(geojson_antennas);

    // create antenna direction
    createAntennaDirection(new_antenna_collection.features[0], geojson_antennas_directions)

    // update source 'antennas_directions'
    map.getSource('antennas_directions').setData(geojson_antennas_directions);

    // set printable Message
    printableMessage = `'${geojson_antennas.features[new_index].properties.title}'` + " has been added to the Map.";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);

    // add header message to print on console and on Distances & RSSI container
    var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
        ` &#8226; Antenna added. Connect to MQTT to know the measurements.`;

    // Update container innerHTML
    updateContainerInnerHtml(distance_rssi_container, messageToContainer)

    // Start the LinesOfSight animation.
    animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
    // Start the IntersectionPoints animation.
    animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
    // Start the pulsingDotPoints animation.
    animatePulsingDotPoints(pulsing_dots_layers_sources);

    // set flag needUpdateAntennas to true
    needUpdateAntennas = true;
}

/**
 *  Delete the last Antenna Marker from the Map 
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_antennas_directions Antennas Directions FeatureCollection
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 */
function deleteLastAntennaMarkerFromMap(
    geojson_antennas,
    geojson_antennas_directions,
    geojson_asset_points,
    geojson_anchors,
    geojson_lines_of_sight,
    wall_intersections_points,
    geojson_walls,
    pulsing_dots_layers_sources
) {
    if (geojson_antennas.features.length > 1) {
        if (!animatingAssetPointFlags[geojson_asset_points.features.length - 1]) {
            // Call event to close all open popups
            map.fire('closeAllPopups');

            // set printable Message
            printableMessage = `'${geojson_antennas.features[geojson_antennas.features.length - 1].properties.title}'` + " has been removed from the Map.";

            // remove (pop) the last marker from 'geojson_antennas' FeatureCollection
            geojson_antennas.features.pop();

            // update source 'antennas'
            map.getSource('antennas').setData(geojson_antennas);

            // remove (pop) the last direction from 'geojson_antennas_directions' FeatureCollection
            geojson_antennas_directions.features.pop();

            // update source 'antennas_directions'
            map.getSource('antennas_directions').setData(geojson_antennas_directions);

            // print to console and to console_debugger
            console.log(printableMessage);
            printOnConsoleDebugger(printableMessage);

            // add header message to print on console and on Distances & RSSI container
            var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
                ` &#8226; Antenna removed. Connect to MQTT to know the measurements.`;

            // Start the LinesOfSight animation.
            animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
            // Start the IntersectionPoints animation.
            animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
            // Start the pulsingDotPoints animation.
            animatePulsingDotPoints(pulsing_dots_layers_sources);

            // set flag needUpdateAntennas to true
            needUpdateAntennas = true;
        }
    }
    else {
        // populate message to print
        var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
            ` &#8226; Keep at least one Antenna, to measure Distances and RSSI. \n Connect to MQTT to know the measurements.`;

        // print to console and to console_debugger
        console.log(messageToContainer);
        printOnConsoleDebugger(messageToContainer);
    }

    // Update container innerHTML
    updateContainerInnerHtml(distance_rssi_container, messageToContainer);
}

/**
 * Add a new Anchor Marker to the Map 
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 * @param {number} map_max_long Maximum value of Map Longitude
 * @param {number} map_min_long Minimum value of Map Longitude
 * @param {number} map_max_lat Maximum value of Map Latitude
 * @param {number} map_min_lat Minimum value of Map Latitude
 */ 
function addAnchorMarkerToMap(
    geojson_anchors,
    geojson_asset_points,
    geojson_antennas,
    geojson_lines_of_sight,
    wall_intersections_points,
    geojson_walls,
    map_max_long,
    map_min_long,
    map_max_lat,
    map_min_lat,
) {
    var random_long = getRandomArbitrary(map_min_long, map_max_long);
    var random_lat = getRandomArbitrary(map_min_lat, map_max_lat);
    const new_index = geojson_anchors.features.length;
    const new_anchor_collection = {
        'type': 'FeatureCollection',
        'features': [{
            'type': 'Feature',
            'properties': {
                'id': new_index,
                'title': `Anchor ${new_index + 1}`,
                'description': `Anchor ${new_index + 1} description`,
                'show_lines': false,
                'draggable': true,
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [random_long, random_lat]
            }
        }]
    }
    // push new markers to 'geojson_anchors' FeatureCollection
    geojson_anchors.features.push(new_anchor_collection.features[0]);

    // update source 'anchors'
    map.getSource('anchors').setData(geojson_anchors);

    // set printable Message
    printableMessage = `'${geojson_anchors.features[new_index].properties.title}'` + " has been added to the Map.";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);

    // add header message to print on console and on Distances & RSSI container
    var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
        ` &#8226; Anchor added. Connect to MQTT to know the measurements.`;

    // Start the LinesOfSight animation.
    animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
    // Start the IntersectionPoints animation.
    animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);

    // Update container innerHTML
    updateContainerInnerHtml(distance_rssi_container, messageToContainer)

    // set flag needUpdateAnchors to true
    needUpdateAnchors = true;
}

/**
 * Delete the last Anchor Marker from the Map 
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 */
function deleteLastAnchorMarkerFromMap(
    geojson_anchors,
    geojson_asset_points,
    geojson_antennas,
    geojson_lines_of_sight,
    wall_intersections_points,
    geojson_walls
) {
    if (geojson_anchors.features.length > 0) {
        if (!animatingAssetPointFlags[geojson_asset_points.features.length - 1]) {
            // Call event to close all open popups
            map.fire('closeAllPopups');

            // set printable Message
            printableMessage = `'${geojson_anchors.features[geojson_anchors.features.length - 1].properties.title}'` + " has been removed from the Map.";

            // remove (pop) the last marker from 'geojson_anchors' FeatureCollection
            geojson_anchors.features.pop();

            // update source 'antennas'
            map.getSource('anchors').setData(geojson_anchors);

            // print to console and to console_debugger
            console.log(printableMessage);
            printOnConsoleDebugger(printableMessage);

            // add header message to print on console and on Distances & RSSI container
            var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
                ` &#8226; Anchor removed. Connect to MQTT to know the measurements.`;

            // Start the LinesOfSight animation.
            animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);

            // Start the IntersectionPoints animation.
            animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);

            // set flag needUpdateAnchors to true
            needUpdateAnchors = true;
        }
    }
    else {
        // populate message to print
        var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
            ` &#8226; There is no anchors on the map, add first one. \n Connect to MQTT to know the measurements.`;

        // print to console and to console_debugger
        console.log(messageToContainer);
        printOnConsoleDebugger(messageToContainer);
    }

    // Update container innerHTML
    updateContainerInnerHtml(distance_rssi_container, messageToContainer);
}

// ========== End of Buttons Controls Event Handlers ========== //