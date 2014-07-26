mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId
Mixed = mongoose.Schema.Types.Mixed

ProductShemaFields = 
	name:
		type: String
		required: true
	description:
		type: String
		required: true
	img:
		bottle:
			type: String
		bottle_thumb:
			type: String
		jar:
			type: String
		jar_thumb:
			type: String
	position:
		type: Number
		required: true
	active:
		type: Boolean
		default: true

options =
	collection: 'products'

ProductShema = new mongoose.Schema ProductShemaFields, options

module.exports =  mongoose.model 'Product', ProductShema