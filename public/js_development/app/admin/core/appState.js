define([
	'canjs'
], 
	function (can) {

		var AppState = can.Map.extend({
			define: {
				notification: {
					value: {},
					serialize: false
				}
			}
		});

		return new AppState();
	}
);