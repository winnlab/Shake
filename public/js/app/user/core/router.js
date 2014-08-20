define([
	'canjs',
	'core/appState',
	'underscore',
	'core/hub'	
],
	function (can, appState, _, hub) {

		var Modules = can.Map.extend({
			loaderShown: true,

			modules: [],

			silentInit: function (ev, module, id) {				
				this.initModule(module, id, true);
			},

			initModule: function (moduleName, id, silent) {
				var self = this,
					module = _.find(self.moduleTypes, function (module) {
						return module.name === moduleName
					});

				if (!module) {
					throw new Error("There no such module '" + moduleName + "', please check your configuration file");
				}

				if (self.checkModule(id, silent)) {
					return;
				}

				if (!silent) {
					this.showPreloader();
				}

				require([module.path], function (Module) {
					if (Module) {
						self.addModule(id);
						var isReady = can.Deferred();
						new Module('#' + id, {
							isReady: isReady
						});
						if (!silent) {
							self.activateModule(id, isReady);
						}
					} else {
						if (module.path) {
							throw new Error('Please check constructor of ' + module.path + '.js');
						} else {
							throw new Error('Please check existing of module "' + module.name + '"');
						}
					}
				});
				
			},

			checkModule: function (id, silent) {
				var module = _.find(this.modules, function(module){
						return module.id === id;
					}),
					exist = !_.isEmpty(module);

				if (exist && !silent) {
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

			activateModule: function (id, isReady) {
				_.map(this.modules, function (module) {
					module.attr('active', module.id === id);
				});

				this.hidePreloader(isReady);
			},

			showPreloader: function () {
				if (!this.attr('loaderShown')) {
					this.attr('loaderShown', true);
					$('#preloader').show();
				}
			},

			hidePreloader: function (isReady) {
				if (this.attr('loaderShown')) {
					isReady.then(function() {
						this.attr('loaderShown', false);
						$('#preloader').hide();
					}.bind(this));
				}
			}

		});

		return can.Control.extend({
			defaults: {
				viewpath: '../app/user/core/views/',
				langBtn: '.isoLang'
			}
		}, {
			init: function (el, options) {
				this.Modules = new Modules({
					moduleTypes: this.options.modules
				});

				var html = can.view(this.options.viewpath + 'route.stache', {
						modules: this.Modules.attr('modules')
					}),
					self = this;

				$(options.modulesContainer).prepend(html);

				_.each(options.routes, function (route) {
					can.route(route.route, route.defaults ? route.defaults : {});
				});

				can.on.call(hub, 'silentModule', can.proxy(this.Modules.silentInit, this.Modules));

				can.route.bindings.pushstate.root = appState.lang;
				can.route.ready(false);

			},

			'.module click': function (el, ev) {
				ev.preventDefault();

                var href = el.attr('href') ? el.attr('href') : el.attr('data-href');

				try {
                    if ( href ) {

                        var routeObj = can.route.deparam(href);

                        if (!_.isEmpty(routeObj)) {
                            can.route.attr(routeObj, true);
                        } else {
                            throw new  Error("There now such routing rule for '" + href + "', please check your configuration file");
                        }

                    } else {
                        throw new  Error("href parameter is undefined");
                    }
				} catch (e) {
					console.error(e);
				}
			},

			':module route': 'routeChanged',
			':module/:id route': 'routeChanged',

			routeChanged: function(data) {
				var moduleName = data.module,
					id = moduleName + (data.id ? '-' + data.id : '');					
								
				this.Modules.initModule(moduleName, id);				
			},

			'{langBtn} click': function (el, ev) {
				ev.preventDefault();
				
				var lang = el.attr('href').replace(/\//, ''),
					currentLink = '/' + can.route.param(can.route.attr());

				document.location.href = (lang ? '/' + lang : '') + currentLink;
			}

		});
	}
);