Crud = require '../../lib/crud'

crud = new Crud
    modelName: 'Fragment'
    files: [
        name: 'mp3'
        replace: true
        type: 'string'
        parent: 'track'
    ,
        name: 'wav'
        replace: true
        type: 'string'
        parent: 'track'
    ,
        name: 'mp4'
        replace: true
        type: 'string'
        parent: 'video'
    ,
        name: 'webm'
        replace: true
        type: 'string'
        parent: 'video'
    ,
        name: 'ogv'
        replace: true
        type: 'string'
        parent: 'video'
    ,
        name: 'img'
        replace: true
        type: 'string'
    ]

module.exports.rest = crud.request.bind crud
module.exports.restFile = crud.fileRequest.bind crud
