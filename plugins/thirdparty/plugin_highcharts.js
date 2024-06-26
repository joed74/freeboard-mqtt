// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ freeboard-dynamic-highcharts-plugin                                │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ https://blog.onlinux.fr/?tag=freeboard                             │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Freeboard widget plugin for Highcharts.                            │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
(function() {

	//
	// DECLARATIONS
	//
	var HIGHCHARTS_ID = 0;
	var ONE_SECOND_IN_MILIS = 1000;
	var MAX_NUM_SERIES = 3;

	//
	// HELPERS
	//

	// Get coordinates of point
	function xy(obj, x, y) {
		return [obj[x], obj[y]]
	}

	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	//
	// TIME SERIES CHARTS
	//
	var highchartsLineWidgetSettings = [{
		"name": "timeframe",
		"display_name": "Timeframe (s)",
		"type": "text",
		"description": "Specify the last number of seconds you want to see.",
		"default_value": 60
	}, {
		"name": "blocks",
		"display_name": "Height (No. Blocks)",
		"type": "text",
		"default_value": 4
	}, {
		"name": "chartType",
		"display_name": "Chart Type",
		"type": "option",
		"options": [{
			"name": "Area",
			"value": "area"
		}, {
			"name": "Spline",
			"value": "spline"
		}]
	}, {
		"name": "title",
		"display_name": "Title",
		"type": "text"
	},
		{
		"name": "showcontextmenu",
		"display_name": "Show menu",
		"type": "boolean",
		"default_value": false
		},
		{
		"name": "updateinterval",
		"display_name": "Use update interval",
		"type": "boolean",
		"default_value": false,
		"description": "If yes, chart acts like a plotter and updates every second"
		},
		{
		"name": "xaxis",
		"display_name": "X-Axis",
		"type": "calculated",
		"default_value": "{\"title\":{\"text\" : \"Time\"}, \"type\": \"datetime\", \"floor\":0}"
	}, {
		"name": "yaxis",
		"display_name": "Y-Axis",
		"type": "calculated",
		"default_value": "{\"title\":{\"text\" : \"Values\"}, \"minorTickInterval\":\"auto\", \"floor\":0}"
	}];

	for (i = 1; i <= MAX_NUM_SERIES; i++) {
		var dataSource = {
			"name": "series" + i,
			"display_name": "Series " + i + " - Datasource",
			"type": "calculated"
		};

		var xField = {
			"name": "series" + i + "label",
			"display_name": "Series " + i + " - Label",
			"type": "text",
		};

		highchartsLineWidgetSettings.push(dataSource);
		highchartsLineWidgetSettings.push(xField);
	}

	freeboard
		.loadWidgetPlugin({
			"type_name": "highcharts-timeseries",
			"display_name": "Time series (Highcharts)",
			"description": "Time series line chart.",
			"external_scripts": [
				"plugins/thirdparty/highcharts/highcharts.js",
				"plugins/thirdparty/highcharts/exporting.js"
			],
			"fill_size": true,
			"settings": highchartsLineWidgetSettings,
			newInstance: function(settings, newInstanceCallback) {
				newInstanceCallback(new highchartsTimeseriesWidgetPlugin(
					settings));
			}
		});

	var highchartsTimeseriesWidgetPlugin = function(settings) {

		var self = this;
		var currentSettings = settings;
		var refreshTimer;
		var newData={};
		var mycontainerElement;

		var thisWidgetId = "highcharts-widget-timeseries-" + HIGHCHARTS_ID++;
		var thisWidgetContainer = $('<div class="highcharts-widget" id="' + thisWidgetId + '"></div>');

		function createRefreshTimer(interval)
		{
			if(refreshTimer)
			{
				clearInterval(refreshTimer);
			}

			refreshTimer = setInterval(function()
			{
				var chart = thisWidgetContainer.highcharts();
				_.each(chart.series, function(series)
				{
				    var newValue=newData[series.userOptions.id];
				    var y;
                                    if (typeof newValue === "object") {
                                        Object.keys(newValue).forEach(key => {
                                                if (isNumber(newValue[key])) y=Number(newValue[key]);
                                        });
                                    } else {
                                        if (isNumber(newValue)) { //check if it is a real number and not text
                                                y = Number(newValue);
                                        };
                                    }
			            self.onCalculatedValueChanged(series.userOptions.id,{ time: new Date(), value: y }, true);
				});
			}, interval);
		}

		function createWidget() {

			Highcharts.theme = {
				global: {
					useUTC: false
				},
				colors: ["#2b908f", "#90ee7e", "#f45b5b", "#7798BF", "#aaeeee",
					"#ff0066", "#eeaaee", "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"
				],
				chart: {
					backgroundColor: null,
					style: {
						fontFamily: "'Open Sans', sans-serif"
					},
					plotBorderColor: '#606063'
				},
				title: {
					style: {
						color: '#E0E0E3',
						fontSize: '20px'
					}
				},
				subtitle: {
					style: {
						color: '#E0E0E3',
						textTransform: 'uppercase'
					}
				},
				xAxis: {
					gridLineColor: '#707073',
					labels: {
						style: {
							color: '#E0E0E3'
						}
					},
					lineColor: '#707073',
					minorGridLineColor: '#505053',
					tickColor: '#707073',
					title: {
						style: {
							color: '#A0A0A3'

						}
					}
				},
				yAxis: {
					gridLineColor: '#707073',
					labels: {
						style: {
							color: '#E0E0E3'
						}
					},
					lineColor: '#707073',
					minorGridLineColor: '#505053',
					tickColor: '#707073',
					tickWidth: 1,
					title: {
						style: {
							color: '#A0A0A3'
						}
					}
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.85)',
					style: {
						color: '#F0F0F0'
					}
				},
				plotOptions: {
					series: {
						dataLabels: {
							color: '#B0B0B3'
						},
						marker: {
							lineColor: '#333'
						}
					},
					boxplot: {
						fillColor: '#505053'
					},
					candlestick: {
						lineColor: 'white'
					},
					errorbar: {
						color: 'white'
					}
				},
				legend: {
					itemStyle: {
						color: '#E0E0E3'
					},
					itemHoverStyle: {
						color: '#FFF'
					},
					itemHiddenStyle: {
						color: '#606063'
					}
				},
				credits: {
					style: {
						color: '#666'
					}
				},
				labels: {
					style: {
						color: '#707073'
					}
				},

				drilldown: {
					activeAxisLabelStyle: {
						color: '#F0F0F3'
					},
					activeDataLabelStyle: {
						color: '#F0F0F3'
					}
				},

				navigation: {
					buttonOptions: {
						symbolStroke: '#DDDDDD',
						theme: {
							fill: '#505053'
						}
					}
				},

				// scroll charts
				rangeSelector: {
					buttonTheme: {
						fill: '#505053',
						stroke: '#000000',
						style: {
							color: '#CCC'
						},
						states: {
							hover: {
								fill: '#707073',
								stroke: '#000000',
								style: {
									color: 'white'
								}
							},
							select: {
								fill: '#000003',
								stroke: '#000000',
								style: {
									color: 'white'
								}
							}
						}
					},
					inputBoxBorderColor: '#505053',
					inputStyle: {
						backgroundColor: '#333',
						color: 'silver'
					},
					labelStyle: {
						color: 'silver'
					}
				},

				navigator: {
					handles: {
						backgroundColor: '#666',
						borderColor: '#AAA'
					},
					outlineColor: '#CCC',
					maskFill: 'rgba(255,255,255,0.1)',
					series: {
						color: '#7798BF',
						lineColor: '#A6C7ED'
					},
					xAxis: {
						gridLineColor: '#505053'
					}
				},

				scrollbar: {
					barBackgroundColor: '#808083',
					barBorderColor: '#808083',
					buttonArrowColor: '#CCC',
					buttonBackgroundColor: '#606063',
					buttonBorderColor: '#606063',
					rifleColor: '#FFF',
					trackBackgroundColor: '#404043',
					trackBorderColor: '#404043'
				},

				// special colors for some of the
				legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
				background2: '#505053',
				dataLabelsColor: '#B0B0B3',
				textColor: '#C0C0C0',
				contrastTextColor: '#F0F0F3',
				maskColor: 'rgba(255,255,255,0.3)'
			};

			Highcharts.setOptions(Highcharts.theme);

			// Get widget configurations
			var thisWidgetXAxis = JSON.parse(currentSettings.xaxis);
			var thisWidgetYAxis = JSON.parse(currentSettings.yaxis);
			var thisWidgetTitle = currentSettings.title;
			var thisWidgetChartType = currentSettings.chartType;
			//console.log('chartType:' + currentSettings.chartType + ' ' + thisWidgetChartType);
			var thisWidgetSeries = [];

			for (i = 1; i <= MAX_NUM_SERIES; i++) {
				var datasource = currentSettings['series' + i];
				if (datasource) {
					var serieno = "series" + i + "label";
					var label = currentSettings[serieno];
					//console.log('label: ', label);
					var newSeries = {
						id: 'series' + i,
						name: label,
						fillColor: {
							linearGradient: {
								x1: 0,
								y1: 0,
								x2: 0,
								y2: 1
							},
							stops: [
								[0, Highcharts.getOptions().colors[i - 1]],
								//[1, 'rgba(2,0,0,0)']
								[1, Highcharts.Color(Highcharts.getOptions().colors[i - 1]).setOpacity(0).get('rgba')]
							]
						},

						data: [],
						connectNulls: true
					};

					thisWidgetSeries.push(newSeries);
				}
			}

			// Create widget
			thisWidgetContainer.css('height', 60 * self.getHeight() - 10 + 'px');
			thisWidgetContainer.css('width', '100%');

			thisWidgetContainer.highcharts({
				chart: {
					type: thisWidgetChartType,
					animation: Highcharts.svg,
					marginRight: 20
				},
				title: {
					text: thisWidgetTitle
				},
				xAxis: thisWidgetXAxis,
				yAxis: thisWidgetYAxis,

				plotOptions: {
					area: {
						marker: {
							enabled: false,
							symbol: 'circle',
							radius: 2,
							hover: {
								enabled: true
							}
						},
						lineWidth: 2,
						states: {
							hover: {
								lineWidth: 2
							}
						},
						threshold: null
					}
				},
				exporting: {
					enabled: currentSettings.showcontextmenu
				},
				tooltip: {
					formatter: function() {
						return '<b>' + this.series.name + '</b><br/>' + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S',
							this.x) + '<br/>' + Highcharts.numberFormat(this.y, 1);
					}
				},
				series: thisWidgetSeries
			});

			if (refreshTimer) clearInterval(refreshTimer);
			refreshTimer=undefined;
			if (currentSettings.updateinterval) createRefreshTimer(1000);
		}

		self.render = function(containerElement) {
			createWidget();
			mycontainerElement=containerElement;
		}

		self.getHeight = function() {
			return currentSettings.blocks;
		}

		self.onSettingsChanged = function(newSettings) {
			currentSettings = newSettings;
			createWidget();
		}

		self.onSizeChanged = function() {
			$(mycontainerElement).append(thisWidgetContainer);
			thisWidgetContainer.highcharts().reflow();
		}

		self.onCalculatedValueChanged = function(settingName, newValue, fromTimer) {
			// console.log(settingName, 'newValue:', newValue);

			if (refreshTimer && fromTimer===undefined)  {
				newData[settingName]=newValue;
				return;
			}

			var chart = thisWidgetContainer.highcharts();
			var series = chart.get(settingName);
			if (series) {
				var x,y;
				if (typeof newValue === "object") {
					Object.keys(newValue).forEach(key => {
						if (key==='time') x=Date.parse(newValue[key]);
						if (isNumber(newValue[key])) y=Number(newValue[key]);
					});
				} else {
					if (isNumber(newValue)) { //check if it is a real number and not text
						x = (new Date()).getTime();
						y = Number(newValue);
					};
				}
				if (!_.isUndefined(x) && !_.isUndefined(y)) {
					var shift = false;
					var add = true;
					if (series.data.length>0) 
					{
						var timeframeMS = currentSettings.timeframe * ONE_SECOND_IN_MILIS;
						var first = series.data[0].x;
						var last = series.data[series.data.length-1].x;
						if (x-last<ONE_SECOND_IN_MILIS) add=false;
						if (x-first>timeframeMS) shift=true;
					}

					if (add)
					{
						// console.log('addPoint:', x, currentSettings[settingName], y);
						var plotMqtt = [x, y];
						series.addPoint(plotMqtt, true, shift);
					}
				}
			}
		}

		self.onDispose = function() {
			if (refreshTimer) clearInterval(refreshTimer);
			refreshTimer=undefined;
			return;
		}
	}

}());

