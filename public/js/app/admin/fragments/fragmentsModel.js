define(
	[
		'canjs'		
	], 

	function (can) {

		return can.Model.extend({
			id: "_id",
			findAll: "GET /admin/fragment",
			create:  'POST /admin/fragment',
			update:  'PUT /admin/fragment',
			destroy: 'DELETE /admin/fragment/{id}',
			parseModel: function (data) {
				if (data.success) {
					data = data.message;
				}
				return data;
			},
			parseModels: function (data) {
				return data.message.fragments;
			}
		}, {
			getName: function () {
				var name = this.attr('lang.0.name');
				return name ? name : '';
			},
			uploaded: function (name, value) {
				if (name === 'img') {
					this.attr('img', value);
				} else {
					if (!this.attr('video')) {
						this.attr('video', {});
					}
					var videos = this.attr('video');
					videos.attr(name, value);
				}
			},
			removeUploaded: function (name) {
				if (name === 'img') {
					this.attr('img', '');
				} else {
					var videos = this.attr('video');
					videos.attr(name, undefined);
				}
			}
		});

	}
); 