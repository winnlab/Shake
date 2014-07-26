require.config({
	baseUrl: '/js/lib',
	paths: {
		app: '../app/admin',
		core: '../app/admin/core',
		can: 'canjs/amd/can/',
		canjs: 'canjs/amd/can',
		jquery: 'jquery/dist/jquery',
		underscore: 'underscore/underscore'
	},
	map: {
		'*': {
			'css': 'require-css/css'
		}
	},
	shim: {
		'jquery': {
			exports: '$'
		},
		'underscore': {
			exports: '_'
		},
		'canjs': {
			deps: ['jquery', 'can/route/pushstate', 'can/map/define', 'can/map/delegate', 'can/map/sort', 'can/list/promise']
		},
		'core/upload': {
			deps: ['jquery.form']
		}
	}
});

require([		
		'core/router',
		'core/notification',
		'core/config',
		'core/appState',
		'core/tabs',
		'core/upload',
		'core/viewHelpers',

		'css!core/css/style'
	],
	function (Router, initNotification, config) {

		new Router(document.body, config.router);
		initNotification();

	}
);