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
	position:
		type: Number
		required: true
	active:
		type: Boolean
		default: true
	video: 
		mp4:
			type: String
			default: ''
		webm:
			type: String
			default: ''
		ogv: 
			type: String
			default: ''
	img: 
		type: String
		default: ''

options =
	collection: 'fragments'

FragmentShema = new mongoose.Schema FragmentShemaFields, options

module.exports =  mongoose.model 'Fragment', FragmentShema