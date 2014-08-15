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

				self.element.html(
					can.view(self.options.viewpath + 'index.stache', appState)
				);

				this.titleManager = new TitleManager({
					bgColor: 'transparent'
				});

				setTimeout(function () {
					self.element.find('.checkerBtns').addClass('active');
				}, 2000);

			},

			':module route': function (data) {
				if (data.module == 'checker'){
					this.titleManager.animate();
				}
			},

			'.yes click': function () {
				can.route.attr({
					module: 'products'
				});

				this.titleManager.stopAnimate()
			},

			'.no click': function () {
				appState.attr('is18Show', false);
			}

		});
	}
);