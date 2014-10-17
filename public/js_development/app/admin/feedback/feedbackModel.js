define(
    [
        'canjs'
    ],

    function (can) {

        return can.Model.extend({
            id: "_id",
            findAll: "GET /admin/feedback",
            destroy: 'DELETE /admin/feedback/{id}',
            parseModel: function (data) {
                if (data.success) {
                    data = data.message;
                }
                return data;
            },
            parseModels: function (data) {
                return data.message.feedback;
            }
        }, {});

    }
);