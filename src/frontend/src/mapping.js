/**
 * Mapping function definition
 *  @module mapping */

/**
 * Load assets for the map function
 * @param {string} configJsonFilePath Path to JSON config file
 * @param {number} selectedMapIndex Index of selected Map
 * @param {string} mapbox_style Mapbox GL JS style
 * @param {string} mapboxgl_accessToken Mapbox GL JS accessToken
 * @param {MapboxGLButtonControl} controlCoordinatesPointContainer Button to toggle Coordinates Point Container
 * @param {MapboxGLButtonControl} controlDistanceRssiContainer Button to toggle Distance Rssi Container
 * @param {MapboxGLButtonControl} controlAnimationOptionsContainer Button to toggle Animation Options Container
 * @param {MapboxGLButtonControl} controlConsoleDebuggerContainer Button to toggle Console Debugger Container
 * @param {MapboxGLButtonControl} controlRssiPathLossModelContainer Button to toggle Rssi Path Loss Model Container
 * @param {MapboxGLButtonControl} controlMlAgentsContainer Button to toggle ML Agents 
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_pulsing_dots_points_1 Pulsing Dots of First AP FeatureCollection
 * @param {FeatureCollection} geojson_assetpoints_directions Asset Points Directions FeatureCollection
 * @param {FeatureCollection} geojson_antennas_directions Antennas Directions FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 * @param {Array} pulsing_dots_layers_IDs Pulsing Dots IDs Array
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {Popup} popup Popup object
 * @param {number} cpu_frame_rate CPU frame rate
 * @param {number} last_frame Last frame value
 * @param {MapboxGeocoder} geocoder Mapbox Geocoder
 * @param {Array} clickCoords Mouse click coordinatess Array
 * @param {number} animation_speed_factor value of animation speed factor
 * @param {number} prev_large_lobe_angle_direction Previous value of large lobe angle direction of Asset Point
 * @param {number} prev_small_lobe_angle_direction Previous value of small lobe angle direction of Asset Point
 * @param {Array} asset_point_animations Asset Point Animations Array
 * @param {string} anchors_url Path to Anchors objects
 * @param {string} antennas_url Path to Antennas objects
 * @param {string} assets_url Path to Asset points objects
 * @param {string} pulsing_dot_points Path to Pulsing Dot Points objects
 * @param {LongLat} map_center Longitude and Latitude coordinates of map center
 * @param {number} map_zoom Value of Map zoom
 * @param {number} map_pitch Value of Map pitch
 * @param {number} map_bearing Value of Map bearing
 * @param {number} map_max_long Maximum value of Map Longitude
 * @param {number} map_min_long Minimum value of Map Longitude
 * @param {number} map_max_lat Maximum value of Map Latitude
 * @param {number} map_min_lat Minimum value of Map Latitude
 * @param {LongLat} marker_point Longitude and Latitude coordinates of marker point
 * @param {string} marker_logo Path to logo image marker
 * @param {string} marker_info Description to include on logo image marker popup
 * @param {string} client_id MQTT client ID
 * @param {string} mqtt_hostname MQTT hostname connection
 * @param {string} mqtt_port MQTT port connection
 * @param {number} reconnect_timeout MQTT reconnect Time Out value
 * @param {string} clientUsername MQTT client username connection
 * @param {string} clientPassword MQTT client password connection
 * @param {boolean} ssl_flag MQTT connection SSL flag
 * @param {string} messageToSend MQTT message to send to broker
 * @param {string} mqttTopicToReceivePredictions MQTT Topic To Receive Predictions
 * @param {string} mqttTopicToReceiveCalculations MQTT Topic To Receive Calculations
 * @param {string} received_uuid MQTT received session UUID
 * @returns {Array} Map features Array
 */
