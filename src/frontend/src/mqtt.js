/**
 * MQTT Connection functions definitions
 *  @module mqtt */

/**
 * Execute the MQTT client connection to the broker
 * @param {string} session_uuid Generated MQTT session UUID
 * @param {string} client_id MQTT client ID
 * @param {string} mqtt_hostname MQTT hostname connection
 * @param {string} mqtt_port MQTT port connection
 * @param {number} reconnect_timeout MQTT reconnect Time Out value
 * @param {string} clientUsername MQTT client username connection
 * @param {string} clientPassword MQTT client password connection
 * @param {boolean} ssl_flag MQTT connection SSL flag
 * @param {number} backend_read_rate Backend read rate value
 * @param {string} messageToSend MQTT message to send to broker
 * @param {string} mqttTopicToReceivePredictions MQTT Topic To Receive Predictions
 * @param {string} mqttTopicToReceiveCalculations MQTT Topic To Receive Calculations
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 * @param {Array} pulsing_dots_layers_IDs Pulsing Dots IDs Array
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {number} selectedMapIndex Index of selected Map
 * @param {string} received_uuid MQTT received session UUID
 */
function connectToMqttBroker(
    session_uuid,
    client_id,
    mqtt_hostname,
    mqtt_port,
    reconnect_timeout,
    clientUsername,
    clientPassword,
    ssl_flag,
    backend_read_rate,
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
) {
    // Create a client instance
    mqtt = new Paho.MQTT.Client(mqtt_hostname, mqtt_port, client_id);

    // set callback handlers
    mqtt.onConnectionLost = (msg) => onMqttConnectionLost(
        msg,
        pulsing_dots_layers_IDs
    );
    mqtt.onMessageArrived = (msg) => onMqttMessageArrived(
        msg,
        session_uuid,
        geojson_asset_points,
        geojson_anchors,
        geojson_antennas,
        pulsing_dots_layers_sources,
        mqttTopicToReceivePredictions,
        mqttTopicToReceiveCalculations,
        received_uuid
    );

    // set connection options
    var options = {
        mqttVersion: 3,
        timeout: 3,
        useSSL: ssl_flag,
        userName: clientUsername,
        password: clientPassword,
        onSuccess: () => onConnect(
            session_uuid,
            client_id,
            connection_string,
            backend_read_rate,
            selectedMapIndex,
            messageToSend,
            mqttTopicToReceivePredictions,
            mqttTopicToReceiveCalculations,
            geojson_asset_points,
            geojson_antennas,
            geojson_anchors,
            geojson_precison_decimal_places
        ),
        onFailure: (res) => onMqttConnectionFailure(
            res,
            connection_string,
            session_uuid,
            client_id,
            mqtt_hostname,
            mqtt_port,
            reconnect_timeout,
            clientUsername,
            clientPassword,
            ssl_flag,
            backend_read_rate,
            messageToSend,
            mqttTopicToReceivePredictions,
            mqttTopicToReceiveCalculations,
            geojson_asset_points,
            geojson_antennas,
            geojson_anchors,
            geojson_precison_decimal_places,
            pulsing_dots_layers_IDs,
            pulsing_dots_layers_sources,
            selectedMapIndex,
            received_uuid
        ),
    };

    printableMessage = "Attempting to connect to the broker at Host '" + connection_string + "' ...";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);

    // connect the client
    mqtt.connect(options);
}

