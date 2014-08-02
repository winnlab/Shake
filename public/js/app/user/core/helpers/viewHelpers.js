define([
	'canjs'
],
	function (can) {

		can.mustache.registerHelper('isPrimitive', function (observer, primitive, options) {
			return observer() === primitive ? options.fn() : options.inverse();
		});

	}
);