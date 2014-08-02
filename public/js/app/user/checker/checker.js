define([
	'canjs',
	'core/appState',
	'css!app/checker/css/checker.css'
],
	function (can, appState) {
		return can.Control.extend({
			defaults: {
				viewpath: 'app/checker/'
			}
		}, {
			init: function () {
				var self = this;				

				self.element.html(
					can.view(self.options.viewpath + 'index.stache', appState)
				);
			},

			'.yes click': function () {
				can.route.attr({
					module: 'products'
				})
			},

			'.no click': function () {
				this.state.attr('is18Show', false);
			}


		});
	}
);