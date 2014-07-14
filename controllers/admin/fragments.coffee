async = require 'async'
fs = require 'fs'

View = require '../../lib/view'
Model = require '../../lib/model'
Logger = require '../../lib/logger'
Fragments = require '../../lib/fragments'

imgPath = './uploads/'

exports.index = (req, res) ->
	async.waterfall [
		(next)->
			async.parallel [
				(cb) ->
					Model 'Fragment', 'find', cb, {product_id: req.params.id}
			,
				(cb) ->
					Model 'Product', 'findById', cb, req.params.id, 'name'
			], next
		(results)->
			View.render 'admin/fragments/index', res,
				fragments: results[0],
				product: results[1]
	], (err)->
		View.error err, res

exports.getFragment = (req, res) ->
	async.waterfall [
		(next)->
			async.parallel [
				(cb) ->
					Model 'Day', 'find', cb, {}
			,
				(cb) ->
					if req.params.id
						Model 'Fragment', 'findById', cb, req.params.id
					else
						cb null, {}
			], next			
		(data)->
			View.render 'admin/fragments/set', res,
				product_id: req.params.product_id
				days: data[0]
				fragment: data[1]
	], (err)->
		View.error err, res

exports.save = (req, res) ->
	async.waterfall [
		(next)->
			Fragments.save req, res, next
		(fragment)->
			opts = 
				success: true
				message: "Фрагмент успешно сохранен!"
			View.render 'admin/message', res, opts
	], (err)->
		Logger.log 'info', "Error in controllers/admin/fragment/save: #{err.message or err}"
		opts = 
			success: false
			message: "Произошла ошибка при сохранении фрагмента: #{err.message or err}"
		View.render 'admin/message', res, opts

exports.remove = (req, res) ->
	_id = req.params.id

	async.waterfall [
		(next) ->
			Fragments.removeVideos _id, Fragments.videoTypes, next
		(next) ->
			Fragments.removeImage _id, true, next
		(next) ->
			Model 'Fragment', 'findOne', next, {_id}		
		(doc, next) ->
			doc.remove (err) ->
				next err if err
				View.clientSuccess 'Фрагмент успешно удален!', res
	], (err) ->
		Logger.log 'info', "Error in controllers/admin/fragments/remove: #{err.message or err}"
		msg = "Произошла ошибка при удалении фрагмента: #{err.message or err}"
		View.clientFail msg, res