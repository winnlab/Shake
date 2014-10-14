mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId

SoundCloudImageSchemaFields =
	playlistId:
		type: Number
		required: true
	image:
		type: String
		required: true

options =
	collection: 'soundCloudImages'

SoundCloudImageSchema = new mongoose.Schema SoundCloudImageSchemaFields, options

module.exports =  mongoose.model 'SoundCloudImage', SoundCloudImageSchema