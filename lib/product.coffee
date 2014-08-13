Logger = require './logger'
Model = require './model'
async = require 'async'
fs = require 'fs'
_ = require 'underscore'

imgPath = './uploads/'
imgTypes = [
	'bottle',
	'bottle_thumb',
	'jar',
	'jar_thumb'
]

exports.save = (req, res, cb)->
	
	data = req.body
	_id = data._id
	data.img = {}


	_.each imgTypes, (img) ->
		data.img[img] = req.files[img].name if (req?.files?[img])

	delete data._wysihtml5_mode if data._wysihtml5_mode
	delete data.img if _.isEmpty data.img

	async.waterfall [
		(next) ->
			if (data.img)
				removeImages _id, Object.keys(data.img), next
			else 
				next()
		() ->
			if _id
				async.waterfall [
					(next) ->
						Model 'Product', 'findOne', next, {_id}
					(doc) ->
						for own prop, val of data
							unless prop is '_id' or val is undefined
								doc[prop] = val

						doc.active = data.active or false

						doc.save cb
				], (err) ->
					cb err
			else
				Model 'Product', 'create', cb, data

	], (err) ->	
		Logger.log 'error', "Error rmoveImages /lib/product: %s #{err.message or err}"
		cb err

removeImages = (id, img, cb) ->
	if id and img.length
		async.waterfall [
			(next)->
				Model 'Product', 'findById', next, id
			(product)->
				async.each img, (img, procced) ->
					if (product?.img?[img])
						fs.unlink imgPath + product.img[img], procced
					else
						procced()
				, (err)->					
					cb err
		], (err) ->
			Logger.log 'error', "Error in /lib/product: %s #{err.message or err}"
			cb err
	else 
		cb null
