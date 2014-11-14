define([
	'canjs',
	'core/appState',
	'managers/TitleManager',

	'css!app/checker/css/checker.css'
],
	function (
		can,
		appState,
		TitleManager
	) {
		return can.Control.extend({
			defaults: {
				viewpath: 'app/checker/'
			}
		}, {

			init: function () {
				var self = this;

				if (appState.attr('is18Conf')) {
                    return self.redirect();
                }

				self.element.html(
					can.view(self.options.viewpath + 'index.stache', appState)
				);

				if (self.options.isReady) {
					self.options.isReady.resolve();
				}

				self.titleManager = new TitleManager({
					bgColor: 'transparent'
				});

				setTimeout(function () {
					self.element.find('.checkerBtns').addClass('active');
				}, 1000);

			},

			':module route': function (data) {
				if (data.module == 'checker'){
					this.titleManager.animate.call(this.titleManager);
				}
			},

			'.yes click': function () {
				appState.attr('is18Conf', true);
				this.titleManager.stopAnimate.call(this.titleManager);
				this.redirect();
			},

			'.no click': function () {
				appState.attr('is18Show', false);
			},

			redirect: function () {
                var startRoute = appState.attr('startRoute');

                if (startRoute) {
                    can.route.attr(startRoute, true);
                } else {
					console.log('go')
                    can.route.attr({
                        module: 'products'
                    }, true);
                }

            }

		});
	}
);
