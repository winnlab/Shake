define([
	'canjs',
	'underscore'
],
	function (can, _) {
		return can.Map.extend({

			namespace: 'preloader',
			loaded: 0,

			init: function () {
				this.loadImages();
			},

			loadImages: function () {
				this.folder = this.folder || '/uploads/';

				if (this.images.length) {
					_.each(this.images, can.proxy(function(imgSrc) {
						if (imgSrc) {
							this.loadImage(this.folder + imgSrc);
						} else {
							this.loaded += 1;
						}
					}, this));
				} else {
					this.callback && this.callback();
				}

			},

			loadImage: function (imgSrc) {
				var image = new Image();

				$(image).on('load.' + this.namespace + ' error.' + this.namespace, this.imageIsLoaded.bind(this));

				image.src = imgSrc;
			},

			imageIsLoaded: function () {
				this.loaded += 1;

				if (this.loaded == this.images.length && this.callback) {
					this.callback();
				}
			}
		});
	}
);
