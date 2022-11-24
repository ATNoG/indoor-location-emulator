/**
 * Asset Point Animations Functions definitions
 *  @module animations */

/**
 * Activate Asset Point Animations
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_assetpoints_directions Asset Points Directions FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {Array} asset_point_animations Asset Point Animations Array
 * @param {number} cpu_frame_rate CPU frame rate
 * @param {number} last_frame last frame 
 * @param {number} animation_speed_factor value of animation speed factor
 */
function activateAssetPointsAnimations(
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
) {
    animation_speed_factor = parseFloat(document.getElementById("animation_speed_slider").value);

    geojson_asset_points.features.forEach(index => {
        var currentAssetFeatureId = index.properties.id;
        if (!animatingAssetPointFlags[currentAssetFeatureId]) {
            // call Animation
            animateAssetPointWithCustomMove(
                index,
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
        }
    });

    // set printable Message
    printableMessage = "Animation speed factor has been set to '" + animation_speed_factor + "x'.";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);
}


/**
 * Stop Asset Point Animations
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 */
function stopAssetPointsAnimations(geojson_asset_points) {
    geojson_asset_points.features.forEach(index => {
        var currentAssetFeatureId = index.properties.id;

        if (animatingAssetPointFlags[currentAssetFeatureId]) {
            // set animatingPointFlags to false
            animatingAssetPointFlags[currentAssetFeatureId] = false;

            // remove 'trace' layer and source if already exists on map
            if (map.getLayer(`trace-ap${currentAssetFeatureId + 1}`)) {
                map.removeLayer(`trace-ap${currentAssetFeatureId + 1}`);
            }
            if (map.getSource(`trace-ap${currentAssetFeatureId + 1}`)) {
                map.removeSource(`trace-ap${currentAssetFeatureId + 1}`);
            }

            // set printable Message
            printableMessage3 = "Stop of Asset Point Animations... ";

            // print to console and to console_debugger
            console.log(printableMessage3);
            printOnConsoleDebugger(printableMessage3);
        }
    });
}

// 
/**
 * Async function to animate Asset Point with a custom move
 * @async
 * @param {number} index Asset Point index ID
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_assetpoints_directions Asset Points Directions FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} wall_intersections_points Map Features Walls Points Intersections FeatureCollection
 * @param {FeatureCollection} geojson_lines_of_sight Lines of Sight FeatureCollection
 * @param {FeatureCollection} geojson_walls Map Features Walls FeatureCollection
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {Array} animations Pulsing Dots sources Array
 * @param {number} cpu_frame_rate CPU frame rate
 * @param {number} last_frame last frame 
 * @param {number} animation_speed_factor value of animation speed factor
 * @returns {null} null if no animations is setted
 */
