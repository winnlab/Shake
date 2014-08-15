define([
	'canjs',
	'core/appState',
	'app/soundCloudPlayer/soundCloudPlayer',
	'css!app/menu/css/menu'
], 
	function (can, appState, scplayer) {
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

				self.element.prepend(can.view(self.options.viewpath + 'index.stache', options.state));
			},

			'.menu click': function () {
				var state = this.options.state,
					menu = state.attr('menu');
				state.attr('menu', menu == 'opened' ? 'closed' : 'opened');
			},

			'.pages .module click': function () {
				this.options.state.attr('menu', 'closed');
			},

            '.playBtn click': function () {
                appState.attr('paused', !appState.attr('paused'));
                scplayer.togglePause();
            },

			'.soundIcon click': function () {
				appState.attr('muted', !appState.attr('muted'));

				scplayer.toggleMute();
			}
		});
	}
);