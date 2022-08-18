// # A Freeboard Plugin that uses the Eclipse Paho javascript client to read MQTT messages

(function()
{
    // ### Datasource Definition
    //
    // -------------------
    freeboard.loadDatasourcePlugin({
        "type_name"   : "paho_mqtt_js",
        "display_name": "Paho MQTT Client",
        "description" : "Receive data from an MQTT server using Websockets",
        "external_scripts" : [
            "plugins/thirdparty/paho-mqtt.js"
        ],
        "settings"    : [
            {
                "name"         : "server",
                "display_name" : "MQTT Broker URI",
                "type"         : "text",
                "description"  : "Must be in the following format: ws[s]://hostname:port/[path] - e.g. ws://localhost:3320/<br>%HOST% can be used as replacement for hostname:port - e.g. ws://%HOST%/mydest",
                "required"     : true,
				"validator"	   : function(value) {
					if (!value.match(/^(wss?):\/\/((\[(.+)\])|([^\/]+?))(:(\d+))?(\/.*)$/)) return "incorrect format, please reread description";
					return(""); 
				}
            },
            {
                "name"        : "client_id",
                "display_name": "Client Id",
                "type"        : "text",
                "required"    : true
            },
            {
                "name"        : "topics",
                "display_name": "Topics",
				"description" : "The topics to subscribe to, wildcards allowed!",
				"required"    : true,
                "type"        : "array",
				"settings"    : [
				{
				                "name"        : "topic",
								"display_name": "Topic",
								"type"        : "text",								
								"required"    : true
				}
				]
            }
        ],
        // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
        // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
        // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
        // * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
        newInstance   : function(settings, newInstanceCallback, updateCallback)
        {
            newInstanceCallback(new mqttDatasourcePlugin(settings, updateCallback));
        }
    });

    var mqttDatasourcePlugin = function(settings, updateCallback)
    {
        var self = this;
        var data = {};
        var topicList = [];
		var client;

        var currentSettings = settings;

		function connect() {

			if (client!==undefined) {
				client.onConnectionLost=client.onMessageArrived=function() {};
				if (client.isConnected()) client.disconnect();
			}
		
			options = {
				timeout: 3,
				onSuccess: onConnect,
				onFailure: onFailure
			}
		
			var clientid = currentSettings.client_id+'_'+Math.floor(Math.random()*100000)+1;
			try {
				client = new Paho.MQTT.Client(currentSettings.server.replace("%HOST%",location.host),
                                        clientid);
				console.log( "Attempting connection..." );
				client.connect( options );											
			}
			catch (e)
			{
				console.log(e);
			}
		}
		
        function onConnect() {
            console.log("Connected");
			client.onConnectionLost = onConnectionLost;
			client.onMessageArrived = onMessageArrived;

			try {
				_.each(currentSettings.topics, function (entry) {
					var topic = entry.topic;
					console.log( "Subscribing to " + topic )
					client.subscribe( topic )
					if (topic.search(/[\+#]/g)==-1) data[topic] = {}
				});
			}
			catch (e) {
			}			
            // update the data to main to populate the topics list there
            updateCallback( data );
        };

        function onConnectionLost(responseObject) {
            if (responseObject.errorCode !== 0)
                console.log("onConnectionLost:"+responseObject.errorMessage);
			connect();
        };

        function onMessageArrived(message) {
            //console.log( "! t: " + message.destinationName )
            //console.log( "  m: " + message.payloadString )
            // Try to parse as JSON message, if failed revert to plain text
	    data={};
	    try {
                data[message.destinationName] = JSON.parse( message.payloadString )
            } catch(err) {
                data[message.destinationName] = message.payloadString
            }
			updateCallback( data );
        };

        function onFailure( message ) {
            console.log( "Connection failed - " + message.errorMessage )
        }

		// Allow datasource to post mqtt messages
		self.send = function(name, value) {
			if (client.isConnected()) {
			var message = new Paho.MQTT.Message(String(value));
			message.destinationName = name+'/set';
			console.log("send "+value+" to "+message.destinationName);
			client.send(message);
			}
		}

        // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
        self.onSettingsChanged = function(newSettings)
        {
            data = {};
            currentSettings = newSettings;
			connect();
        }

        // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
        self.updateNow = function()
        {
            // Don't need to do anything here, can't pull an update from MQTT.
        }

        // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
        self.onDispose = function()
        {
            if (client.isConnected()) {
				client.onConnectionLost=client.onMessageArrived=function() {};
                console.log( "Disconnecting from broker..." )
                client.disconnect();
            }
            client = {};
        }

		connect();

    }
}());
