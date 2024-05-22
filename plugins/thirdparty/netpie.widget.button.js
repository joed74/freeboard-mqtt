/*  NETPIE widget plugin for Freeboard                            */
/*  Developed by Chavee Issariyapat                               */
/*  More information about NETPIE please visit https://netpie.io  */

(function() {
    var bcolor = { red:    ["#FFFFFF","#e74c3c"],
	           green:  ["#FFFFFF","#2ecc71"],
	           blue:   ["#FFFFFF","#3498db"],
	           yellow: ["#FFFFFF","#f1c40f"],
	           white:  ["#454545","#ecf0f1"],
	           grey:   ["#FFFFFF","#bdc3c7"],
	           dark:   ["#FFFFFF","#3d3d3d"]
                 };

    $('head').append('<link href="plugins/thirdparty/netpie.widget.button.css" rel="stylesheet" />');

    freeboard.loadWidgetPlugin({
        "type_name"   : "Button",
        "display_name": "Buttons",
        "description" : "A widget with three buttons that can perform Javascript action.",
        "fill_size" : false,
        "settings"  : [
            {
                "name"        : "text",
                "display_name": "Label Text",
                "type"        : "text",
				"description": "Text on the right side of the last button"
            },
            {
		"name"        : "caption",
		"display_name": "Button Left Caption",
		"type"        : "text",
		"default_value": "Push me",
		"description": "Text on button, button is hidden if text is empty"
            },
	    {
                "name"        : "color",
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
		    },
	            {
                        "name" : "Dark",
                        "value": "dark"
		    }
                ]
            },
	    {
                "name"        : "onClick",
                "display_name": "Button Left Action",
                "type"        : "script",
                "description" : "Add some Javascript here."
	    },
            {
		"name"        : "caption2",
		"display_name": "Button Middle Caption",
		"type"        : "text",
		"description": "Text on button, button is hidden if text is empty"
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
                    },
		    {
			"name" : "Dark",
			"value": "dark"
		    }
                ]
            },
	    {
                "name"        : "onClick2",
                "display_name": "Button Middle Action",
                "type"        : "script",
                "description" : "Add some Javascript here."
            },
	    {
		"name"        : "caption3",
		"display_name": "Button Right Caption",
		"type"        : "text",
		"description": "Text on button, button is hidden if text is empty"
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
		    },
		    {
			"name" : "Dark",
			"value": "dark",
		    }
                ]
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
		var myelement;

        self.widgetID = makeid(16);
	self.widgetID2 = makeid(16);
	self.widgetID3 = makeid(16);

	self.flash = function(e, color) {
	    if (color=="white") {
	       e.currentTarget.style.color="white";
	       e.currentTarget.style.backgroundColor="#bdc3c7";
	    } else {
	       e.currentTarget.style.color="black";
               e.currentTarget.style.backgroundColor="white";
	    }
	    setTimeout(() => {
               e.currentTarget.style.color=bcolor[color][0];
	       e.currentTarget.style.backgroundColor=bcolor[color][1];
	    }, 150);
	}

	self.onClick = function(e) {
	    e.preventDefault();
	    self.flash(e, currentSettings.color);
    	    var f=new Function(currentSettings.onClick);
	    return(f(self));
	}

	self.onClick2 = function(e) {
            e.preventDefault();
            self.flash(e, currentSettings.color2);
	    var f=new Function(currentSettings.onClick2);
	    return(f(self));
	}

	self.onClick3 = function(e) {
            e.preventDefault();
            self.flash(e, currentSettings.color3);
	    var f=new Function(currentSettings.onClick3);
	    return(f(self));
	}

        var buttonElement = $("<input type=\"button\" class=\"netpie-button\" style=\"margin-right: 20px; padding: unset\" id=\""+self.widgetID+"\" value=\""+(settings.caption?settings.caption:"")+"\">");
	$(buttonElement).click(self.onClick.bind(self));

	var buttonElement2 = $("<input type=\"button\" class=\"netpie-button\" style=\"margin-right: 20px; padding: unset\" id=\""+self.widgetID2+"\" value=\""+(settings.caption2?settings.caption2:"")+"\">");
	$(buttonElement2).click(self.onClick2.bind(self));

	var buttonElement3 = $("<input type=\"button\" class=\"netpie-button\" style=\"margin-right: 10px; padding: unset\" id=\""+self.widgetID3+"\" value=\""+(settings.caption3?settings.caption3:"")+"\">");
	var textElement = $("<div style=\"display: table-cell; white-space: break-spaces; vertical-align: middle; height: 35px; font-size: 95%\">"+(settings.text?settings.text:"")+"</div>");
        $(buttonElement3).click(self.onClick3.bind(self));

        function updateButton(element, caption, color) {
			if (caption) element[0].value=caption;
            if (bcolor[color]) {
                element.css({
                    "color" : bcolor[color][0],
                    "background-color" : bcolor[color][1]
                });
            } else {
                element.css({
                    "color" : bcolor["red"][0],
                    "background-color" : bcolor["red"][1]
                });
			}
        }

        updateButton(buttonElement, settings.caption, settings.color);
	    updateButton(buttonElement2, settings.caption2, settings.color2);
	    updateButton(buttonElement3, settings.caption3, settings.color3);

        self.render = function(containerElement) {
			myelement = containerElement;

			let cnt=0;
			if (typeof currentSettings.caption === "string" && currentSettings.caption.trim().length > 0) cnt++;
			if (typeof currentSettings.caption2 === "string" && currentSettings.caption2.trim().length > 0) cnt++;
			if (typeof currentSettings.caption3 === "string" && currentSettings.caption3.trim().length > 0) cnt++;

		        let fsize=120;
			let width=50;
			if (cnt==3) {
			   width=20;
			   fsize=98;
			}
			if (cnt==2) {
			   width=34;
			   fsize=110;
			}

			$(containerElement).append("<div style='height: 7px'></div>");
			let lastbutton;
			if (typeof currentSettings.caption === "string" && currentSettings.caption.trim().length > 0) {
				buttonElement.css({"width" : width+"%","font-size" : fsize+"%"});
				lastbutton=buttonElement;
				$(containerElement).append(buttonElement);
			}
			if (typeof currentSettings.caption2 === "string" && currentSettings.caption2.trim().length > 0) {
				buttonElement2.css({"width" : width+"%","font-size" : fsize+"%"});
				lastbutton=buttonElement2;
				$(containerElement).append(buttonElement2);
			}
			if (typeof currentSettings.caption3 === "string" && currentSettings.caption3.trim().length > 0) {
				buttonElement3.css({"width" : width+"%","font-size" : fsize+"%"});
				lastbutton=buttonElement3;
				$(containerElement).append(buttonElement3);
			}
			lastbutton.css({"margin-right" : "10px"});

			$(containerElement).append(textElement);
	}

        self.getHeight = function() {
            return 1;
        }

        self.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
			$(buttonElement)[0].value=(newSettings.caption?newSettings.caption:"");
			$(buttonElement2)[0].value=(newSettings.caption2?newSettings.caption2:"");
			$(buttonElement3)[0].value=(newSettings.caption3?newSettings.caption3:"");
            updateButton(buttonElement, newSettings.caption, newSettings.color);
            updateButton(buttonElement2, newSettings.caption2, newSettings.color2);
            updateButton(buttonElement3, newSettings.caption3, newSettings.color3);
	        textElement.text(newSettings.text?newSettings.text:"");
			if (myelement) self.render(myelement);
	}

        self.onCalculatedValueChanged = function(settingName, newValue) {
            if(settingName == "caption") {
                $(buttonElement).val(newValue);
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
