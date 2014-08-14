define({
	router: {
		base: '/admin/',
		modulesContainer: '#moduleContent',
		routes: [{
			route: ':module',
			defaults: {
				module: 'dashboard'
			}
		}],
		modules: [{
			name: 'dashboard',
			path: 'app/dashboard/dashboard',
			title: ''
		}, {
			name: 'products',
			path: 'app/products/products',
			title: ''
		}, {
			name: 'days',
			path: 'app/days/days',
			title: ''
		}, {
			name: 'fragments',
			path: 'app/fragments/fragments',
			title: ''
		}]
	}
});