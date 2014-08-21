define(
    [
        'canjs',
        'underscore',
        'app/newPodcasts/newPodcast',
        'app/newPodcasts/newPodcastsModel',
        'core/appState',
        'css!app/newPodcasts/css/newPodcasts'
    ],

    function (can, _, NewPodcast, newPodcastsModel, appState) {

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
                    module: 'newPodcasts',
                    action: undefined,
                    entity_id: undefined
                });
                this.attr('viewState', 'list');
            },
            toEntity: function (newPodcast_id) {
                can.route.attr({
                    entity_id: newPodcast_id,
                    action: 'set',
                    module: 'newPodcasts'
                });
            }
        });

        return can.Control.extend({
            defaults: {
                viewpath: 'app/newPodcasts/views/',
                newPodcastsModel: newPodcastsModel
            }
        }, {
            init: function () {

                var self = this,
                    route = can.route.attr();

                viewModel = new ViewModel();

                viewModel.attr({
                    'newPodcasts': new newPodcastsModel.List({})
                });

                if (route.entity_id && route.action) {
                    viewModel.attr('viewState', 'edit');
                    can.when(
                            viewModel.attr('newPodcasts')
                        ).then(function () {
                            self.setNewPodcast(route.entity_id, route.action);
                        });
                }

                console.log(viewModel);
                self.element.html(can.view(self.options.viewpath + 'index.stache', viewModel));

                this.viewModel = viewModel;
            },

            /*
             * Routes
             */

            ':module/:id route': function (data) {
                var viewModel = this.viewModel,
                    viewState = viewModel.attr('viewState');

                if (data.module === 'newPodcasts' && viewState !== 'list') {
                    viewModel.toList();
                }
            },

            ':module/:action/:entity_id route': function (data) {
                if (data.module === 'newPodcasts') {
                    this.setNewPodcast(data.entity_id, data.action);
                }
            },

            /*
             * Set fragment functions
             */

            '.addNewPodcast click': function (el) {
                this.viewModel.toEntity('0');
            },

            '.editNewPodcast click': function (el) {
                var newPodcast = el.parents('.newPodcast').data('newPodcast');
                this.viewModel.toEntity(newPodcast.attr('_id'));
            },

            setNewPodcast: function (id) {

                this.viewModel.attr({
                    'id': Date.now(),
                    'viewState': 'edit'
                });

                var self = this,
                    formWrap = self.element.find('.setNewPodcastWrap'),
                    newPodcast = _.find(self.viewModel.attr('newPodcasts'), function (newPodcast) {
                        return newPodcast && newPodcast.attr('_id') === id;
                    });

                new NewPodcast(formWrap, {
                    newPodcast: newPodcast ? newPodcast : new newPodcastsModel()
                });
            },

            '.removeNewPodcast click': function (el) {
                var newPodcast = el.parents('.newPodcast').data('newPodcast');

                if (confirm('Вы действительно хотите удалить анонс подкаста: "' + newPodcast.attr('name') + '"?')) {
                    newPodcast.destroy().always(function (newPodcast, status, def) {
                        appState.attr('notification', {
                            status: status,
                            msg: newPodcast.name + '. '+ def.responseJSON.message
                        })
                    });
                }
            },

            '{newPodcastsModel} updated': function () {
                this.viewModel.reOrder('newPodcasts');
            },

            '{newPodcastsModel} created': function (Model, ev, newPodcast) {
                var self = this,
                    newPodcasts = self.viewModel.attr('newPodcasts');

                newPodcasts.push(newPodcast);
                this.viewModel.reOrder('newPodcasts');
            }
        });

    }
);