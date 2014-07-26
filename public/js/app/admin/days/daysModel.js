define(
	[
		'canjs'		
	], 

	function (can) {

		return can.Model.extend({
			id: "_id",
			findAll: "GET /admin/day",
			create:  'POST /admin/day',
			update:  'PUT /admin/day',
			destroy: 'DELETE /admin/day/{id}',
			parseModel: function (data) {
				if (data.success) {
					data = data.message;
				}
				return data;
			},
			parseModels: function (data) {
				return data.message.days;
			}
		}, {});

	}
); 