define([
	'canjs',
	'core/appState',
	
	'css!app/global/css/global.css'
],
	function (can) {
		
		return can.Control.extend({
			defaults: {
				viewpath: 'app/global/',
				hidden: ['contacts', 'checker']
			}
		}, {

			init: function () {
				var self = this,
					html = can.view(self.options.viewpath + 'index.stache', {
						appState: appState
					}, {
						isContactsShown: function (options) {							
							return self.options.hidden.indexOf(can.route.attr('module')) == -1 
								? options.fn() 
								: options.inverse();
						}
					});

				self.element.append(html);
			}

		});
	}
);