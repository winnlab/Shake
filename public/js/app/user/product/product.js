define([
    'canjs',
    'underscore',
    'core/appState',
    'css!app/product/css/product.css'
],
    function (can, _, appState) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/product/'
            }
        }, {
            init: function () {
                var self = this;

                var product = this.getProduct();

                self.element.html(
                    can.view(self.options.viewpath + 'index.stache', {
                        product: product,
                        appState: appState
                    })
                );
            },

            getProduct: function () {
                return _.find(appState.products, function(element) {
                    return element.link == can.route.attr('id');
                });
            },

            '.bottleType click': function () {
                var viewMode = appState.attr('viewMode');
                appState.attr('viewMode', viewMode == 'bottle' ? 'can' : 'bottle');
            }
        });

    }
);