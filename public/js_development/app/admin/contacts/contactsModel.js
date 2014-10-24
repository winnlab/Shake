define(
    [
        'canjs'
    ],

    function (can) {

        return can.Model.extend({
            id: "_id",
            findAll: "GET /admin/contact",
            create:  'POST /admin/contact',
            update:  'PUT /admin/contact',
            destroy: 'DELETE /admin/contact/{id}',
            parseModel: function (data) {
                if (data.success) {
                    data = data.message;
                }
                return data;
            },
            parseModels: function (data) {
                return data.message.contacts;
            }
        }, {});

    }
);