/**
 * Called when the client connects sucessfully
 * @param {string} session_uuid Generated MQTT session UUID
 * @param {string} client_id MQTT client ID
 * @param {string} connection_string MQTT connection string value (hostname + port)
 * @param {number} backend_read_rate Backend read rate value
 * @param {number} selectedMapIndex Index of selected Map
 * @param {string} messageToSend MQTT message to send to broker
 * @param {string} mqttTopicToReceivePredictions MQTT Topic To Receive Predictions
 * @param {string} mqttTopicToReceiveCalculations MQTT Topic To Receive Calculations
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 */
function onConnect(
    session_uuid,
    client_id,
    connection_string,
    backend_read_rate,
    selectedMapIndex,
    messageToSend,
    mqttTopicToReceivePredictions,
    mqttTopicToReceiveCalculations,
    geojson_asset_points,
    geojson_antennas,
    geojson_anchors,
    geojson_precison_decimal_places
) {
    printableMessage = "The '" + client_id + "' is CONNECTED at '" + connection_string + "' !";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);

    // show window alert message
    alert(printableMessage);

    // set state to CONNECTED
    connectedFlag = true;

    // change button colors on connect successfully
    updateConnectionButtonsColors();

    // create a message and set a topic to publish
    messageToPublish = new Paho.MQTT.Message("");
    messageToPublish.destinationName = mqttTopicToPublish;

    // create a message and set a topic to subscribe from predictor
    messageToReceivePredictions = new Paho.MQTT.Message("");
    messageToReceivePredictions.destinationName = mqttTopicToReceivePredictions;

    // create a message and set a topic to subscribe from backend
    messageToReceiveCalculations = new Paho.MQTT.Message("");
    messageToReceiveCalculations.destinationName = mqttTopicToReceiveCalculations;

    // subscribe a topic to receive Messages from Predictor
    subscribeMqttTopic(messageToReceivePredictions.destinationName + "/" + session_uuid);

    // subscribe a topic to receive Messages from Backend
    subscribeMqttTopic(messageToReceiveCalculations.destinationName + "/" + session_uuid);

    // publish a full message in the begining
    messageToSend = constructJsonMessage(
        origin = "default",
        geojson_asset_points,
        geojson_antennas,
        geojson_anchors,
        geojson_precison_decimal_places,
        backend_read_rate,
        selectedMapIndex,
        messageToSend
    );
    publishMqttMessage(mqttTopicToPublish, messageToSend);

    /**
     * Publish a full message to the topic every 'mqttTimerFullUpdate' seconds if is connected to broker
     */
    const full_timer = setInterval(() => {
        if (connectedFlag) {
            // Publish a full message to the topic each 'mqttTimerFullUpdate' if client is connected to broker
            messageToSend = constructJsonMessage(
                origin = "default",
                geojson_asset_points,
                geojson_antennas,
                geojson_anchors,
                geojson_precison_decimal_places,
                backend_read_rate,
                selectedMapIndex,
                messageToSend
            );
            publishMqttMessage(mqttTopicToPublish, messageToSend);
        } else {
            window.clearInterval(full_timer);
        }
    }, mqttTimerFullUpdate / mqttMessagesPerTimer);

    /**
     * Publish a partial message to the topic each 'mqttTimerPartialUpdate' if is connected to broker
     */
    const partial_timer = setInterval(() => {
        if (connectedFlag) {
            // Construct AP Json Message
            messageToSend = constructJsonMessage(
                "assetPoint",
                geojson_asset_points,
                geojson_antennas,
                geojson_anchors,
                geojson_precison_decimal_places,
                backend_read_rate,
                selectedMapIndex,
                messageToSend
            );
            publishMqttMessage(mqttTopicToPublish, messageToSend);

            if (needUpdateAntennas) {
                // Construct Antennas Json Message
                messageToSend = constructJsonMessage(
                    "antennas",
                    geojson_asset_points,
                    geojson_antennas,
                    geojson_anchors,
                    geojson_precison_decimal_places,
                    backend_read_rate,
                    selectedMapIndex,
                    messageToSend
                );
                publishMqttMessage(mqttTopicToPublish, messageToSend);

                // set flag needUpdateAntennas to false
                needUpdateAntennas = false;
            }

            if (needUpdateAnchors) {
                // Construct Anchors Json Message
                messageToSend = constructJsonMessage(
                    "anchors",
                    geojson_asset_points,
                    geojson_antennas,
                    geojson_anchors,
                    geojson_precison_decimal_places,
                    backend_read_rate,
                    selectedMapIndex,
                    messageToSend
                );
                publishMqttMessage(mqttTopicToPublish, messageToSend);

                // set flag needUpdateAnchors to false
                needUpdateAnchors = false;
            }
        }
        else {
            window.clearInterval(partial_timer);
        }
    }, mqttTimerPartialUpdate / mqttMessagesPerTimer);
}

/**
 * Called when the client can't connect, try reconnect after a timeout
 * @param {Object} responseObject On Failure Response Object
 * @param {string} connection_string MQTT connection string value (hostname + port)
 * @param {string} session_uuid Generated MQTT session UUID
 * @param {string} client_id MQTT client ID
 * @param {string} mqtt_hostname MQTT hostname connection
 * @param {string} mqtt_port MQTT port connection
 * @param {number} reconnect_timeout MQTT reconnect Time Out value
 * @param {string} clientUsername MQTT client username connection
 * @param {string} clientPassword MQTT client password connection
 * @param {boolean} ssl_flag MQTT connection SSL flag
 * @param {number} backend_read_rate Backend read rate value
 * @param {string} messageToSend MQTT message to send to broker
 * @param {string} mqttTopicToReceivePredictions MQTT Topic To Receive Predictions
 * @param {string} mqttTopicToReceiveCalculations MQTT Topic To Receive Calculations
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 * @param {Array} pulsing_dots_layers_IDs Pulsing Dots IDs Array
 * @param {Array} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {number} selectedMapIndex Index of selected Map
 * @param {string} received_uuid MQTT received session UUID  
 */
