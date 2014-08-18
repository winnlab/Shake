define([
    'canjs',
    'underscore',
    'core/appState',
    'app/soundCloudPlayer/soundCloudPlayer',
    'css!app/podcast/css/podcast.css'
],
    function (can, _, appState, scplayer) {

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

                this.initFuturePodcasts();

                if (self.options.isReady) {
                    self.options.isReady.resolve();
                }
            },

            '.playTrack click': function () {
                scplayer.togglePause();
            },

            '.nextTrack click': function () {
                scplayer.playNextTrack();
            },

            '.prevTrack click': function () {
                scplayer.playPrevTrack();
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