async = require 'async'
fs = require 'fs'

Product = require '../../lib/product'
View = require '../../lib/view'
Model = require '../../lib/model'
Logger = require '../../lib/logger'

imgPath = './uploads/'

exports.index = (req, res) ->
	async.waterfall [
		(next)->
			Model 'Product', 'find', next, {}, null, {sort: 'position'}
		(products)->
			View.render 'admin/products/index', res,
				products: products
	], (err)->
		View.error err, res

exports.getProduct = (req, res) ->
	async.waterfall [
		(next)->
			if req.params.id
				Model 'Product', 'findById', next, req.params.id
			else
				next null, {}
		(product)->
			View.render 'admin/products/set', res,
				product: product
	], (err)->
		View.error err, res

exports.save = (req, res) ->
	async.waterfall [
		(next)->
			Product.save req, res, next
		(product)->
			opts = 
				success: true
				message: "Продукт успешно сохранен!"
			View.render 'admin/message', res, opts
	], (err)->
		Logger.log 'info', "Error in controllers/admin/product/save: %s #{err.message or err}"
		opts = 
			success: false
			message: "Произошла ошибка при сохранении продукта: #{err.message or err}"
		View.render 'admin/message', res, opts

exports.remove = (req, res) ->
	_id = req.params.id

	async.waterfall [
		(next) ->
			Model 'Product', 'findOne', next, {_id}
		(doc, next) ->
			if doc
				async.each Object.keys(doc.img), (img, procced) ->
					fs.unlink imgPath + doc.img[img], procced
				, (err) ->
					next err, doc
			else
				next "Произошла неизвестная ошибка."
		(doc, next) ->
			doc.remove (err) ->
				next err if err
				View.clientSuccess 'Продукт успешно удален!', res
	], (err) ->
		Logger.log 'info', "Error in controllers/admin/ages/remove: %s #{err.message or err}"
		msg = "Произошла ошибка при удалении продукта: #{err.message or err}"
		View.clientFail msg, res