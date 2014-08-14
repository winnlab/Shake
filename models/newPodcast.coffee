mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId

NewPodcastSchemaFields =
		name:
				type: String
				required: true
		author:
				type: String
				required: true
		date:
				type: String
				required: false

options =
		collection: 'newPodcasts'

NewPodcastSchema = new mongoose.Schema NewPodcastSchemaFields, options

module.exports =  mongoose.model 'NewPodcast', NewPodcastSchema