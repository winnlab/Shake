mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId
Mixed = mongoose.Schema.Types.Mixed
Validate = require '../utils/validate'

schema = new mongoose.Schema
	_id:
		type: ObjectId
		required: true
	created_at:
		type: Date
		required: true
	login:
		type: String
		required: false
	email:
		type: String
		required: false
		trim: true
		match: Validate.email
	type: # 0 - direct, 1 - friend
		type: Number
		required: true
	invited_by:
		type: String
		required: false
	active:
		type: Boolean
		required: true
,
	collection: 'client'

module.exports = mongoose.model 'Client', schema