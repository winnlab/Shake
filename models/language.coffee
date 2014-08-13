mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId

schema = new mongoose.Schema
	_id:
		type: ObjectId
		required: true
	name:
		type: String
		required: true
	isoCode: 
		type: String
		required: true
	active:
		type: Boolean
		default: true
	default: 
		type: Boolean
		default: false
,
	collection: 'languages'

module.exports = mongoose.model 'Language', schema