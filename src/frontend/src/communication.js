/**
 * Communication functions definitions to deal with sent and received messages
 * @module communication */

/**
 * Add Session UUID To Json Message
 * @param {string} payloadString Payload string data to add
 * @returns {string} Payload string data
 */
function addSessionUuidToJsonMessage(payloadString) {
    // add 'session_uuid' to the JSON message
    payloadString += '"uuid": ';
    payloadString += `"${session_uuid}"`;
    return payloadString;
}

/**
 * Add Map ID To Json Message
 * @param {string} payloadString Payload string data to add
 * @param {number} selectedMapIndex Index of selected Map
 * @returns Payload string data
 */
function addMapIdToJsonMessage(payloadString, selectedMapIndex) {
    // add 'session_uuid' to the JSON message
    payloadString += '"map": ';
    payloadString += `${selectedMapIndex}`;
    return payloadString;
}

/**
 * Add "Open" Status To Json Message
 * @param {string} payloadString Payload string data to add
 * @returns {string} Payload string data
 */
function addStatusOpenToJsonMessage(payloadString) {
    // add "status": "open" to the JSON message
    payloadString += `"status": `;
    payloadString += '"open"';
    return payloadString;
}

/**
 * Add "Close" Status To Json Message
 * @param {string} payloadString Payload string data to add
 * @returns {string} Payload string data
 */
function addStatusCloseToJsonMessage(payloadString) {
    // add "status": "close" to the JSON message
    payloadString += `"status": `;
    payloadString += '"close"';
    return payloadString;
}
 
/**
 * Add Backend Read Rate To Json Message
 * @param {string} payloadString Payload string data to add
 * @param {number} backend_read_rate Backend read rate value
 * @returns Payload string data
 */
function addBackendReadRateToJsonMessage(payloadString, backend_read_rate) {
    // add the 'read_rate' to the JSON message
    payloadString += '"read_rate": ';
    payloadString += `${backend_read_rate}`;
    return payloadString;
}

/**
 * Add Selected ML Agents Data To Json Message
 * @param {string} payloadString Payload string data to add
 * @returns {string} Payload string data
 */
function addSelectedMlAgentsDataToJsonMessage(payloadString) {
    if (selected_ml_agent_algorithm == 'knn,svr,gbr,rf,dt') {
        selected_ml_agent_algorithm = '"all"';

    }
    // add the 'selected_ml_agent_algorithm' to the JSON messag
    payloadString += '"algs": [';
    payloadString += `${selected_ml_agent_algorithm}`;
    payloadString += ']'
    return payloadString;
}

/**
 * Add Antennas Data To Json Message
 * @param {string} payloadString Payload string data to add
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 * @returns {string} Payload string data
 */
function addAntennasDataToJsonMessage(payloadString, geojson_antennas, geojson_precison_decimal_places) {
    // add 'antennas' to the JSON message
    payloadString += '"ant": [';

    // iterate by all others 'geojson_antennas' features
    for (let index = 0, len = geojson_antennas.features.length; index < len; index++) {
        // save long, lat, direction and opening values by index of antennas
        var antennaLong = geojson_antennas.features[index].geometry.coordinates[0].toFixed(geojson_precison_decimal_places)
        var antennaLat = geojson_antennas.features[index].geometry.coordinates[1].toFixed(geojson_precison_decimal_places)
        var antennaDir = geojson_antennas.features[index].properties.angle_direction.toFixed(2);
        var antennaOp = geojson_antennas.features[index].properties.angle_opening.toFixed(2);
        var antennaTxPower = geojson_antennas.features[index].properties.tx_power;

        // Add the antennas positions until last
        if (index < len - 1) {
            payloadString += `{"LongLat": [${antennaLong + "," + antennaLat}], "DirOpen": [${antennaDir + "," + antennaOp}], "TxPower": ${antennaTxPower}}, `;
        }
        // Add the last antenna position 
        if (index == len - 1) {
            payloadString += `{"LongLat": [${antennaLong + "," + antennaLat}], "DirOpen": [${antennaDir + "," + antennaOp}], "TxPower": ${antennaTxPower}}`;
        }
    }
    payloadString += ']';
    return payloadString;
}

/**
 * Add Anchors Data To Json Message
 * @param {string} payloadString Payload string data to add
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 * @returns {string} Payload string data
 */
