define(
	[
		'canjs',
		'underscore',
		'app/fragments/fragment',
		'app/fragments/fragmentsModel',
		'app/products/productsModel',
		'app/days/daysModel',
		'core/appState',
		'css!app/fragments/css/fragments'
	], 

	function (can, _, Fragment, FragmentsModel, ProductsModel, DaysModel, appState) {

		var ViewModel = can.Map.extend({
			define: {
				viewState: {
					value: 'list'
				}
			},
			reOrder: function (attr, key) {
				key = key || 'position';
				var list = this.attr(attr);
				list.sort(function (a, b) {
					return a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;
				});
			},
			toList: function () {
				can.route.attr({
					module: 'fragments',
					action: undefined,
					entity_id: undefined
				});
				this.attr('viewState', 'list');
			},
			toEntity: function (fragment_id) {
				can.route.attr({
					entity_id: fragment_id,
					action: 'set',
					module: 'fragments'
				});
			}
		});

		return can.Control.extend({
			defaults: {
				viewpath: 'app/fragments/views/',
				FragmentsModel: FragmentsModel,
				ProductsModel: ProductsModel,
				DaysModel: DaysModel
			}
		}, {
			init: function () {

				var self = this,
					route = can.route.attr();
				
				viewModel = new ViewModel();
				viewModel.attr('product_id', can.route.attr('id'));

				viewModel.attr({
					'days': new DaysModel.List({}),
					'product': new ProductsModel.List({
						_id: viewModel.attr('product_id')
					}),
					'fragments': new FragmentsModel.List({
						product_id: viewModel.attr('product_id')
					})
				});

				if (route.entity_id && route.action) {
					viewModel.attr('viewState', 'edit');
					can.when(
						viewModel.attr('fragments'),
						viewModel.attr('days'),
						viewModel.attr('product')
					).then(function () {
						self.setFragment(route.entity_id, route.action);
					});
				}

				self.element.html(can.view(self.options.viewpath + 'index.stache', viewModel));

				this.viewModel = viewModel;
			},

			/*
			 * Routes
			 */

			':module/:id route': function (data) {
				var viewModel = this.viewModel,
					viewState = viewModel.attr('viewState'),
					product_id = viewModel.attr('product_id');

				if (data.module === 'fragments' && viewState !== 'list' && data.id === product_id) {
					viewModel.toList(this.product_id);
				}
			},

			':module/:id/:action/:entity_id route': function (data) {
				if (data.module === 'fragments' && data.id === this.viewModel.attr('product_id')) {
					this.setFragment(data.entity_id, data.action);
				}
			},

			/*
			 * Set fragment functions
			 */

			'.addFragment click': function (el) {
				this.viewModel.toEntity('0');
			},

			'.editFragment click': function (el) {
				var fragment = el.parents('.fragment').data('fragment');
				this.viewModel.toEntity(fragment.attr('_id'));
			},

			setFragment: function (id) {
				var product = this.viewModel.attr('product');
				
				if (!product.length) {
					return;
				}

				this.viewModel.attr({
					'id': Date.now(),
					'viewState': 'edit'
				});

				var self = this,
					formWrap = self.element.find('.setFragmentWrap'),
					fragment = _.find(self.viewModel.attr('fragments'), function (fragment) {
						return fragment && fragment.attr('_id') === id;
					});

				new Fragment(formWrap, {
					fragment: fragment ? fragment : new FragmentsModel(),
					days: self.viewModel.attr('days')
				});
			},

			'.removeFragment click': function (el) {
				var fragment = el.parents('.fragment').data('fragment');

				if (confirm('Вы действительно хотите удалить фрагмент: "' + fragment.attr('name') + '"?')) {
					fragment.destroy().always(function (fragment, status, def) {
						appState.attr('notification', {
							status: status,
							msg: fragment.name + '. '+ def.responseJSON.message
						})
					});
				}
			},

			'{FragmentsModel} updated': function () {
				this.viewModel.reOrder('fragments');
			},

			'{FragmentsModel} created': function (Model, ev, fragment) {
				var self = this,
					fragments = self.viewModel.attr('fragments');
				fragments.push(fragment);
				this.viewModel.reOrder('fragments');
			},

			'{DaysModel} created': function (Model, ev, day) {
				var days = this.viewModel.attr('days');
				days.push(day);
				this.viewModel.reOrder('days');
			},

			'{DaysModel} updated': function () {
				this.viewModel.reOrder('days');
			},

			'{ProductsModel} destroyed': function (Model, ev, product) {
				var products = this.viewModel.attr('product'),
					fragments = this.viewModel.attr('fragments');

				if (products.indexOf(product) !== -1) {
					this.viewModel.attr({
						viewState: 'list',
						deletedProduct: product.attr('name')
					})
					products.replace([]);
					fragments.replace([]);
				}
			}

		});

	}
);