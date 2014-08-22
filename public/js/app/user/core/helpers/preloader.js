define([
	'canjs',
	'underscore'
],
	function (can, _) {
		$('#sandbox').on('click', function() {
			$('#sandbox').append('<p>some another text</p>');
		});

		return can.Construct.extend({

		}, {

			init: function () {
				this.loadImages();
			},

			namespace: 'preloader',

			loaded: 0,

			loadImages: function (folder) {
				this.folder = this.folder || '/uploads/';
				
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
				this.loaded += 1;

				if (this.loaded == this.images.length && this.callback) {
					this.callback();
				}
			}
		});
	}
);