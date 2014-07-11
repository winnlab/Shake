async = require 'async'

metaMigrate = require '../meta/migrate'

checkMigration = (migrate, callback) ->
	Model = require '../models/' + migrate.modelName

	async.each migrate.data, (data, next) ->
		Model.findByIdAndUpdate data._id, data, upsert: true, next
	, callback

exports.init = (callback)->	
	async.each metaMigrate, checkMigration, callback