function addAnchorsDataToJsonMessage(payloadString, geojson_anchors, geojson_precison_decimal_places) {
    // add 'anchors' to the JSON message
    payloadString += '"anchors": [';

    // iterate by all others 'geojson_anchors' features
    for (let index = 0, len = geojson_anchors.features.length; index < len; index++) {
        // save long and lat values by index of anchors
        var anchorLong = geojson_anchors.features[index].geometry.coordinates[0].toFixed(geojson_precison_decimal_places)
        var anchorLat = geojson_anchors.features[index].geometry.coordinates[1].toFixed(geojson_precison_decimal_places)

        // Add the anchors positions until last
        if (index < len - 1) {
            payloadString += `{"LongLat": [${anchorLong + "," + anchorLat}]},`;
        }
        // Add the last anchor position 
        if (index == len - 1) {
            payloadString += `{"LongLat": [${anchorLong + "," + anchorLat}]}`;
        }
    }
    payloadString += ']';
    return payloadString;
}

/**
 * Add Asset Points Data To Json Message
 * @param {string} payloadString Payload string data to add
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 * @returns {string} Payload string data
 */
function addAssetPointsDataToJsonMessage(payloadString, geojson_asset_points, geojson_precison_decimal_places) {
    // add 'asset-points' to the JSON message
    payloadString += '"ap": [';

    // iterate by all others 'geojson_asset_points' features
    for (let index = 0, len = geojson_asset_points.features.length; index < len; index++) {
        // save long, lat, direction and opening values by index of asset points
        var apLong = geojson_asset_points.features[index].geometry.coordinates[0].toFixed(geojson_precison_decimal_places)
        var apLat = geojson_asset_points.features[index].geometry.coordinates[1].toFixed(geojson_precison_decimal_places)
        var apDirLarge = geojson_asset_points.features[index].properties.angle_direction_large_lobe.toFixed(2);
        var apOpLarge = geojson_asset_points.features[index].properties.angle_opening_large_lobe.toFixed(2);
        var apDirSmall = geojson_asset_points.features[index].properties.angle_direction_small_lobe.toFixed(2);
        var apOpSmall = geojson_asset_points.features[index].properties.angle_opening_small_lobe.toFixed(2);

        // Add the antennas positions until last
        if (index < len - 1) {
            payloadString += `{"LongLat": [${apLong + "," + apLat}], "LargeDirOpen": [${apDirLarge + "," + apOpLarge}], "SmallDirOpen": [${apDirSmall + "," + apOpSmall}]}, `;
        }
        // Add the last antenna position 
        if (index == len - 1) {
            payloadString += `{"LongLat": [${apLong + "," + apLat}], "LargeDirOpen": [${apDirLarge + "," + apOpLarge}], "SmallDirOpen": [${apDirSmall + "," + apOpSmall}]}`;
        }
    }
    payloadString += ']';
    return payloadString;
}

/**
 * Add Rssi Parameters Data To Json Message
 * @param {string} payloadString Payload string data to add
 * @returns {string} Payload string data
 */
function addRssiParametersDataToJsonMessage(payloadString) {
    // add rssi-calc-param
    payloadString += '"rp": {';

    // add 'tx-Power' to the JSON message
    payloadString += '"tx": ';
    payloadString += `${txPower}`;
    payloadString += ', '

    // add 'path Loss Expoent(n)' to the JSON message
    payloadString += '"ple(n)": ';
    payloadString += `${pathLossExpoent}`;
    payloadString += ', '

    // add 'constant Fading' to the JSON message
    payloadString += '"cf": ';
    payloadString += `${constantFading}`;
    payloadString += ', '

    // add 'skewIndex' to the JSON message
    payloadString += '"skew": ';
    payloadString += `${skewIndex}`;
    payloadString += ', '

    // add 'reference Distance' to the JSON message
    payloadString += '"d0": ';
    payloadString += `${referenceDistance}`;
    payloadString += ', '

    // add 'attenuation factor' to the JSON message
    payloadString += '"af": ';
    payloadString += `${attenuationFactor}`;
    payloadString += '}'
    return payloadString;
}

