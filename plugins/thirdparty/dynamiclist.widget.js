/* dynamic list widget for Freeboard */
/* developed by Jochen Dolze         */
(function() {
    var dynamicListWidget = function(settings) {
        var self = this;
        var myElement;
        var currentSettings = settings;

        const convertImages = (query, callback) => {
            const images = document.querySelectorAll(query);
            images.forEach(image => {
                fetch(image.src)
                    .then(res => res.text())
                    .then(data => {
                        const parser = new DOMParser();
                        const svg = parser.parseFromString(data, 'image/svg+xml').querySelector('svg');
			if (svg===null) return;

                        if (image.id) svg.id = image.id;
                        if (image.className) svg.classList = image.classList;

                        if (image.width) svg.setAttribute("width", image.width);
                        if (image.height) svg.setAttribute("height", image.height);

                        image.parentNode.replaceChild(svg, image);
                    })
                    .then(callback)
                    .catch(error => console.error(error))
            });
        }

        function updateState(listObject) {

            let maxElements = 1;
            $(myElement).empty();
            $(myElement).height(maxElements * 60);

            if (listObject && _.isArray(listObject)) {

                maxElements = listObject.length;
                $(myElement).height(maxElements * 60);

                for (let i = 0; i < maxElements; i++) {
                    var subElement = $('<div class="sub-section sub-section-height-1" style="height: 54px; padding-top: 5px; padding-right: 10px; padding-left: 10px;" data-dest="' + listObject[i].topic + '"></div>');
                    var titleElement = $('<h2 class="section-title"></h2>');
                    titleElement.html((_.isUndefined(currentSettings.title) ? "" : currentSettings.title));

                    let picname;
                    let value = listObject[i].value;			
                    switch (listObject[i].type) {
                        case 'light':
                            picname = "img/extra/light_light_dim_100.svg";
                            break;
                        case 'door':
                            if (value=='unlocked')
		               picname = "img/extra/fts_door_unlocked.svg";
		            else if (value=='tilted')
			       picname = "img/extra/fts_door_tilt.svg";
		            else
                               picname = "img/extra/fts_door_open.svg";
                            break;
                        case 'pump':
                            picname = "img/extra/sani_pump.svg";
                            break;
                        case 'socket':
                            picname = "img/extra/message_socket.svg";
                            break;
                        case 'lock':
                            picname = "img/extra/fts_door_locked.svg";
                            break;
                        case 'window':
		            if (value=='tilted')
			       picname = "img/extra/fts_window_1w_tilt.svg";
			    else
                               picname = "img/extra/fts_window_1w_open.svg";
                            break;
                        case 'motion':
                            picname = "img/extra/message_presence.svg";
                            break;
			case 'rcd':
			    picname = "img/extra/control_fault_current_circuit_breaker_off.svg";
			    break;
                        case 'bell':
		            picname = "img/extra/message_bell.svg";
			    break;
                        case 'shutter':
		            picname = "img/extra/fts_shutter_40.svg";
                            break;
                        case 'dryer':
                            picname = "img/extra/scene_clothes_dryer.svg";
                            break;
                        case 'washer':
                            picname = "img/extra/scene_washing_machine.svg";
                            break;
                        case 'gate':
                            picname = "img/extra/fts_garage_door_40.svg";
                            break;
                        default:
                            picname = "";
                    }
                    var picElement = $('<div class="pic" style="width: 50px;height: 50px;float:left;margin-top:-5px;margin-right:10px;"><img src="' + picname + '" class="svg-convert" width="100%" height="100%" id="' + listObject[i].type + '"></div>');

                    var Text = $('<div class="indicator-text unselectable"  style="height: 26px; width: fit-content; font-size: large; color: #d3d4d4; font-weight: 100">' + listObject[i].display_name + '</div>');

                    const date = new Date(listObject[i].time);
		    const dayOfYear = date =>  Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
		    let dd=dayOfYear(new Date())-dayOfYear(date);
		    let timestr;
		    if (dd>0) 
		    {
			timestr='('+dd+'d) '+date.toLocaleTimeString();
		    }
		    else
	            {
			timestr=date.toLocaleTimeString();
	            }
                    var timeText = $('<div class="unselectable" style="float: right;margin-top:-5px;font-size: xx-small">' + timestr + '</div>');
                    $(subElement).append(titleElement).append(picElement).append(Text).append(timeText);

                    if (listObject[i].type === 'light' || listObject[i].type === 'pump' || listObject[i].type === 'socket') {
                        $(picElement).on('dblclick', $(subElement), self.onDblClick);
                        $(picElement).on('pointerdown', $(subElement), self.onPointerDown);
                        $(picElement).css({
                            "cursor": "pointer"
                        });
                        $(Text).on('dblclick', $(subElement), self.onDblClick);
                        $(Text).on('pointerdown', $(subElement), self.onPointerDown);
			$(Text).css({
                            "cursor": "pointer"
                        });
                    }
                    $(myElement).append(subElement);
                }
                convertImages('img.svg-convert', function() {
                       setColor($("svg"), '#b5b5b5');
                       setColor($("svg#light.svg-convert"), '#f0e68c');
                       setColor($("svg#pump.svg-convert"), '#f0e68c');
		       setColor($("svg#socket.svg-convert"), '#f0e68c');
		});
            }
        }

        function setColor(svgdata, color) {
            $(svgdata).find("path,circle,line").css({
                fill: function() {
                    if ($(this).css("fill").replace(/ /g, "") !== 'none') return color;
                    return $(this).css("fill");
                }
            }).css({
                stroke: color
            });
        }

        var tid;

        this.onPointerDown = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (tid) return;
	    tid = setTimeout(function() {
		    setColor(e.data, "#f0e68c");
		    tid=undefined;
	    },800);
            setColor(e.data, "#979269");
	}


        this.onDblClick = function(e) {

	    if (tid) clearTimeout(tid);
	    tid=undefined;

            var new_val;
            if (currentSettings.format) {
                new_val = currentSettings.format.replace("%value%", "off");
            } else {
                new_val = "off";
            }

            var matches = currentSettings.value.match(/datasources\[[\"']([^\"']+)[\"']\](\[[\"'].*[\"']\])*/);
            if (matches) {
                var dest = 'datasources["' + matches[1] + '"]["' + $(e.data).attr('data-dest') + '"]';
                self.sendValue(dest, new_val);
            }
        }


        this.render = function(element) {
            myElement = element;
            // remove padding, will be added on subsections
            $(myElement).css("padding-top", "0px");
            $(myElement).css("padding-right", "0px");
            $(myElement).css("padding-bottom", "0px");
            $(myElement).css("padding-left", "0px");
        }

        this.onSettingsChanged = function(newSettings) {
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function(settingName, newValue) {
            //whenver a calculated value changes, stored them in the variable 'stateObject'
            if (settingName == 'value') updateState(newValue);
        }

        this.onDispose = function() {}

        this.getHeight = function() {
            if (_.isUndefined(myElement)) return 1;
            var height = Math.ceil($(myElement).height() / 60);
            return (height > 0 ? height : 1);
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "dynamiclist",
        display_name: "Dynamic List",
        settings: [{
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
        newInstance: function(settings, newInstanceCallback) {
            newInstanceCallback(new dynamicListWidget(settings));
        }
    });
}());
