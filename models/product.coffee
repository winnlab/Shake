mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId

ProductShemaFields =
	lang: [
		language_id:
			type: ObjectId
			ref: 'Language'
		name: 
			type: String
			trim: true
		description:
			type: String
			trim: true
	]
	link: 
		type: String
		trim: true
		required: true
	img:
		bottle:
			type: String
			default: ''
		bottle_list:
			type: String
			default: ''
		can:
			type: String
			default: ''
		can_list:
			type: String
			default: ''
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