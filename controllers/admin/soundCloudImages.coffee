_ = require 'underscore'
fs = require 'fs'
async = require 'async'

View = require '../../lib/view'
Model = require '../../lib/model'
Logger = require '../../lib/logger'
Document = require '../../utils/document'

uploadPath = './uploads/'

setFail = (err, res) ->
	msg = "Error in #{__filename}: #{err.message or err}"
	Logger.log 'error', msg
	View.clientFail err, res

exports.findAll = (req, res) ->
	async.waterfall [
		(next)->
			Model 'SoundCloudImage', 'find', next, {}, null
		(soundCloudImages)->
			View.clientSuccess {soundCloudImages}, res
	], (err)->
		setFail err, res

exports.save = (req, res) ->
	playlistId = req.body.id
	imgName = req.body.name

	async.waterfall [
		(next) ->
			Model 'SoundCloudImage', 'findOne', next, playlistId: playlistId
		(doc, next) ->
			if doc and doc.image
				fs.unlink uploadPath + doc.image, ->
					next null, doc
			else
				next null, doc
		(doc, next) ->
			data =
				playlistId: playlistId
				image: req.files?[imgName]?.name

			if doc
				_.extend doc, data
				doc.save next
			else
				Model 'SoundCloudImage', 'create', next, data
		(doc) ->
			View.clientSuccess name: doc.image, res
	], (err) ->
		setFail err, res

exports.delete = (req, res) ->
	playlistId = req.body.id

	async.waterfall [
		(next) ->
			Model 'SoundCloudImage', 'findOne', next, playlistId: playlistId
		(doc, next) ->
			if doc.image
				fs.unlink uploadPath + doc.image, ->
					next null, doc
			else
				next null, doc
		(doc, next) ->
			doc.remove next
		(next) ->
			View.clientSuccess 'Картинка плейлиста успешно удалена!', res
	], (err) ->
		setFail err, res