define([
	'canjs',
	'core/appState',
	'core/helpers/preloader',
	'css!app/products/css/products.css'
],
	function (can, appState, Preloader) {

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
					new Preloader({
						images: appState.getProductImages(['bottle']),
						callback: function () {
							self.options.isReady.resolve();
						}
					});					
				}
			},

			'.bottlesIcon click': function () {
				var viewMode = appState.attr('viewMode');
				appState.attr('viewMode', viewMode == 'bottle' ? 'can' : 'bottle');
			}
		});

	}
);