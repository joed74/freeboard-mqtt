//freeboard random data source
//Rafael Aroca - July/2021
(function () {

	var randomDatasource = function (settings, updateCallback) {
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;

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

			var num=Math.random() * (currentSettings.max - currentSettings.min) + parseFloat(currentSettings.min);
			data=Math.round((num * 100) / 100).toFixed(currentSettings.decimalPlaces);
			updateCallback(data);
		}
		
		this.send = function(newValue)
		{
			data=newValue;
			updateCallback(data);
		}
		
		this.onDispose = function () {
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function (newSettings) {
			errorStage = 0;

			currentSettings = newSettings;
			updateRefresh(currentSettings.refresh * 1000);
			self.updateNow();
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name: "Random Data Source",
		settings: [
			{
				name: "max",
				display_name: "Maximum",
				type: "text",
				description: "Maximum random number"
			},
			{
				name: "min",
				display_name: "Minimum",
				type: "text",
				description: "Minimum random number"
			},
			{
				name: "decimalPlaces",
				display_name: "Decimal Places",
				type: "text",
				description: "Decimal places"
			},



			{
				name: "refresh",
				display_name: "Refresh Every",
				type: "number",
				suffix: "seconds",
				default_value: 5
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new randomDatasource(settings, updateCallback));
		}
	});



}());
