define([
	'canjs'
],
	function (can) {

		var AppState = can.Map.extend({

				//Settings
				imgPath: '/img/user/',
				uploadPath: '/uploads/',

				//Dynamic properties
				// can be false or true
				is18Show: true,
				// can be 'closed' or 'opened'
				menu: 'closed',
				// can be 'bottle' or 'can'
				viewMode: 'bottle',

                muted: false,
                paused: false,

/*				podcast: {
                    isPlayed: false,
                    currentTitle: null,
                    currentSound: null,
                    prevSound: null,
                    nextSound: null,
                    currentTrackPosition: null,
                    prevTrackPosition: null,
                    nextTrackPosition: null,

                    currentPlaylist: null,
                    prevPlaylist: null,
                    nextPlaylist: null
                },*/

                podcastChange: null,
                podcast: {
                    playlists: null,

                    currentTitle: null,
                    currentSound: null,

                    currentPlaylist: null,
                    prevPlaylist: null,
                    nextPlaylist: null,

                    currentPlaylistPosition: null,
                    currentPlaylistSystemPosition: null,
                    prevPlaylistPosition: null,
                    nextPlaylistPosition: null
                },

				fontSize: function () {
					return Number($('body').css('font-size').replace(/px$/, ""));
				},

				getPageHeight: function () {					
					return $('module.active').outerHeight();
				},

				size: {
					width: 0,
					height: 0,
					aspectRatio: 0					
				},

				scene: {
					originWidth: 800,
					width: 800,
					height: 300
				},

				// Data
				locale: data && data.locale ? data.locale : false,
				lang: data && data.lang ? '/' + data.lang + '/' : '/',
				langs: data && data.langs ? data.langs : false,
				products: data && data.products ? data.products : false,
                product: data && data.product ? data.product : false,
				parties: data && data.parties ? data.parties : false,
                newPodcasts: data && data.newPodcasts ? data.newPodcasts : false,
				soundCloudImages: data && data.soundCloudImages ? data.soundCloudImages : false,

                getProductImages: function (props) {
					var products = this.attr('products'),
						imgs = [];
					props = props || ['bottle', 'can'];

					for (var i = products.length - 1; i >= 0; i--) {
						for (var j = props.length - 1; j >= 0; j--) {
							if (products[i].img[props[j]]) {
								imgs.push(products[i].img[props[j]]);
							}
						}
					}

					return imgs;
				}

			}),
			appState = new AppState();

		window['appState'] = appState;
		// delete window.data;

		return appState;
	}
);