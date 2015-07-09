async = require 'async'
_ = require 'underscore'

View = require '../../lib/view'
Model = require '../../lib/model'
Logger = require '../../lib/logger'
Document = require '../../utils/document'

setFail = (err, res) ->
	msg = "Error in #{__filename}: #{err.message or err}"
	Logger.log 'error', msg
	View.clientFail err, res

exports.findAll = (req, res) ->
	async.waterfall [
		(next)->
			Model 'Feedback', 'find', next, {}, null
		(feedback)->
			View.clientSuccess {feedback}, res
	], (err)->
		setFail err, res

exports.delete = (req, res) ->
	_id = req.params.id

	async.waterfall [
		(next) ->
			Model 'Feedback', 'findOne', next, {_id}
		(doc, next) ->
			doc.remove next
		(next) ->
			View.clientSuccess 'Запись успешно удалена!', res
	], (err) ->
		setFail err, res