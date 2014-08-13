async = require 'async'
_ = require 'underscore'
fs = require 'fs'


View = require '../../lib/view'
Files = require '../../lib/files'
Model = require '../../lib/model'
Logger = require '../../lib/logger'

uploadPath = './uploads/'

setFail = (err, res) ->
	msg = "Error in #{__filename}: #{err.message or err}"
	Logger.log 'error', msg
	View.clientFail err, res

exports.removeData = removeData = (doc, cb) ->
	async.parallel [
		(proceed) ->
			video = _.pick doc.video, [
				"mp4"
				"webm"
				"ogv"
			]
			Files.unlinkArray _.values(video), uploadPath, proceed
		(proceed) ->
			unlinkImage doc.img, proceed
		(proceed) ->
			doc.remove proceed
	], (err) ->
		cb err
		
unlinkImage = (img, cb) ->
	if img
		fs.unlink uploadPath + img, cb
	else 
		cb()

exports.findAll = (req, res) ->
	# product_id = req.query.product_id
	async.waterfall [
		(next)->
			Model 'Fragment', 'find', next, req.query, null, {sort: 'position'}
		(fragments)->
			View.clientSuccess {fragments}, res
	], (err)->
		setFail err, res

exports.save = (req, res) ->
	data = req.body
	_id = data._id

	async.waterfall [
		(next) ->
			if _id
				Model 'Fragment', 'findOne', next, {_id}
			else
				next null, null
		(doc, next) ->
			if doc
				for own prop, val of data
					unless prop is '_id' or val is undefined
						doc[prop] = val

				doc.save next
			else 
				Model 'Fragment', 'create', next, data
		(fragment) ->
			View.clientSuccess _id: fragment._id, res
	], (err)->
		setFail err, res

exports.delete = (req, res) ->
	_id = req.params.id
	async.waterfall [
		(next) ->
			Model 'Fragment', 'findOne', next, {_id}
		(fragment, next) ->
			removeData fragment, next		
		() ->
			View.clientSuccess 'Фрагмент успешно удален!', res
	], (err) ->
		setFail err, res


exports.imgSave = (req, res) ->	
	_id = req.body.id
	imgName = req.body.name

	async.waterfall [
		(next) ->
			Model 'Fragment', 'findOne', next, {_id}
		(doc, next) ->
			unlinkImage doc.img, (err) ->
				next err, doc
		(doc, next) ->
			if req.files?[imgName]?.name
				doc.img = req.files[imgName].name
			
			doc.save next
		(doc) ->
			View.clientSuccess name: doc.img, res
	], (err) ->
		setFail err, res

exports.imgDelete = (req, res) ->
	_id = req.body.id
	imgName = req.body.name

	async.waterfall [
		(next) ->
			Model 'Fragment', 'findOne', next, {_id}
		(doc, next) ->
			unlinkImage doc.img, (err) ->
				next err, doc
		(doc, next) ->
			doc.img = ''
			doc.save next
		() ->
			View.clientSuccess 'Картинка успешно удалена', res
	], (err) ->
		setFail err, res

exports.videoSave = (req, res) ->	
	_id = req.body.id
	videoName = req.body.name

	async.waterfall [
		(next) ->
			Model 'Fragment', 'findOne', next, {_id}
		(doc, next) ->
			video = []
			video = [doc.video[videoName]] if doc?.video?[videoName]
			Files.unlinkArray video, uploadPath, (err) ->
				next err, doc
		(doc, next) ->
			if req.files?[videoName]?.name
				doc.video[videoName] = req.files[videoName].name
			
			doc.save next
		(doc) ->
			View.clientSuccess name: doc.video[videoName], res
	], (err) ->
		setFail err, res

exports.videoDelete = (req, res) ->
	_id = req.body.id
	videoName = req.body.name

	async.waterfall [
		(next) ->
			Model 'Fragment', 'findOne', next, {_id}
		(doc, next) ->
			Files.unlinkArray [doc?.video?[videoName]], uploadPath, (err) ->
				next err, doc
		(doc, next) ->
			doc.video[videoName] = undefined
			doc.save next
		() ->
			View.clientSuccess 'Видео успешно удалено', res
	], (err) ->
		setFail err, res