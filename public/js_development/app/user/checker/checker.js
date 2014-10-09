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
				var products = appState.attr('products'),
					randIndex = Math.floor(Math.random() * products.length);

				can.route.attr({
					module: 'product',
					id: products.attr(randIndex + '.link')
				}, true);
				this.titleManager.stopAnimate.call(this.titleManager);
			},

			'.no click': function () {
				appState.attr('is18Show', false);				
			}

		});
	}
);