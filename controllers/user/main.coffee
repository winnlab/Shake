async = require 'async'
_ = require 'underscore'

View = require '../../lib/view'
Model = require '../../lib/model'

locale = require '../../locale'

timestamp = new Date()
day = null
langs = null

checkDay = (currentTime, cb) ->
	if timestamp.getDay() != currentTime.getDay()
		timestamp = currentTime
		changeDay cb
	else if day is null
		changeDay cb
	else
		cb()

changeDay = (cb) ->
	async.waterfall [
		(next) ->
			position = if day then day.position else 0
			Model 'Day', 'find', next,
				position: $gt: position
				active: true
			, null,
				sort: 'position'
				limit: 1
		(docs) ->
			if docs.length
				day = docs[0]
				cb()
			else if day is null
				cb()
			else
				day = null
				changeDay cb
	], cb

getData = (lang, cb) -> 
	async.parallel
		products: (proceed) ->
			Products = Model 'Product', 'find', null, active: true
			Products.lean().exec proceed
		parties: (proceed) ->
			query = 
				active: true
			query['day_id'] = day._id if day

			Fragments = Model 'Fragment', 'find', null, query
			Fragments.lean().exec proceed
	, (err, data) ->
		return cb err if err
		data.lang = if lang.default then '' else lang.isoCode
		data.locale = locale[lang.isoCode]
		data.products = filterLang data.products, lang._id
		data.parties = filterLang data.parties, lang._id
		console.log data
		cb null, data

filterLang = (array, languageId) ->
	_.map array, (el) ->
		el.lang = _.find el.lang, (lang) ->
			lang.language_id.toString() == languageId.toString()
		return el		

getQueryLang = (url, cb) ->
	queryString = url.split('/')[0]
	lang = _.findWhere langs, isoCode: queryString
	if lang
		cb null, lang
	else
		cb null, (_.findWhere langs, default: true)


exports.index = (req, res) ->
	async.waterfall [
		(next) ->
			currentTime = new Date()
			checkDay currentTime, next
		(next) ->
			if langs
				next null, langs
			else 
				Model 'Language', 'find', next
		(docs, next) ->
			langs = docs
			getQueryLang req.originalUrl, next
		(lang, next) ->
			getData lang, next
		(data, next) ->
			View.render 'user/index', res, {data}
	], (err) ->	
		res.send err