define([
	'canjs',
	'css!app/menu/css/menu'
], 
	function (can) {
		return can.Control.extend({
			defaults: {
				viewpath: 'app/menu/'
			}
		}, {
			init: function () {
				var self = this,
					options = self.options;

				if (!options.state) {
					options.state = new can.Map();
				}				

				self.element.append(can.view(self.options.viewpath + 'index.stache', options.state));
			},

			'.menu click': function () {
				var state = this.options.state,
					menu = state.attr('menu');
				state.attr('menu', menu == 'opened' ? 'closed' : 'opened');
			}
		});
	}
);