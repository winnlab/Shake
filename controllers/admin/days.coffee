async = require 'async'
_ = require 'underscore'

View = require '../../lib/view'
Model = require '../../lib/model'
Logger = require '../../lib/logger'

exports.index = (req, res) ->
	async.waterfall [
		(next) ->
			async.parallel [
				(cb) ->
					Days = Model 'Day', 'find', null, {}, null, {sort: 'position'}
					Days.lean().exec cb
			,
				(cb) ->
					Model 'Fragment', 'find', cb, {}, '-description -video -img', {sort: 'position'}
			], next
		(data) ->			

			days = _.map data[0], (day, key, list) ->				
				day.fragments = _.filter data[1], (fragment) ->					
					return fragment.day_id.toString() == day._id.toString()
				return day
			
			View.render 'admin/days/index', res,
				days: days
	], (err) ->
		View.error err, res

exports.getDay = (req, res) ->
	async.waterfall [
		(next) ->
			if req.params.id
				Model 'Day', 'findById', next, req.params.id
			else
				next null, {}
		(day) ->
			View.render 'admin/days/set', res,
				day: day
	], (err) ->
		View.error err, res

exports.save = (req, res) ->

	_id = req.body._id

	data = req.body

	async.waterfall [
		(next) ->
			if _id
				async.waterfall [
					(next2) ->
						Model 'Day', 'findOne', next2, {_id}
					(doc) ->
						for own prop, val of data
							unless prop is 'id' or val is undefined
								doc[prop] = val
						
						doc.active = data.active or false

						doc.save next
				], (err) ->
					next err
			else
				delete data._id
				Model 'Day', 'create', next, data
		(doc, next) ->
			if not doc
				return next "Произошла неизвестная ошибка."
			opts = 
				success: true
				message: "День успешно сохранен!"
			View.render 'admin/message', res, opts
	], (err) ->
		Logger.log 'info', "Error in controllers/admin/days/save: %s #{err.message or err}"
		opts = 
			success: false
			message: "Произошла ошибка при сохранении дня: #{err.message or err}"
		View.render 'admin/message', res, opts
		

exports.remove = (req, res) ->
	_id = req.params.id

	async.waterfall [
		(next) ->
			Model 'Day', 'findOne', next, {_id}		
		(doc, next) ->
			doc.remove (err) ->
				next err if err
				View.clientSuccess 'День успешно удален!', res
	], (err) ->
		Logger.log 'info', "Error in controllers/admin/ages/remove: %s #{err.message or err}"
		msg = "Произошла ошибка при удалении дня: #{err.message or err}"
		View.clientFail msg, res