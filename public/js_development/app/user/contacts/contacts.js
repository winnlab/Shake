define([
    'canjs',
    'core/appState',
    'css!app/contacts/css/contacts.css'
],
    function (can, appState) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/contacts/'
            }
        }, {
            init: function () {
                var self = this;

                self.element.html(
                    can.view(self.options.viewpath + 'index.stache', appState)
                );

                if (self.options.isReady) {
                    self.options.isReady.resolve();
                }
            },

	        '#feedbackForm submit': function (el, ev) {
		        var self = this;
		        ev.preventDefault();
		        var $button = el.find('button');
		        $button.attr('disabled', 'disabled');

		        can.ajax({
			        url: '/saveFeedback',
			        type: 'POST',
			        data: can.deparam(el.serialize()),
			        success: function (feedback) {

				        var $successWrapper = $('.feedbackSuccess');

				        $successWrapper.fadeIn();
				        setTimeout(function(){
					        $successWrapper.fadeOut();
					        $button.removeAttr('disabled');
				        },5000);
			        }
		        });
	        }
        });

    }
);