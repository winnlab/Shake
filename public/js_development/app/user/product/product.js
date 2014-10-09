define([
	'canjs',
	'underscore',
	'core/appState',
	'core/helpers/preloader',

	'managers/TitleManager',

	'css!app/product/css/product.css'
],
	function (can, _, appState, Preloader, TitleManager) {

		return can.Control.extend({
			defaults: {
				viewpath: 'app/product/'
			}
		}, {
			init: function () {
				var self = this,
					product = self.getProduct(),
					productTitle = self.getTitle(product.lang.name),
					titleId = 'productTitle' + Date.now();

				self.productId = product.attr('link');

				self.element.html(
					can.view(self.options.viewpath + 'index.stache', {
						product: product,
						appState: appState,
						titleId: titleId
					})
				);

				self.titleManager = new TitleManager({
					bgColor: 'transparent',
					selector: titleId,
					title: productTitle,
					align: 'left',
					letterSpacing: -4,
					fontSize: appState.fontSize() * 10.5,
					spaceWidth: 110,
					lineOffset: -80,
					mouseRadius: 50
				});

				if (self.options.isReady) {
					new Preloader({
						images: [product.img.bottle, product.img.can],
						callback: function () {
							self.options.isReady.resolve();
						}
					});
				}
			},

			getProduct: function () {
				return _.find(appState.products, function(element) {
					return element.link == can.route.attr('id');
				});
			},

			getTitle: function (name) {
				if (name.length < 15) return name.toUpperCase();

				var index = name.lastIndexOf(' '),
					title = index 
						? name.slice(0, index) + '\n' + name.slice(index + 1)
						: name;

				return title.toUpperCase();
			},

			'.bottlesIcon click': function () {
				var viewMode = appState.attr('viewMode');
				appState.attr('viewMode', viewMode == 'bottle' ? 'can' : 'bottle');
			},

			':module route': 'controllAnimation',
			':module/:id route': 'controllAnimation',

			controllAnimation: function (data) {
				if (data.module === 'product' && data.id === this.productId) {
					this.titleManager.animate.call(this.titleManager);
				} else {
					this.titleManager.stopAnimate.call(this.titleManager);
				}
			}

		});
	}
);