async function animateAssetPointWithCustomMove(
    index,
    geojson_asset_points,
    geojson_assetpoints_directions,
    geojson_anchors,
    geojson_antennas,
    wall_intersections_points,
    geojson_lines_of_sight,
    geojson_walls,
    pulsing_dots_layers_sources,
    animations,
    cpu_frame_rate,
    last_frame,
    animation_speed_factor
) {

    // Find the index of the first symbol layer in the map style
    const layers = map.getStyle().layers;
    let firstLinesOfSightLayerId;
    for (const layer of layers) {
        if (layer.id === 'layer-with-lines') {
            firstLinesOfSightLayerId = layer.id;
            break;
        }
    }

    var animation_geojson = '';
    var color = '';
    var currentAssetFeatureId = index.properties.id;

    if (!animatingAssetPointFlags[currentAssetFeatureId]) {
        switch (index.properties.animation_option_index) {
            case 1:
                printableMessage = `Animation 1 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[0]
                color = '#69d4ff';
                break;
            case 2:
                printableMessage = `Animation 2 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[1]
                color = '#ad96ff';
                break;
            case 3:
                printableMessage = `Animation 3 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[2]
                color = '#96ffb1';
                break;
            case 4:
                printableMessage = `Animation 4 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[3]
                color = '#ff944d';
                break;
            case 5:
                printableMessage = `Animation 5 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[4]
                color = '#fcd303';
                break;
            case 6:
                printableMessage = `Animation 6 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[5]
                color = '#6bfc03';
                break;
            case 7:
                printableMessage = `Animation 7 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[6]
                color = '#0341fc';
                break;
            case 8:
                printableMessage = `Animation 8 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[7]
                color = '#de0202';
                break;
            case 9:
                printableMessage = `Animation 9 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[8]
                color = '#57ffe6';
                break;
            case 10:
                printableMessage = `Animation 10 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[9]
                color = '#90efe6';
                break;
            case 11:
                printableMessage = `Animation 11 was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = animations[10]
                color = '#9050e6';
                break;
            default:
                printableMessage = `Default animation null was selected for AP ${currentAssetFeatureId + 1}.`
                animation_geojson = null
                break;
        }
        console.log(printableMessage);
        printOnConsoleDebugger(printableMessage)

        if (animation_geojson == null) {
            printableMessage = `Animation for Asset Point ${currentAssetFeatureId + 1} was not setted!`
            console.log(printableMessage);
            printOnConsoleDebugger(printableMessage)
            return;
        }

        // We fetch the JSON here so that we can parse and use it separately
        // from GL JS's use in the added source.
        const response = await fetch(animation_geojson);
        const data = await response.json();

        // save full coordinate list for later
        const coordinates = data.features[0].geometry.coordinates;

        // set animatingPointFlag to true
        animatingAssetPointFlags[currentAssetFeatureId] = true;

        // set disable 'Start Animation' button and enable 'Stop Animation' button
        document.getElementById('btn_start_animations').disabled = true;
        document.getElementById('btn_stop_animations').disabled = false;
        document.getElementById('draw-assetpoint').disabled = true;
        document.getElementById('delete-assetpoint').disabled = true;
        document.getElementById('draw-antenna').disabled = true;
        document.getElementById('delete-antenna').disabled = true;
        document.getElementById('draw-anchor').disabled = true;
        document.getElementById('delete-anchor').disabled = true;

        // update button color
        updateAnimationColorButtonsOnStart();

        // start by showing just the first coordinate
        data.features[0].geometry.coordinates = [coordinates[0]];

        // remove 'trace' layer and source if already exists on map
        if (map.getLayer(`trace-ap${currentAssetFeatureId + 1}`)) {
            map.removeLayer(`trace-ap${currentAssetFeatureId + 1}`);
        }
        if (map.getSource(`trace-ap${currentAssetFeatureId + 1}`)) {
            map.removeSource(`trace-ap${currentAssetFeatureId + 1}`);
        }

        // set 1st printableMessage 
        printableMessage1 = `Animate Asset Point ${currentAssetFeatureId + 1}... `;

        // print to console and to console_debugger
        console.log(printableMessage1);
        printOnConsoleDebugger(printableMessage1);

        // add 'trace' layer and source
        map.addSource(`trace-ap${currentAssetFeatureId + 1}`, { type: 'geojson', data: data });
        map.addLayer({
            'id': `trace-ap${currentAssetFeatureId + 1}`,
            'type': 'line',
            'source': `trace-ap${currentAssetFeatureId + 1}`,
            'paint': {
                'line-color': color,
                'line-opacity': 0.5,
                'line-width': 6,
            }
        }, firstLinesOfSightLayerId);

        // setup the viewport on coordinate index 0
        map.flyTo({ 'center': coordinates[0], 'zoom': 21, 'speed': 0.5 });

        // on a regular basis, add more coordinates from the saved list and update the map
        let i = 0;
        const timer = setInterval(async () => {
            // get current date and time
            const currentDate = new Date();
            var now = currentDate.getTime();

            // limit to (cpu_frame_rate/10) updates per second
            if ((now - last_frame) < cpu_frame_rate) {
                return;
            };

            // Call event to close all open popups
            map.fire('closeAllPopups');

            if (i < coordinates.length && animatingAssetPointFlags[currentAssetFeatureId]) {
                // save last position coordinate
                lastCoord = geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates;
                // save new position coordinate
                newCoord = coordinates[i];

                // get bearing between two locations
                directionLargeLobe = getBearingBetweenLocations(lastCoord, newCoord);

                // set large and small lobes of asset point
                geojson_asset_points.features[currentAssetFeatureId].properties.angle_direction_large_lobe = directionLargeLobe;
                geojson_asset_points.features[currentAssetFeatureId].properties.angle_direction_small_lobe = rescrictTo180Degrees(parseFloat(directionLargeLobe) + 180);

                // push actual animation coordinate
                data.features[0].geometry.coordinates.push(coordinates[i]);
                geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates = coordinates[i];

                // Call setData to the source layer `trace` on it.
                map.getSource(`trace-ap${currentAssetFeatureId + 1}`).setData(data)
                // Call setData to the source layer `geojson_asset_points` on it.
                map.getSource('asset-points').setData(geojson_asset_points);

                // remove (splice) the direction at currentAssetFeatureId from 'geojson_assetpoints_directions' FeatureCollection
                geojson_assetpoints_directions.features.splice(currentAssetFeatureId * 2, 2);

                // create assetpoint Lobe Direction at currentAssetFeatureId
                createAssetPointLobesDirection(geojson_asset_points.features[currentAssetFeatureId], geojson_assetpoints_directions)

                // Call setData to the source layer `places` on it.
                map.getSource('assetpoints_directions').setData(geojson_assetpoints_directions);

                // Print the coordinates of where the point had
                // finished being moved to on the map.
                messageToPrint =
                    `<strong>${geojson_asset_points.features[currentAssetFeatureId].properties.title} Coordinates: </strong><br /> ` +
                    `&#8226; Longitude:  ${rescrictTo180Degrees(geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[0])} ` +
                    `(${convertDMSLng(rescrictTo180Degrees(geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[0]))}) <br /> ` +
                    `&#8226; Latitude:  ${geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[1]} ` +
                    `(${convertDMSLat(geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[1])})`;
                // Update container innerHTML
                updateContainerInnerHtml(coordinates_point_container, messageToPrint);

                // set 2nd printableMessage 
                printableMessage2 = `<strong>Coordinates (Long, Lat):</strong><br />` +
                    `(${geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[0]}, ` +
                    `${geojson_asset_points.features[currentAssetFeatureId].geometry.coordinates[1]})`;

                // print to console and to console_debugger
                console.log(printableMessage2);
                printOnConsoleDebugger(printableMessage2);

                // Start the LinesOfSight animation.
                animateLinesOfSight(geojson_asset_points, geojson_anchors, geojson_antennas, geojson_lines_of_sight);
                // Start the IntersectionPoints animation.
                animateWallIntersectionPoints(wall_intersections_points, geojson_lines_of_sight, geojson_walls);
                // Start the pulsingDotPoints animation.
                animatePulsingDotPoints(pulsing_dots_layers_sources);
                // update last_fame with now time
                last_frame = now;
                // increment index
                i++;

            } else {
                window.clearInterval(timer);

                // set animatingAssetPointFlag to false
                animatingAssetPointFlags[currentAssetFeatureId] = false;

                // set enable 'Start Animation' button and disable 'Stop Animation' button
                document.getElementById('btn_start_animations').disabled = false;
                document.getElementById('btn_stop_animations').disabled = true;
                document.getElementById('draw-assetpoint').disabled = false;
                document.getElementById('delete-assetpoint').disabled = false;
                document.getElementById('draw-antenna').disabled = false;
                document.getElementById('delete-antenna').disabled = false;
                document.getElementById('draw-anchor').disabled = false;
                document.getElementById('delete-anchor').disabled = false;

                // update button color
                updateAnimationColorButtonsOnStop();

                // set 3rd printableMessage
                printableMessage3 = `End of Asset Point ${currentAssetFeatureId + 1} Animation!`;

                // print to console and to console_debugger
                console.log(printableMessage3);
                printOnConsoleDebugger(printableMessage3);
            }
        }, 1000 / animation_speed_factor);
    }
}

// =========== End of Asset Point Animations Functions =========== //