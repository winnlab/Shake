define(
	[
		'canjs',
		'core/appState'
	], 

	function (can, appState) {

		return can.Control.extend({
			defaults: {
				productForm: '.setProduct',
				viewpath: 'app/products/views/'
			}
		}, {
			init: function () {
				var self = this,
					product = self.options.product;				

				self.element.html(can.view(self.options.viewpath + 'set.stache', {
					product: product,
					langs: langs
				}));
			},

			'{productForm} submit': function (el, ev) {
				ev.preventDefault();

				var self = this,
					productData = can.deparam(el.serialize()),
					product = self.options.product;				

				if (!productData.active) {
					productData.active = false;
				}

				product.attr(productData);
				
				product.save()
				.done(function() {					
					can.route.attr({'entity_id': product.attr('_id')});					
					self.setNotification('success', 'Продукт "' + product.getName() + '" успешно сохранен!')					
				})
				.fail(function (product) {
					console.error(product);
					self.setNotification('error', 'Ошибка сохранения продукта "' + product.getName() + '"!')
				});
				
			},

			setNotification: function (status, msg) {
				appState.attr('notification', {
					status: status,
					msg: msg
				});
			}
		});

	}
);