require.config({
	baseUrl: '/js/lib',
	urlArgs: 'cb=' + Math.random(),
	paths: {
		app: '../app/user',
		core: '../app/user/core',
		helpers: '../app/user/core/helpers',
		can: 'canjs/amd/can/',
		canjs: 'canjs/amd/can',
		jquery: 'jquery/dist/jquery',
		underscore: 'underscore/underscore',
		managers: '../app/user/managers',

		Class: 'jsOOP/Class',
		baseClass: 'jsOOP/baseClass',
		three: 'three.r60',
		TweenLite: 'greensock/TweenLite',
		CSSPlugin: 'greensock/CSSPlugin',
		Ease: 'greensock/EasePack',
		ScrollToPlugin: 'greensock/ScrollToPlugin',
		velocity: 'velocity/velocity.min'
	},
	map: {
		'*': {
			'css': 'require-css/css'
		}
	},
	shim: {
		'jquery': {
			deps: ['requestAnimationFrame'],
			exports: '$'
		},
		'underscore': {
			exports: '_'
		},
		'canjs': {
			deps: ['jquery', 'can/route/pushstate', 'can/map/define', 'can/map/delegate', 'can/list/promise']
		},
		'three': {
            exports: 'THREE'
        },
        TweenLite: {
            deps: ['CSSPlugin', 'Ease', 'ScrollToPlugin']
        }
	}
});

require(['jquery'], function($) {
	var specs = [];

	specs.push('helpers/preloader_test');

	$(function() {		
		require(specs, function(preloader_test) {			
			executeTests();			
		});
	});
});