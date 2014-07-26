define(
	[
		'canjs',
		'underscore',
		'app/days/day',
		'app/days/daysModel',
		'app/fragments/fragmentsModel',
		'app/products/productsModel',
		'core/appState',
		'css!app/days/css/days'
	], 

	function (can, _, Day, DaysModel, FragmentsModel, ProductsModel, appState) {

		var ViewModel = can.Map.extend({
			define: {
				days: {
					value: new DaysModel.List({})
				},
				viewState: {
					value: 'list',
					serialize: false
				}
			},
			reOrder: function (attr, key) {				
				key = key || 'position';
				// var list = this.attr(attr),
				// 	orderedList = _.sortBy(list, function (item) {
				// 		return item[key];
				// 	});
				// list.replace(orderedList);
				var list = this.attr(attr);
				list.sort(function (a, b) {
					return a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;
				});
			},
			toList: function () {
				can.route.attr({
					module: 'days',
					action: undefined,
					entity_id: undefined
				});
				this.attr('viewState', 'list');
			},
			toEntity: function (day_id) {
				can.route.attr({
					entity_id: day_id,
					action: 'set',
					module: 'days'
				});
			}
		});

		return can.Control.extend({
			defaults: {
				viewpath: 'app/days/views/',
				DaysModel: DaysModel,
				ProductsModel: ProductsModel,
				FragmentsModel: FragmentsModel
			}
		}, {
			init: function () {
				var self = this,
					route = can.route.attr();
				
				self.viewModel = new ViewModel();

				self.viewModel.attr('fragments', new FragmentsModel.List({}));

				if (route.entity_id && route.action) {
					self.viewModel.attr('viewState', 'edit');
					can.when(
						self.viewModel.attr('days')
					).then(function () {
						self.setDay(route.entity_id, route.action);
					});
				}

				self.element.html(can.view(self.options.viewpath + 'index.stache', self.viewModel));

			},

			/*
			 * Routes
			 */

			':module route': function (data) {
				var viewState = this.viewModel.attr('viewState');
				if (data.module === 'days' && viewState !== 'list') {
					this.viewModel.toList(this.product_id);
				}
			},

			':module/:action/:entity_id route': function (data) {				
				if (data.module === 'days') {
					this.setDay(data.entity_id, data.action);
				}
			},

			/*
			 * Set day functions
			 */

			'.addDay click': function (el) {
				this.viewModel.toEntity('0');
			},

			'.editDay click': function (el) {
				var day = el.parents('.day').data('day');
				this.viewModel.toEntity(day.attr('_id'));
			},

			setDay: function (id) {
				this.viewModel.attr({
					'id': Date.now(),
					'viewState': 'edit'
				});

				var formWrap = this.element.find('.setDayWrap'),
					day = _.find(this.viewModel.days, function (day) {
						return day && day.attr('_id') === id;
					});

				new Day(formWrap, {
					day: day ? day : new DaysModel()
				});
			},

			'.removeDay click': function (el) {
				var day = el.parents('.day').data('day');

				if (confirm('Вы действительно хотите удалить день: "' + day.attr('name') + '"?')) {
					day.destroy().always(function (day, status, def) {
						appState.attr('notification', {
							status: status,
							msg: day.name + '. '+ def.responseJSON.message
						})
					});
				}
			},			

			'{DaysModel} created': function (Model, ev, day) {
				var days = this.viewModel.attr('days');
				days.push(day);
				this.viewModel.reOrder('days');
			},

			'{DaysModel} updated': function () {
				this.viewModel.reOrder('days');
			},

			'{FragmentsModel} created': function (Model, ev, fragment) {
				var fragments = this.viewModel.attr('fragments');
				fragments.push(fragment);
				this.viewModel.reOrder('fragments');
			},

			'{FragmentsModel} updated': function (fragment) {
				this.viewModel.reOrder('fragments');
			},

			'{ProductsModel} destroyed': function (Model, ev, product) {
				console.log(product.attr());
				var product_id = product.attr('_id'),
					fragments = this.viewModel.attr('fragments'),
					indexToDelete = [];

				_.each(fragments, function (fragment, index) {
					if (fragment.attr('product_id') == product_id) {
						indexToDelete.push(index);
					}
				});
				can.batch.start();
				_.each(indexToDelete, function (index) {
					fragments.splice(index, 1);
				})
				can.batch.stop();
				console.log('days product destroyed');
			}

		});

	}
);