function loadMapAssets(
    configJsonFilePath,
    selectedMapIndex, mapbox_style, mapboxgl_accessToken,
    controlCoordinatesPointContainer, controlDistanceRssiContainer, controlAnimationOptionsContainer,
    controlConsoleDebuggerContainer, controlRssiPathLossModelContainer, controlMlAgentsContainer,
    geojson_asset_points, geojson_antennas, geojson_pulsing_dots_points_1,
    geojson_assetpoints_directions, geojson_antennas_directions, geojson_lines_of_sight,
    geojson_anchors, geojson_walls, wall_intersections_points,
    geojson_precison_decimal_places, pulsing_dots_layers_IDs, pulsing_dots_layers_sources,
    popup, cpu_frame_rate, last_frame,
    geocoder, clickCoords, animation_speed_factor,
    prev_large_lobe_angle_direction, prev_small_lobe_angle_direction, asset_point_animations,
    anchors_url, antennas_url, assets_url, pulsing_dot_points,
    map_center, map_zoom, map_pitch, map_bearing,
    map_max_long, map_min_long, map_max_lat, map_min_lat,
    marker_point, marker_logo, marker_info,
    antenna_icon, anchor_icon,
    client_id, mqtt_hostname, mqtt_port,
    reconnect_timeout, clientUsername, clientPassword,
    ssl_flag, messageToSend,
    mqttTopicToReceivePredictions, mqttTopicToReceiveCalculations,
    received_uuid
) {
    // ADDED ACCESS TOKEN FROM https://account.mapbox.com
    // Mapbox GL JS access token 
    mapboxgl.accessToken = mapboxgl_accessToken;

    /**
     * Map Tile Object from Mapbox GL JS 
     */
    const map = window.map = new mapboxgl.Map({
        container: 'map', // container ID
        style: mapbox_style,
        center: map_center, // map starting position (IT Aviero Building 1)
        zoom: map_zoom, // starting zoom
        pitch: map_pitch, // pitch camera in degrees
        bearing: map_bearing, // bearing camera in degrees
        attributionControl: false,
        hash: false,
        antialias: false
    });

    /**
     * Get map canvas container
     */
    const canvas = map.getCanvasContainer();

    // map.on 'load' function - async()
    map.on('load', async () => {
        // Create custom markers instance with popups
        const place_policlinica_sjm = marker_point;

        // create DOM elements for the marker (custom)
        const marker_el1 = document.createElement('div');

        // attach #marker_it_logo to div html elements 
        marker_el1.id = marker_logo;

        // create the popups
        const popup_somos_saude_policlinica = new mapboxgl.Popup({
            offset: 25
        }).setText(marker_info);

        // Create the markers, set Long and Lat, set Popup and add it to the map
        new mapboxgl.Marker(marker_el1).setLngLat(place_policlinica_sjm).setPopup(popup_somos_saude_policlinica).addTo(map);

        // Get GeoJSON Objects from file system (Somos Saúde - Policlinica Dr. Mário Martins São João da Madeira)
        geojson_antennas = await getGeoJsonObject(antennas_url);
        geojson_asset_points = await getGeoJsonObject(assets_url);
        geojson_anchors = await getGeoJsonObject(anchors_url);
        geojson_pulsing_dots_points_1 = await getGeoJsonObject(pulsing_dot_points);

        // Add a GeoJSON source with antennas to the map.
        map.addSource('antennas', {
            'type': 'geojson',
            'data': geojson_antennas
        });

        // Add a GeoJSON source with antennas directions to the map.
        map.addSource('antennas_directions', {
            'type': 'geojson',
            'data': geojson_antennas_directions
        });

        // Add GeoJSON source with asset point to the map.
        map.addSource('asset-points', {
            'type': 'geojson',
            'data': geojson_asset_points
        });

        // Add a GeoJSON source with asset points directions to the map.
        map.addSource('assetpoints_directions', {
            'type': 'geojson',
            'data': geojson_assetpoints_directions
        });

        // Add a GeoJSON source with anchors to the map.
        map.addSource('anchors', {
            'type': 'geojson',
            'data': geojson_anchors
        });

        // Add GeoJSON source of pulsing-dot-points to the map.   
        map.addSource('pulsing-dot-points-1', {
            'type': 'geojson',
            'data': geojson_pulsing_dots_points_1
        });

        // Add GeoJSON source of lines of sight to the map.
        map.addSource('lines-of-sight', {
            'type': 'geojson',
            'data': geojson_lines_of_sight
        });

        // Add GeoJSON source with obstacles features (walls) to the map.
        map.addSource('walls', {
            'type': 'geojson',
            'data': geojson_walls
        });

        // Add GeoJSON source of lines of sight to the map.
        map.addSource('wall-intersections-points', {
            'type': 'geojson',
            'data': wall_intersections_points
        });

        // Add layer to the obstacles (walls) to the map.   
        map.addLayer({
            'id': 'layer-with-walls',
            'type': 'line',
            'source': 'walls',
            'layout': {},
            'paint': {
                'line-color': 'black',
                'line-opacity': 0.5,
                'line-width': 1,
            }
        });

        // Add layer for lines-of-sight to the map. 
        map.addLayer({
            'id': 'layer-with-lines',
            'type': 'line',
            'source': 'lines-of-sight',
            'paint': {
                'line-color': 'black',
                'line-opacity': 0.2,
                'line-width': 1.5,
                'line-dasharray': [5, 5]
            }
        });

        // Add layer to the obstacles (walls) intersections to the map.   
        map.addLayer({
            'id': 'layer-with-intersection-walls',
            'type': 'point',
            'source': 'wall-intersections-points',
            'type': 'circle',
            'layout': {},
            'paint': {
                'circle-radius': 3,
                'circle-color': 'violet',
                'circle-opacity': 0.5,
                'circle-stroke-width': 0.25,
                'circle-stroke-color': 'white'
            }
        });

        // Add layer to the assetpoints-directions  
        map.addLayer({
            'id': 'layer-with-assetpoints-directions',
            'type': 'fill',
            'source': 'assetpoints_directions',
            'layout': {},
            'paint': {
                'fill-color': 'lightblue',
                'fill-opacity': 0.4,
                'fill-outline-color': 'darkgrey'
            }
        });

        // Add layer to asset point to the map.
        map.addLayer({
            'id': 'layer-with-asset-points',
            'type': 'circle',
            'source': 'asset-points',
            'layout': {},
            'paint': {
                'circle-radius': 15,
                'circle-color': 'lightgrey', // grey color
                'circle-opacity': 0.95,
                'circle-stroke-width': 3,
                'circle-stroke-color': 'white'
            }
        });

        // Add asset point label layer (type: symbol) to the map.
        map.addLayer({
            "id": "layer-with-asset-points-labels",
            "type": "symbol",
            "source": "asset-points",
            "layout": {
                "text-field": ['get', 'label'],
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                "text-padding": 0,
                'text-size': 12,
                'text-offset': [0, 0],
                'text-anchor': 'center',
                'text-justify': 'auto',
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-optional": true,
            },
            'paint': {
                "text-color": "black",
                "text-halo-color": "white",
                "text-halo-width": 1,
                "text-halo-blur": 1
            }
        });

        // add sky styling with `setFog` that will show when the map is highly pitched
        map.setFog({
            'horizon-blend': 0.3,
            'color': '#f8f0e3',
            'high-color': '#add8e6',
            'space-color': '#d8f2ff',
            'star-intensity': 0.0
        });

        // When the cursor click a feature in the 'asset-points' layer
        map.on('click', 'layer-with-asset-points', (e) => {
            // Change the cursor style as a UI indicator.
            canvas.style.cursor = 'pointer';
            // Copy of event click coodinates
            clickCoords = e.point;
            // Get current feature Id
            currentAssetFeatureId = e.features[0].properties.id;
            // Copy coordinates array
            const coordinates = geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates.slice();
            // Copy draggable bool value
            const draggability = geojson_asset_points.features[currentAssetFeatureId].properties.draggable;
            // Copy show_lines bool value
            const show_lines = geojson_asset_points.features[currentAssetFeatureId].properties.show_lines;
            // Copy show_predictions bool value
            const show_predictions = geojson_asset_points.features[currentAssetFeatureId].properties.show_predictions;
            // Copy show_lines bool value
            const animation_option = geojson_asset_points.features[currentAssetFeatureId].properties.animation_option_index;
            // copy asset point large lobe Direction value (x2 for asset_points_directions)
            const assetpoint_angle_direction_large_lobe = geojson_assetpoints_directions.features[currentAssetFeatureId * 2].properties.angle_direction_large_lobe.toFixed(2);
            // copy assetpoint angle opening of large lobe value (x2 for asset_points_directions)
            const assetpoint_angle_opening_large_lobe = geojson_assetpoints_directions.features[currentAssetFeatureId * 2].properties.angle_opening_large_lobe.toFixed(2);
            // copy asset point large lobe Direction value (x2 for asset_points_directions)
            const assetpoint_angle_direction_small_lobe = geojson_assetpoints_directions.features[currentAssetFeatureId * 2].properties.angle_direction_small_lobe.toFixed(2);
            // copy assetpoint angle opening of small lobe value (x2 for asset_points_directions)
            const assetpoint_angle_opening_small_lobe = geojson_assetpoints_directions.features[currentAssetFeatureId * 2].properties.angle_opening_small_lobe.toFixed(2);
            // get number of loaded animations + 1 (option 0 is not an animation)
            const nr_animations_available = asset_point_animations.length + 1;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            // define popup content
            const popupContent = `<strong>${geojson_asset_points.features[currentAssetFeatureId].properties.title}</strong><br/>` +
                `<strong>Description:</strong> ${geojson_asset_points.features[currentAssetFeatureId].properties.description}<br/>` +
                `<strong>Latitude:</strong> ${geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[1]}<br/>` +
                `(${convertDMSLat(geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[1])})<br/>` +
                `<strong>Logitude:</strong> ${geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[0]}<br/>` +
                `(${convertDMSLng(rescrictTo180Degrees(geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[0]))})<br/>` +
                `<strong>Large Lobe Dir:</strong> <input type="text" id="ap_large_direction_parameter" value=${assetpoint_angle_direction_large_lobe} 
            style="width:50px; text-align:right; background-color:rgba(255, 255, 255, 1.0);
            color: rgba(128,128,128,1.0);"> ${String.fromCharCode(176)} (NORTH)<br/>` +
                `<strong>Small Lobe Dir:</strong> <input type="text" id="ap_small_direction_parameter" value=${assetpoint_angle_direction_small_lobe} 
            style="width:50px; text-align:right; background-color:rgba(255, 255, 255, 1.0);
            color: rgba(128,128,128,1.0);"> ${String.fromCharCode(176)} (NORTH)<br/>` +
                `<strong>Large Lobe Opening:</strong> <input type="text" id="ap_large_opening_parameter" value=${assetpoint_angle_opening_large_lobe} 
            style="width: 50px; text-align:right; background-color:rgba(255, 255, 255, 1.0);
            color: rgba(128,128,128,1.0);"> ${String.fromCharCode(176)}<br/>` +
                `<strong>Small Lobe Opening:</strong> <input type="text" id="ap_small_opening_parameter" value=${assetpoint_angle_opening_small_lobe} 
            style="width: 50px; text-align:right; background-color:rgba(255, 255, 255, 1.0);
            color: rgba(128,128,128,1.0);"> ${String.fromCharCode(176)}<br/>` +
                `<strong>Toggle Drag Option: </strong>` +
                `<input type="checkbox" id="check_toggle_drag" 
            style="height:12px; width:12px; vertical-align: middle; 
            margin-top: -1px;"${(draggability == true ? "checked" : "unchecked")}> ${(draggability == true ? "ON" : "OFF")} <br/>` +
                `<strong>Toggle Lines-of-Sight: </strong>` +
                `<input type="checkbox" id="check_toggle_lines_of_sight" 
            style="height:12px; width:12px; vertical-align: middle; 
            margin-top: -1px;"${(show_lines == true ? "checked" : "unchecked")}> ${(show_lines == true ? "ON" : "OFF")} <br/>` +
                `<strong>Toggle Predictions: </strong>` +
                `<input type="checkbox" id="check_toggle_predictions" 
            style="height:12px; width:12px; vertical-align: middle; 
            margin-top: -1px;"${(show_predictions == true ? "checked" : "unchecked")}> ${(show_predictions == true ? "ON" : "OFF")} <br/>` +
                `<strong>Select an animation:</strong>
                <select id="animation_ap${currentAssetFeatureId}" name="animation_ap${currentAssetFeatureId}" 
                style="width:100%; border-radius: 3px; font-size: 12px; background-color:rgba(255,255,255,1.0); 
                color: rgba(0, 0, 0, 1.0);">
                    <option id="animation_option0" value='null'> -- select an option -- </option>
                    <option id="animation_option1" value='animation1'>Animation 1</option>
                    <option id="animation_option2" value='animation2'>Animation 2</option>
                    <option id="animation_option3" value='animation3'>Animation 3</option>
                    <option id="animation_option4" value='animation4'>Animation 4</option>
                    <option id="animation_option5" value='animation5'>Animation 5</option>
                    <option id="animation_option6" value='animation6'>Animation 6</option>
                    <option id="animation_option7" value='animation7'>Animation 7</option>
                    <option id="animation_option8" value='animation8'>Animation 8</option>
                    <option id="animation_option9" value='animation9'>Animation 9</option>
                    <option id="animation_option10" value='animation10'>Animation 10</option>
                    <option id="animation_option11" value='animation11'>Animation 11</option>
                </select><br/><br/>`+
                `<button class='content' id='btn_save_assetpoint_configs' style="width: 100%;">Update Asset Point Config</button>`;

            // Populate the popup and set its coordinates
            // based on the feature found.
            popup.setLngLat(coordinates).setHTML(popupContent).addTo(map);
            document.getElementById(`animation_ap${currentAssetFeatureId}`).selectedIndex = animation_option;
            document.getElementById(`animation_ap${currentAssetFeatureId}`).options.length = nr_animations_available;

            // Attach event listener to button toggleDrag
            document.getElementById('check_toggle_drag').addEventListener('click', function () {
                toggleDrag('asset-points', geojson_asset_points, currentAssetFeatureId, draggability);
            });

            // Attach event listener to button toggleLinesOfSight
            document.getElementById('check_toggle_lines_of_sight').addEventListener('click', function () {
                toggleLinesOfSight('asset-points', geojson_asset_points, currentAssetFeatureId, show_lines);
                // Call LinesOfSight animation.
                animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight)
                // Call the IntersectionPoints animation.
                animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
            });

            // Attach event listener to button togglePredictions
            document.getElementById('check_toggle_predictions').addEventListener('click', function () {
                togglePredictions('asset-points', geojson_asset_points, currentAssetFeatureId, show_predictions);
            });

            // Attach event listener to button 
            document.getElementById('btn_save_assetpoint_configs').addEventListener('click', function () {
                // save previous lobes values
                prev_large_lobe_angle_direction = assetpoint_angle_direction_large_lobe;
                prev_small_lobe_angle_direction = assetpoint_angle_direction_small_lobe;

                // Drop down list of available animations
                let itemListAnimations = document.getElementById(`animation_ap${currentAssetFeatureId}`);
                var animationItem = itemListAnimations.options[itemListAnimations.selectedIndex].value;

                updateAssetPointConfigs('asset-points',
                    geojson_asset_points,
                    geojson_assetpoints_directions,
                    prev_large_lobe_angle_direction,
                    prev_small_lobe_angle_direction,
                    animationItem,
                    currentAssetFeatureId);
            });
        });

        // When the cursor enters a feature in
        // the asset-point layer, prepare for dragging.
        map.on('mouseenter', 'layer-with-asset-points', () => {
            canvas.style.cursor = 'move';
        });

        map.on('mouseleave', 'layer-with-asset-points', () => {
            canvas.style.cursor = '';
        });

        map.on('mouseup', 'layer-with-asset-points', () => {
            // change circle-radius and circle-color of 'asset-points'
            map.setPaintProperty('layer-with-asset-points', 'circle-radius', 15);
            map.setPaintProperty('layer-with-asset-points', 'circle-color', 'lightgrey');
        });

        map.on('mousedown', 'layer-with-asset-points', (e, draggability) => {
            // Prevent the default map drag behavior.
            e.preventDefault();
            // Copy of event click coodinates
            clickCoords = e.point;
            // Copy current Feature Id value
            currentAssetFeatureId = e.features[0].properties.id;
            // Copy draggable bool value
            draggability = e.features[0].properties.draggable;

            // change circle-radius and circle-color of 'asset-points'
            map.setPaintProperty('layer-with-asset-points', 'circle-radius', 20);
            map.setPaintProperty('layer-with-asset-points', 'circle-color', 'darkgray');

            if (draggability) {
                map.on('mousemove', onMouseMoveAssetPoint);
                map.once('mouseup', onMouseUpAssetPoint);
            } else {
                map.off('mousemove', onMouseMoveAssetPoint);
                map.off('mouseup', onMouseUpAssetPoint);
            }
        });

        // When the cursor touch a feature in
        // the asset-points layer, prepare for dragging.
        map.on('touchstart', 'layer-with-asset-points', (e, draggability) => {
            if (e.points.length !== 1) return;

            // Prevent the default map drag behavior.
            e.preventDefault();
            // Copy of event click coodinates
            clickCoords = e.point;
            // Copy current Feature Id value
            currentAssetFeatureId = e.features[0].properties.id;
            // Copy draggable bool value
            draggability = e.features[0].properties.draggable;

            if (draggability) {
                map.on('touchmove', onMouseMoveAssetPoint);
                map.once('touchend', onMouseUpAssetPoint);
            } else {
                map.off('touchmove', onMouseMoveAssetPoint);
                map.off('touchend', onMouseUpAssetPoint);
            }
        });

        // When the cursor click a feature in the 'layer-with-assetpoints-directions'
        map.on('click', 'layer-with-assetpoints-directions', (e) => {
            // check if clickCoords are the same, if they are the same return method, if not proceed
            if (clickCoords.x == e.point.x && clickCoords.y == e.point.y) {
                return;
            }

            // Change the cursor style as a UI indicator.
            canvas.style.cursor = 'pointer';
            // Get current feature Id
            currentAssetFeatureId = e.features[0].properties.id;
        });

        // When the mousedown event in the 'layer-with-assetpoints-directions'
        map.on('mousedown', 'layer-with-assetpoints-directions', (e) => {
            // check if clickCoords are the same, if they are the same return method, if not proceed
            if (clickCoords.x == e.point.x && clickCoords.y == e.point.y) {
                return;
            }

            // Prevent the default map drag behavior.
            e.preventDefault();
            // Get current feature Id
            currentAssetFeatureId = e.features[0].properties.id;
            // Change the cursor style as a UI pointer
            canvas.style.cursor = 'grab';

            map.on('mousemove', onMouseMoveAssetPointDir);
            map.once('mouseup', onMouseUpAssetPointDir);
        });

        map.on('mouseup', 'layer-with-assetpoints-directions', () => { });

        // When the cursor touch a feature in
        // the 'antennas' layer, prepare for dragging.
        map.on('touchstart', 'layer-with-assetpoints-directions', (e) => {
            if (e.points.length !== 1) return;

            // Prevent the default map drag behavior.
            e.preventDefault();

            map.on('mousemove', onMouseMoveAssetPointDir);
            map.once('mouseup', onMouseUpAssetPointDir);
        });

        // When the cursor enters a feature in
        // the pulsing-dot layer, prepare for hover.
        map.on('click', pulsing_dots_layers_IDs, (e) => {
            // check if clickCoords are the same, if they are the same return method, if not proceed
            if (clickCoords.x == e.point.x && clickCoords.y == e.point.y) {
                return;
            }

            // Change the cursor style as a UI indicator.
            canvas.style.cursor = 'pointer';
            // Get current feature Id
            currentPuslingDotFeatureId = e.features[0].properties.id;

            currentAssetFeatureId = Math.floor(currentPuslingDotFeatureId / geojson_pulsing_dots_points_1.features.length)
            currentPuslingDotFeatureId = (currentPuslingDotFeatureId % (geojson_pulsing_dots_points_1.features.length))

            // Copy coordinates array
            const coordinates = pulsing_dots_layers_sources[currentAssetFeatureId].features[currentPuslingDotFeatureId].geometry.coordinates.slice();

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            // define popup content
            const popupContent = `<strong>${pulsing_dots_layers_sources[currentAssetFeatureId].features[currentPuslingDotFeatureId].properties.title}</strong><br />` +
                `<strong>Description:</strong> ${pulsing_dots_layers_sources[currentAssetFeatureId].features[currentPuslingDotFeatureId].properties.description}<br />` +
                `<strong>Latitude:</strong> ${pulsing_dots_layers_sources[currentAssetFeatureId].features[currentPuslingDotFeatureId].geometry.coordinates[1]}<br />` +
                `(${convertDMSLat(pulsing_dots_layers_sources[currentAssetFeatureId].features[currentPuslingDotFeatureId].geometry.coordinates[1])})<br />` +
                `<strong>Logitude:</strong> ${pulsing_dots_layers_sources[currentAssetFeatureId].features[currentPuslingDotFeatureId].geometry.coordinates[0]}<br />` +
                `(${convertDMSLng(rescrictTo180Degrees(pulsing_dots_layers_sources[currentAssetFeatureId].features[currentPuslingDotFeatureId].geometry.coordinates[0]))})<br /> ` +
                `<strong>Algorithm:</strong> ${pulsing_dots_layers_sources[currentAssetFeatureId].features[currentPuslingDotFeatureId].properties.algorithm}<br />`;


            // Populate the popup and set its coordinates
            // based on the feature found.
            popup.setLngLat(coordinates).setHTML(popupContent).addTo(map);
        });

        // on mouseleave event remove popup from 'pulsing-dot'
        map.on('mousedown', pulsing_dots_layers_IDs, (e) => {
        });

        // on mouseleave event remove popup from 'pulsing-dot'
        map.on('mouseleave', pulsing_dots_layers_IDs, (e) => {
        });

        // When the cursor enters a feature in
        // the pulsing-dot layer, prepare for touch.
        map.on('touchstart', pulsing_dots_layers_IDs, (e) => {
            if (e.points.length !== 1) return;

            // Prevent the default map drag behavior.
            e.preventDefault();
            // Copy coordinates array
            const coordinates = e.features[0].geometry.coordinates.slice();
            // Get current feature Id
            currentDotFeatureId = e.features[0].properties.id;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            // define popup content
            const popupContent = `<strong>${e.features[currentDotFeatureId].properties.title}</strong><br />` +
                `<strong>Description:</strong> ${e.features[currentDotFeatureId].properties.description}<br />` +
                `<strong>Latitude:</strong> ${e.features[currentDotFeatureId].geometry.coordinates[1]}<br />` +
                `(${convertDMSLat(e.features[currentDotFeatureId].geometry.coordinates[1])})<br />` +
                `<strong>Logitude:</strong> ${e.features[currentDotFeatureId].geometry.coordinates[0]}<br />` +
                `(${convertDMSLng(rescrictTo180Degrees(e.features[currentDotFeatureId].geometry.coordinates[0]))})<br />` +
                `Algorithm: ${e.features[currentDotFeatureId].properties.algorithm}<br />`;

            // Populate the popup and set its coordinates
            // based on the feature found.
            popup.setLngLat(coordinates).setHTML(popupContent).addTo(map);
        });

        // on touchend event remove popup from 'pulsing-dot'
        map.on('touchend', pulsing_dots_layers_IDs, () => {
            popup.remove();
        });

        // Add an image to use as a custom marker (antennas)
        map.loadImage(
            antenna_icon,
            (error, image1) => {
                if (error) throw error;

                // get all layers of map styles    
                const layers = map.getStyle().layers;

                // Find the index of the first symbol layer in the map style
                let firstAssetPointDirectionsLayerId;
                for (const layer of layers) {
                    if (layer.id === 'layer-with-assetpoints-directions') {
                        firstAssetPointDirectionsLayerId = layer.id;
                        break;
                    }
                }

                // Add layer to the antennas-direction  
                map.addLayer({
                    'id': 'layer-with-antennas-directions',
                    'type': 'fill',
                    'source': 'antennas_directions',
                    'paint': {
                        'fill-color': 'lightgrey',
                        'fill-opacity': 0.55,
                        'fill-outline-color': 'black'
                    }
                }, firstAssetPointDirectionsLayerId);

                // Add 'custom-marker' image to the map
                map.addImage('custom-marker-antenna', image1);

                // Add layer to the antennas features 
                map.addLayer({
                    'id': 'layer-with-antennas',
                    'type': 'symbol',
                    'source': 'antennas',
                    'layout': {
                        'icon-image': 'custom-marker-antenna',
                        'icon-size': 0.25,
                        'icon-allow-overlap': true,
                        "icon-ignore-placement": true,
                        "text-allow-overlap": true,
                        "text-ignore-placement": true,
                        "text-optional": true,
                        "text-padding": 0,
                        'text-field': ['get', 'title'], // get the title name from the source's "title" property
                        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                        'text-size': 10,
                        'text-offset': [0, 2.5],
                        'text-anchor': 'center',
                        'text-justify': 'auto',
                    },
                    'paint': {
                        'icon-opacity': 0.80,
                        "text-color": "black",
                        "text-halo-color": "white",
                        "text-halo-width": 1,
                        "text-halo-blur": 1
                    }
                }, firstAssetPointDirectionsLayerId);

                // When the cursor click a feature in the 'antennas' layer
                map.on('click', 'layer-with-antennas-directions', (e) => {
                    // check if clickCoords are the same, if they are the same return method, if not proceed
                    if (clickCoords.x == e.point.x && clickCoords.y == e.point.y) {
                        return;
                    }
                    // Change the cursor style as a UI indicator.
                    canvas.style.cursor = 'pointer';
                    // Get current feature Id
                    currentAntennaFeatureId = e.features[0].properties.id;
                });

                map.on('mousedown', 'layer-with-antennas-directions', (e) => {
                    // Prevent the default map drag behavior.
                    e.preventDefault();

                    // Get current feature Id
                    currentAntennaFeatureId = e.features[0].properties.id;

                    // Change the cursor style as a UI pointer
                    canvas.style.cursor = 'grab';

                    map.on('mousemove', onMouseMoveAntennaDir);
                    map.once('mouseup', onMouseUpAntennaDir);
                });

                map.on('mouseup', 'layer-with-antennas-directions', () => { });

                // When the cursor touch a feature in
                // the 'antennas' layer, prepare for dragging.
                map.on('touchstart', 'layer-with-antennas-directions', (e) => {
                    if (e.points.length !== 1) return;

                    // Prevent the default map drag behavior.
                    e.preventDefault();

                    map.on('mousemove', onMouseMoveAntennaDir);
                    map.once('mouseup', onMouseUpAntennaDir);
                });

                // When the cursor click a feature in the 'antennas' layer
                map.on('click', 'layer-with-antennas', (e) => {
                    // check if clickCoords are the same, if they are the same return method, if not proceed
                    if (clickCoords.x == e.point.x && clickCoords.y == e.point.y) {
                        return;
                    }

                    // Change the cursor style as a UI indicator.
                    canvas.style.cursor = 'pointer';
                    // Get current feature Id
                    currentAntennaFeatureId = e.features[0].properties.id;
                    // Copy coordinates array
                    const coordinates = geojson_antennas.features[currentAntennaFeatureId].geometry.coordinates.slice();
                    // Copy draggable bool value
                    const draggability = geojson_antennas.features[currentAntennaFeatureId].properties.draggable;
                    // copy antenna tx_power value
                    const antenna_tx_power = geojson_antennas_directions.features[currentAntennaFeatureId].properties.tx_power;
                    // copy antenna Direction value
                    const antenna_angle_direction = geojson_antennas_directions.features[currentAntennaFeatureId].properties.angle_direction.toFixed(2);
                    // copy antenna_opening value
                    const antenna_angle_opening = geojson_antennas_directions.features[currentAntennaFeatureId].properties.angle_opening.toFixed(2);

                    // Ensure that if the map is zoomed out such that multiple
                    // copies of the feature are visible, the popup appears
                    // over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    const popupContent = `<strong>${geojson_antennas.features[currentAntennaFeatureId].properties.title}</strong><br/>` +
                        `<strong>Description:</strong> ${geojson_antennas.features[currentAntennaFeatureId].properties.description}<br/>` +
                        `<strong>Latitude:</strong> ${geojson_antennas.features[currentAntennaFeatureId].geometry.coordinates[1]}<br/>` +
                        `(${convertDMSLat(geojson_antennas.features[currentAntennaFeatureId].geometry.coordinates[1])})<br/>` +
                        `<strong>Logitude:</strong> ${geojson_antennas.features[currentAntennaFeatureId].geometry.coordinates[0]}<br/>` +
                        `(${convertDMSLng(rescrictTo180Degrees(geojson_antennas.features[0].geometry.coordinates[0]))})<br/>` +
                        `<strong>Power Emittied:</strong> <input type="text" id="ant_tx_power_parameter" value=${antenna_tx_power} 
                    style="width: 50px; text-align:right; background-color:rgba(255, 255, 255, 1.0); 
                    color: rgba(128,128,128,1.0);"> [mW]<br/>` +
                        `<strong>Angle Direction:</strong> <input type="text" id="ant_angle_direction_parameter" value=${antenna_angle_direction} 
                    style="width:50px; text-align:right; background-color:rgba(255, 255, 255, 1.0);
                    color: rgba(128,128,128,1.0);"> ${String.fromCharCode(176)} (NORTH)<br/>` +
                        `<strong>Angle Opening:</strong> <input type="text" id="ant_angle_opening_parameter" value=${antenna_angle_opening} 
                    style="width: 50px; text-align:right; background-color:rgba(255, 255, 255, 1.0);
                    color: rgba(128,128,128,1.0);"> ${String.fromCharCode(176)}<br/>` +
                        `<strong>Toggle Drag Option: </strong>` +
                        `<input type="checkbox" id="check_toggle_drag_antenna" style="height:12px; width:12px; vertical-align: middle; margin-top: -1px;"
                    ${(draggability == true ? "checked" : "unchecked")}> ${(draggability == true ? "ON" : "OFF")} ` +
                        `<button class='content' id='btn_save_antenna_configs' style="width: 100%;">Update Antenna Config</button>`;

                    // Populate the popup and set its coordinates
                    // based on the feature found.
                    popup.setLngLat(coordinates).setHTML(popupContent).addTo(map);

                    // Attach event listener to button 
                    document.getElementById('check_toggle_drag_antenna').addEventListener('click', function () {
                        toggleDrag('antennas', geojson_antennas, currentAntennaFeatureId, draggability);
                    });

                    // Attach event listener to button 
                    document.getElementById('btn_save_antenna_configs').addEventListener('click', function () {
                        updateAntennaConfigs('antennas', geojson_antennas, geojson_antennas_directions, currentAntennaFeatureId);
                    });
                });

                // When the cursor enters a feature in
                // the 'antennas' layer, prepare for dragging.
                map.on('mouseenter', 'layer-with-antennas', () => {
                    canvas.style.cursor = 'move';
                });

                map.on('mouseleave', 'layer-with-antennas', () => {
                    canvas.style.cursor = '';
                });

                map.on('mouseup', 'layer-with-antennas', () => {
                    // change icon-opacity, icon-size and text-offset of 'antennas'
                    map.setPaintProperty('layer-with-antennas', 'icon-opacity', 0.85);
                    map.setLayoutProperty('layer-with-antennas', 'icon-size', 0.25);
                    map.setLayoutProperty('layer-with-antennas', 'text-offset', [0, 2.5]);

                });

                map.on('mousedown', 'layer-with-antennas', (e, draggability) => {
                    // Prevent the default map drag behavior.
                    e.preventDefault();

                    // check if clickCoords are the same, if they are the same return method
                    if (clickCoords.x == e.point.x && clickCoords.y == e.point.y) {
                        return;
                    }
                    // Change the cursor style as a UI grabbing
                    canvas.style.cursor = 'grab';
                    // Get current feature Id
                    currentAntennaFeatureId = e.features[0].properties.id;
                    // Copy draggable bool value
                    draggability = e.features[0].properties.draggable;
                    // Copy show_lines bool value
                    show_lines = e.features[0].properties.show_lines;

                    if (draggability) {
                        map.on('mousemove', onMouseMoveAntenna);
                        map.once('mouseup', onMouseUpAntenna);
                    } else {
                        map.off('mousemove', onMouseMoveAntenna);
                        map.off('mouseup', onMouseUpAntenna);
                    }
                });

                // When the cursor touch a feature in
                // the 'antennas' layer, prepare for dragging.
                map.on('touchstart', 'layer-with-antennas', (e, draggability) => {
                    if (e.points.length !== 1) return;

                    // Prevent the default map drag behavior.
                    e.preventDefault();

                    // Get current feature Id
                    currentAntennaFeatureId = e.features[0].properties.id;

                    // Copy draggable bool value
                    draggability = e.features[0].properties.draggable;

                    if (draggability) {
                        map.on('mousemove', onMouseMoveAntenna);
                        map.once('mouseup', onMouseUpAntenna);
                    } else {
                        map.off('mousemove', onMouseMoveAntenna);
                        map.off('mouseup', onMouseUpAntenna);
                    }
                });

                // Add a custom event listener to the map
                map.on('closeAllPopups', () => {
                    popup.remove();
                });
            }
        );

        // Add an image to use as a custom marker (anchors)
        map.loadImage(
            anchor_icon,
            (error, image2) => {
                if (error) throw error;

                // get all layers of map styles    
                const layers = map.getStyle().layers;

                // Find the index of the first symbol layer in the map style
                let firstAssetPointDirectionsLayerId;
                for (const layer of layers) {
                    if (layer.id === 'layer-with-assetpoints-directions') {
                        firstAssetPointDirectionsLayerId = layer.id;
                        break;
                    }
                }

                // Add 'custom-marker' image to the map
                map.addImage('custom-marker-anchors', image2);

                // Add layer to the antennas features 
                map.addLayer({
                    'id': 'layer-with-anchors',
                    'type': 'symbol',
                    'source': 'anchors',
                    'layout': {
                        'icon-image': 'custom-marker-anchors',
                        'icon-size': 0.25,
                        'icon-allow-overlap': true,
                        "icon-ignore-placement": true,
                        "text-allow-overlap": true,
                        "text-ignore-placement": true,
                        "text-optional": true,
                        "text-padding": 0,
                        'text-field': ['get', 'title'], // get the title name from the source's "title" property
                        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                        'text-size': 10,
                        'text-offset': [0, -2.5],
                        'text-anchor': 'center',
                        'text-justify': 'auto',
                    },
                    'paint': {
                        'icon-opacity': 0.80,
                        "text-color": "black",
                        "text-halo-color": "white",
                        "text-halo-width": 1,
                        "text-halo-blur": 1
                    }
                }, firstAssetPointDirectionsLayerId);

                // When the cursor click a feature in the 'antennas' layer
                map.on('click', 'layer-with-anchors', (e) => {
                    // check if clickCoords are the same, if they are the same return method, if not proceed
                    if (clickCoords.x == e.point.x && clickCoords.y == e.point.y) {
                        return;
                    }

                    // Change the cursor style as a UI indicator.
                    canvas.style.cursor = 'pointer';
                    // Get current feature Id
                    currentAnchorFeatureId = e.features[0].properties.id;
                    // Copy coordinates array
                    const coordinates = geojson_anchors.features[currentAnchorFeatureId].geometry.coordinates.slice();
                    // Copy draggable bool value
                    const draggability = geojson_anchors.features[currentAnchorFeatureId].properties.draggable;
                    // Copy show_lines bool value
                    const show_lines = geojson_anchors.features[currentAnchorFeatureId].properties.show_lines;

                    // Ensure that if the map is zoomed out such that multiple
                    // copies of the feature are visible, the popup appears
                    // over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    // define popup content
                    const popupContent = `<strong>${geojson_anchors.features[currentAnchorFeatureId].properties.title}</strong><br/>` +
                        `<strong>Description:</strong> ${geojson_anchors.features[currentAnchorFeatureId].properties.description}<br/>` +
                        `<strong>Latitude:</strong> ${geojson_anchors.features[currentAnchorFeatureId].geometry.coordinates[1]}<br/>` +
                        `(${convertDMSLat(geojson_anchors.features[currentAnchorFeatureId].geometry.coordinates[1])})<br/>` +
                        `<strong>Logitude:</strong> ${geojson_anchors.features[currentAnchorFeatureId].geometry.coordinates[0]}<br/>` +
                        `(${convertDMSLng(rescrictTo180Degrees(geojson_anchors.features[0].geometry.coordinates[0]))})<br/>` +
                        `<strong>Toggle Drag Option: </strong>` +
                        `<input type="checkbox" id="check_toggle_drag_anchor" style="height:12px; width:12px; vertical-align: middle; margin-top: -1px;"
                        ${(draggability == true ? "checked" : "unchecked")}> ${(draggability == true ? "ON" : "OFF")} <br/>` +
                        `<strong>Toggle Lines-of-Sight: </strong>` +
                        `<input type="checkbox" id="check_toggle_lines_of_sight_anchor" 
                        style="height:12px; width:12px; vertical-align: middle; margin-top: -1px;"${(show_lines == true ? "checked" : "unchecked")}> ${(show_lines == true ? "ON" : "OFF")}`;

                    // Populate the popup and set its coordinates
                    // based on the feature found.
                    popup.setLngLat(coordinates).setHTML(popupContent).addTo(map);

                    // Attach event listener to button 
                    document.getElementById('check_toggle_drag_anchor').addEventListener('click', function () {
                        toggleDrag('anchors', geojson_anchors, currentAnchorFeatureId, draggability);
                    });
                    // Attach event listener to button toggleLinesOfSight
                    document.getElementById('check_toggle_lines_of_sight_anchor').addEventListener('click', function () {
                        toggleLinesOfSight('anchors', geojson_anchors, currentAnchorFeatureId, show_lines);
                        // Call LinesOfSight animation.
                        animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight)
                        // Call the IntersectionPoints animation.
                        animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
                    });

                });

                // When the cursor enters a feature in
                // the 'antennas' layer, prepare for dragging.
                map.on('mouseenter', 'layer-with-anchors', () => {
                    canvas.style.cursor = 'move';
                });

                map.on('mouseleave', 'layer-with-anchors', () => {
                    canvas.style.cursor = '';
                });

                map.on('mouseup', 'layer-with-anchors', () => {
                    // change icon-opacity, icon-size and text-offset of 'antennas'
                    map.setPaintProperty('layer-with-anchors', 'icon-opacity', 0.85);
                    map.setLayoutProperty('layer-with-anchors', 'icon-size', 0.25);
                    map.setLayoutProperty('layer-with-anchors', 'text-offset', [0, -2.5]);

                });

                map.on('mousedown', 'layer-with-anchors', (e, draggability) => {
                    // Prevent the default map drag behavior.
                    e.preventDefault();

                    // check if clickCoords are the same, if they are the same return method
                    if (clickCoords.x == e.point.x && clickCoords.y == e.point.y) {
                        return;
                    }

                    // Change the cursor style as a UI grabbing
                    canvas.style.cursor = 'grab';

                    // Get current feature Id
                    currentAnchorFeatureId = e.features[0].properties.id;

                    // Copy draggable bool value
                    draggability = e.features[0].properties.draggable;

                    if (draggability) {
                        map.on('mousemove', onMouseMoveAnchor);
                        map.once('mouseup', onMouseUpAnchor);
                    } else {
                        map.off('mousemove', onMouseMoveAnchor);
                        map.off('mouseup', onMouseUpAnchor);
                    }
                });

                // When the cursor touch a feature in
                // the 'antennas' layer, prepare for dragging.
                map.on('touchstart', 'layer-with-anchors', (e, draggability) => {
                    if (e.points.length !== 1) return;

                    // Prevent the default map drag behavior.
                    e.preventDefault();

                    // Get current feature Id
                    currentAnchorFeatureId = e.features[0].properties.id;
                    // Copy draggable bool value
                    draggability = e.features[0].properties.draggable;

                    if (draggability) {
                        map.on('mousemove', onMouseMoveAnchor);
                        map.once('mouseup', onMouseUpAnchor);
                    } else {
                        map.off('mousemove', onMouseMoveAnchor);
                        map.off('mouseup', onMouseUpAnchor);
                    }
                });

                // Add a custom event listener to the map
                map.on('closeAllPopups', () => {
                    popup.remove();
                });
            }
        );

        // for first pulsing dots = 5 (from geojson_pulsing_dots file) 
        const pulsing_dots_fixed_size = geojson_pulsing_dots_points_1.features.length;

        // create filterGroup for 'ml_agents_form'
        const filterGroup = document.getElementById('ml_agents_form');

        // Iterate by all the 'geojson_asset_points', using array.forEach(index => { // do something here });
        geojson_asset_points.features.forEach(index => {

            // create antennas directions by index, with a given rotation of 0
            createAssetPointLobesDirection(index, geojson_assetpoints_directions);

            // Call setData to the source layer `places` on it.
            map.getSource('assetpoints_directions').setData(geojson_assetpoints_directions);

            // save AP number (id +1)
            const ap_number = index.properties.id + 1;

            // Deep clone copy source data without reference
            const geojson_pulsing_dots_points_new = JSON.parse(JSON.stringify(geojson_pulsing_dots_points_1));

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

            if (ap_number > 1) {
                // Add GeoJSON source of pulsing-dot-points to the map.   
                map.addSource(`pulsing-dot-points-${ap_number}`, {
                    'type': 'geojson',
                    'data': geojson_pulsing_dots_points_1
                });
                // push new source data to list of sources
                pulsing_dots_layers_sources.push(geojson_pulsing_dots_points_new);
            }
            else {
                // push loaded source data to list of sources
                pulsing_dots_layers_sources.push(geojson_pulsing_dots_points_1);
            }

            // for first 5 pulsing dots 
            for (let i = 0; i < pulsing_dots_fixed_size; i++) {
                const pulsing_dot_feature = geojson_pulsing_dots_points_1.features[i];
                const new_pulsing_dot_index = geojson_pulsing_dots_points_1.features.length * (ap_number - 1) + i;
                const algo = pulsing_dot_feature.properties.algorithm.toUpperCase();
                const basecolor = pulsing_dot_feature.properties.basecolor;
                const pulsing_dot_imageID = `pulsing-dot-ap${ap_number}-rgb-${basecolor}`;
                const layerID = `layer-with-pulsing-dot-ap${ap_number}-${algo}`;

                // Generate Animated Image withe a basecolor
                var animatedPulsingDot = generateAnimatedImage(basecolor);

                // Add a layer for this symbol type if it hasn't been added already.
                if (!map.getLayer(layerID)) {
                    // add checkboxes options (just for first AP)
                    if (ap_number == 1) {
                        // Add checkbox and label elements to the layer.
                        const input = document.createElement('input');
                        input.type = 'checkbox';
                        input.id = algo;
                        input.name = "ml-agents";
                        input.checked = false;
                        input.style.marginTop = '-1px';
                        input.style.height = '15px';
                        input.style.width = '15px';
                        input.style.verticalAlign = 'middle'
                        filterGroup.appendChild(input);

                        const label = document.createElement('label');
                        label.id = `${algo}-label`
                        label.setAttribute('for', algo);
                        label.style.fontSize = '12px'
                        filterGroup.appendChild(label);

                        const space = document.createElement('br');
                        filterGroup.appendChild(space);
                    }

                    // check if the pulsing_dot_imageID already exists on the map
                    if (!map.hasImage(pulsing_dot_imageID)) {
                        // Add an animated image to the map, with a specific ID with some options
                        map.addImage(pulsing_dot_imageID, animatedPulsingDot, { pixelRatio: 3 });
                    }

                    // for the APs bigger than 1 update pulsing dot data in the collection
                    const pulsing_dot_collection = {
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

                    if (ap_number > 1) {
                        // update values of geojson_pulsing_dots_points_new source data (just for APs > 1)
                        geojson_pulsing_dots_points_new.features[i] = pulsing_dot_collection.features[0];
                    }

                    // Add pulsing-dot-points layer to the map (type: symbol)
                    map.addLayer({
                        'id': layerID,
                        'type': 'symbol',
                        'source': `pulsing-dot-points-${ap_number}`,
                        'layout': {
                            'icon-image': ['concat', `pulsing-dot-ap${ap_number}-rgb-`, ['get', 'basecolor']],
                            'icon-allow-overlap': true,
                            "icon-ignore-placement": true,
                            "text-allow-overlap": true,
                            "text-ignore-placement": true,
                            "text-optional": true,
                            'text-field': ['get', 'algorithm'],
                            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                            "text-padding": 0,
                            'text-size': 10,
                            'text-offset': [0, 0],
                            'text-transform': 'uppercase',
                            'text-letter-spacing': 0.025,
                            'text-anchor': 'center',
                            'text-justify': 'auto',
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
        });

        // Iterate by all the 'geojson_antennas', using array.forEach(index => { // do something here });
        geojson_antennas.features.forEach(index => {
            // create antennas directions by index, with a given rotation of 0
            createAntennaDirection(index, geojson_antennas_directions);

            // Call setData to the source layer `places` on it.
            map.getSource('antennas_directions').setData(geojson_antennas_directions);
        });

        /* Add controllers to the map */
        // Add Geocoder Control to map 
        map.addControl(geocoder, 'top-right');

        // Add the specific indoor control
        map.addControl(map.indoor.control, 'top-right');

        // Add zoom and rotation controls to the map.
        map.addControl(new mapboxgl.NavigationControl, 'top-right');

        // Add the fullscreen control to map
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        // Add Attribution Control to map
        map.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

        /* Add custom controls (buttons) to the Map  */
        map.addControl(
            new MapboxGLButtonControl({
                className: 'my-custom-control-connect',
                title: "Connect MQTT",
                textContent: "Connect MQTT",
                id: "connectMqtt",
                eventHandler: doConnect,
            }),
            'top-left');

        map.addControl(
            new MapboxGLButtonControl({
                className: 'my-custom-control-disconnect',
                title: "Disconnect MQTT",
                textContent: "Disconnect MQTT",
                id: "disconnectMqtt",
                eventHandler: (e) => doDisconnect(
                    e,
                    client_id,
                    connection_string,
                    geojson_asset_points,
                    geojson_antennas,
                    geojson_anchors,
                    geojson_precison_decimal_places,
                    selectedMapIndex,
                    messageToSend,
                    pulsing_dots_layers_IDs
                ),
            }),
            'top-left');

        map.addControl(
            new MapboxGLButtonControl({
                className: "mapboxgl-ctrl-group mapbox-gl-draw_point",
                title: "Add an Asset Point",
                textContent: "",
                id: "draw-assetpoint",
                eventHandler: () => addAssetPointMarkerToMap(
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
                )
            }),
            "top-right");

        map.addControl(
            new MapboxGLButtonControl({
                className: "mapboxgl-ctrl-group mapbox-gl-draw_trash",
                title: "Delete last Asset Point",
                textContent: "",
                id: "delete-assetpoint",
                eventHandler: () => deleteLastAssetPointMarkerFromMap(
                    geojson_antennas,
                    geojson_asset_points,
                    geojson_assetpoints_directions,
                    geojson_anchors,
                    geojson_lines_of_sight,
                    wall_intersections_points,
                    geojson_walls,
                    pulsing_dots_layers_IDs,
                    pulsing_dots_layers_sources
                )
            }), "top-right");

        map.addControl(
            new MapboxGLButtonControl({
                className: "mapboxgl-ctrl-group mapbox-gl-draw_antenna",
                title: "Add an Antenna",
                textContent: "",
                id: "draw-antenna",
                eventHandler: () => addAntennaMarkerToMap(
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
                    map_min_lat
                )
            }),
            "top-right");

        map.addControl(
            new MapboxGLButtonControl({
                className: "mapboxgl-ctrl-group mapbox-gl-draw_trash",
                title: "Delete last Antenna",
                textContent: "",
                id: "delete-antenna",
                eventHandler: () => deleteLastAntennaMarkerFromMap(
                    geojson_antennas,
                    geojson_antennas_directions,
                    geojson_asset_points,
                    geojson_anchors,
                    geojson_lines_of_sight,
                    wall_intersections_points,
                    geojson_walls,
                    pulsing_dots_layers_sources
                )
            }), "top-right");

        map.addControl(
            new MapboxGLButtonControl({
                className: "mapboxgl-ctrl-group mapbox-gl-draw_anchor",
                title: "Add an Anchor",
                textContent: "",
                id: "draw-anchor",
                eventHandler: () => addAnchorMarkerToMap(
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
                )
            }),
            "top-right");

        map.addControl(
            new MapboxGLButtonControl({
                className: "mapboxgl-ctrl-group mapbox-gl-draw_trash",
                title: "Delete last Anchor",
                textContent: "",
                id: "delete-anchor",
                eventHandler: () => deleteLastAnchorMarkerFromMap(
                    geojson_anchors,
                    geojson_asset_points,
                    geojson_antennas,
                    geojson_lines_of_sight,
                    wall_intersections_points,
                    geojson_walls
                )
            }), "top-right");

        map.addControl(controlConsoleDebuggerContainer, 'bottom-left');
        map.addControl(controlRssiPathLossModelContainer, 'bottom-left');
        map.addControl(controlMlAgentsContainer, 'bottom-left');
        map.addControl(controlAnimationOptionsContainer, 'bottom-left');
        map.addControl(controlDistanceRssiContainer, 'bottom-left');
        map.addControl(controlCoordinatesPointContainer, 'bottom-left');


        // set to stop the color of animation button 
        updateAnimationColorButtonsOnStop();

        // set enable 'Start Animation' button and disable 'Stop Animation' button
        document.getElementById('btn_start_animations').disabled = false
        document.getElementById('btn_stop_animations').disabled = true

        // Attach event listener to button btn_start_connection
        document.getElementById('btn_start_connection').addEventListener('click', function () {
            connection_string, backend_read_rate = updateMqttParameters(
                mqtt_hostname,
                mqtt_port,
                reconnect_timeout,
                clientUsername,
                clientPassword,
                ssl_flag,
                messageToSend,
                mqttTopicToReceivePredictions,
                mqttTopicToReceiveCalculations,
                geojson_asset_points,
                geojson_antennas,
                geojson_anchors,
                geojson_precison_decimal_places,
                pulsing_dots_layers_sources,
                pulsing_dots_layers_IDs,
                selectedMapIndex,
                received_uuid
            );
        });

        // Attach event listener to button btn_start_animation
        document.getElementById('btn_start_animations').addEventListener('click', function () {
            activateAssetPointsAnimations(
                geojson_asset_points,
                geojson_assetpoints_directions,
                geojson_anchors,
                geojson_antennas,
                wall_intersections_points,
                geojson_lines_of_sight,
                geojson_walls,
                pulsing_dots_layers_sources,
                asset_point_animations,
                cpu_frame_rate,
                last_frame,
                animation_speed_factor
            );
        });

        // Attach event listener to button btn_stop_animations
        document.getElementById('btn_stop_animations').addEventListener('click', function () {
            stopAssetPointsAnimations(geojson_asset_points);
        });

        // Attach event listener to button btn_update_rssi_params
        document.getElementById('btn_update_rssi_params').addEventListener('click', function () {
            rssiParametersData = updateRssiPathLossModelParameters(
                connectedFlag,
                geojson_asset_points,
                geojson_antennas,
                geojson_anchors,
                geojson_precison_decimal_places,
                backend_read_rate,
                selectedMapIndex,
                mqttTopicToPublish,
                messageToSend
            );

            txPower = rssiParametersData["txPower"];
            constantFading = rssiParametersData["constantFading"];
            pathLossExpoent = rssiParametersData["pathLossExpoent"];
            referenceDistance = rssiParametersData["referenceDistance"];
            skewIndex = rssiParametersData["skewIndex"];
            attenuationFactor = rssiParametersData["attenuationFactor"];
        });

        // Attach event listener to button submit_ml_agents
        document.getElementById('submit_ml_agents').addEventListener('click', function () {
            selected_ml_agent_algorithm = updateSelectedMlAgents(
                connectedFlag,
                geojson_asset_points,
                geojson_antennas,
                geojson_anchors,
                geojson_precison_decimal_places,
                backend_read_rate,
                selectedMapIndex,
                mqttTopicToPublish,
                messageToSend
            );
        });

        // print the coordinates at the coordinates_point_container of where the asset point is on the map.
        var messageCoordinatesPointContainer =
            `<strong>${geojson_asset_points.features[0].properties.title} Coordinates: </strong><br />` +
            ` &#8226; Longitude:  ${rescrictTo180Degrees(geojson_asset_points.features[0].geometry.coordinates[0])}` +
            ` (${convertDMSLng(rescrictTo180Degrees(geojson_asset_points.features[0].geometry.coordinates[0]))})<br />` +
            ` &#8226; Latitude:  ${geojson_asset_points.features[0].geometry.coordinates[1]} ` +
            `(${convertDMSLat(geojson_asset_points.features[0].geometry.coordinates[1])})`;

        // print the Distances | RSSI | Walls | Direction at the Distances & RSSI container
        var messageRssiDistancesContainer =
            `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
            ` &#8226; Connect to MQTT to know the measurements.</br>`;

        // call to load config JSON file
        loadJsonFile(configJsonFilePath, function (response) {
            // Parse JSON string into object
            var data = JSON.parse(response);
            // Call to assign variables
            assignVariableParameters(data)

            // Set the Default selected_ml_agent (first call)
            selected_ml_agent_algorithm = updateSelectedMlAgents(
                connectedFlag,
                geojson_asset_points,
                geojson_antennas,
                geojson_anchors,
                geojson_precison_decimal_places,
                backend_read_rate,
                selectedMapIndex,
                mqttTopicToPublish,
                messageToSend
            );

            // update RSSI parameters data (first call)
            var rssiParametersData = updateRssiPathLossModelParameters(
                connectedFlag,
                geojson_asset_points,
                geojson_antennas,
                geojson_anchors,
                geojson_precison_decimal_places,
                backend_read_rate,
                selectedMapIndex,
                mqttTopicToPublish,
                messageToSend
            );

            txPower = rssiParametersData["txPower"];
            constantFading = rssiParametersData["constantFading"];
            pathLossExpoent = rssiParametersData["pathLossExpoent"];
            referenceDistance = rssiParametersData["referenceDistance"];
            skewIndex = rssiParametersData["skewIndex"];
            attenuationFactor = rssiParametersData["attenuationFactor"];
        });

        // Update container innerHTML
        updateContainerInnerHtml(distance_rssi_container, messageRssiDistancesContainer)
        // Update container innerHTML
        updateContainerInnerHtml(coordinates_point_container, messageCoordinatesPointContainer);
        // Call LinesOfSight animation.
        animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
        // Call the IntersectionPoints animation.
        animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
        // Call the pulsingDotPoints animation.
        animatePulsingDotPoints(pulsing_dots_layers_sources);
    });

    /**
     * On Mouse Move Asset Point event method
     * @param {event} e Event
     */
    function onMouseMoveAssetPoint(e) {
        const currentDate = new Date();
        var now = currentDate.getTime();

        // Limit to (cpu_frame_rate/10) updates per second
        if ((now - last_frame) < cpu_frame_rate) {
            return;
        };

        // save coordinates from event
        const coords = e.lngLat;
        // Set a UI indicator for dragging.
        canvas.style.cursor = 'grabbing';
        // Call event to close all open popups
        map.fire('closeAllPopups');

        // save last position coordinate
        lastCoord = geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates;
        // save new position coordinate
        newCoord = [rescrictTo180Degrees(coords.lng), coords.lat];
        // get bearing between two locations
        directionLargeLobe = getBearingBetweenLocations(lastCoord, newCoord);
        // set large and small lobes of asset point
        geojson_asset_points.features[currentAssetFeatureId].properties.angle_direction_large_lobe = directionLargeLobe;
        geojson_asset_points.features[currentAssetFeatureId].properties.angle_direction_small_lobe = rescrictTo180Degrees(parseFloat(directionLargeLobe) + 180);
        // Update the point feature coordinates in `geojson_asset_points` 
        geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates = [rescrictTo180Degrees(coords.lng), coords.lat];
        // And call setData to the source layer `point` on it.
        map.getSource('asset-points').setData(geojson_asset_points);

        // remove (splice) the direction at currentAssetFeatureId from 'geojson_assetpoints_directions' FeatureCollection (x2 for asset_points_directions)
        geojson_assetpoints_directions.features.splice(currentAssetFeatureId * 2, 2);
        // create assetpoint Lobe Direction at currentAssetFeatureId
        createAssetPointLobesDirection(geojson_asset_points.features[currentAssetFeatureId], geojson_assetpoints_directions)
        // Call setData to the source layer `places` on it.
        map.getSource('assetpoints_directions').setData(geojson_assetpoints_directions);

        // Call the LinesOfSight animation.
        animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
        // Call the IntersectionPoints animation.
        animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
        // Call the pulsingDotPoints animation.
        animatePulsingDotPoints(pulsing_dots_layers_sources);

        // Print the coordinates of where the point had
        // finished being dragged to on the map.
        messageToPrint =
            `<strong>${geojson_asset_points.features[currentAssetFeatureId].properties.title} Coordinates: </strong><br />` +
            ` &#8226; Latitude:  ${coords.lat} (${convertDMSLat(coords.lat)})<br />` +
            ` &#8226; Longitude:  ${rescrictTo180Degrees(coords.lng)} (${convertDMSLng(rescrictTo180Degrees(coords.lng))})`;
        // Update container innerHTML
        updateContainerInnerHtml(coordinates_point_container, messageToPrint);

        // update last_fame with now time
        last_frame = now;
    }

    /**
    * On Mouse Up Asset Point event method
    */
    function onMouseUpAssetPoint() {
        // Set a UI indicator for default
        canvas.style.cursor = '';

        // change back circle-radius and circle-color of 'asset-points'
        map.setPaintProperty('layer-with-asset-points', 'circle-radius', 15);
        map.setPaintProperty('layer-with-asset-points', 'circle-color', 'lightgrey');

        // Unbind mouse/touch events
        map.off('mousemove', onMouseMoveAssetPoint)
        map.off('mouseup', onMouseUpAssetPoint);
    }

    /**
    * On Mouse Move Asset Point Direction event method
    * @param {event} e Event
    */
    function onMouseMoveAssetPointDir(e) {
        const currentDate = new Date();
        var now = currentDate.getTime();

        // Limit to (cpu_frame_rate/10) updates per second
        if ((now - last_frame) < cpu_frame_rate) {
            return;
        };

        // save coordinates from event
        const coords = e.lngLat;
        // calculate asset point Direction Centroid (x2 for asset_points_directions)
        const assetpointDirCentroid = turf.centroid(geojson_assetpoints_directions.features[currentAssetFeatureId * 2]).geometry.coordinates
        // get xDistance and yDistance from Centroid
        var xDistanceFromCenter = assetpointDirCentroid[0] - coords.lng;
        var yDistanceFromCenter = assetpointDirCentroid[1] - coords.lat;
        // calculate angle direction large lobe Math.atan2
        var angle_dir_large_lobe = -Math.atan2(xDistanceFromCenter, yDistanceFromCenter) * 180 / Math.PI;
        // set oposite angle direction small lobe
        var angle_dir_small_lobe = parseFloat(rescrictTo180Degrees((-Math.atan2(xDistanceFromCenter, yDistanceFromCenter) * 180 / Math.PI) + 180));

        // Set a UI indicator for pointer.
        canvas.style.cursor = 'grabbing';
        // Call event to close all open popups
        map.fire('closeAllPopups');

        // remove (splice) the direction at currentAssetFeatureId from 'geojson_assetpoints_directions' FeatureCollection (x2 for asset_points_directions)
        geojson_assetpoints_directions.features.splice(currentAssetFeatureId * 2, 2);
        // create asset point lobes Directions at currentAssetFeatureId, with an incremented rotation 
        createAssetPointLobesDirection(geojson_asset_points.features[currentAssetFeatureId], geojson_assetpoints_directions);
        // update angle properties
        geojson_assetpoints_directions.features[currentAssetFeatureId * 2].properties.angle_direction_large_lobe = angle_dir_large_lobe;
        geojson_assetpoints_directions.features[currentAssetFeatureId * 2].properties.angle_direction_small_lobe = angle_dir_small_lobe;
        // Call setData to the source layer `places` on it.
        map.getSource('assetpoints_directions').setData(geojson_assetpoints_directions);

        // update last_fame with now time
        last_frame = now;
    }

    /**
    * On Mouse Up Asset Point Direction event method
    */
    function onMouseUpAssetPointDir() {
        canvas.style.cursor = '';

        // Unbind mouse/touch events
        map.off('mousemove', onMouseMoveAssetPointDir);
        map.off('touchmove', onMouseUpAssetPointDir);
    }

    /**
    * On Mouse Move Antenna event method
    * @param {event} e Event
    */
    function onMouseMoveAntenna(e) {
        const currentDate = new Date();
        var now = currentDate.getTime();

        // Limit to (cpu_frame_rate/10) updates per second
        if ((now - last_frame) < cpu_frame_rate) {
            return;
        };

        // save coordinates from event
        const coords = e.lngLat;
        // Set a UI indicator for dragging.
        canvas.style.cursor = 'grabbing';
        // Call event to close all open popups
        map.fire('closeAllPopups');

        // change icon-opacity, icon-size and text-offset of 'antennas'
        map.setPaintProperty('layer-with-antennas', 'icon-opacity', 1.0);
        map.setLayoutProperty('layer-with-antennas', 'icon-size', 0.4);
        map.setLayoutProperty('layer-with-antennas', 'text-offset', [0, 3.5]);

        // Update the point feature coordinates in `geojson_antennas` 
        geojson_antennas.features[currentAntennaFeatureId].geometry.coordinates = [rescrictTo180Degrees(coords.lng), coords.lat];
        // Call setData to the source layer `places` on it.
        map.getSource('antennas').setData(geojson_antennas);

        // remove (splice) the direction at currentAntennaFeatureId from 'geojson_antennas_directions' FeatureCollection
        geojson_antennas_directions.features.splice(currentAntennaFeatureId, 1);
        // create antenna Direction at currentAntennaFeatureId
        createAntennaDirection(geojson_antennas.features[currentAntennaFeatureId], geojson_antennas_directions);
        // Call setData to the source layer `places` on it.
        map.getSource('antennas_directions').setData(geojson_antennas_directions);

        // Call the LinesOfSight animation.
        animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
        // Call the IntersectionPoints animation.
        animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
        // Call the pulsingDotPoints animation.
        animatePulsingDotPoints(pulsing_dots_layers_sources);

        // set needUpdateAntennas to true
        needUpdateAntennas = true;
        // update last_fame with now time
        last_frame = now;
    }

    /**
    * On Mouse Up Antenna event method
    */
    function onMouseUpAntenna() {
        // Set a UI indicator for default
        canvas.style.cursor = '';

        // change back icon-opacity and icon-size of 'antennas'
        map.setPaintProperty('layer-with-antennas', 'icon-opacity', 0.85);
        map.setLayoutProperty('layer-with-antennas', 'icon-size', 0.25);
        map.setLayoutProperty('layer-with-antennas', 'text-offset', [0, 2.5]);

        // Unbind mouse/touch events
        map.off('mousemove', onMouseMoveAntenna);
        map.off('touchmove', onMouseMoveAntenna);
    }

    /**
    * On Mouse Move Antenna Direction event method
    * @param {event} e Event
    */
    function onMouseMoveAntennaDir(e) {
        const currentDate = new Date();
        var now = currentDate.getTime();

        // Limit to (cpu_frame_rate/10) updates per second
        if ((now - last_frame) < cpu_frame_rate) {
            return;
        };

        // save coordinates from event
        const coords = e.lngLat;

        // calculate antenna Direction Centroid
        const antennaDirCentroid = turf.centroid(geojson_antennas_directions.features[currentAntennaFeatureId]).geometry.coordinates;

        // get xDistance and yDistance from Centroid
        var xDistanceFromCenter = antennaDirCentroid[0] - coords.lng;
        var yDistanceFromCenter = antennaDirCentroid[1] - coords.lat;

        // calculate angle Math.atan2
        var angle = -Math.atan2(xDistanceFromCenter, yDistanceFromCenter) * 180 / Math.PI;

        // Set a UI indicator for pointer.
        canvas.style.cursor = 'grabbing';
        // Call event to close all open popups
        map.fire('closeAllPopups');

        // remove (splice) the direction at currentAntennaFeatureId from 'geojson_antennas_directions' FeatureCollection
        geojson_antennas_directions.features.splice(currentAntennaFeatureId, 1);
        //create antenna Direction at currentAntennaFeatureId, with an incremented rotation 
        createAntennaDirection(geojson_antennas.features[currentAntennaFeatureId], geojson_antennas_directions);
        // update angle properties
        geojson_antennas_directions.features[currentAntennaFeatureId].properties.angle_direction = angle;
        // Call setData to the source layer `places` on it.
        map.getSource('antennas_directions').setData(geojson_antennas_directions);

        // update last_fame with now time
        last_frame = now;
    }

    /**
    * On Mouse Up Antenna Direction event method
    */
    function onMouseUpAntennaDir() {
        canvas.style.cursor = '';

        // Unbind mouse/touch events
        map.off('mousemove', onMouseMoveAntennaDir);
        map.off('touchmove', onMouseUpAntennaDir);

        // set flag needUpdateAntennas to true
        needUpdateAntennas = true;
    }

    /**
    * On Mouse Move Anchor event method
    * @param {event} e Event
    */
    function onMouseMoveAnchor(e) {
        const currentDate = new Date();
        var now = currentDate.getTime();

        // Limit to (cpu_frame_rate/10) updates per second
        if ((now - last_frame) < cpu_frame_rate) {
            return;
        };

        // save coordinates from event
        const coords = e.lngLat;
        // Set a UI indicator for dragging.
        canvas.style.cursor = 'grabbing';
        // Call event to close all open popups
        map.fire('closeAllPopups');

        // change icon-opacity, icon-size and text-offset of 'antennas'
        map.setPaintProperty('layer-with-anchors', 'icon-opacity', 1.0);
        map.setLayoutProperty('layer-with-anchors', 'icon-size', 0.4);
        map.setLayoutProperty('layer-with-anchors', 'text-offset', [0, -3.5]);

        // Update the point feature coordinates in `geojson_antennas` 
        geojson_anchors.features[currentAnchorFeatureId].geometry.coordinates = [rescrictTo180Degrees(coords.lng), coords.lat];
        // Call setData to the source layer `places` on it.
        map.getSource('anchors').setData(geojson_anchors);
        // Call the LinesOfSight animation.
        animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
        // Call the IntersectionPoints animation.
        animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);

        // set needUpdateAntennas to true
        needUpdateAnchors = true;
        // update last_fame with now time
        last_frame = now;
    }

    /**
    * On Mouse Up Anchor event method
    */
    function onMouseUpAnchor() {
        // Set a UI indicator for default
        canvas.style.cursor = '';

        // change back icon-opacity and icon-size of 'antennas'
        map.setPaintProperty('layer-with-anchors', 'icon-opacity', 0.85);
        map.setLayoutProperty('layer-with-anchors', 'icon-size', 0.25);
        map.setLayoutProperty('layer-with-anchors', 'text-offset', [0, -2.5]);

        // Unbind mouse/touch events
        map.off('mousemove', onMouseMoveAnchor);
        map.off('touchmove', onMouseMoveAnchor);
    }

    // return the map object
    return map;
}
// ============ End of Mapping function ============ //