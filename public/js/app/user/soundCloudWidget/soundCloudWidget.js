define([
    'canjs',
    'underscore',
    'core/appState',
    'soundcloud/sdk',
    'soundcloud/api'
],
    function (can, _, appState) {

        var Widget = can.Control.extend({
            defaults: {
                clientId: '36d9ee3197b18f8c51dbc9a24ef5cc70',
                userId: '/users/107070408',
                userPlaylistsLink: '/users/107070408/playlists',
                viewpath: 'app/soundCloudWidget/'
            }
        }, {
            init: function () {
                var self = this;

                self.playlists = null;
                self.widget = null;
                self.currentPlaylistIndex = null;
                self.podcast = appState.attr('podcast');
            },

            initSoundCloudWidget: function ( $selector ) {
                var self = this;

                SC.initialize({
                    client_id: self.options.clientId
                });

                self.getPlaylists($selector);
            },

            getPlaylists: function ( $selector ) {
                var self = this;

                SC.get(
                    self.options.userPlaylistsLink,
                    function ( playlists ) {
                        self.playlists = playlists;
                        self.playRandomPlaylist( $selector, playlists );
                    }
                );
            },

            playRandomPlaylist: function ( $selector, playlists ) {
                var self = this;
                var randomPlaylistPosition = Math.floor(Math.random() * (parseInt(playlists.length) - 1));

                self.podcast.attr('currentPlaylistSystemPosition', randomPlaylistPosition);
                self.currentPlaylistIndex = randomPlaylistPosition;
                self.initIframe( $selector, playlists[randomPlaylistPosition], randomPlaylistPosition );
            },

            displayPlaylists: function ( $selector, playlists, playlistPosition ) {
                var self = this;

                self.podcast.attr('currentPlaylist', playlists[playlistPosition]);
                self.podcast.attr('currentPlaylistPosition', playlistPosition + 1);

                if ( playlistPosition - 1 >= 0 ) {
                    self.podcast.attr('prevPlaylist', playlists[playlistPosition-1]);
                    self.podcast.attr('prevPlaylistPosition', playlistPosition);
                } else {
                    self.podcast.attr('prevPlaylist', playlists[playlists.length-1]);
                    self.podcast.attr('prevPlaylistPosition', playlists.length);
                }

                if ( playlistPosition + 1 <= playlists.length - 1) {
                    self.podcast.attr('nextPlaylist', playlists[playlistPosition+1]);
                    self.podcast.attr('nextPlaylistPosition', playlistPosition + 2);
                } else {
                    self.podcast.attr('nextPlaylist', playlists[0]);
                    self.podcast.attr('nextPlaylistPosition', 1);
                }
            },

            initIframe: function ( $selector, currentPlaylist, currentPlaylistPosition ) {
                var self = this;

                var $iframe = $selector.find('iframe');
                if ( $iframe.length > 0 ) {
                    $iframe.remove();
                    self.widget = null;
                }

                $selector.html(
                    can.view(self.options.viewpath + 'iframe.stache', {
                        width: '100%',
                        height: '450',
                        scrolling: 'no',
                        frameborder: 'no',
                        auto_play: 'false',
                        hide_related: 'true',
                        show_comments: 'false',
                        show_user: 'false',
                        show_reposts: 'false',
                        visual: 'true',

                        playlist_id: currentPlaylist.id
                    })
                );

                self.displayPlaylists( $selector, self.playlists, currentPlaylistPosition );
                self.initWidget();
            },

            initWidget: function () {
                var self = this;

                self.widget = SC.Widget(document.getElementById('soundcloud_widget'));
            },

            playNextPlaylist: function ( $selector ) {
                var self = this;

                if ( self.widget ) {
                    self.widget.pause();
                }

                if ( self.currentPlaylistIndex + 1 <= self.playlists.length - 1) {
                    self.currentPlaylistIndex++;
                } else {
                    self.currentPlaylistIndex = 0;
                }
                self.initIframe( $selector, self.playlists[self.currentPlaylistIndex], self.currentPlaylistIndex);
            },

            playPrevPlaylist: function ( $selector ) {
                var self = this;

                if ( self.widget ) {
                    self.widget.pause();
                }

                if ( self.currentPlaylistIndex - 1 >= 0) {
                    self.currentPlaylistIndex--;
                } else {
                    self.currentPlaylistIndex = self.playlists.length - 1;
                }
                self.initIframe( $selector, self.playlists[self.podcast.attr('currentPlaylistPosition')], self.currentPlaylistIndex);
            },

            togglePause: function ($selector) {
                var self = this;

                if ( self.widget ) {
                    self.widget.toggle();
                } else {
                    self.initSoundCloudWidget($selector);
                }
            },

            toggleMute: function () {
                var self = this;

                if ( self.widget ) {
                    self.widget.toggleMute();
                }
            }
        });

        return new Widget('body');
    }
);