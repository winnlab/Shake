define([
    'canjs',
    'underscore',
    'core/appState',
    'app/soundCloudWidget/soundCloudWidget',
    'css!app/podcasts/css/podcasts.css'
],
    function (can, _, appState, scwidget) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/podcasts/'
            }
        }, {
            init: function (elementObject) {
                var self = this;
                this.elementObject = elementObject;

                if ( appState.attr('podcast.playlists') ) {
                    self.renderPodcasts(appState.attr('podcast.playlists'));
                } else {
                    scwidget.initSoundCloudWidget(null, false, can.proxy(self.renderPodcasts, self));
                }
            },

            renderPodcasts: function () {
                var self = this;

                self.element.html(
                    can.view(self.options.viewpath + 'index.stache', {
                        appState: appState
                    }, {})
                );

                if (self.options.isReady) {
                    self.options.isReady.resolve();
                }
            },

            '.playlist click': function ( el, ev ) {

                var playlistIndex = parseInt(el.data('playlist_index'));
                var playlists = appState.attr('podcast.playlists');

                appState.attr('podcast.currentPlaylist', playlists[playlistIndex]);
                appState.attr('podcast.currentPlaylistSystemPosition', playlistIndex);
                appState.attr('podcastChange', playlists[playlistIndex]);

                can.route.attr({
                    module: 'podcast'
                }, true);
            }
        });
    }
);