define([
	'canjs',
	'underscore'
],
	function (can, _) {
		return can.Map({

			init: function () {
				this.loadImages();
			},

			namespace: 'preloader',
			
			loadImage: function (imgSrc) {
				var image = new Image();

				$(image).on('load.' + this.namespace + ' error.' + this.namespace, function (event) {
					// this.loaded.push(image.src);
				});

				image.src = imgSrc;
			},

			loadImages: function (folder) {				
				this.folder = this.folder || '/uploads/';

				_.each(this.images, function(imgSrc) {
					if (imgSrc) {
						this.loadImage(this.folder + imgSrc);
					}
				}.bind(this));
			}
		});
	}
);