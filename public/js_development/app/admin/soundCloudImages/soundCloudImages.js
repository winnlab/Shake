'use strict';

define(
    [
        'canjs',
        'underscore',
        'app/soundCloudImages/soundCloudImage',
        'app/soundCloudImages/soundCloudImagesModel',
	    'soundcloud/sdk',
        'css!app/soundCloudImages/css/soundCloudImages'
    ],

    function (can, _, SoundCloudImage, soundCloudImagesModel) {

        var Playlist = can.Map.extend({
		        uploaded: function (name, value) {
			        if (!this.attr('image')) {
				        this.attr('image', {});
			        }
			        var img = this.attr('image');
			        img.attr(name, value);
		        },
		        removeUploaded: function (name) {
			        var img = this.attr('image');
			        img.attr(name, undefined);
		        }
	        }),

        ViewModel = can.Map.extend({
            define: {
                viewState: {
                    value: 'list'
                }
            },
            reOrder: function (attr, key) {
                key = key || 'position';
                var list = this.attr(attr);
                list.sort(function (a, b) {
                    return a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;
                });
            },
            toList: function () {
                can.route.attr({
                    module: 'soundCloudImages',
                    action: undefined,
                    entity_id: undefined
                });
                this.attr('viewState', 'list');
            },
            toEntity: function (newPodcast_id) {
                can.route.attr({
                    entity_id: newPodcast_id.toString(),
                    action: 'set',
                    module: 'soundCloudImages'
                });
            },

	        mergeData: function (images, playlists) {
		        return _.map(playlists, function (playlist) {
			        var image = _.find(images, function(image) {
				        return image.attr('playlistId') === playlist.attr('id');
			        });
			        playlist.attr('image', image ? image : new soundCloudImagesModel());
			        return playlist;
		        });
	        }
        });

        return can.Control.extend({
            defaults: {
                viewpath: 'app/soundCloudImages/views/',
                soundCloudImagesModel: soundCloudImagesModel,
	            userPlaylistsLink: '/users/107070408/playlists',
	            clientId: '36d9ee3197b18f8c51dbc9a24ef5cc70'
            }
        }, {
            init: function () {

                var self = this,
                    route = can.route.attr(),
	                viewModel = new ViewModel(),
	                def = can.Deferred(),
	                data = new can.List(def);

	            self.playlists = null;
	            self.playlistDef = can.Deferred();

	            self.initSoundCloud();

                viewModel.attr({
                    'soundCloudImages': data
                });

	            can.when(soundCloudImagesModel.findAll({}), self.playlistDef).then(function(images, playlists) {
		            playlists = _.map(playlists, function(playlist){
			            return new Playlist(playlist);
		            })

		            def.resolve( viewModel.mergeData(images, playlists) );
	            });

                if (route.entity_id && route.action) {
                    viewModel.attr('viewState', 'edit');
                    can.when(
                            viewModel.attr('soundCloudImages')
                        ).then(function () {
                            self.setSoundCloudImage(route.entity_id, route.action);
                        });
                }

                self.element.html(can.view(self.options.viewpath + 'index.stache', viewModel));

                this.viewModel = viewModel;
            },

	        initSoundCloud: function () {
		        var self = this;

		        SC.initialize({
			        client_id: self.options.clientId
		        });

		        self.getPlaylists();
	        },

	        getPlaylists: function () {
		        var self = this;

		        SC.get(
			        self.options.userPlaylistsLink,
			        function (playlists) {
				        self.playlistDef.resolve(playlists);
			        }
		        );
	        },

            /*
             * Routes
             */

            ':module route': function (data) {
                var viewModel = this.viewModel,
                    viewState = viewModel.attr('viewState');

                if (data.module === 'soundCloudImages' && viewState !== 'list') {
                    viewModel.toList();
                }
            },

            ':module/:action/:entity_id route': function (data) {
                if (data.module === 'soundCloudImages') {
                    this.setSoundCloudImage(data.entity_id, data.action);
                }
            },

            /*
             * Set fragment functions
             */

            '.editSoundCloudImage click': function (el) {
                var soundCloudImage = el.parents('.soundCloudImage').data('soundCloudImage');
                this.viewModel.toEntity(soundCloudImage.attr('id'));
            },

            setSoundCloudImage: function (id) {
                this.viewModel.attr({
                    'id': Date.now(),
                    'viewState': 'edit'
                });

                var self = this,
                    formWrap = self.element.find('.setSoundCloudImageWrap'),
                    soundCloudImage = _.find(self.viewModel.attr('soundCloudImages'), function (soundCloudImage) {
                        return soundCloudImage && soundCloudImage.attr('id') == id;
                    });

                new SoundCloudImage(formWrap, {
                    soundCloudImage: soundCloudImage
                });
            }

        });

    }
);