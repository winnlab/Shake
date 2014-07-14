Logger = require './logger'
Model = require './model'
async = require 'async'
fs = require 'fs'
_ = require 'underscore'

imgPath = './uploads/'
exports.videoTypes = videoTypes = [
	'mp4'
	'webm'
	'ogv'
]

exports.save = (req, res, cb)->
	data = req.body
	_id = data._id
	data.video = {}
	data.img = req.files.img.name if req?.files?.img?.name

	_.each videoTypes, (video) ->
		data.video[video] = req.files[video].name if (req?.files?[video])

	delete data._wysihtml5_mode if data._wysihtml5_mode
	delete data.video if _.isEmpty data.video

	async.waterfall [
		(next) ->
			videoArr = if data.video then Object.keys(data.video) else []
			exports.removeVideos _id, videoArr, next
		(next) ->
			exports.removeImage _id, data.img, next
		(next) ->
			if _id
				async.waterfall [
					(next) ->
						Model 'Fragment', 'findById', next, _id
					(doc) ->
						for own prop, val of data
							unless prop is '_id' or val is undefined
								doc[prop] = val

						doc.active = data.active or false

						doc.save cb
				], cb
			else
				Model 'Fragment', 'create', cb, data
	], (err) ->	
		Logger.log 'error', "Error rmoveImages /lib/fragment: #{err.message or err}"
		cb err

exports.removeVideos = (id, video, cb) ->
	if id and video.length
		async.waterfall [
			(next)->
				Model 'Fragment', 'findById', next, id
			(fragment)->
				async.each video, (video, procced) ->
					if fragment?.video?[video]
						fs.unlink imgPath + fragment.video[video], procced
					else
						procced()
				, cb
		], (err) ->
			Logger.log 'error', "Error removing videos in /lib/fragment: #{err.message or err}"
			cb err
	else 
		cb null

exports.removeImage = (_id, img, cb) ->
	if _id && img
		async.waterfall [
			(next)->
				Model 'Fragment', 'findById', next, _id
			(fragment)->
				if fragment.img
					fs.unlink imgPath + fragment.img, cb
				else 
					cb()
		], (err) ->
			Logger.log 'error', "Error removing image in /lib/fragment: #{err.message or err}"
			cb err		
	else
		cb()