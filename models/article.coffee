mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId
Mixed = mongoose.Schema.Types.Mixed

schema = new mongoose.Schema
	_id:
		type: ObjectId
		required: true
	type: # 0 - news, 1 - sales, 2 - feeding
		type: Number
		required: true
	date:
		type: Date
		required: false
	desc_image:
		type: Array
		required: false
	desc_title:
		type: String
		required: true
	desc_shorttext:
		type: String
		required: false
	desc_text:
		type: String
		required: false
	active:
		type: Boolean
		required: true
,
	collection: 'article'



module.exports = mongoose.model 'Article', schema
