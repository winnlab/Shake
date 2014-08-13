mongoose = require 'mongoose'
ObjectId = mongoose.Schema.Types.ObjectId
Mixed = mongoose.Schema.Types.Mixed

schema = new mongoose.Schema
	_id:
		type: String
		required: true
	name:
		type: String
		required: true
		unique: true
	permissions: [
		type: String
		ref: 'Permission'
	]
,
	collection: 'roles'

module.exports = mongoose.model 'Role', schema