function onMqttConnectionFailure(
    responseObject,
    connection_string,
    session_uuid,
    client_id,
    mqtt_hostname,
    mqtt_port,
    reconnect_timeout,
    clientUsername,
    clientPassword,
    ssl_flag,
    backend_read_rate,
    messageToSend,
    mqttTopicToReceivePredictions,
    mqttTopicToReceiveCalculations,
    geojson_asset_points,
    geojson_antennas,
    geojson_anchors,
    geojson_precison_decimal_places,
    pulsing_dots_layers_IDs,
    pulsing_dots_layers_sources,
    selectedMapIndex,
    received_uuid
) {
    printableMessage = "Connection attempt to Host '" + connection_string + "' failed: " +
        responseObject.errorMessage + ' (errorCode: ' + responseObject.errorCode + ')';

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);

    // show window alert message
    alert(printableMessage);

    // reconnect
    setTimeout(
        connectToMqttBroker(
            session_uuid,
            client_id,
            mqtt_hostname,
            mqtt_port,
            reconnect_timeout,
            clientUsername,
            clientPassword,
            ssl_flag,
            backend_read_rate,
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
        ), reconnect_timeout);
}

/**
 * Subscribe to a MQTT topic
 * @param {string} topicName Name of the MQTT topic to subscribe
 */
function subscribeMqttTopic(topicName) {
    // Subscribe options
    var subscribeOptions = {
        qos: 0,  // QoS
        //invocationContext: { foo: true },  // Passed to success / failure callback
        onSuccess: onMqttSuccessSubscription,
        onFailure: onMqttFailureSubscription,
        timeout: 5
    };

    printableMessage = "Subscribing topic '" + topicName + "'...";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);

    // call subscribe
    mqtt.subscribe(topicName, subscribeOptions);
}

/**
 * Called when the MQTT client subscribe the topic successfully
 */
function onMqttSuccessSubscription() {
    printableMessage = "Subscription to defined topic has succeeded!";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);
}

/**
 * Called when the MQTT client can't subscribe a topic
 * @param {Object} responseObject On Failure Response Object
 */
function onMqttFailureSubscription(responseObject) {
    printableMessage = "Subscription attempt to defined topic has failed: " +
        responseObject.errorMessage + ' (errorCode: ' + responseObject.errorCode + ')';

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);
}

/**
 * Called when the client loses its connection
 * @param {Object} responseObject On Failure Response Object
 * @param {Array} pulsing_dots_layers_IDs Pulsing Dots IDs Array
 */
function onMqttConnectionLost(responseObject, pulsing_dots_layers_IDs) {
    if (responseObject.errorCode !== 0) {
        printableMessage = "The connection with broker was lost: " + responseObject.errorMessage + ' (errorCode: ' + responseObject.errorCode + ')';

        // print to console and to console_debugger
        console.log(printableMessage);
        printOnConsoleDebugger(printableMessage);

        // show window alert message
        alert(printableMessage);

        // set state to DISCONNECTED
        connectedFlag = false;

        // change button colors on disconnect 
        updateDisconnectionButtonsColors();

        // set visibility of 'pulsing-dots' layers to none
        setPulsingDotsLayersToNone(pulsing_dots_layers_IDs);
    }
}

/**
 * Publish a MQTT message in the topic
 * @param {string} topicName Name of the MQTT topic to publish a message
 * @param {string} messagePayload Message payload string data to publish
 */
function publishMqttMessage(topicName, messagePayload) {
    message = new Paho.MQTT.Message(messagePayload);
    message.destinationName = topicName;
    message.qos = 0;
    message.retained = false;
    mqtt.send(message);

    // print to console and to console_debugger
    console.log("Message Published: " + message.payloadString);
    printOnConsoleDebugger("Message Published: </br>" + message.payloadString);
}

/**
 * Called when a MQTT message arrives
 * @param {string} message MQTT message received from the broker
 * @param {string} session_uuid Generated MQTT session UUID
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {number} pulsing_dots_layers_sources Pulsing Dots sources Array
 * @param {string} mqttTopicToReceivePredictions MQTT Topic To Receive Predictions
 * @param {string} mqttTopicToReceiveCalculations MQTT Topic To Receive Calculations
 * @param {string} received_uuid MQTT received session UUID
 */
