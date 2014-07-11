mongoose = require 'mongoose'

StatFields =
	host: 
		type: String
		required: true
	userAgent:
		type: String
		required: true
	path:
		type: String
		required: true
	created_on:
		type: Number
		default: Date.now

options =
	collection: "stats"

StatSchema = new mongoose.Schema StatFields, options

module.exports = mongoose.model 'Stat', StatSchema