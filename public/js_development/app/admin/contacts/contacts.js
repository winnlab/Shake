define(
    [
        'canjs',
        'underscore',
        'app/contacts/contact',
        'app/contacts/contactsModel',
        'core/appState',
        'css!app/contacts/css/contacts'
    ],

    function (can, _, Contact, contactsModel, appState) {

        var ViewModel = can.Map.extend({
            define: {
                viewState: {
                    value: 'list'
                }
            },
            reOrder: function (attr, key) {
                key = key || 'position';
                var list = this.attr(attr);
                list.sort(function (a, b) {
                    return a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;
                });
            },
            toList: function () {
                can.route.attr({
                    module: 'contacts',
                    action: undefined,
                    entity_id: undefined
                });
                this.attr('viewState', 'list');
            },
            toEntity: function (contact_id) {
                can.route.attr({
                    entity_id: contact_id,
                    action: 'set',
                    module: 'contacts'
                });
            }
        });

        return can.Control.extend({
            defaults: {
                viewpath: 'app/contacts/views/',
                contactsModel: contactsModel
            }
        }, {
            init: function () {

                var self = this,
                    route = can.route.attr();

                viewModel = new ViewModel();

                viewModel.attr({
                    'contacts': new contactsModel.List({})
                });

                if (route.entity_id && route.action) {
                    viewModel.attr('viewState', 'edit');
                    can.when(
                            viewModel.attr('contacts')
                        ).then(function () {
                            self.setContact(route.entity_id, route.action);
                        });
                }

                self.element.html(can.view(self.options.viewpath + 'index.stache', viewModel));

                this.viewModel = viewModel;
            },

            /*
             * Routes
             */

            ':module/:id route': function (data) {
                var viewModel = this.viewModel,
                    viewState = viewModel.attr('viewState');

                if (data.module === 'contacts' && viewState !== 'list') {
                    viewModel.toList();
                }
            },

            ':module/:action/:entity_id route': function (data) {
                if (data.module === 'contacts') {
                    this.setContact(data.entity_id, data.action);
                }
            },

            /*
             * Set fragment functions
             */

            '.addContact click': function (el) {
                this.viewModel.toEntity('0');
            },

            '.editContact click': function (el) {
                var contact = el.parents('.contact').data('contact');
                this.viewModel.toEntity(contact.attr('_id'));
            },

            setContact: function (id) {

                this.viewModel.attr({
                    'id': Date.now(),
                    'viewState': 'edit'
                });

                var self = this,
                    formWrap = self.element.find('.setContactWrap'),
                    contact = _.find(self.viewModel.attr('contacts'), function (contact) {
                        return contact && contact.attr('_id') === id;
                    });

                new Contact(formWrap, {
                    contact: contact ? contact : new contactsModel()
                });
            },

            '.removeContact click': function (el) {
                var contact = el.parents('.contact').data('contact');

                if (confirm('Вы действительно хотите удалить контакт?')) {
                    contact.destroy().always(function (contact, status, def) {
                        appState.attr('notification', {
                            status: status,
                            msg: def.responseJSON.message
                        })
                    });
                }
            },

            '{contactsModel} updated': function () {
                this.viewModel.reOrder('contacts');
            },

            '{contactsModel} created': function (Model, ev, contact) {
                var self = this,
                    contacts = self.viewModel.attr('contacts');

                contacts.push(contact);
                this.viewModel.reOrder('contacts');
            }
        });

    }
);