define({
	router: {
		base: '/',
		modulesContainer: 'body',
		routes: [{
			route: ':module',
			defaults: {
				module: 'checker'
			}
		}, {
            route: ':module/:id'
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
		}, {
            name: 'podcast',
            path: 'app/podcast/podcast',
            title: ''
        }, {
            name: 'contacts',
            path: 'app/contacts/contacts',
            title: ''
        }, {
            name: 'shakeit',
            path: 'app/shakeit/shakeit',
            title: ''
        }, {
            name: 'podcasts',
            path: 'app/podcasts/podcasts',
            title: ''
        }]
	}
});