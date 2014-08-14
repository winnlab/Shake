define([
	'canjs'
],
	function (can) {

		return can.Control.extend({
			init: function () {
				var options = this.options;

				if (!options.state) {
					options.state = new can.Map();
				}

				this.setViewWidth();
				this.setViewHeight();
				this.setAspectRatio();
			},

			setViewWidth: function () {
				var state = this.options.state,
					sceneWidth = state.attr('scene.width'),
					originSceneWidth = state.attr('scene.originWidth'),
					width = (window.innerWidth
					? window.innerWidth
					: (document.documentElement.clientWidth
						? document.documentElement.clientWidth
						: document.body.offsetWidth));


				this.options.state.attr('scene.width', 
					width < sceneWidth
						? width
						: width > originSceneWidth
							? originSceneWidth
							: width
				);
				this.options.state.attr('size.width', width);
			},

			setViewHeight: function () {				
				var viewportHeight = (window.innerHeight
					? window.innerHeight
					: (document.documentElement.clientHeight
						? document.documentElement.clientHeight
						: document.body.offsetHeight));

				$('body').css('min-height', viewportHeight);
				this.options.state.attr('size.height', viewportHeight);
			},

			setAspectRatio: function () {
				var state = this.options.state,
					sceneWidth = state.attr('scene.width'),
					sceneHeight = state.attr('scene.height');

				this.options.state.attr('scene.aspectRatio', sceneWidth / sceneHeight);
			},

			'{window} resize': function () {
				this.setViewWidth();
				this.setViewHeight();
				this.setAspectRatio();
			}
		});

	}
);