define(
    [
        'canjs'
    ],

    function (can) {

        return can.Model.extend({
            id: "_id",
            findAll: "GET /admin/soundCloudImage",
            create:  'POST /admin/soundCloudImage',
            update:  'PUT /admin/soundCloudImage',
            destroy: 'DELETE /admin/soundCloudImage/{id}',
            parseModel: function (data) {
                if (data.success) {
                    data = data.message;
                }
                return data;
            },
            parseModels: function (data) {
                return data.message.soundCloudImages;
            }
        }, {});

    }
);