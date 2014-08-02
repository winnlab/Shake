define({
	router: {
		base: '/',
		modulesContainer: 'body',
		routes: [{
			route: ':module',
			defaults: {
				module: 'checker'
			}
		}],
		modules: [{
			name: 'checker',
			path: 'app/checker/checker',
			title: ''
		}, {
			name: 'products',
			path: 'app/products/products',
			title: ''
		}, {
			name: 'product',
			path: 'app/product/product',
			title: ''
		}, {
			name: 'fragments',
			path: 'app/fragments/fragments',
			title: ''
		}]
	}
});