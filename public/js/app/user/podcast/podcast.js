define([
    'canjs',
    'underscore',
    'core/appState',
    'soundcloud/sdk',
    'css!app/podcast/css/podcast.css'
],
    function (can, _, appState) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/podcast/',
                playlistPath: '/playlists/45428734',
                clientId: '36d9ee3197b18f8c51dbc9a24ef5cc70'
            }
        }, {
            init: function () {
                var self = this;
                this.playlist = false;
                this.currentTrackPosition = 0;
                this.currentSound = null;

                this.displaySounds = new can.Map({
                    currentSound: null,
                    prevSound: null,
                    nextSound: null,
                    currentTrackPosition: null,
                    prevTrackPosition: null,
                    nextTrackPosition: null
                });

                self.element.html(
                    can.view(self.options.viewpath + 'index.stache', {
                        displaySounds: this.displaySounds,
                        currentTrackPosition: this.currentTrackPosition,
                        appState: appState
                    })
                );

                this.initSoundCloudApi();
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
                        self.initMarquee(playlist.tracks);
                    }
                );
            },

            playRandomTrack: function ( playlist ) {
                var self = this;
                var randomTrackPosition = Math.floor(Math.random() * (parseInt(playlist.track_count) - 1));

                this.playTrack(randomTrackPosition);
            },

            '.playTrack click': function () {
                this.currentSound.togglePause();
            },

            '.nextTrack click': function () {
                this.playNextTrack();
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

            '.prevTrack click': function () {
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
            },

            initMarquee: function ( tracks ) {
                var self = this;

                $('#marquee', this.element).html(
                    can.view(self.options.viewpath + 'marquee.stache', {tracks: tracks})
                );
            },

            '.trackTitleAnchor click': function ( el, ev ) {
                ev.preventDefault();

                var trackId = parseInt(el.attr('href'));
                var trackPosition = parseInt(this.getTrackPosition(trackId));

                if (trackPosition) {
                    this.currentSound.stop();
                    this.currentTrackPosition = trackPosition;
                    this.playTrack(this.currentTrackPosition);
                }
            },

            getTrackPosition: function ( trackId ) {
                for ( var i in this.playlist.tracks ) {
                    if (this.playlist.tracks.hasOwnProperty(i)) {
                        if ( this.playlist.tracks[i].id == trackId ) {
                            return i;
                        }
                    }
                }
                return false;
            }
        });
    }
);