define([
	'canjs',
	'core/appState',
	'underscore',
	'social/fb/fb_sdk',
	'social/vk/vk_sdk',
	'css!app/global/css/global.css'
],
	function (can, appState, _) {
		
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
				self.initFbSDK();
				self.initVkSDK();
			},

			initFbSDK: function () {

				var app = _.find(appState.attr('social.fbApps'), function (fbApp) {
					return _.find(fbApp.domains, function (fbDomain) {
						console.log(fbDomain);
						return fbDomain == window.location.hostname
					});
				});

				console.log('--------------');
				console.log(window.location.hostname);

				if (app)  {

					console.log(app.attr('appId'));

					FB.init({
						appId: app.attr('appId'),
						cookie: true,
						xfbml: true,
						version: 'v2.1'
					});
				}

			},

			initVkSDK: function () {
				VK.init({
					apiId: 4593957
				})
			}
		});
	}
);