/**
 * Construct Json Message to send to MQTT Broker
 * @param {string} origin Label with description from where the message came from 
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 * @param {number} backend_read_rate Backend read rate value
 * @param {number} selectedMapIndex Index of selected Map
 * @param {string} messageToSend MQTT message to send to broker
 * @returns {string} Constructed Message to send to the MQTT Broker
 */
function constructJsonMessage(
    origin = "default",
    geojson_asset_points,
    geojson_antennas,
    geojson_anchors,
    geojson_precison_decimal_places,
    backend_read_rate,
    selectedMapIndex,
    messageToSend
) {
    if (geojson_asset_points.features.length > 0 && geojson_antennas.features.length > 0) {
        // var to create the message string - Open JSON structure
        var payloadString = '{';

        // addSessionUuidToJsonMessage
        payloadString = addSessionUuidToJsonMessage(payloadString);
        payloadString += ', '

        // Full message (default)
        if (origin == "default") {
            // addStatusOpenToJsonMessage
            payloadString = addStatusOpenToJsonMessage(payloadString);
            payloadString += ', '

            // addSessionUuidToJsonMessage
            payloadString = addMapIdToJsonMessage(payloadString, selectedMapIndex);
            payloadString += ', '

            // addAntennasDataToJsonMessage
            payloadString = addAntennasDataToJsonMessage(payloadString, geojson_antennas, geojson_precison_decimal_places);
            payloadString += ', '
            // addAnchorsDataToJsonMessage
            if (geojson_anchors.features.length > 0) {
                payloadString = addAnchorsDataToJsonMessage(payloadString, geojson_anchors, geojson_precison_decimal_places);
                payloadString += ', '
            }
            // addAssetPointsDataToJsonMessage
            payloadString = addAssetPointsDataToJsonMessage(payloadString, geojson_asset_points, geojson_precison_decimal_places);
            payloadString += ', '
            // addSelectedMlAgentsDataToJsonMessage
            payloadString = addSelectedMlAgentsDataToJsonMessage(payloadString);
            payloadString += ', '
            // addRssiParametersDataToJsonMessage
            payloadString = addRssiParametersDataToJsonMessage(payloadString);
            payloadString += ', '
            // addBackendReadRateToJsonMessage
            payloadString = addBackendReadRateToJsonMessage(payloadString, backend_read_rate);
        }

        // Partial message to update asset point values
        else if (origin == "assetPoint") {
            // addStatusOpenToJsonMessage
            payloadString = addStatusOpenToJsonMessage(payloadString);
            payloadString += ', '
            // addAssetPointsDataToJsonMessage
            payloadString = addAssetPointsDataToJsonMessage(payloadString, geojson_asset_points, geojson_precison_decimal_places);
        }

        // Partial message to update antenna values
        else if (origin == "antennas") {
            // addStatusOpenToJsonMessage
            payloadString = addStatusOpenToJsonMessage(payloadString);
            payloadString += ', '
            // addAntennasDataToJsonMessage
            payloadString = addAntennasDataToJsonMessage(payloadString, geojson_antennas, geojson_precison_decimal_places);
        }

        // Partial message to update anchors values
        else if (origin == "anchors") {
            // addStatusOpenToJsonMessage
            payloadString = addStatusOpenToJsonMessage(payloadString);
            payloadString += ', '
            // addAntennasDataToJsonMessage
            payloadString = addAnchorsDataToJsonMessage(payloadString, geojson_anchors, geojson_precison_decimal_places);
        }

        // Partial message to update Rssi Parameters values
        else if (origin == "rssiUpdateParams") {
            // addStatusOpenToJsonMessage
            payloadString = addStatusOpenToJsonMessage(payloadString);
            payloadString += ', '
            // addRssiParametersDataToJsonMessage
            payloadString = addRssiParametersDataToJsonMessage(payloadString);
        }

        // Partial message to update ML Agents algorithms
        else if (origin == "algs") {
            // addStatusOpenToJsonMessage
            payloadString = addStatusOpenToJsonMessage(payloadString);
            payloadString += ', '
            // addSelectedMlAgentsDataToJsonMessage
            payloadString = addSelectedMlAgentsDataToJsonMessage(payloadString);
        }

        // Send a message to broker to inform all subscribers about DISCONNECT
        else if (origin == "disconnect") {
            // addStatusCloseToJsonMessage
            payloadString = addStatusCloseToJsonMessage(payloadString);
        }

        // close JSON structure
        payloadString += '}';
        // populate messageToSend with payloadString 
        messageToSend = payloadString
    }
    return messageToSend;
}

