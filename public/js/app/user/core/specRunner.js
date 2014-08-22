require.config({
	baseUrl: '/js/lib',
	paths: {
		app: '../app/user',
		core: '../app/user/core',
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
	},

	waitSeconds: 15
});
