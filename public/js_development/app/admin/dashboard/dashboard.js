define(
	[
		'canjs'
	], 

	function (can) {

		return can.Control.extend({

		}, {
			init: function () {
				console.log('dashboard inited');
				this.element.append('!!!!!!!');
			}
		});

	}
);