define(
    [
        'canjs',
        'core/appState',
	    '../../../admin/plugins/ckeditor/ckeditor'
    ],

    function (can, appState) {

        return can.Control.extend({
            defaults: {
	            contactForm: '.setContact',
                viewpath: 'app/contacts/views/'
            }
        }, {
            init: function () {
                var options = this.options;

                this.element.html(can.view(options.viewpath + 'set.stache', {
                    contact: options.contact,
	                langs: langs
                }));
            },

            '{contactForm} submit': function (el, ev) {
                ev.preventDefault();

                var self = this,
                    contactData = can.deparam(el.serialize()),
                    contact = self.options.contact;

                if (!contactData.active) {
                    contactData.active = false;
                }

                contact.attr(contactData);

                contact.save()
                    .done(function() {
                        can.route.attr({'entity_id': contact.attr('_id')});
                        self.setNotification('success', 'Контакт успешно сохранен!')
                    })
                    .fail(function (contact) {
                        console.error(contact);
                        self.setNotification('error', 'Ошибка сохранения!')
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