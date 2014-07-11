mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId

FragmentShemaFields = 
	product_id:
		type: String
		ref: 'Product'
	name:
		type: String
		required: true
	description:
		type: String
		required: true
	video: 
		type: String
		default: ''
	img: 
		type: String
		default: ''

options =
	collection: 'fragments'

FragmentShema = new mongoose.Schema FragmentShemaFields, options

module.exports =  mongoose.model 'Fragment', FragmentShema