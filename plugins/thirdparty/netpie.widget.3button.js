/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

(function() {
    var bcolor = {red:["#FFF","#e74c3c"],green:["#FFF","#2ecc71"],blue:["#FFF","#3498db"],yellow:["#FFF","#f1c40f"],white:["#454545","#ecf0f1"],grey:["#FFF","#bdc3c7"]};

    freeboard.loadWidgetPlugin({
        "type_name"   : "ThreeButton",
        "display_name": "Three Buttons",
        "description" : "A widget with three buttons that can perform Javascript action.",
        "fill_size" : false,
        "settings"  : [
            {
                "name"        : "text",
                "display_name": "Label Text",
                "type"        : "text"
            },
            {
		"name"        : "caption1",
		"display_name": "Button Left Caption",
		"type"        : "text"
            },
            {
		"name"        : "caption2",
		"display_name": "Button Middle Caption",
		"type"        : "text"
            },
	    {
		"name"        : "caption3",
		"display_name": "Button Right Caption",
		"type"        : "text"
            },
	    {
                "name"        : "color1",
                "display_name": "Button Left Color",
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
                "name"        : "color2",
                "display_name": "Button Middle Color",
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
                "name"        : "color3",
                "display_name": "Button Right Color",
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
                "name"        : "onClick1",
                "display_name": "Button Left Action",
                "type"        : "script",
                "description" : "Add some Javascript here."
	    },
	    {
                "name"        : "onClick2",
                "display_name": "Button Middle Action",
                "type"        : "script",
                "description" : "Add some Javascript here."
            },
	    {
                "name"        : "onClick3",
                "display_name": "Button Right Action",
                "type"        : "script",
                "description" : "Add some Javascript here."
            }
	],
        newInstance   : function(settings, newInstanceCallback) {
            newInstanceCallback(new button3WidgetPlugin(settings));
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

    var button3WidgetPlugin = function(settings) {
        var self = this;
        var currentSettings = settings;

        self.widgetID1 = makeid(16);
	self.widgetID2 = makeid(16);
	self.widgetID3 = makeid(16);

	self.onClick1 = function(e) {
	    e.preventDefault();
    	    var f=new Function(currentSettings.onClick1);
	    return(f(self));
	}

	self.onClick2 = function(e) {
            e.preventDefault();
	    var f=new Function(currentSettings.onClick2);
	    return(f(self));
	}

	self.onClick3 = function(e) {
            e.preventDefault();
	    var f=new Function(currentSettings.onClick3);
	    return(f(self));
	}

        var buttonElement1 = $("<input type=\"button\" class=\"netpie-button\" style=\"width: 20%; margin-right: 20px; font-size: 0.9vw\" id=\""+self.widgetID1+"\" value=\""+(settings.caption1?settings.caption1:"")+"\">");
	$(buttonElement1).click(self.onClick1.bind(self));

	var buttonElement2 = $("<input type=\"button\" class=\"netpie-button\" style=\"width: 20%; margin-right: 20px; font-size: 0.9vw\" id=\""+self.widgetID2+"\" value=\""+(settings.caption2?settings.caption2:"")+"\">");
	$(buttonElement2).click(self.onClick2.bind(self));

	var buttonElement3 = $("<input type=\"button\" class=\"netpie-button\" style=\"width: 20%; margin-right: 10px; font-size: 0.9vw\" id=\""+self.widgetID3+"\" value=\""+(settings.caption3?settings.caption3:"")+"\">");
        var textElement = $("<div class=\"netpie-button-text\" style=\"float: none; white-space: break-spaces; display: flex; padding: unset\">"+(settings.text?settings.text:"")+"</div>");
        $(buttonElement3).click(self.onClick3.bind(self));

        function updateButtonColor(element, color) {
            if (bcolor[color]) {
                element.css({
                    "color" : bcolor[color][0],
                    "background-color" : bcolor[color][1]
                });
            }
        }

        updateButtonColor(buttonElement1, (settings.color1?settings.color1:"red"));
	updateButtonColor(buttonElement2, (settings.color2?settings.color2:"red"));
	updateButtonColor(buttonElement3, (settings.color3?settings.color3:"red"));

        self.render = function(containerElement) {
            $(containerElement).append(buttonElement1);
	    $(containerElement).append(buttonElement2);
            $(containerElement).append(buttonElement3).append(textElement);
	}

        self.getHeight = function() {
            return 1;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
            document.getElementById(self.widgetID1).value = (newSettings.caption1?newSettings.caption1:"");
            document.getElementById(self.widgetID2).value = (newSettings.caption2?newSettings.caption2:"");
            document.getElementById(self.widgetID3).value = (newSettings.caption3?newSettings.caption3:"");
            updateButtonColor(buttonElement1, newSettings.color1);
            updateButtonColor(buttonElement2, newSettings.color2);
            updateButtonColor(buttonElement3, newSettings.color3);
	    textElement.text(newSettings.text?newSettings.text:"");
	}

        self.onCalculatedValueChanged = function(settingName, newValue) {
            if(settingName == "caption1") {
                $(buttonElement1).val(newValue);
            }
            if(settingName == "caption2") {
		$(buttonElement2).val(newValue);
	    }
	    if(settingName == "caption3") {
		$(buttonElement3).val(newValue);
	    }
	}

        self.onDispose = function() {
        }
    }
}());
