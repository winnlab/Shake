define([
	'canjs',
	'underscore'
],
	function (can, _) {
		return can.Map({

			namespace: 'preloader',
			
			loadImage: function (imgSrc) {
				var image = new Image();

				$(image).on('load.' + this.namespace + ' error.' + this.namespace, function (event) {
					// this.loadedImages.push(image.src);
				});

				image.src = imgSrc;
			},

			loadImages: function (list, folder) {
				folder = folder || '/uploads/';

				_.each(list, function(imgSrc) {
					if (imgSrc) {
						this.loadImage(folder + imgSrc);
					}
				}.bind(this));
			}
		});
	}
);