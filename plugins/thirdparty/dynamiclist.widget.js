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
                    switch (listObject[i].type) {
                        case 'light':
                            picname = "img/extra/light_light_dim_100.svg";
                            break;
                        case 'door':
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
			default:
                            picname = "";
                    }
                    var picElement = $('<div class="pic" style="width: 50px;height: 50px;float:left;margin-top:-5px;margin-right:10px;"><img src="' + picname + '" class="svg-convert" width="100%" height="100%" id="' + listObject[i].type + '"></div>');

                    var Text = $('<div class="indicator-text unselectable"  style="height: 26px; width: fit-content;">' + listObject[i].display_name + '</div>');

                    const date = new Date(listObject[i].time);
                    var timeText = $('<div class="unselectable" style="float: right;margin-top:-5px;font-size: xx-small">' + date.toLocaleTimeString() + '</div>');
                    $(subElement).append(titleElement).append(picElement).append(Text).append(timeText);

                    $(timeText).on('pointerup', $(subElement), self.onPointerUp);

                    if (listObject[i].type === 'light' || listObject[i].type === 'pump' || listObject[i].type === 'socket') {
                        $(picElement).on('pointerdown', $(subElement), self.onPointerDown);
                        $(picElement).on('pointerup', $(subElement), self.onPointerUp);
                        $(picElement).css({
                            "cursor": "pointer"
                        });
                        $(Text).on('pointerdown', $(subElement), self.onPointerDown);
                        $(Text).on('pointerup', $(subElement), self.onPointerUp);
                        $(Text).css({
                            "cursor": "pointer"
                        });
                    }
                    $(myElement).append(subElement);
                }
                convertImages('img.svg-convert', function() {
                    setColor($("svg"), '#f0e68c');
                });
            }
        }

        function setColor(svgdata, color) {
            $(svgdata).find("path,circle").css({
                fill: function() {
                    if ($(this).css("fill").replace(/ /g, "") !== 'none') return color;
                    return $(this).css("fill");
                }
            }).css({
                stroke: color
            });
        }

        const shadeBlendConvert = function(p, from, to) {
            if (typeof(p) != "number" || p < -1 || p > 1 || typeof(from) != "string" || (from[0] != 'r' && from[0] != '#') || (to && typeof(to) != "string")) return null; //ErrorCheck
            if (!this.sbcRip) this.sbcRip = (d) => {
                let l = d.length,
                    RGB = {};
                if (l > 9) {
                    d = d.split(",");
                    if (d.length < 3 || d.length > 4) return null; //ErrorCheck
                    RGB[0] = i(d[0].split("(")[1]), RGB[1] = i(d[1]), RGB[2] = i(d[2]), RGB[3] = d[3] ? parseFloat(d[3]) : -1;
                } else {
                    if (l == 8 || l == 6 || l < 4) return null; //ErrorCheck
                    if (l < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? d[4] + "" + d[4] : ""); //3 or 4 digit
                    d = i(d.slice(1), 16), RGB[0] = d >> 16 & 255, RGB[1] = d >> 8 & 255, RGB[2] = d & 255, RGB[3] = -1;
                    if (l == 9 || l == 5) RGB[3] = r((RGB[2] / 255) * 10000) / 10000, RGB[2] = RGB[1], RGB[1] = RGB[0], RGB[0] = d >> 24 & 255;
                }
                return RGB;
            }
            var i = parseInt,
                r = Math.round,
                h = from.length > 9,
                h = typeof(to) == "string" ? to.length > 9 ? true : to == "c" ? !h : false : h,
                b = p < 0,
                p = b ? p * -1 : p,
                to = to && to != "c" ? to : b ? "#000000" : "#FFFFFF",
                f = this.sbcRip(from),
                t = this.sbcRip(to);
            if (!f || !t) return null; //ErrorCheck
            if (h) return "rgb" + (f[3] > -1 || t[3] > -1 ? "a(" : "(") + r((t[0] - f[0]) * p + f[0]) + "," + r((t[1] - f[1]) * p + f[1]) + "," + r((t[2] - f[2]) * p + f[2]) + (f[3] < 0 && t[3] < 0 ? ")" : "," + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000 : t[3] < 0 ? f[3] : t[3]) + ")");
            else return "#" + (0x100000000 + r((t[0] - f[0]) * p + f[0]) * 0x1000000 + r((t[1] - f[1]) * p + f[1]) * 0x10000 + r((t[2] - f[2]) * p + f[2]) * 0x100 + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 255) : t[3] > -1 ? r(t[3] * 255) : f[3] > -1 ? r(f[3] * 255) : 255)).toString(16).slice(1, f[3] > -1 || t[3] > -1 ? undefined : -2);
        }

        var tid;
        this.onPointerDown = function(e) {
            e.preventDefault();
            e.stopPropagation();
	    var bv=0;

            if (tid) clearInterval(tid);
            tid = setInterval(function() {
                bv = bv - 0.04;
                setColor(e.data, shadeBlendConvert(bv, "#f0e68c"));
		if (bv <= -0.61) {
                    clearInterval(tid);
                    setTimeout( self.onClick,1500,e);
                    tid = undefined;
                }
            }, 50);
        }

        this.onPointerUp = function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (window.getSelection) {window.getSelection().removeAllRanges();}
              else if (document.selection) {document.selection.empty();}

            if (tid) {
                clearInterval(tid);
                tid = undefined;
                setColor(e.data, "#f0e68c");
	    }
        }

        this.onClick = function(e) {
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
