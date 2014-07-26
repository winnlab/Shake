define(
	[
		'canjs'		
	], 

	function (can) {

		return can.Model.extend({
			id: "_id",
			findAll: "GET /admin/product",
			findOne: "GET /admin/product/{id}",
			create:  'POST /admin/product',
			update:  'PUT /admin/product',
			destroy: 'DELETE /admin/product/{id}',
			parseModel: function (data) {
				if (data.success) {
					data = data.message;
				}
				return data;
			},
			parseModels: function (data) {
				return data.message.products;
			}
		}, {
			uploaded: function (name, value) {
				if (!this.attr('img')) {
					this.attr('img', {});
				}
				var imgs = this.attr('img');
				imgs.attr(name, value);
			},
			removeUploaded: function (name) {
				var imgs = this.attr('img');				
				imgs.attr(name, undefined);
			}
		});

	}
); 