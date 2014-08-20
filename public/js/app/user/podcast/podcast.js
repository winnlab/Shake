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
                scwidget.initSoundCloudWidget($('#widgetWrapper', self.element));

                if (self.options.isReady) {
                    self.options.isReady.resolve();
                }
            },

            initFuturePodcasts: function () {
                var self = this;

                $('#marquee', this.element).html(
                    can.view(self.options.viewpath + 'marquee.stache', {
                        appState: appState
                    })
                );
            },

            '.nextTrack click': function () {
                scwidget.playNextPlaylist($('#widgetWrapper', self.element));
            },

            '.prevTrack click': function () {
                scwidget.playPrevPlaylist($('#widgetWrapper', self.element));
            }
        });
    }
);