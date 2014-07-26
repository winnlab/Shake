define(['canjs', 'underscore'],
	function (can, _) {


		var Placeholder = can.Map.extend({
			modules: [],

			initModule: function (module, id) {
				var self = this;

				if ( ! self.checkModule(id)) {
					require([module.path], function (Module) {
						if (Module) {
							self.addModule(id);
							new Module('#' + id);
							self.activateModule(id);
						} else {
							if (module.path) {
								throw new Error('Please check constructor of ' + module.path + '.js');
							} else {
								throw new Error('Please check existing of module "' + module.name + '"');
							}
						}
					});
				}
				
			},

			checkModule: function (id) {
				var module = _.find(this.modules, function(module){
						return module.id === id;
					}),
					exist = !_.isEmpty(module);

				if (exist) {
					this.activateModule(id);
				}
				return exist;
			},

			addModule: function (id) {
				this.modules.push({
					id: id,
					active: false
				});
			},

			activateModule: function (id) {
				_.map(this.modules, function (module) {
					module.attr('active', module.id === id);
				});
			}

		});

		return can.Control.extend({
			defaults: {
				viewpath: '../app/admin/core/views/'
			}
		}, {
			init: function (el, options) {
				
				this.Placeholder = new Placeholder();

				var html = can.view(this.options.viewpath + 'route.stache', {
						modules: this.Placeholder.attr('modules')
					}),
					self = this;

				$(options.modulesContainer).html(html);

				_.each(options.routes, function (route) {
					can.route(route.route, route.defaults ? route.defaults : {});
				});

				can.route.bindings.pushstate.root = options.base;
				can.route.ready(false);
			},

			'.module click': function (el, ev) {
				ev.preventDefault();

				var options = this.options,
					href = el.attr('href').split(options.base)[1],
					routeObj = can.route.deparam(href);

				try {
					if (!_.isEmpty(routeObj)) {
						can.route.attr(routeObj, true);
					} else {
						throw new  Error("There now such routing rule for '" + href + "', please check your configuration file");
					}
				} catch (e) {
					console.error(e);
				}
			},

			':module route': 'routeChanged',
			':module/:id route': 'routeChanged',
			':module/:id/:action/:entity_id route': 'routeChanged',
			':module/:action/:entity_id route': 'routeChanged',

			routeChanged: function(data) {
				var modules = this.options.modules,
					moduleName = data.module,
					id = moduleName + (data.id ? '-' + data.id : '');
					module = _.find(modules, function (module) {
						return module.name === moduleName
					});

				try {
					if (module) {
						this.Placeholder.initModule(module, id);
					} else {
						throw new  Error("There no such module '" + moduleName + "', please check your configuration file");
					}
				} catch (e) {
					console.error(e);
				}
			}

		});
	}
);