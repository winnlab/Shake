define([
	'canjs',
	'core/appState'
],
	function (can, appState) {

		function computedVal (value) {
			if (typeof value === 'function') {
				value = value();
			}
			return value;
		};

		can.mustache.registerHelper('isPrimitive', function (observer, primitive, options) {
			return observer() === primitive ? options.fn() : options.inverse();
		});

        can.mustache.registerHelper('convertTrackDate', function (date) {
            var splitBySpace = date.split(' ');
            var splitBySlash = splitBySpace[0].split('/');
            return splitBySlash[2] + '/' + splitBySlash[1];
        });

        can.mustache.registerHelper('showPlaylistNumber', function (index) {
            return index()+1;
        });

		can.mustache.registerHelper('is', function () {
			var options = arguments[arguments.length - 1],
				comparator = computedVal(arguments[0]),
				result = true;

			for (var i = 1, ln = arguments.length - 1; i < ln; i += 1) {
				if (comparator !== computedVal(arguments[i])) {
					result = false;
					break;
				}
			}

			return result ? options.fn() : options.inverse();
		});

		can.mustache.registerHelper('and', function () {
			var options = arguments[arguments.length - 1],
				result = true;

			for (var i = 1, ln = arguments.length - 1; i < ln; i += 1) {
				if (!computedVal(arguments[i])) {
					result = false;
					break;
				}
			}

			return result ? options.fn() : options.inverse();
		});

		can.mustache.registerHelper('getContactsMap', function (index) {
			var result = '';

			appState.contacts.forEach(function (value) {
				if (value.link == 'main-office') {
					result = value.map;
				}
			});

			return result;

		});
	}
);
