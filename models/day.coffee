mongoose = require 'mongoose'

ObjectId = mongoose.Schema.Types.ObjectId

DayShemaFields = 
	name:
		type: String
		required: true
	position:
		type: Number
		required: true
	active:
		type: Boolean
		default: true

options =
	collection: 'days'

DayShema = new mongoose.Schema DayShemaFields, options

module.exports =  mongoose.model 'Day', DayShema