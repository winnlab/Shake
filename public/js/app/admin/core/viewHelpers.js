define([
	'canjs'
],
	function (can) {
		
		can.mustache.registerHelper('checkState', function (options) {
			return options.context.attr('viewState') === 'list'
				? options.fn()
				: options.inverse();
		});
		
		can.mustache.registerHelper('createForm', function (id, className) {
			return '<div id="' + id() + '" class="right-side ' + className + '"></div>';
		});

		can.mustache.registerHelper('checkSelected', function (id, anotherId) {
			return id() === anotherId() ? 'selected' : '';
		});

		can.mustache.registerHelper('checkRelation', function (id, relId, options) {
			return id() === relId() ? options.fn() : options.inverse();
		});

		can.mustache.registerHelper('getBoxName', function (index) {
			var classes = ['bg-light-blue', 'bg-red', 'bg-green', 'bg-yellow', 'bg-maroon', 'bg-purple', 'bg-aqua'];
			return classes[index() % classes.length]
		});

		can.mustache.registerHelper('make3Col', function (index) {
			return (index() + 1) % 3 === 0 ? '<div class="clearfix"></div>' : '';
		});

	}
);