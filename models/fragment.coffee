mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId
Mixed = mongoose.Schema.Types.Mixed

FragmentShemaFields = 
	product_id:
		type: String
		ref: 'Product'
	day_id:
		type: ObjectId
		ref: 'Day'
	name:
		type: String
		required: true
	description:
		type: String
		required: true	
	position:
		type: Number
		required: true
	video: 
		type: Mixed
	img: 
		type: String
		default: ''

options =
	collection: 'fragments'

FragmentShema = new mongoose.Schema FragmentShemaFields, options

module.exports =  mongoose.model 'Fragment', FragmentShema