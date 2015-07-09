mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId

SchemaFields =
	email:
		type: String
		required: false
		trim: true
	name:
		type: String
		required: false
		trim: true
	subject:
		type: String
		required: false
		trim: true
	message:
		type: String
		required: false
		trim: true

options =
	collection: 'feedback'

Schema = new mongoose.Schema SchemaFields, options

module.exports =  mongoose.model 'Feedback', Schema