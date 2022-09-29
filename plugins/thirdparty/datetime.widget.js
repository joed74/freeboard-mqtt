/* datetime widget for Freeboard */
/* developed by Jochen Dolze     */

(function()
{

    freeboard.loadWidgetPlugin({
        type_name: "datetime_widget",
        display_name: "Date and Time",
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "size",
                display_name: "Size",
                type: "option",
                options: [
                    {
                        name: "Regular",
                        value: "regular"
                    },
                    {
                        name: "Big",
                        value: "big"
                    }
                ]
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "format",
                display_name: "Format",
                type: "option",
                options: [
                    {
                        name: "Date and Time",
                        value: "datetime"
                    },
                    {
                        name: "Time only",
                        value: "time"
                    },
                    {
                        name: "Date only",
                        value: "date"
                    },
                ]
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new datetimeWidget(settings));
        }
    });

    var datetimeWidget = function (settings) {

        var self = this;

        var currentSettings = settings;
		var displayElement = $('<div class="tw-display"></div>');
		var titleElement = $('<h2 class="section-title tw-title tw-td"></h2>');
        var valueElement = $('<div class="tw-value"></div>');
		var actval;

		function updateValueSizing()
		{
			valueElement.css("max-width", "100%");
		}

		function updateValue()
		{
			valueElement.text(actval);
		}

        this.render = function (element) {
			$(element).empty();

			$(displayElement)
				.append($('<div class="tw-tr"></div>').append(titleElement))
				.append($('<div class="tw-tr"></div>').append($('<div class="tw-value-wrapper tw-td"></div>').append(valueElement)))

			$(element).append(displayElement);

			updateValueSizing();
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;

			var shouldDisplayTitle = (!_.isUndefined(newSettings.title) && newSettings.title != "");

			if(shouldDisplayTitle)
			{
				titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
				titleElement.attr("style", null);
			}
			else
			{
				titleElement.empty();
				titleElement.hide();
			}

			var valueFontSize = 25;

			if(newSettings.size == "big")
			{
				valueFontSize = 50;
			}

			valueElement.css({"font-size" : valueFontSize + "px"});

			updateValueSizing();
        }

		this.onSizeChanged = function()
		{
			updateValueSizing();
		}

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {
				let date=new Date(newValue);

				switch (currentSettings.format) {
					case "date":
					  actval=date.toLocaleDateString();
					  break;
					case "time":
					  actval=date.toLocaleTimeString();
					  break;
					default:
					  actval=date.toLocaleString();
				}
            }
	    updateValue();
        }

        this.onDispose = function () {

        }

        this.getHeight = function () {
            if (currentSettings.size == "big") {
                return 2;
            }
            else {
                return 1;
            }
        }

        this.onSettingsChanged(settings);
    };

}());
