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

				podcast: {
					isPlayed: false,
					currentTitle: null,
					currentSound: null,
					prevSound: null,
					nextSound: null,
					currentTrackPosition: null,
					prevTrackPosition: null,
					nextTrackPosition: null
				},

				fontSize: function () {
					return Number($('body').css('font-size').replace(/px$/, ""));
				},

				size: {
					width: 0,
					height: 0,
					aspectRatio: 0,
					getHeight: function () {
						return $('body').height();
					}
				},

				scene: {
					originWidth: 800,
					width: 800,
					height: 300
				},

				// Data
				locale: data && data.locale ? data.locale : false,
				lang: data && data.lang ? '/' + data.lang + '/' : '/',
				products: data && data.products ? data.products : false,
				product: data && data.product ? data.product : false,
				parties: data && data.parties ? data.parties : false

			}),
			appState = new AppState();

		window['appState'] = appState;
		// delete window.data;

		return appState;
	}
);