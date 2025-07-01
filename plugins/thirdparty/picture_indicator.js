(function()
{

    freeboard.loadWidgetPlugin({
        type_name: "picture_indicator",
        display_name: "Picture Indicator",
        description : "Indicator which displays pictures for values",
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
		name: "time",
		display_name: "Timestamp",
		type: "calculated",
		description: "if defined, show timestamp on bottom right corner"
	    },
	    {
                name: "pictures",
		display_name: "Pictures",
		type: "array",
		settings : [
			{
				name: "value",
				display_name: "Value",
				type: "text"
			},
			{
				name: "picture",
				display_name: "Picture",
				type: "text"
			},
			{
				name: "text",
				display_name: "Text",
				type: "text"
			}
		]
	    }
        ],
        newInstance: function (settings, newInstanceCallback) {
  	   newInstanceCallback(new pictureIndicator(settings));
        }
    });

//    freeboard.addStyle('.indicator-light.interactive:hover', "box-shadow: 0px 0px 15px #FF9900; cursor: pointer;");
    var pictureIndicator = function (settings) {
        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div class="indicator-text"></div>');
        var picElement = $('<div class="pic" style="width: 50px;height: 50px;float:left;margin-top:-5px;"><img style="margin-left: -7px" src="" width="100%" height="100%"></div>');
        var timeElement = $('<div class="tw-time" style="margin-right: 10px"></div>');
	var actvalue;

	var currentSettings = settings;

        function updateState() {
            if (currentSettings.pictures) {
 	       let obj=currentSettings.pictures.find(o => o.value === actvalue);
	       if (obj)
	       {
	            let img=$(picElement).find("img").first();
		    if (img)
		    {
			img.attr("src","img/extra/"+obj.picture+".svg");
			if (titleElement.html().length>0)
			{
			     img.attr("width","90%");
			     img.attr("height","90%");
			     img.attr("style","margin-left: -4px");
			}
		    }
                    stateElement.text(obj.text);
	       }
	    }
	}

        this.render = function (element) {
            $(element).append(titleElement).append(picElement).append(stateElement).append(timeElement);
	}

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            updateState();
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {
		actvalue = newValue;
	    }

            if (settingName == "time") {
		let dv=new Date(newValue);
                if (isNaN(dv[Symbol.toPrimitive]('number'))) return;
                let dd=freeboard.dateDiff(new Date(),dv);
		if (dd>0)
                {
                   timeElement.text('('+dd+'d) '+dv.toLocaleTimeString());
                }
                else
                {
                   timeElement.text(dv.toLocaleTimeString());
                }
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
