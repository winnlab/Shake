define([
    'canjs',
    'core/appState',
    'css!app/shakeit/css/shakeit.css'
],
    function (can, appState) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/shakeit/'
            }
        }, {
            init: function () {
                var self = this;
                var wrapMinHeight = parseInt($(window).height()) - parseInt($('header.header').height());

                console.log(wrapMinHeight);

                self.element.html(
                    can.view(self.options.viewpath + 'index.stache', {
                        appState: appState,
                        wrapMinHeight: wrapMinHeight + 'px'
                    })
                );
            },

            '.next click': function ( el, ev ) {

            },

            '.previous click': function ( el, ev ) {

            }
        });

    }
);
