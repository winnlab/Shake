define([
	'canjs'
],
	function (can) {

		return can.Control.extend({
			init: function () {
				var options = this.options;

				if (!options.state) {
					options.state = new can.Map({
						width: 0,
						height: 0
					});
				}

				this.setViewWidth();
				this.setViewHeight();
			},

			setViewWidth: function () {
				var width = (window.innerWidth
					? window.innerWidth
					: (document.documentElement.clientWidth
						? document.documentElement.clientWidth
						: document.body.offsetWidth));

				this.options.state.attr('size.width', width);
			},

			setViewHeight: function () {
				$('body').removeAttr('style');
				var htmlHeight = $('html').height(),
					healthWarnHeight = Number($('body').css('font-size').replace(/px$/, "")) * 3,
					viewportHeight = (window.innerHeight
					? window.innerHeight
					: (document.documentElement.clientHeight
						? document.documentElement.clientHeight
						: document.body.offsetHeight)),
					height = (htmlHeight > viewportHeight ? htmlHeight : viewportHeight)  + healthWarnHeight;				
				$('body').css('min-height', height);

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
			}
		});

	}
);