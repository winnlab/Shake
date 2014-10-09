define([
	'canjs'
],
	function (can) {

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
	}
);