function onMqttMessageArrived(
    message,
    session_uuid,
    geojson_asset_points,
    geojson_anchors,
    geojson_antennas,
    pulsing_dots_layers_sources,
    mqttTopicToReceivePredictions,
    mqttTopicToReceiveCalculations,
    received_uuid
) {
    // first replace (') by (")
    var result = message.payloadString.replace(/'/g, '"');
    // process received JSON message format 
    jsonData = JSON.parse(result);
    // save received_uuid
    received_uuid = jsonData["uuid"];

    // verify if received_uuid is session_uuid 
    if (received_uuid == session_uuid) {
        if (message.destinationName == mqttTopicToReceivePredictions + "/" + session_uuid
            || message.destinationName == mqttTopicToReceiveCalculations + "/" + session_uuid) {
            // do something with received data (backend and predictions)
            var printableMessage = "Message Received: " + "</br>" +
                message.payloadString + " | " +
                "Topic: " + message.destinationName + " | " +
                "QoS: " + message.qos + " | " +
                "Retained: " + message.retained + " | " +
                // Read Only, set if message might be a duplicate sent from broker
                "Duplicate: " + message.duplicate;

            // print to console and to console_debugger
            console.log(printableMessage);
            printOnConsoleDebugger(printableMessage);

            // process received JSON message
            processReceivedJsonMessage(
                message,
                geojson_asset_points,
                geojson_anchors,
                geojson_antennas,
                pulsing_dots_layers_sources,
                received_uuid
            );
        }
    }
}

/**
 * Unsubscribe to a MQTT topic (uncalled)
 * @param {string} topicName Name of the MQTT topic to unsubscribe
 */
function unsubscribeMqttTopic(topicName) {
    // Unsubscribe options
    var unsubscribeOptions = {
        invocationContext: { foo: true },  // Passed to success / failure callback
        onSuccess: onSuccessUnsubscription,
        onFailure: onFailureUnsubscription,
        timeout: 10
    };

    printableMessage = "Unsubscribing topic: " + topicName;

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);

    // call unsubscribe
    mqtt.unsubscribe(mqttTopicToPublish, unsubscribeOptions);
}

/**
 * Called when the client unsubscribe the topic successfully (uncalled)
 */
function onSuccessUnsubscription() {
    printableMessage = "Unsubscription of the topic defined has succeeded!";

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);
}

/**
 * Called when the client can't unsubscribe (uncalled)
 * @param {Object} responseObject On Failure Response Object
 */
function onFailureUnsubscription(responseObject) {
    printableMessage = "Unsubscription of topic defined attempt has failed: " +
        responseObject.errorMessage + ' (errorCode: ' + responseObject.errorCode + ')';

    // print to console and to console_debugger
    console.log(printableMessage);
    printOnConsoleDebugger(printableMessage);
}

/**
 * Execute the MQTT client Disconnection to the broker
 * @param {string} client_id MQTT client ID
 * @param {string} connection_string MQTT connection string value (hostname + port)
 * @param {FeatureCollection} geojson_asset_points Asset Points FeatureCollection
 * @param {FeatureCollection} geojson_antennas Antennas FeatureCollection
 * @param {FeatureCollection} geojson_anchors Anchors FeatureCollection
 * @param {number} geojson_precison_decimal_places Value of precison decimal places
 * @param {number} selectedMapIndex Index of selected Map
 * @param {string} messageToSend MQTT message to send to broker
 * @param {Array} pulsing_dots_layers_IDs Pulsing Dots IDs Array
 */
function disconnectFromMqttBroker(
    client_id,
    connection_string,
    geojson_asset_points,
    geojson_antennas,
    geojson_anchors,
    geojson_precison_decimal_places,
    selectedMapIndex,
    messageToSend,
    pulsing_dots_layers_IDs,
) {
    if (connectedFlag) {
        // set state to DISCONNECTED
        connectedFlag = false;

        // Construct disconnect Json Message
        messageToSend = constructJsonMessage(
            "disconnect",
            geojson_asset_points,
            geojson_antennas,
            geojson_anchors,
            geojson_precison_decimal_places,
            backend_read_rate,
            selectedMapIndex,
            messageToSend
        );
        publishMqttMessage(mqttTopicToPublish, messageToSend);

        // change button colors on disconnect successfully
        updateDisconnectionButtonsColors();

        // set visibility of 'pulsing-dots' layers to none
        setPulsingDotsLayersToNone(pulsing_dots_layers_IDs);

        printableMessage1 = "Disconnecting from the broker...";

        // print to console and to console_debugger
        console.log(printableMessage1);
        printOnConsoleDebugger(printableMessage1);

        // call disconnect
        mqtt.disconnect();

        printableMessage2 = "The client '" + client_id + "' with backend_read_rate '" + backend_read_rate + " ms' was DISCONNECTED from '" + connection_string + "' !";

        // print to console and to console_debugger
        console.log(printableMessage2);
        printOnConsoleDebugger(printableMessage2);

        // show window alert message
        alert(printableMessage2);

        // print the Distances | RSSI | Walls | Direction at the Distances & RSSI container
        var messageRssiDistancesContainer =
            `<strong>Distances [m] | RSSI [dBm] | Walls: # | Directionated: (boolean)</strong></br>` +
            ` &#8226; Connect to MQTT to know the measurements.</br>`;

        // Update container innerHTML
        updateContainerInnerHtml(distance_rssi_container, messageRssiDistancesContainer)
    }
}

// ========== End of MQTT Connection Functions ========== //
