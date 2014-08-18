define([
	'canjs',
	'core/appState',
	'css!app/products/css/products.css'
],
	function (can, appState) {

		return can.Control.extend({
			defaults: {
				viewpath: 'app/products/'
			}
		}, {
			init: function () {
				var self = this;

				self.element.html(
					can.view(self.options.viewpath + 'index.stache', {
						appState: appState
					})
				);

				if (self.options.isReady) {
					self.options.isReady.resolve();
				}
			},

			'.bottleType click': function () {
				var viewMode = appState.attr('viewMode');
				appState.attr('viewMode', viewMode == 'bottle' ? 'can' : 'bottle');
			}
		});

	}
);