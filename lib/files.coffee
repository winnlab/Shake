_ = require 'underscore'
fs = require 'fs'
async = require 'async'

exports.unlinkArray = (arr, path, cb) ->
	async.each arr, (item, proceed) ->
		file = path + item
		if item
			fs.exists file, (exists) ->
				if exists
					fs.unlink file, proceed 
				else
					proceed()
		else
			proceed()
	, cb
