mongoose = require 'mongoose'
ObjectId = mongoose.Schema.Types.ObjectId

schema = new mongoose.Schema
	_id:
		type: String
		required: true
	name:
		type: String
		required: true
,
	collection: 'permissions'

module.exports = mongoose.model 'Permission', schema