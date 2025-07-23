// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
	var jsonDatasource = function (settings, updateCallback) {
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;
		var errorStage = 0; 	// 0 = try standard request
		// 1 = try JSONP
		// 2 = try thingproxy.freeboard.io
		var lockErrorStage = false;

		function updateRefresh(refreshTime) {
			if (updateTimer) {
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function () {
				self.updateNow();
			}, refreshTime);
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function () {
			if ((errorStage > 1 && !currentSettings.use_thingproxy) || errorStage > 2) // We've tried everything, let's quit
			{
				return; // TODO: Report an error
			}

			var requestURL = currentSettings.url;

			if (errorStage == 2 && currentSettings.use_thingproxy) {
				requestURL = (location.protocol == "https:" ? "https:" : "http:") + "//thingproxy.freeboard.io/fetch/" + encodeURI(currentSettings.url);
			}

			var body = currentSettings.body;

			// Can the body be converted to JSON?
			if (body) {
				try {
					body = JSON.parse(body);
				}
				catch (e) {
				}
			}

			$.ajax({
				url: requestURL,
				dataType: (errorStage == 1) ? "JSONP" : "JSON",
				type: currentSettings.method || "GET",
				data: body,
				beforeSend: function (xhr) {
					try {
						_.each(currentSettings.headers, function (header) {
							var name = header.name;
							var value = header.value;

							if (!_.isUndefined(name) && !_.isUndefined(value)) {
								xhr.setRequestHeader(name, value);
							}
						});
					}
					catch (e) {
					}
				},
				success: function (data) {
					lockErrorStage = true;
					updateCallback(data);
				},
				error: function (xhr, status, error) {
					if (!lockErrorStage) {
						// TODO: Figure out a way to intercept CORS errors only. The error message for CORS errors seems to be a standard 404.
						errorStage++;
						self.updateNow();
					}
				}
			});
		}

		this.onDispose = function () {
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function (newSettings) {
			lockErrorStage = false;
			errorStage = 0;

			currentSettings = newSettings;
			updateRefresh(currentSettings.refresh * 1000);
			self.updateNow();
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name: "JSON",
		settings: [
			{
				name: "url",
				display_name: "URL",
				type: "text"
			},
			{
				name: "use_thingproxy",
				display_name: "Try thingproxy",
				description: 'A direct JSON connection will be tried first, if that fails, a JSONP connection will be tried. If that fails, you can use thingproxy, which can solve many connection problems to APIs. <a href="https://github.com/Freeboard/thingproxy" target="_blank">More information</a>.',
				type: "boolean",
				default_value: true
			},
			{
				name: "refresh",
				display_name: "Refresh Every",
				type: "number",
				suffix: "seconds",
				default_value: 5
			},
			{
				name: "method",
				display_name: "Method",
				type: "option",
				options: [
					{
						name: "GET",
						value: "GET"
					},
					{
						name: "POST",
						value: "POST"
					},
					{
						name: "PUT",
						value: "PUT"
					},
					{
						name: "DELETE",
						value: "DELETE"
					}
				]
			},
			{
				name: "body",
				display_name: "Body",
				type: "text",
				description: "The body of the request. Normally only used if method is POST"
			},
			{
				name: "headers",
				display_name: "Headers",
				type: "array",
				settings: [
					{
						name: "name",
						display_name: "Name",
						type: "text"
					},
					{
						name: "value",
						display_name: "Value",
						type: "text"
					}
				]
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new jsonDatasource(settings, updateCallback));
		}
	});

	var playbackDatasource = function (settings, updateCallback) {
		var self = this;
		var currentSettings = settings;
		var currentDataset = [];
		var currentIndex = 0;
		var currentTimeout;

		function moveNext() {
			if (currentDataset.length > 0) {
				if (currentIndex < currentDataset.length) {
					updateCallback(currentDataset[currentIndex]);
					currentIndex++;
				}

				if (currentIndex >= currentDataset.length && currentSettings.loop) {
					currentIndex = 0;
				}

				if (currentIndex < currentDataset.length) {
					currentTimeout = setTimeout(moveNext, currentSettings.refresh * 1000);
				}
			}
			else {
				updateCallback({});
			}
		}

		function stopTimeout() {
			currentDataset = [];
			currentIndex = 0;

			if (currentTimeout) {
				clearTimeout(currentTimeout);
				currentTimeout = null;
			}
		}

		this.updateNow = function () {
			stopTimeout();

			$.ajax({
				url: currentSettings.datafile,
				dataType: (currentSettings.is_jsonp) ? "JSONP" : "JSON",
				success: function (data) {
					if (_.isArray(data)) {
						currentDataset = data;
					}
					else {
						currentDataset = [];
					}

					currentIndex = 0;

					moveNext();
				},
				error: function (xhr, status, error) {
				}
			});
		}

		this.onDispose = function () {
			stopTimeout();
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			self.updateNow();
		}
	};

	freeboard.loadDatasourcePlugin({
		"type_name": "playback",
		"display_name": "Playback",
		"settings": [
			{
				"name": "datafile",
				"display_name": "Data File URL",
				"type": "text",
				"description": "A link to a JSON array of data."
			},
			{
				name: "is_jsonp",
				display_name: "Is JSONP",
				type: "boolean"
			},
			{
				"name": "loop",
				"display_name": "Loop",
				"type": "boolean",
				"description": "Rewind and loop when finished"
			},
			{
				"name": "refresh",
				"display_name": "Refresh Every",
				"type": "number",
				"suffix": "seconds",
				"default_value": 5
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new playbackDatasource(settings, updateCallback));
		}
	});

	var clockDatasource = function (settings, updateCallback) {
		var self = this;
		var currentSettings = settings;
		var timer;

		function stopTimer() {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		}

		function updateTimer() {
			stopTimer();
			timer = setInterval(self.updateNow, currentSettings.refresh * 1000);
		}

		this.updateNow = function () {
			var date = new Date();

			var data = {
				numeric_value: date.getTime(),
				full_string_value: date.toLocaleString(),
				date_string_value: date.toLocaleDateString(),
				time_string_value: date.toLocaleTimeString(),
				date_object: date
			};

			updateCallback(data);
		}

		this.onDispose = function () {
			stopTimer();
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			updateTimer();
		}

		updateTimer();
	};

	freeboard.loadDatasourcePlugin({
		"type_name": "clock",
		"display_name": "Clock",
		"settings": [
			{
				"name": "refresh",
				"display_name": "Refresh Every",
				"type": "number",
				"suffix": "seconds",
				"default_value": 1
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new clockDatasource(settings, updateCallback));
		}
	});
}());

/// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
	var SPARKLINE_HISTORY_LENGTH = 100;
	var SPARKLINE_COLORS = ["#FF9900", "#FFFFFF", "#B3B4B4", "#6B6B6B", "#28DE28", "#13F7F9", "#E6EE18", "#C41204", "#CA3CB8", "#0B1CFB"];

    function easeTransitionText(newValue, textElement, duration) {

		var currentValue = $(textElement).text();

        if (currentValue === newValue)
            return;

        if ($.isNumeric(newValue) && $.isNumeric(currentValue)) {
            var numParts = newValue.toString().split('.');
            var endingPrecision = 0;

            if (numParts.length > 1) {
                endingPrecision = numParts[1].length;
            }

            numParts = currentValue.toString().split('.');
            var startingPrecision = 0;

            if (numParts.length > 1) {
                startingPrecision = numParts[1].length;
            }

            jQuery({transitionValue: Number(currentValue), precisionValue: startingPrecision}).animate({transitionValue: Number(newValue), precisionValue: endingPrecision}, {
                duration: duration,
                step: function () {
                    $(textElement).text(this.transitionValue.toFixed(this.precisionValue));
                },
                done: function () {
                    $(textElement).text(newValue);
                }
            });
        }
        else {
            $(textElement).text(newValue);
        }
    }

	function addSparklineLegend(element, legend) {
		var legendElt = $("<div class='sparkline-legend'></div>");
		for(var i=0; i<legend.length; i++) {
			var color = SPARKLINE_COLORS[i % SPARKLINE_COLORS.length];
			var label = legend[i];
			legendElt.append("<div class='sparkline-legend-value'><span style='color:" +
							 color + "'>&#9679;</span>" + label + "</div>");
		}
		element.empty().append(legendElt);

		freeboard.addStyle('.sparkline-legend', "margin:5px;");
		freeboard.addStyle('.sparkline-legend-value',
			'color:white; font:10px arial,san serif; float:left; overflow:hidden; width:50%;');
		freeboard.addStyle('.sparkline-legend-value span',
			'font-weight:bold; padding-right:5px;');
	}

	function addValueToSparkline(element, value, legend) {
		var values = $(element).data().values;
		var valueMin = $(element).data().valueMin;
		var valueMax = $(element).data().valueMax;
		if (!values) {
			values = [];
			valueMin = undefined;
			valueMax = undefined;
		}

		var collateValues = function(val, plotIndex) {
			if(!values[plotIndex]) {
				values[plotIndex] = [];
			}
			if (values[plotIndex].length >= SPARKLINE_HISTORY_LENGTH) {
				values[plotIndex].shift();
			}
			values[plotIndex].push(Number(val));

			if(valueMin === undefined || val < valueMin) {
				valueMin = val;
			}
			if(valueMax === undefined || val > valueMax) {
				valueMax = val;
			}
		}

		if(_.isArray(value)) {
			_.each(value, collateValues);
		} else {
			collateValues(value, 0);
		}
		$(element).data().values = values;
		$(element).data().valueMin = valueMin;
		$(element).data().valueMax = valueMax;

		var tooltipHTML = '<span style="color: {{color}}">&#9679;</span> {{y}}';

		var composite = false;
		_.each(values, function(valueArray, valueIndex) {
			$(element).sparkline(valueArray, {
				type: "line",
				composite: composite,
				height: "100%",
				width: "100%",
				fillColor: false,
				lineColor: SPARKLINE_COLORS[valueIndex % SPARKLINE_COLORS.length],
				lineWidth: 2,
				spotRadius: 3,
				spotColor: false,
				minSpotColor: "#78AB49",
				maxSpotColor: "#78AB49",
				highlightSpotColor: "#9D3926",
				highlightLineColor: "#9D3926",
				chartRangeMin: valueMin,
				chartRangeMax: valueMax,
				tooltipFormat: (legend && legend[valueIndex])?tooltipHTML + ' (' + legend[valueIndex] + ')':tooltipHTML
			});
			composite = true;
		});
	}

	var valueStyle = freeboard.getStyleString("values");

	freeboard.addStyle('.widget-big-text', valueStyle + "font-size:75px;");
	freeboard.addStyle('.widget-middle-text', valueStyle + "font-size:45px;");

	freeboard.addStyle('.tw-display', 'width: 100%; height:100%; display:table; table-layout:fixed;');

	freeboard.addStyle('.tw-tr',
		'display:table-row;');

	freeboard.addStyle('.tw-tg',
		'display:table-row-group;');

	freeboard.addStyle('.tw-tc',
		'display:table-caption;');

	freeboard.addStyle('.tw-td',
		'display:table-cell;');

	freeboard.addStyle('.tw-value',
		valueStyle +
		'overflow: hidden;' +
		'display: inline-block;' +
		'text-overflow: ellipsis;');

	freeboard.addStyle('.tw-unit',
		'display: inline-block;' +
		'padding-left: 10px;' +
		'vertical-align: top;');

	freeboard.addStyle('.tw-value-wrapper',
		'position: relative;' +
		'height:100%;');

        freeboard.addStyle('.tw-time',
		'position: absolute;'+
                'bottom: 0; right: 0;'+
                'margin-bottom: 1px;'+
                'font-size: xx-small');

	freeboard.addStyle('.tw-sparkline',
		'height:20px;');

    var textWidget = function (settings) {

        var self = this;
	var value = null;
	var intervalID = null;
        var currentSettings = settings;
	var displayElement = $('<div class="tw-display"></div>');
	var titleElement = $('<h2 class="section-title tw-title tw-td"></h2>');
        var valueElement = $('<div class="tw-value"></div>');
        var unitsElement = $('<div class="tw-unit"></div>');
	var value2Element = $('<div class="tw-value"></div>');
	var unit2Element = $('<div class="tw-unit"></div>');
	var timeElement = $('<div class="tw-time"></div>');
	var valueWrapper = $('<div class="tw-value-wrapper tw-td"></div>');
	var sparklineElement = $('<div class="tw-sparkline tw-td"></div>');
	if (_.isUndefined(currentSettings.updaterate)) currentSettings.updaterate="onchange";

	this.updateSparkline = function() {
	   //if (!Array.isArray(value)) return;
	   //if (value.some(isNaN)) return;
	   addValueToSparkline(sparklineElement, value);
	}

	this.updateInterval = function(rate) {
		if (intervalID) {
			clearInterval(intervalID);
			intervalID=null;
		}
		if (currentSettings.updaterate=="1s") intervalID=setInterval(self.updateSparkline, 1000);
		if (currentSettings.updaterate=="10s") intervalID=setInterval(self.updateSparkline, 10000);
		if (currentSettings.updaterate=="30s") intervalID=setInterval(self.updateSparkline, 30000);
		if (currentSettings.updaterate=="1m") intervalID=setInterval(self.updateSparkline, 60000);
	}


		function updateValueSizing()
		{
			if(!_.isUndefined(currentSettings.units) && currentSettings.units != "") // If we're displaying our units
			{
				valueElement.css("max-width", (displayElement.innerWidth() - unitsElement.outerWidth(true)) + "px");
			}
			else
			{
				valueElement.css("max-width", "100%");
			}
		}

        this.render = function (element) {
			$(element).empty();

			$(displayElement)
				.append($('<div class="tw-tr"></div>').append(titleElement))
				.append($('<div class="tw-tr"></div>').append($(valueWrapper).append(valueElement).append(unitsElement).append(value2Element).append(unit2Element).append(timeElement)))
				.append($('<div class="tw-tr"></div>').append(sparklineElement));

			$(element).append(displayElement);
			updateValueSizing();
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;

			var shouldDisplayTitle = (!_.isUndefined(newSettings.title) && newSettings.title != "");
			var shouldDisplayUnits = (!_.isUndefined(newSettings.units) && newSettings.units != "");
		        var shouldDisplaySecondUnit = (!_.isUndefined(newSettings.secondunit) && !_.isUndefined(newSettings.showsecondunit) && newSettings.showsecondunit == true && newSettings.secondunit != "");
                        var shouldDisplayTime =  (!_.isUndefined(newSettings.time) && newSettings.time != "");
			var shouldDisplaySecondValue = (!_.isUndefined(newSettings.showsecondunit) && newSettings.showsecondunit == true);

			if(newSettings.sparkline)
			{
				sparklineElement.attr("style", null);
				self.updateInterval(newSettings.updaterate);
			}
			else
			{
				delete sparklineElement.data().values;
				sparklineElement.empty();
				sparklineElement.hide();
				self.updateInterval("onchange");
			}

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

			if(shouldDisplayUnits)
			{
				unitsElement.html((_.isUndefined(newSettings.units) ? "" : newSettings.units));
				unitsElement.attr("style", null);
			}
			else
			{
				unitsElement.empty();
				unitsElement.hide();
			}

			if (shouldDisplaySecondUnit)
			{
				unit2Element.html((_.isUndefined(newSettings.secondunit) ? "" : newSettings.secondunit));
				unit2Element.attr("style", null);
			}
			else
			{
				unit2Element.empty();
				unit2Element.hide();
			}

			if (shouldDisplaySecondValue)
			{
				value2Element.show();
			}
			else
			{
				value2Element.empty();
				value2Element.hide();
			}

                        if (shouldDisplayTime)
                        {
                                timeElement.html("");
				timeElement.attr("style", null);
			}
                        else
                        {
                                timeElement.empty();
                                timeElement.hide();
                        }

			var valueFontSize = 30;
		        var unitPadding = "0.3em";

			if(newSettings.size == "big") {
				valueFontSize = 60;
				unitPadding = "1.2em";
			}
			if(newSettings.size == "small") {
				valueFontSize = 18;
				unitPadding = "0.05em";
			}

			valueElement.css({"font-size" : valueFontSize + "px", "white-space" : "pre"});
		        value2Element.css({"font-size" : valueFontSize + "px", "white-space" : "pre", "padding-left" : "15px"});
			if (shouldDisplayUnits) unitsElement.css({ "padding-top" : unitPadding });
		        if (shouldDisplaySecondUnit) unit2Element.css({ "padding-top" : unitPadding });

			updateValueSizing();
        }

		this.onSizeChanged = function()
		{
			updateValueSizing();
		}

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {
		var newValue2;
		if (isFinite(newValue))
		{
		    // number
		    if (currentSettings.showsecondunit)
		    {
			newValue2=new Function('return '+ currentSettings.secondunitconv.replace("%value%", newValue))();
		    }
		    if (currentSettings.decimalplaces!==undefined && currentSettings.decimalplaces!=="")
		    {
			newValue=parseFloat(newValue).toFixed(currentSettings.decimalplaces);
			if (newValue2) newValue2=parseFloat(newValue2).toFixed(currentSettings.decimalplaces);
		    }
		}
		else
		{
		    // if its not text -> ignore
		    if (!(typeof newValue === 'string' || newValue instanceof String)) return;
		}

                if (currentSettings.animate)
		{
                    easeTransitionText(newValue, valueElement, 500);
		    if (newValue2) easeTransitionText(newValue2, value2Element, 500);
                }
                else
		{
	    	    valueElement.text(newValue);
		    if (newValue2) value2Element.text(newValue2);
                }

                if (currentSettings.sparkline)
		{
		    value = newValue;
		    if (currentSettings.updaterate=="onchange") self.updateSparkline();
                }
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
	    if (settingName == "enable") {
                var widget = displayElement[0].parentElement;
	        if (newValue===false || newValue==="false" || newValue===0 || newValue==="0") {
                        widget.style.pointerEvents="none";
                        widget.classList.add("disconnected");
			widget.classList.remove("inactive");
                }
                else {
                        widget.classList.remove("disconnected");
			if (currentSettings.active===false || currentSettings.active==="false" ||
				currentSettings.active===0 || currentSettings.active==="0") {
				widget.classList.add("inactive");
			} else {
				widget.style.pointerEvents="inherit";
			}
                }
	    }
	    if (settingName == "active") {
		var widget = displayElement[0].parentElement;
		if (newValue===false || newValue==="false" || newValue===0 || newValue==="0") {
			widget.style.pointerEvents="none";
			widget.classList.add("inactive");
		}
		else
		{
			widget.style.pointerEvents="inherit";
			widget.classList.remove("inactive");
		}
	    }
	}

        this.onDispose = function () {

        }

        this.getHeight = function () {
	    var lines=valueElement.text().replace(/\r\n$|\r$|\n$/,"").split(/\r\n|\r|\n/).length;
	    var fontSize = 30;
	    if (currentSettings.size == "big") fontSize=60;
	    if (currentSettings.size == "small") fontSize=18;
	    var calcHeight = 8+Math.ceil(lines * fontSize * 1.14); // 1.14 = normal line-height, 8 = margin top/bottom

	    if (lines>1) {
	       var hasTitle = (!_.isUndefined(currentSettings.title) && currentSettings.title != "");
	       if (hasTitle) calcHeight += 17;
	       var hasTime = (!_.isUndefined(currentSettings.time) && currentSettings.time != "");
	       if (hasTime) calcHeight += 11;
	    }

	    calcHeight = Math.ceil(calcHeight/60)-1;

	    if (lines==1) {
		    valueWrapper.css({ "vertical-align" : "middle" });
	    } else {
		    valueWrapper.css({ "vertical-align" : "top" });
	    }

            if (currentSettings.sparkline) {
                return 2+calcHeight;
            }
            else {
                return 1+calcHeight;
            }
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "text_widget",
        display_name: "Text",
        "external_scripts" : [
            "plugins/thirdparty/jquery.sparkline.min.js"
        ],
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
                    },
		    {
			name: "Small",
			value: "small"
	            }
                ]
            },
            {
                name: "enable",
		display_name: "Enable",
		type: "calculated",
		default_value: true,
		description: "Shows disconnect icon if set to 'false' or '0'"
	    },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
	        name: "decimalplaces",
		display_name: "Decimal Places",
		type: "number",
		description: "if value is numeric, format it with this parameter"
	    },
	    {
		name: "active",
		display_name: "Active",
		type: "calculated",
		default_value: true,
		description: "Shows inactive alert icon when set to 'false' or '0'"
	    },
	    {
                name: "sparkline",
                display_name: "Include Sparkline",
                type: "boolean"
            },
	    {
		name: "updaterate",
		display_name: "Update rate of Sparkline",
		default_value: "onchange",
		type: "option",
		options: [
		    {
		        name: "upon change",
			value: "onchange"
		    },
		    {
			name: "every second",
			value: "1s"
		    },
		    {
			name: "every 10 seconds",
			value: "10s"
		    },
		    {
			name: "every 30 seconds",
			valie: "30s"
		    },
		    {
			name: "every minute",
			value: "1m"
		    }
		]
	    },
            {
                name: "animate",
                display_name: "Animate Value Changes",
                type: "boolean",
                default_value: false
            },
            {
                name: "time",
                display_name: "Timestamp",
                type: "calculated",
                description: "if defined, show timestamp on bottom right corner"
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            },
	    {
		name: "showsecondunit",
		display_name: "Show Value With Second Unit",
		type: "boolean",
		default_value: false
	    },
	    {
		name: "secondunitconv",
		display_name: "Conversion For Second Unit",
		type: "text",
		default_value: "%value%",
		description: "calculation for second unit, e.g. %value%*3.6"
	    },
	    {
		name: "secondunit",
		display_name: "Second Unit",
		type: "text"
	    }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new textWidget(settings));
        }
    });

    var gaugeID = 0;
	freeboard.addStyle('.gauge-widget-wrapper', "width: 100%;text-align: center;");
	freeboard.addStyle('.gauge-widget', "width:200px;height:160px;display:inline-block;");

    var gaugeWidget = function (settings) {
        var self = this;

        var thisGaugeID = "gauge-" + gaugeID++;
        var titleElement = $('<h2 class="section-title"></h2>');
        var gaugeElement = $('<div class="gauge-widget" id="' + thisGaugeID + '"></div>');

        var gaugeObject;
        var rendered = false;

        var currentSettings = settings;

        function createGauge() {
            if (!rendered) {
                return;
            }

            gaugeElement.empty();

            gaugeObject = new JustGage({
                id: thisGaugeID,
                value: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                min: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                max: (_.isUndefined(currentSettings.max_value) ? 0 : currentSettings.max_value),
                label: currentSettings.units,
                showInnerShadow: false,
                valueFontColor: "#d3d4d4",
		valueMinFontSize: 25,
		decimals: (_.isUndefined(currentSettings.decimalplaces) ? 0 : currentSettings.decimalplaces)
            });
        }

        this.render = function (element) {
            rendered = true;
            $(element).append(titleElement).append($('<div class="gauge-widget-wrapper"></div>').append(gaugeElement));
            createGauge();
        }

        this.onSettingsChanged = function (newSettings) {
            if (newSettings.min_value != currentSettings.min_value || newSettings.max_value != currentSettings.max_value || newSettings.units != currentSettings.units || newSettings.decimalplaces != currentSettings.decimalplaces) {
                currentSettings = newSettings;
                createGauge();
            }
            else {
                currentSettings = newSettings;
            }

            titleElement.html(newSettings.title);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (!_.isUndefined(gaugeObject)) {
		gaugeObject.refresh(Number(newValue));
            }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 3;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "gauge",
        display_name: "Gauge",
        "external_scripts" : [
            "plugins/thirdparty/raphael.2.1.0.min.js",
            "plugins/thirdparty/justgage.1.7.0.js"
        ],
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
	        name: "decimalplaces",
		display_name: "Decimal Places",
		type: "number",
		description: "if value is numeric, format it with this parameter",
	    },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            },
            {
                name: "min_value",
                display_name: "Minimum",
                type: "text",
                default_value: 0
            },
            {
                name: "max_value",
                display_name: "Maximum",
                type: "text",
                default_value: 100
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new gaugeWidget(settings));
        }
    });


	freeboard.addStyle('.sparkline', "width:100%;height: 75px;");
    var sparklineWidget = function (settings) {
        var self = this;
	var value = null;
	var intervalID = null;
        var titleElement = $('<h2 class="section-title"></h2>');
        var sparklineElement = $('<div class="sparkline"></div>');
	var sparklineLegend = $('<div></div>');
	var currentSettings = settings;
	if (_.isUndefined(currentSettings.updaterate)) currentSettings.updaterate="onchange";

	this.updateSparkline = function() {
	   if (!Array.isArray(value)) return;
	   if (value.some(isNaN)) return;
	   if (currentSettings.legend) {
	       addValueToSparkline(sparklineElement, value, currentSettings.legend.split(","));
	   } else {
	       addValueToSparkline(sparklineElement, value);
	   }
	}

	this.updateInterval = function(rate) {
		if (intervalID) {
			clearInterval(intervalID);
			intervalID=null;
		}
		if (currentSettings.updaterate=="1s") intervalID=setInterval(self.updateSparkline, 1000);
		if (currentSettings.updaterate=="10s") intervalID=setInterval(self.updateSparkline, 10000);
		if (currentSettings.updaterate=="30s") intervalID=setInterval(self.updateSparkline, 30000);
		if (currentSettings.updaterate=="1m") intervalID=setInterval(self.updateSparkline, 60000);
	}
 
        this.render = function (element) {
            $(element).append(titleElement).append(sparklineElement).append(sparklineLegend);
        }

        this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));

			if(newSettings.include_legend) {
				addSparklineLegend(sparklineLegend,  newSettings.legend.split(","));
			}
			self.updateInterval(newSettings.updaterate);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
		value=newValue;
		if (currentSettings.updaterate=="onchange") self.updateSparkline();
        }

        this.onDispose = function () {
		if (intervalID) clearInterval(intervalID);
		intervalID=null;
        }

        this.getHeight = function () {
			var legendHeight = 0;
			if (currentSettings.include_legend && currentSettings.legend) {
				var legendLength = currentSettings.legend.split(",").length;
				if (legendLength > 4) {
					legendHeight = Math.floor((legendLength-1) / 4) * 0.5;
				} else if (legendLength) {
					legendHeight = 0.5;
				}
			}
			return 2 + legendHeight;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "sparkline",
        display_name: "Sparkline",
        "external_scripts" : [
            "plugins/thirdparty/jquery.sparkline.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
	    {
		name: "updaterate",
		display_name: "Update",
		default_value: "onchange",
		type: "option",
		options: [
		    {
		        name: "upon change",
			value: "onchange"
		    },
		    {
			name: "every second",
			value: "1s"
		    },
		    {
			name: "every 10 seconds",
			value: "10s"
		    },
		    {
			name: "every 30 seconds",
			valie: "30s"
		    },
		    {
			name: "every minute",
			value: "1m"
		    }
		]
	    },
            {
                name: "value",
                display_name: "Value",
                type: "calculated",
				multi_input: "true"
            },
			{
				name: "include_legend",
				display_name: "Include Legend",
				type: "boolean"
			},
			{
				name: "legend",
				display_name: "Legend",
				type: "text",
				description: "Comma-separated for multiple sparklines"
			}
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new sparklineWidget(settings));
        }
    });

	freeboard.addStyle('div.pointer-value', "position:absolute;height:50px;margin: auto;top: 0px;bottom: 0px;width: 94%;text-align:center;");
    var pointerWidget = function (settings) {
        var self = this;
		var currentsettings = settings;
        var paper;
        var strokeWidth = 3;
        var pointer;
        var width, height;
        var currentValue = 0;
        var valueDiv = $('<div class="widget-middle-text" style="font-size: 42px; margin-right: 3px;"></div>');
        var unitsDiv = $('<div></div>');

        function polygonPath(points) {
            if (!points || points.length < 2)
                return [];
            var path = []; //will use path object type
            path.push(['m', points[0], points[1]]);
            for (var i = 2; i < points.length; i += 2) {
                path.push(['l', points[i], points[i + 1]]);
            }
            path.push(['z']);
            return path;
        }

		function fillPaper(paper) {
			if (paper===undefined) return;

			paper.clear();

			var radius;
			if (currentsettings.labels) {
				radius =Math.min(width, height) / 2;
				var marginx = width/4;
				var marginy = height/4;

				var rect = paper.rect(marginx,marginy,width-(2*marginx),height-(2*marginy),0);
				rect.attr("stroke", "#FF9900");
				rect.attr("stroke-width", strokeWidth);
				pointer = paper.circle(width / 5, height / 5,10);

				if (currentsettings.labels[0]) {
					var txtTop=paper.text(0,0,currentsettings.labels[0].text).attr({'text-anchor': 'start'});
					var rtxtTop=txtTop.node.getBBox();
					txtTop.attr("x",marginx+(rect.attr("width")/2)-(rtxtTop.width/2));
					txtTop.attr("y",marginy-rtxtTop.height);
					txtTop.attr("fill", "#FF9900");
				}

				if (currentsettings.labels[1]) {
					var txtBottom=paper.text(0,0,currentsettings.labels[1].text).attr({'text-anchor': 'start'});
					var rtxtBottom=txtBottom.node.getBBox();
					txtBottom.attr("x",marginx+(rect.attr("width")/2)-(rtxtBottom.width/2));
					txtBottom.attr("y",marginy+rect.attr("height")+rtxtBottom.height);
					txtBottom.attr("fill", "#FF9900");
				}

				if (currentsettings.labels[2]) {
					var txtLeft=paper.text(0,0,currentsettings.labels[2].text).attr({'text-anchor': 'start'});
					var rtxtLeft=txtLeft.node.getBBox();
					txtLeft.attr("x",rect.attr("x")-rtxtLeft.height);
					txtLeft.attr("y",marginy+rect.attr("height")- (rect.attr("height")/2 -rtxtLeft.width/2))
					txtLeft.transform('r-90,'+txtLeft.attr("x")+','+txtLeft.attr("y"));
					txtLeft.attr("fill", "#FF9900");
				}

				if (currentsettings.labels[3]) {
					var txtRight=paper.text(0,0,currentsettings.labels[3].text).attr({'text-anchor': 'start'});
					var	rtxtRight=txtRight.node.getBBox();
					txtRight.attr("x",rect.attr("x")+rect.attr("width")+rtxtRight.height);
					txtRight.attr("y",marginy+rect.attr("height")- (rect.attr("height")/2 -rtxtRight.width/2))
					txtRight.transform('r-90,'+txtRight.attr("x")+','+txtRight.attr("y"));
					txtRight.attr("fill", "#FF9900");
				}
				pointer.attr("stroke-width",0);
			} else {
				radius = Math.min(width, height) / 2 - strokeWidth * 2;
				var circle = paper.circle(width / 2, height / 2, radius);
				circle.attr("stroke", "#FF9900");
				circle.attr("stroke-width", strokeWidth);
				pointer = paper.path(polygonPath([width / 2, (height / 2) - radius + strokeWidth, 15, 20, -30, 0]));
			}
        	        pointer.attr("fill", "#fff");
			unitsDiv.html(currentsettings.units);
			currentValue="";
		}

        this.render = function (element) {
            width = $(element).width();
			height = (this.getHeight()*60)-5;

			paper = Raphael($(element).get()[0], width, height);
			fillPaper(paper);

            $(element).append($('<div class="pointer-value"></div>').append(valueDiv).append(unitsDiv));
        }

        this.onSettingsChanged = function (newSettings) {
		currentsettings = newSettings
		fillPaper(paper);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
	    if (settingName == "direction") {
                if (!_.isUndefined(pointer) && isFinite(newValue)) {
		    newValue=Math.trunc(newValue);
		    if (currentsettings.labels) newValue+=50;
		    if (newValue!==currentValue)
			   pointer.animate({transform: "r" + newValue + "," + (width / 2) + "," + (height / 2)}, 250, "bounce", function() 
			   {
			       if (this._.deg===newValue) currentValue = newValue;
			   });
		}
            }
            else if (settingName == "value_text") {
		if (isFinite(newValue)) {
		    let f=parseFloat(newValue);
		    if (!_.isUndefined(currentsettings.decimalplaces) && currentsettings.decimalplaces!="")
		    {
			valueDiv.html(f.toFixed(currentsettings.decimalplaces));
		    }
		    else
		    {
		 	valueDiv.html(newValue);
		    }
		} else {
		   valueDiv.html(newValue);
		}
            }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 4;
        }

        //this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "pointer",
        display_name: "Pointer",
        "external_scripts" : [
            "plugins/thirdparty/raphael.2.1.0.min.js"
        ],
        settings: [
            {
                name: "direction",
                display_name: "Direction",
                type: "calculated",
                description: "In degrees"
            },
            {
                name: "value_text",
                display_name: "Value Text",
                type: "calculated"
            },
	    {
		name: "decimalplaces",
		display_name: "Decimal Places",
		type: "number",
		description: "if value is numeric, format it with this parameter"
	    },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            },
			{
				name: "labels",
				display_name: "If defined, pointer will change to a circle around a rectangle.\n\nEnter labels for rectangle (top, bottom, left, right)",
				type: "array",
				settings: [
					{
						name: "text",
						display_name: "Labels",
						type: "text"
					}
				]
			}

        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new pointerWidget(settings));
        }
    });

    var pictureWidget = function(settings)
    {
        var self = this;
        var widgetElement;
        var timer;
        var imageURL;

        function stopTimer()
        {
            if(timer)
            {
                clearInterval(timer);
                timer = null;
            }
        }

        function updateImage()
        {
            if(widgetElement && imageURL)
            {
             	var cacheBreakerURL = imageURL + (imageURL.indexOf("?") == -1 ? "?" : "&") + Date.now(), img = new Image();
		img.onload = function() {
			$(widgetElement).css({
				"background-image" :  "url(" + cacheBreakerURL + ")"
			});
		}
		img.src = cacheBreakerURL;
            }
        }

        this.render = function(element)
        {
            $(element).css({
                width : "100%",
                height: "100%",
                "background-size" : "contain",
                "background-position" : "center",
		"background-repeat" : "no-repeat"
            });

            widgetElement = element;
        }

        this.onSettingsChanged = function(newSettings)
        {
            stopTimer();

            if(newSettings.refresh && newSettings.refresh > 0)
            {
                timer = setInterval(updateImage, Number(newSettings.refresh) * 1000);
            }
        }

        this.onCalculatedValueChanged = function(settingName, newValue)
        {
            if(settingName == "src")
            {
                imageURL = newValue;
            }

            updateImage();
        }

        this.onDispose = function()
        {
            stopTimer();
        }

        this.getHeight = function()
        {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "picture",
        display_name: "Picture",
        fill_size: true,
        settings: [
            {
                name: "src",
                display_name: "Image URL",
                type: "calculated"
            },
            {
                "type": "number",
                "display_name": "Refresh every",
                "name": "refresh",
                "suffix": "seconds",
                "description":"Leave blank if the image doesn't need to be refreshed"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new pictureWidget(settings));
        }
    });

	freeboard.addStyle('.indicator-light', "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
	freeboard.addStyle('.indicator-light.on', "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;");
	freeboard.addStyle('.indicator-text', "margin-top:8px;font-size:large;color:#d3d4d4");
    var indicatorWidget = function (settings) {
        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div class="indicator-text"></div>');
        var indicatorElement = $('<div class="indicator-light"></div>');
        var timeElement = $('<div class="tw-time" style="margin-right: 10px"></div>');
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

        this.render = function (element) {
            $(element).append(titleElement).append(indicatorElement).append(stateElement).append(timeElement);
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            updateState();
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {
                if (isNaN(newValue)) {
			isOn = Boolean(newValue);
		} else {
			isOn = Boolean(Number(newValue));
		}
            }
            if (settingName == "on_text") {
                onText = newValue;
            }
            if (settingName == "off_text") {
                offText = newValue;
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

    freeboard.loadWidgetPlugin({
        type_name: "indicator",
        display_name: "Indicator Light",
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
	            name: "on_text",
	            display_name: "On Text",
	            type: "calculated"
	        },
	        {
	            name: "off_text",
	            display_name: "Off Text",
	            type: "calculated"
	        }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new indicatorWidget(settings));
        }
    });

    freeboard.addStyle('.gm-style-cc a', "text-shadow:none;");

    var googleMapWidget = function (settings) {
        var self = this;
        var currentSettings = settings;
        var map;
        var marker;
        var currentPosition = {};

        function updatePosition() {
            if (map && marker && currentPosition.lat && currentPosition.lon) {
                var newLatLon = new google.maps.LatLng(currentPosition.lat, currentPosition.lon);
                marker.setPosition(newLatLon);
                map.panTo(newLatLon);
            }
        }

        this.render = function (element) {
            function initializeMap() {
                var mapOptions = {
                    zoom: 13,
                    center: new google.maps.LatLng(37.235, -115.811111),
                    disableDefaultUI: true,
                    draggable: false,
                    styles: [
                        {"featureType": "water", "elementType": "geometry", "stylers": [
                            {"color": "#2a2a2a"}
                        ]},
                        {"featureType": "landscape", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 20}
                        ]},
                        {"featureType": "road.highway", "elementType": "geometry.fill", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 17}
                        ]},
                        {"featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 29},
                            {"weight": 0.2}
                        ]},
                        {"featureType": "road.arterial", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 18}
                        ]},
                        {"featureType": "road.local", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 16}
                        ]},
                        {"featureType": "poi", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 21}
                        ]},
                        {"elementType": "labels.text.stroke", "stylers": [
                            {"visibility": "on"},
                            {"color": "#000000"},
                            {"lightness": 16}
                        ]},
                        {"elementType": "labels.text.fill", "stylers": [
                            {"saturation": 36},
                            {"color": "#000000"},
                            {"lightness": 40}
                        ]},
                        {"elementType": "labels.icon", "stylers": [
                            {"visibility": "off"}
                        ]},
                        {"featureType": "transit", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 19}
                        ]},
                        {"featureType": "administrative", "elementType": "geometry.fill", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 20}
                        ]},
                        {"featureType": "administrative", "elementType": "geometry.stroke", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 17},
                            {"weight": 1.2}
                        ]}
                    ]
                };

                map = new google.maps.Map(element, mapOptions);

                google.maps.event.addDomListener(element, 'mouseenter', function (e) {
                    e.cancelBubble = true;
                    if (!map.hover) {
                        map.hover = true;
                        map.setOptions({zoomControl: true});
                    }
                });

                google.maps.event.addDomListener(element, 'mouseleave', function (e) {
                    if (map.hover) {
                        map.setOptions({zoomControl: false});
                        map.hover = false;
                    }
                });

                marker = new google.maps.Marker({map: map});

                updatePosition();
            }

            if (window.google && window.google.maps) {
                initializeMap();
            }
            else {
                window.gmap_initialize = initializeMap;
                head.js("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmap_initialize");
            }
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "lat") {
                currentPosition.lat = newValue;
            }
            else if (settingName == "lon") {
                currentPosition.lon = newValue;
            }

            updatePosition();
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "google_map",
        display_name: "Google Map",
        fill_size: true,
        settings: [
            {
                name: "lat",
                display_name: "Latitude",
                type: "calculated"
            },
            {
                name: "lon",
                display_name: "Longitude",
                type: "calculated"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new googleMapWidget(settings));
        }
    });

    freeboard.addStyle('.html-widget', "white-space:normal;width:100%;height:100%");

    var htmlWidget = function (settings) {
        var self = this;
        var htmlElement = $('<div class="html-widget"></div>');
        var currentSettings = settings;

        this.render = function (element) {
            $(element).append(htmlElement);
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "html") {
                htmlElement.html(newValue);
            }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return Number(currentSettings.height);
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        "type_name": "html",
        "display_name": "HTML",
        "fill_size": true,
        "settings": [
            {
                "name": "html",
                "display_name": "HTML",
                "type": "calculated",
                "description": "Can be literal HTML, or javascript that outputs HTML."
            },
            {
                "name": "height",
                "display_name": "Height Blocks",
                "type": "number",
                "default_value": 4,
                "description": "A height block is around 60 pixels"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new htmlWidget(settings));
        }
    });

}());
