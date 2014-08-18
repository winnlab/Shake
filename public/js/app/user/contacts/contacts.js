define([
    'canjs',
    'core/appState',
    'css!app/contacts/css/contacts.css'
],
    function (can, appState) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/contacts/'
            }
        }, {
            init: function () {
                var self = this;

                self.element.html(
                    can.view(self.options.viewpath + 'index.stache', appState)
                );

                if (self.options.isReady) {
                    self.options.isReady.resolve();
                }
            }
        });

    }
);