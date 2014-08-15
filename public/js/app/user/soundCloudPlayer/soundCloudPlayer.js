define([
    'canjs',
    'underscore',
    'core/appState',
    'soundcloud/sdk'
],
    function (can, _, appState) {

        var Player = can.Control.extend({
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

                self.displaySounds = appState.attr('podcast');

                self.initSoundCloudApi();
            },

            initSoundCloudApi: function () {
                var self = this;

                SC.initialize({
                    client_id: self.options.clientId
                });

                this.getPlaylist();
            },

            getPlaylist: function () {
                var self = this;

                SC.get(
                    self.options.playlistPath,
                    function ( playlist ) {
                        self.playlist = playlist;
                        self.playRandomTrack(playlist);
                    }
                );
            },

            playRandomTrack: function ( playlist ) {
                var self = this;
                var randomTrackPosition = Math.floor(Math.random() * (parseInt(playlist.track_count) - 1));

                this.currentTrackPosition = randomTrackPosition;
                self.displayTracks(randomTrackPosition);
            },

            togglePause: function () {
                var self = this;

                if ( self.currentSound ) {
                    self.currentSound.togglePause();
                } else {
                    self.playTrack(self.currentTrackPosition);
                }
            },

            toggleMute: function () {
                var self = this;

                if ( self.currentSound ) {
                    self.currentSound.toggleMute();
                }
            },

            playNextTrack: function () {
                this.currentSound.stop();

                if ( this.currentTrackPosition + 1 <= this.playlist.track_count - 1) {
                    this.currentTrackPosition++;
                } else {
                    this.currentTrackPosition = 0;
                }
                this.playTrack(this.currentTrackPosition);
            },

            playPrevTrack: function () {
                this.currentSound.stop();

                if ( this.currentTrackPosition - 1 >= 0) {
                    this.currentTrackPosition--;
                } else {
                    this.currentTrackPosition = this.playlist.track_count - 1;
                }
                this.playTrack(this.currentTrackPosition);
            },

            playTrack: function ( trackPosition ) {
                var self = this;

                var trackUrl = '/tracks/' + self.playlist.tracks[trackPosition].id;

                SC.stream(
                    trackUrl,
                    function ( sound ) {
                        sound.play({
                            onfinish: function () {
                                self.playNextTrack();
                            }
                        });
                        self.currentSound = sound;
                        self.currentTrackPosition = trackPosition;
                        self.displayTracks(trackPosition);
                        self.displaySounds.attr('currentTitle', self.playlist.tracks[trackPosition].title);
                    }
                );
            },

            displayTracks: function ( trackPosition ) {

                this.displaySounds.attr('currentSound', this.playlist.tracks[trackPosition]);
                this.displaySounds.attr('currentTrackPosition', trackPosition + 1);

                if ( trackPosition - 1 >= 0 ) {
                    this.displaySounds.attr('prevSound', this.playlist.tracks[trackPosition-1]);
                    this.displaySounds.attr('prevTrackPosition', trackPosition);
                } else {
                    this.displaySounds.attr('prevSound', this.playlist.tracks[this.playlist.track_count-1]);
                    this.displaySounds.attr('prevTrackPosition', this.playlist.track_count);
                }

                if ( trackPosition + 1 <= this.playlist.track_count - 1) {
                    this.displaySounds.attr('nextSound', this.playlist.tracks[trackPosition+1]);
                    this.displaySounds.attr('nextTrackPosition', trackPosition + 2);
                } else {
                    this.displaySounds.attr('nextSound', this.playlist.tracks[0]);
                    this.displaySounds.attr('nextTrackPosition', 1);
                }
            }
        });

        return new Player('body');
    }
);