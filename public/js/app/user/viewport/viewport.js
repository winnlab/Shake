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
					viewportHeight = (window.innerHeight
					? window.innerHeight
					: (document.documentElement.clientHeight
						? document.documentElement.clientHeight
						: document.body.offsetHeight)),
					height = htmlHeight > viewportHeight ? htmlHeight : viewportHeight;

				console.log(htmlHeight, viewportHeight);

				$('body').css('min-height', height);

				this.options.state.attr('size.height', height);
			},

			'{window} resize': function () {
				this.setViewWidth();
				this.setViewHeight();
			}
		});

	}
);