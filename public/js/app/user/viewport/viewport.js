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

				this.options.state.attr('size.height', height);
			},

			setAspectRatio: function () {
				this.options.state.attr('size.aspectRatio', window.innerWidth / window.innerHeight);
			},

			'{window} resize': function () {
				this.setViewWidth();
				this.setViewHeight();
				this.setAspectRatio();
			}
		});

	}
);