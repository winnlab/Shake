define(
    [
        'canjs',
        'core/appState'
    ],

    function (can, appState) {

        return can.Control.extend({
            defaults: {
	            feedbackItemForm: '.setFeedbackItem',
                viewpath: 'app/feedback/views/'
            }
        }, {
            init: function () {
                var options = this.options;

                this.element.html(can.view(options.viewpath + 'set.stache', {
                    feedbackItem: options.feedbackItem
                }));
            },

            '{feedbackItemForm} submit': function (el, ev) {
                ev.preventDefault();

                var self = this,
	                feedbackItemData = can.deparam(el.serialize()),
	                feedbackItem = self.options.feedbackItem;

                if (!feedbackItemData.active) {
	                feedbackItemData.active = false;
                }

	            feedbackItem.attr(feedbackItemData);

	            feedbackItem.save()
                    .done(function() {
                        can.route.attr({'entity_id': feedbackItem.attr('_id')});
                        self.setNotification('success', 'Анонс подкаста "' + feedbackItem.name + '" успешно сохранен!')
                    })
                    .fail(function (feedbackItem) {
                        console.error(feedbackItem);
                        self.setNotification('error', 'Ошибка сохранения анонса подкаста "' + feedbackItem.name + '"!')
                    });

            },

            setNotification: function (status, msg) {
                appState.attr('notification', {
                    status: status,
                    msg: msg
                });
            }
        });

    }
);