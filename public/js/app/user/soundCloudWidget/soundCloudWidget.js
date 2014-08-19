define([
    'canjs',
    'underscore',
    'core/appState',
    'soundcloud/sdk'
],
    function (can, _, appState) {

        var Widget = can.Control.extend({
            defaults: {
                playlistPath: '/playlists/45428734',
                clientId: '36d9ee3197b18f8c51dbc9a24ef5cc70'
            }
        }, {
            init: function () {
                var self = this;
                self.playlist = false;
                self.currentTrackPosition = 0;
                self.currentSound = null;

/*                self.displaySounds = appState.attr('podcast');*/

            },

            initSoundCloudWidget: function ( $selector ) {

            }
        });

        return new Widget('body');
    }
);