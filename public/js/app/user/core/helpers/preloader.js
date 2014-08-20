define([
	'canjs',
	'underscore'
],
	function (can, _) {
		return can.Map.extend({

			init: function () {
				this.loadImages();
			},

			namespace: 'preloader',

			loaded: 0,

			loadImages: function (folder) {
				this.folder = this.folder || '/uploads/';
				console.log(this.images);
				_.each(this.images, function(imgSrc) {
					if (imgSrc) {
						this.loadImage(this.folder + imgSrc);
					}
				}.bind(this));
			},
			
			loadImage: function (imgSrc) {
				var image = new Image();

				$(image).on('load.' + this.namespace + ' error.' + this.namespace, this.imageIsLoaded.bind(this));

				image.src = imgSrc;
			},

			imageIsLoaded: function () {
				console.log('imageIsLoaded');
				this.loaded += 1;

				if (this.loaded == this.images.length && this.callback) {
					this.callback();
				}
			}
		});
	}
);