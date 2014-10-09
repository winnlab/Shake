'use strict';

define(
    [
        'canjs',
        'core/appState'
    ],

    function (can, appState) {

        return can.Control.extend({
            defaults: {
                soundCloudImageForm: '.setSoundCloudImage',
                viewpath: 'app/soundCloudImages/views/'
            }
        }, {
            init: function () {
                var options = this.options;
                this.element.html(can.view(options.viewpath + 'set.stache', {
                    soundCloudImage: options.soundCloudImage
                }));
            },

            '{soundCloudImageForm} submit': function (el, ev) {
                ev.preventDefault();

                var self = this,
                    soundCloudImageData = can.deparam(el.serialize()),
                    soundCloudImage = self.options.soundCloudImage;

                if (!soundCloudImageData.active) {
                    soundCloudImageData.active = false;
                }

                soundCloudImage.attr(soundCloudImageData);

                soundCloudImage.save()
                    .done(function() {
                        can.route.attr({'entity_id': soundCloudImage.attr('_id')});
                        self.setNotification('success', 'Картинка подкаста успешно сохранена!')
                    })
                    .fail(function (soundCloudImage) {
                        console.error(soundCloudImage);
                        self.setNotification('error', 'Ошибка сохранения картинки подкаста подкаста "' + soundCloudImage.name + '"!')
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