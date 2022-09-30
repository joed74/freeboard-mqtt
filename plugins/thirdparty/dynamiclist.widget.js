/* dynamic list widget for Freeboard */
/* developed by Jochen Dolze         */

(function()
{
	var dynamicListWidget = function (settings) {
        var self = this;
	var myElement;
        var currentSettings = settings;

		function updateState(listObject) {

			let maxElements=1;
			$(myElement).empty();
			$(myElement).height(maxElements*60);

			if (listObject && _.isArray(listObject)) {

				maxElements=listObject.length;
				$(myElement).height(maxElements*60);

				for (let i = 0; i < maxElements; i++) {
					var subElement = $('<div class="sub-section sub-section-height-1" style="height: 54px; padding-top: 5px; padding-right: 10px; padding-left: 10px;"></div>');
					var titleElement = $('<h2 class="section-title"></h2>');
					titleElement.html((_.isUndefined(currentSettings.title) ? "" : currentSettings.title));
					var indicatorElement = $('<div class="indicator-light interactive" data-dest="'+listObject[i].topic+'"></div>');
					indicatorElement.toggleClass("on", true);
					$(indicatorElement).click(self.onClick.bind(self));

					var indicatorText = $('<div class="indicator-text" style="height: 26px">'+listObject[i].display_name+'</div>');

					$(subElement).append(titleElement).append(indicatorElement).append(indicatorText);

					$(myElement).append(subElement);
				}
			}
		}

		this.onClick = function(e) { 
            e.preventDefault()
            var new_val;
			if (currentSettings.format)
			{
				new_val=currentSettings.format.replace("%value%",false);
			}
			else
			{
				new_val=false;
			}
			var matches = currentSettings.value.match(/datasources\[[\"']([^\"']+)[\"']\](\[[\"'].*[\"']\])*/);
			if (matches)
			{
				var dest='datasources["'+matches[1]+'"]["'+e.target.getAttribute('data-dest')+'"]';
				this.sendValue(dest, new_val);
			}
        }


        this.render = function (element) {
			myElement=element;
			// remove padding, will be added on subsections
			$(myElement).css("padding-top","0px");
			$(myElement).css("padding-right","0px");
			$(myElement).css("padding-bottom","0px");
			$(myElement).css("padding-left","0px");
			//updateState(currentSettings.value);
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
			//updateState(currentSettings.value);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            //whenver a calculated value changes, stored them in the variable 'stateObject'
			if (settingName=='value')
			{
				updateState(newValue);
			}
        }

        this.onDispose = function () {
        }

        this.getHeight = function () { 
			if (_.isUndefined(myElement)) return 1;
			var height = Math.ceil($(myElement).height() / 60);
			return (height > 0 ? height : 1);
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "dynamiclist",
        display_name: "Dynamic List",
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
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new dynamicListWidget(settings));
        }
    });
}());
