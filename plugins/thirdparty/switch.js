// +--------------------------------------------------------------------+ \\
// ¦ freeboard-switch-plugin                                            ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ http://blog.onlinux.fr/?tag=freeboard                              ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Licensed under the MIT license.                                    ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Freeboard widget plugin for Highcharts.                            ¦ \\
// +--------------------------------------------------------------------+ \\
(function()
{
    //
    // DECLARATIONS
    //
    var LOADING_INDICATOR_DELAY = 1000;
    var SWITCH_ID = 0;
    //
   
    
    freeboard.loadWidgetPlugin({
        type_name: "switch_plugin",
        display_name: "Switch",
        description : "Interactive on-off switch",
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
                name: "on_text",
                display_name: "On Text",
                type: "text",
                default_value: 'On'
            },
            {
                name: "off_text",
                display_name: "Off Text",
                type: "text",
                default_value: 'Off'
            },

        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new wswitch(settings));
        }
    });

     freeboard.addStyle('.floating-box',"display: inline-block; vertical-align: top; width: 78px; margin-top: 10px; margin-right: 5px; cursor: pointer;");
	 //freeboard.addStyle('.onoffswitch:hover', "box-shadow: 0px 0px 15px #FF9900; cursor: pointer;");
     freeboard.addStyle('.onoffswitch-title',"line-height: 29px; width: 65%; height: 29px; padding-left: 10px; color: #8b8b8b;");
	 freeboard.addStyle('.onoffswitch-switch',"background-color: #222;");	 
	 freeboard.addStyle('.onoffswitch-inner .on',"color: #8b8b8b; background-color: #2a2a2a;");
	 freeboard.addStyle('.onoffswitch-inner .off',"color: #8b8b8b; background-color: #2a2a2a;");
	 freeboard.addStyle('.round' ,"border: solid 2px #3d3d3d; height: 22px; width: 22px; top: -3px");
	 freeboard.addStyle('.onoffswitch-checkbox:checked + .onoffswitch-label .onoffswitch-switch' ,"background-color: #FFC773; border-color: #FDF1DF; box-shadow: 0px 0px 15px #FF9900;");
	 freeboard.addStyle('.onoffswitch-label',"border: none;");
	 freeboard.addStyle('.onoffswitch-inner',"transition: none;");
	 
	 
	 var wswitch = function (settings) {
        var self = this;    
        var thisWidgetId = "onoffswitch-" + SWITCH_ID++;
        var currentSettings = settings;

        var box1 =  $('<div class="floating-box"></div>');
        var box2 =  $('<div class="floating-box onoffswitch-title">' + settings.title + '</div>');
        
        var onOffSwitch = $('<div class="onoffswitch"><label class="onoffswitch-label" for="'+ thisWidgetId +'"><div class="onoffswitch-inner1"><span class="on"></span><span class="off"></span></div><div class="onoffswitch-switch round"></div></label></div>');
        
        
        //onOffSwitch.find("span.on").text("True");
        
        onOffSwitch.prependTo(box1);
        
        var isOn = false;
        var onText;
        var offText;
        
        function updateState() {
            console.log("isOn: " + isOn);
            $('#'+thisWidgetId).prop('checked', isOn);
            console.log(onOffSwitch.find("span.on"));
            onOffSwitch.find("span.on").text(onText);
            onOffSwitch.find("span.off").text(offText);
        }              
		 
        this.render = function (element) {
           
            $(element).append(box1).append(box2);
			//$(element).click(this.onClick.bind(this));
			$('<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="'+ thisWidgetId +'">').prependTo(onOffSwitch);
        }

        this.onClick = function(e) { 			
            e.preventDefault()
			console.log("click");
            //this.sendValue(currentSettings.value, !isOn);
        }		
		
        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            box2.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            console.log( "isUndefined on_text: " + _.isUndefined(newSettings.on_text) );
            onText = newSettings.on_text;
            offText = newSettings.off_text;
            updateState();
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            console.log(settingName, newValue);
            
            if (settingName == "value") {
                isOn = Boolean(newValue);
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
