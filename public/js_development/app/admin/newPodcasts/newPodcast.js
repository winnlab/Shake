define(
    [
        'canjs',
        'core/appState'
    ],

    function (can, appState) {

        return can.Control.extend({
            defaults: {
                newPodcastForm: '.setNewPodcast',
                viewpath: 'app/newPodcasts/views/'
            }
        }, {
            init: function () {
                var options = this.options;

                this.element.html(can.view(options.viewpath + 'set.stache', {
                    newPodcast: options.newPodcast
                }));
            },

            '{newPodcastForm} submit': function (el, ev) {
                ev.preventDefault();

                var self = this,
                    newPodcastData = can.deparam(el.serialize()),
                    newPodcast = self.options.newPodcast;

                if (!newPodcastData.active) {
                    newPodcastData.active = false;
                }

                newPodcast.attr(newPodcastData);

                newPodcast.save()
                    .done(function() {
                        can.route.attr({'entity_id': newPodcast.attr('_id')});
                        self.setNotification('success', 'Анонс подкаста "' + newPodcast.name + '" успешно сохранен!')
                    })
                    .fail(function (newPodcast) {
                        console.error(newPodcast);
                        self.setNotification('error', 'Ошибка сохранения анонса подкаста "' + newPodcast.name + '"!')
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