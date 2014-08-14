define(
    [
        'canjs'
    ],

    function (can) {

        return can.Model.extend({
            id: "_id",
            findAll: "GET /admin/newPodcast",
            create:  'POST /admin/newPodcast',
            update:  'PUT /admin/newPodcast',
            destroy: 'DELETE /admin/newPodcast/{id}',
            parseModel: function (data) {
                if (data.success) {
                    data = data.message;
                }
                return data;
            },
            parseModels: function (data) {
                return data.message.newPodcasts;
            }
        }, {});

    }
);