async = require 'async'
_ = require 'underscore'
_.str = require 'underscore.string'

_.mixin _.str.exports()

Database = require './database'
Logger = require '../lib/logger'
Migrate = require './migrate'
Application = require './application'
Notifier = require '../lib/notifier'
AuthStartegies = require './auth'
ModelPreloader = require './mpload'

appPort = 3000

async.waterfall [
	(next) ->
		Logger.log 'info', 'Pre initialization succeeded'
		Logger.init next
	(next) ->
		Logger.log 'info', 'Logger is initializated'

		Migrate.init next
	(next) ->		
		Logger.log 'info', 'Migrate is initializated'

		ModelPreloader "#{process.cwd()}/models/", next
	(next) ->
		Logger.log 'info', 'Models are preloaded'

		Application.init next
	(next) ->
		Logger.log 'info', "Application is initializated"

		AuthStartegies.init next
	(next) ->
		Logger.log 'info', 'Auth is initializated'

		Notifier.init Application.server, next
	(next) ->
		Logger.log 'info', 'Notifier is initializated'

		Application.listen appPort, next
	(next) ->
		Logger.log 'info', "Application is binded to #{appPort}"

], (err) ->
	Logger.error 'Init error: ', err