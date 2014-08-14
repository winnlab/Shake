define(
	[
		'canjs',
		'underscore',
		'app/products/product',
		'app/products/productsModel',
		'core/appState',
		'css!app/products/css/products'
	], 

	function (can, _, Product, ProductsModel, appState) {

		var ViewModel = can.Map.extend({
			define: {
				products: {
					value: new ProductsModel.List({})
				},
				viewState: {
					value: 'list',
					serialize: false
				}
			},
			reOrderProducts: function () {
				var products = this.attr('products'),
					orderedProducts = _.sortBy(products, function (product) {
						return +product.position;
					});
				products.replace(orderedProducts);
			},
			toList: function () {
				can.route.attr({
					module: 'products'
				}, true);
				this.attr('viewState', 'list');
			},
			toEntity: function (product_id) {
				can.route.attr({
					entity_id: product_id,
					action: 'set',
					module: 'products'
				}, true);
			}
		});

		return can.Control.extend({
			defaults: {
				viewpath: 'app/products/views/',
				ProductsModel: ProductsModel
			}
		}, {
			init: function () {
				var self = this,
					route = can.route.attr();

				self.viewModel = new ViewModel;

				if (route.entity_id && route.action) {
					self.viewModel.attr('viewState', 'edit');
				}

				self.element.html(can.view(self.options.viewpath + 'index.stache', this.viewModel, {
                    langs: langs,
					getBg: function (img, options) {
						img = img();						
						var bg = img && img.attr('bottle')
							? 'background-image: url("/uploads/' + img.attr('bottle') + '");'
							: '';						
						return bg;
					}
				}));

				var products = self.viewModel.attr('products');

				can.when(products).then(function () {
					if (route.entity_id && route.action) {
						self.setProduct(route.entity_id, route.action);
					}
				});

			},

			/*
			 * Routes
			 */

			':module route': function (data) {
				var viewModel = this.viewModel;
				if (data.module === 'products' && viewModel.attr('viewState') !== 'list') {					
					viewModel.toList();
				}
			},

			':module/:action/:entity_id route': function (data) {
				if (data.module === 'products') {					
					this.setProduct(data.entity_id, data.action);
				}
			},

			/*
			 * Set product functions
			 */

			'.addProduct click': function (el) {
				this.viewModel.toEntity('0');				
			},

			'.editProduct click': function (el) {
				var product = el.parents('.product').data('product');
				this.viewModel.toEntity(product.attr('_id'));
			},

			setProduct: function (id) {				
				this.viewModel.attr({
					'id': Date.now(),
					'viewState': 'edit'
				})				

				var formWrap = this.element.find('.setProductWrap'),
					product = _.find(this.viewModel.products, function (product) {
						return product.attr('_id') === id;
					});

				new Product(formWrap, {
					product: product ? product : new ProductsModel()
				});
			},

			'.removeProduct click': function (el) {
				var product = el.parents('.product').data('product');

				if (confirm('Вы действительно хотите удалить продукт: "' + product.attr('name') + '"?')) {
					product.destroy().always(function (product, status, def) {
						console.log(arguments);
						console.log(product.attr());
						console.log(status);
						console.log(def);

						appState.attr('notification', {
							status: status,
							msg: product.name + '. '+ def.responseJSON.message
						})
					});
				}
			},

			'{ProductsModel} updated': function () {
				this.viewModel.reOrderProducts();
			},

			'{ProductsModel} created': function (Model, ev, product) {
				var self = this
					products = self.viewModel.attr('products');
				products.push(product);
				this.viewModel.reOrderProducts();
			}

		});

	}
);