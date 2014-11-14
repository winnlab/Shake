define(["canjs", "core/appState", "underscore", "core/hub"], function(e, t, n, r) {
    var i = e.Map.extend({
        loaderShown: !0,
        modules: [],
        silentInit: function(e, t, n) {
            this.initModule(t, n, !0)
        },
        initModule: function(t, r, i) {
            var s = this,
                o = n.find(s.moduleTypes, function(e) {
                    return e.name === t
                });
            if (!o) throw new Error("There no such module '" + t + "', please check your configuration file");
            if (s.checkModule(r, i)) return;
            i || this.showPreloader(), require([o.path], function(t) {
                if (!t) throw o.path ? new Error("Please check constructor of " + o.path + ".js") : new Error('Please check existing of module "' + o.name + '"');
                s.addModule(r);
                var n = e.Deferred();
                new t("#" + r, {
                    isReady: n
                }), i || s.activateModule(r, n)
            })
        },
        checkModule: function(e, t) {
            var r = n.find(this.modules, function(t) {
                    return t.id === e
                }),
                i = !n.isEmpty(r);
            return i && !t && this.activateModule(e), i
        },
        addModule: function(e) {
            this.modules.push({
                id: e,
                active: !1
            })
        },
        activateModule: function(e, t) {
            n.map(this.modules, function(t) {
                t.attr("active", t.id === e)
            }), this.hidePreloader(t)
        },
        showPreloader: function() {
            this.attr("loaderShown") || (this.attr("loaderShown", !0), $("#preloader").show())
        },
        hidePreloader: function(e) {
            this.attr("loaderShown") && e.then(function() {
                this.attr("loaderShown", !1), $("#preloader").hide()
            }.bind(this))
        }
    });
    return e.Control.extend({
        defaults: {
            viewpath: "../app/user/core/views/",
            langBtn: ".isoLang"
        }
    }, {
        init: function(s, o) {
            this.Modules = new i({
                moduleTypes: this.options.modules
            });
            var u = e.view(this.options.viewpath + "route.stache", {
                    modules: this.Modules.attr("modules")
                }),
                a = this;
            $(o.modulesContainer).prepend(u), n.each(o.routes, function(t) {
                e.route(t.route, t.defaults ? t.defaults : {})
            }), e.on.call(r, "silentModule", e.proxy(this.Modules.silentInit, this.Modules)), e.route.bindings.pushstate.root = t.lang, e.route.ready(!1)
        },
        ".module click": function(t, r) {
            r.preventDefault();
            var i = t.attr("href") ? t.attr("href") : t.attr("data-href");
            try {
                if (!i) throw new Error("href parameter is undefined");
                var s = e.route.deparam(i);
                if (!!n.isEmpty(s)) throw new Error("There now such routing rule for '" + i + "', please check your configuration file");
                e.route.attr(s, !0)
            } catch (o) {
                console.error(o)
            }
        },
        ":module route": "routeChanged",
        ":module/:id route": "routeChanged",
        routeChanged: function(e) {
            var t = e.module,
                n = t + (e.id ? "-" + e.id : "");

            if (!appState.attr('is18Conf') && can.route.attr('module') !== 'checker') {
                appState.attr('startRoute', can.route.attr());
                return can.route.attr({
                    module: 'checker'
                }, true);
            }

            this.Modules.initModule(t, n)
        },
        "{langBtn} click": function(t, n) {
            n.preventDefault();
            var r = t.attr("href").replace(/\//, ""),
                i = "/" + e.route.param(e.route.attr());
            document.location.href = (r ? "/" + r : "") + i
        }
    })
});
