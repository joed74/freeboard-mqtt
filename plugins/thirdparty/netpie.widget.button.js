/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

(function() {
    var bcolor = {red:["#FFF","#e74c3c"],green:["#FFF","#2ecc71"],blue:["#FFF","#3498db"],yellow:["#FFF","#f1c40f"],white:["#454545","#ecf0f1"],grey:["#FFF","#bdc3c7"]};
    
    freeboard.loadWidgetPlugin({
        "type_name"   : "Button",
        "display_name": "Button",
        "description" : "A simple button widget that can perform Javascript action.",
        "fill_size" : false,
        "settings"  : [
            {
                "name"        : "caption",
                "display_name": "Button Caption",
                "type"        : "text"
            },
            {
                "name"        : "text",
                "display_name": "Label Text",
                "type"        : "text"
            },
            {
                "name"        : "color",
                "display_name": "Button Color",
                "type"        : "option",
                "options"     : [
                    {
                        "name" : "Red",
                        "value": "red"
                    },
                    {
                        "name" : "Green",
                        "value": "green"
                    },
                    {
                        "name" : "Blue",
                        "value": "blue"
                    },
                    {
                        "name" : "Yellow",
                        "value": "yellow"
                    },
                    {
                        "name" : "White",
                        "value": "white"
                    },
                    {
                        "name" : "Grey",
                        "value": "grey"
                    }

                ]
            },
            {
                "name"        : "onClick",
                "display_name": "onClick action",
                "type"        : "script",
                "description" : "Add some Javascript here. You can chat and publish with a datasource's microgear like this : microgear[\"mygear\"].chat(\"mylamp\",\"ON\"), where \"mygear\" is a datasource name."
            },
            {
                "name"          : "onCreatedAction",
                "display_name"  : "onCreated Action",
                "type"          : "text",
                "description"   : "JS code to run after a button is created"
            }

        ],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new buttonWidgetPlugin(settings));
        }
    });

	function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
	  charactersLength));
   }
   return result;
}
	
    var buttonWidgetPlugin = function(settings) {
        var self = this;
        var currentSettings = settings;

        self.widgetID = makeid(16);

        var buttonElement = $("<input type=\"button\" class=\"netpie-button\" id=\""+self.widgetID+"\" value=\""+settings.caption+"\">");
        var textElement = $("<div class=\"netpie-button-text\">"+(settings.text?settings.text:"")+"</div>");

		$(buttonElement).click(new Function(settings.onClick));

        function updateButtonColor(color) {
            if (bcolor[color]) {
                buttonElement.css({
                    "color" : bcolor[color][0],
                    "background-color" : bcolor[color][1]
                });
            }
        }

        updateButtonColor(settings.color);

        self.render = function(containerElement) {
            $(containerElement).append(buttonElement).append(textElement);
        }
		
        self.getHeight = function() {
            return 1;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            document.getElementById(self.widgetID).value = newSettings.caption;
            updateButtonColor(newSettings.color);
            textElement.text(newSettings.text?newSettings.text:"");
			$(buttonElement).unbind('click');
			$(buttonElement).click(new Function(newSettings.onClick));
        }

        self.onCalculatedValueChanged = function(settingName, newValue) {
            if(settingName == "caption") {
                $(buttonElement).val(newValue);
            }
        }

        self.onDispose = function() {
        }

        if (settings.onCreatedAction) {
            var timer = setInterval(function() {
                if (Object.getOwnPropertyNames(microgear).length > 0) {
                    clearInterval(timer);
                    eval(settings.onCreatedAction);
                }
            },200);
        }
    }
}());
