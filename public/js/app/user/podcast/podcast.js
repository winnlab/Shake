define([
    'canjs',
    'underscore',
    'core/appState',
    'app/soundCloudWidget/soundCloudWidget',
    'css!app/podcast/css/podcast.css'
],
    function (can, _, appState, scwidget) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/podcast/'
            }
        }, {
            init: function () {
                var self = this;

                self.element.html(
                    can.view(self.options.viewpath + 'index.stache', {
                        currentTrackPosition: this.currentTrackPosition,
                        appState: appState
                    })
                );

                self.initFuturePodcasts();
                scwidget.initSoundCloudWidget();

                if (self.options.isReady) {
                    self.options.isReady.resolve();
                }
            },

            '.playTrack click': function () {
                scwidget.togglePause();
            },

            initFuturePodcasts: function () {
                var self = this;

                $('#marquee', this.element).html(
                    can.view(self.options.viewpath + 'marquee.stache', {
                        appState: appState
                    })
                );
            }
        });
    }
);