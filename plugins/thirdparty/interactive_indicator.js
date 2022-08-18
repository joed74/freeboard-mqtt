(function()
{

    freeboard.loadWidgetPlugin({
        type_name: "interactive_indicator",
        display_name: "Interactive Indicator Light",
        description : "Indicator which can send a value as well as recieve one",
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
	    {
		name: "format",
		display_name: "Format to send",
		type: "text",
		description: "use %value% as replacement"
	    },
	    {
                name: "on_text",
                display_name: "On Text",
                type: "calculated"
            },
            {
                name: "off_text",
                display_name: "Off Text",
                type: "calculated"
            },

        ],
        newInstance: function (settings, newInstanceCallback) {
  	   newInstanceCallback(new interactiveIndicator(settings));
        }
    });

//    freeboard.addStyle('.indicator-light.interactive:hover', "box-shadow: 0px 0px 15px #FF9900; cursor: pointer;");
    var interactiveIndicator = function (settings) {
        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div class="indicator-text"></div>');
        var indicatorElement = $('<div class="indicator-light interactive"></div>');
        var currentSettings = settings;
        var isOn = false;
        var onText;
        var offText;

        function updateState() {
            indicatorElement.toggleClass("on", isOn);

            if (isOn) {
                stateElement.text((_.isUndefined(onText) ? (_.isUndefined(currentSettings.on_text) ? "" : currentSettings.on_text) : onText));
            }
            else {
                stateElement.text((_.isUndefined(offText) ? (_.isUndefined(currentSettings.off_text) ? "" : currentSettings.off_text) : offText));
            }
        }


        this.onClick = function(e) { 
            e.preventDefault()
            var new_val;
	    if (currentSettings.format)
	    {
	       new_val=currentSettings.format.replace("%value%",!isOn);
 	    }
	    else
	    {
	       new_val=!isOn;
	    }
     	    this.sendValue(currentSettings.value, new_val);
        }


        this.render = function (element) {
            $(element).append(titleElement).append(indicatorElement).append(stateElement);
            $(indicatorElement).click(this.onClick.bind(this));
	    $(stateElement).click(this.onClick.bind(this));
	}

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            updateState();
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {
                isOn = Boolean(newValue);
            }
            if (settingName == "on_text") {
                onText = newValue;
            }
            if (settingName == "off_text") {
                offText = newValue;
            }

            updateState();
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 1;
        }

        this.onSettingsChanged(settings);
    };

}());
