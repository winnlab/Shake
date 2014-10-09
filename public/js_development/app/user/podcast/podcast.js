define([
    'canjs',
    'underscore',
    'core/appState',
	'core/helpers/preloader',
    'app/soundCloudWidget/soundCloudWidget',
    'css!app/podcast/css/podcast.css'
],
    function (can, _, appState, Preloader, scwidget) {

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
                    }, {
	                    makeBg: function (playlist) {
		                    if (playlist()) {
			                    var id = playlist().attr('id'),
			                        image = _.find(appState.attr('soundCloudImages'), function(image){
				                        return image.attr('playlistId') === id;
			                        });

		                        if (image) {
			                        self.element.css('background-image', 'url(/uploads/' + image.image + ')')
		                        } else {
			                        self.element.removeAttr('style')
		                        }
		                    }
		                    return '';
	                    }
                    })
                );

                self.initFuturePodcasts();

                scwidget.initSoundCloudWidget($('#widgetWrapper', self.element), true);

	            if (self.options.isReady) {
		            new Preloader({
		                images: _.pluck(appState.attr('soundCloudImages'), 'image'),
		                callback: function () {
			                self.options.isReady.resolve();
		                }
	                });
	            }

                self.initBindings();
            },

            initBindings: function () {
                appState.bind('podcastChange', function () {
                    console.log('binding');
                    scwidget.playPlaylist($('#widgetWrapper', self.element), appState.attr('podcast.playlists'));
                });
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