/**
 * Process Json Message received from MQTT Broker
 * @param {string} message MQTT message received from the broker
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {string} received_uuid MQTT received session UUID
 */
function processReceivedJsonMessage(message, geojson_asset_points, geojson_anchors, geojson_antennas, pulsing_dots_layers_sources, received_uuid) {
    // first replace (') by (")
    var result = message.payloadString.replace(/'/g, '"');
    // process received JSON message format 
    jsonData = JSON.parse(result);
    // save received_uuid
    received_uuid = jsonData["uuid"];

    // verify if received_uuid is session_uuid 
    if (received_uuid == session_uuid) {
        if (jsonData["from"] == "backend") {
            // deal with calculations to display info on container
            // save received data from JSON
            ap_distance_values = jsonData["ap-dist"]
            ap_activ_values = jsonData["ap-activ"];
            ap_rssi_values = jsonData["ap-rssi"];
            ap_wall_intersections = jsonData["ap-wall-inter"];
            ant_dir_ap_intersections = jsonData["ant-dir-ap-inter"];
            anchors_dists = jsonData["anch-dist"];
            anchors_activ_values = jsonData["anch-activ"];
            anchors_rssi_values = jsonData["anch-rssi"];
            anchors_wall_intersections = jsonData["anch-wall-inter"];
            ant_dir_anchors_intersections = jsonData["ant-dir-anch-inter"];

            // set message and populate to print on console and on Distances & RSSI container
            var messageToContainer = `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>`;

            // check length of received data
            if (geojson_asset_points.features.length == ap_distance_values.length) {
                // iterate over geojson_asset_points
                geojson_asset_points.features.forEach(index_asset_point => {
                    // populate message to print
                    messageToContainer += `AP ${index_asset_point.properties.id + 1}:</br>`

                    // iterate over geojson_antennas
                    geojson_antennas.features.forEach(index_antenna => {
                        // restrict the length of distance_value and rssi_value to 2 decimal points.
                        var distance_value = Math.round(parseFloat(Object.values(ap_distance_values)[index_asset_point.properties.id][index_antenna.properties.id]) * 100) / 100
                        var rssi_value = Math.round(parseFloat(Object.values(ap_rssi_values)[index_asset_point.properties.id][index_antenna.properties.id]) * 100) / 100

                        // save antenna name by index
                        var antenna_name = geojson_antennas.features[index_antenna.properties.id].properties.title;
                        // save wall intersections by line
                        var wall_intersections_by_line = ap_wall_intersections[index_asset_point.properties.id][index_antenna.properties.id];
                        // save direction intersections by line
                        var dir_intersections_by_line = ant_dir_ap_intersections[index_asset_point.properties.id][index_antenna.properties.id]
                        // populate message to print
                        messageToContainer += ` &#8226; ${antenna_name}: ${distance_value} m | RSSI: ${rssi_value} dBm | Walls: ${wall_intersections_by_line} | Dir: ${String(dir_intersections_by_line)}</br>`;
                    });
                });
            }
            else {
                messageToContainer += ' &#8226; Updating Asset Points data ... </br>';
            }
            // add anchors data if added
            if (anchors_dists.length > 0) {
                if (anchors_dists.length == geojson_anchors.features.length) {
                    // populate message to print
                    messageToContainer += `Anchors: </br>`

                    // iterate over geojson_anchors
                    geojson_anchors.features.forEach(index_anchor => {
                        // save anchor name by index
                        var anchor_name = `Anchor ${index_anchor.properties.id + 1}`;
                        // populate message to print
                        messageToContainer += ` &#8226; ${anchor_name}: `;

                        // iterate over geojson_antennas 
                        geojson_antennas.features.forEach(index_antenna => {
                            // restrict the length of anchor_dist to 2 decimal points.
                            var anchor_dist_value = Math.round(parseFloat(anchors_dists[index_anchor.properties.id][index_antenna.properties.id]) * 100) / 100

                            // Add until the last antenna anchor distance
                            if (index_antenna.properties.id < geojson_antennas.features.length - 1) {
                                // populate message to print
                                messageToContainer += `${anchor_dist_value} m | `;
                            }
                            // Add the last antenna anchor distance 
                            if (index_antenna.properties.id == geojson_antennas.features.length - 1) {
                                messageToContainer += `${anchor_dist_value} m </br>`;
                            }
                        });
                    });
                }
                else {
                    messageToContainer += 'Updating Anchors data ... </br>';
                }
            }
            // Update container innerHTML
            updateContainerInnerHtml(distance_rssi_container, messageToContainer)
        }
        else if (jsonData["from"] == "predictor") {
            var pulsing_dots_layers_IDs_enabled = []
            var pulsing_dots_layers_IDs_disabled = []
            
            // verify possibility of receiving all ML algorithms
            if (selected_ml_agent_algorithm == '"all"') {
                selected_ml_agent_algorithm = ["knn", "svr", "gbr", "rf", "dt"]
            }

            var ordered_algorithms_dict = { 'KNN': 0, 'SVR': 1, "GBR": 2, "RF": 3, "DT": 4 }

            // for the firsts pulsing dots = 8 
            const pulsing_dots_fixed_size = pulsing_dots_layers_sources[0].features.length;

            // check if received data has the same size as geojson_asset_points
            if (jsonData["coords"].length == geojson_asset_points.features.length) {
                // iterate over 'predictor' message
                for (let i = 0, len_i = jsonData["coords"].length; i < len_i; i++) {
                    // save ap_number = ap index + 1
                    const ap_number = geojson_asset_points.features[i].properties.id + 1;
                    // Deal with coordinates to pulsing dots
                    // iterate over 'pulsing_dots_algorithms' array
                    for (let a = 0, len = pulsing_dots_fixed_size; a < len; a++) {
                        // save algorithm name to create layerID
                        const algo_name = pulsing_dots_layers_sources[i].features[a].properties.algorithm.replace(/"/g, '').toUpperCase();
                        // create the layerID
                        const layerID = `layer-with-pulsing-dot-ap${ap_number}-${algo_name}`;
                        // verify if message has values for each AP
                        if (jsonData["coords"][i].length > 0) {
                            // flag to check if algorithm already exists
                            var enabled = false;
                            // iterate over 'coords data' array
                            for (let j = 0, len_j = jsonData["coords"][i].length; j < len_j; j++) {
                                // check if jsonData "coords" array have some 'pulsing_dots_algorithms'
                                if (jsonData["coords"][i][j][2] == `${algo_name}`) {
                                    if (geojson_asset_points.features[i].properties.show_predictions) {
                                        // calculate pulsing dot ID index
                                        const pulsing_dot_ID = ordered_algorithms_dict[algo_name];

                                        // save coordinates of current index j
                                        long = parseFloat(jsonData["coords"][i][j][0]);
                                        lat = parseFloat(jsonData["coords"][i][j][1]);
                                        // update values in 'pulsing_dots_layers_sources'
                                        pulsing_dots_layers_sources[i].features[pulsing_dot_ID].geometry.coordinates = [(long), (lat)];
                                        // update pulsing_dots_layers_IDs
                                        pulsing_dots_layers_IDs_enabled.push(layerID);
                                        // update enabled flag
                                        enabled = true;
                                    }
                                }
                            }
                            // check if not enabled to push layer ID to disabled layers
                            if (!enabled) {
                                pulsing_dots_layers_IDs_disabled.push(layerID)
                            }
                        }
                        else {
                            // check if not enabled to push layer ID to disabled layers
                            pulsing_dots_layers_IDs_disabled.push(layerID)
                        }
                    }
                }

                // set visibility of 'pulsing-dots' layers to none
                pulsing_dots_layers_IDs_disabled = setPulsingDotsLayersToNone(pulsing_dots_layers_IDs_disabled)
                // set visibility of 'pulsing-dots' layers to visible
                pulsing_dots_layers_IDs_enabled = setPulsingDotsLayersToVisible(pulsing_dots_layers_IDs_enabled)
                // Call the pulsingDotPoints animation.
                animatePulsingDotPoints(pulsing_dots_layers_sources);
            }
        }
    }
}

// ========== End of Communication Functions to deal with sent and received messages ========== //