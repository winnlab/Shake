
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

filterLang = (array, languageId) ->
	_.map array, (el) ->
		el.lang = _.find el.lang, (lang) ->
			lang.language_id.toString() == languageId.toString()
		return el

mergeArrays = (origin, merged, originField, mergedField, resultField) ->
	_.map origin, (orig) -> 
		_.each merged, (merg) ->			
			orig[resultField] = merg if orig[originField].toString() == merg[mergedField].toString()
	return origin

getData = (lang, cb) ->
	async.parallel
		products: (proceed) ->
			Products = Model 'Product', 'find', null, active: true, null, sort: 'position'
			Products.lean().exec proceed
		newPodcasts: (proceed) ->
			Model 'NewPodcast', 'find', proceed
		soundCloudImages: (proceed) ->
			Model 'SoundCloudImage', 'find', proceed
		parties: (proceed) ->
			query =
				active: true
			query['day_id'] = day._id if day

			Fragments = Model 'Fragment', 'find', null, query
			Fragments.lean().exec proceed
	, (err, data) ->
		return cb err if err
		data.lang = if lang.default then '' else lang.isoCode		
		data.langs = _.map langs, (lang)-> 
			return _.pick lang, 'isoCode', 'default'
		data.locale = locale[lang.isoCode]
		data.products = filterLang data.products, lang._id
		data.parties = filterLang data.parties, lang._id
		data.products = mergeArrays data.products, data.parties, '_id', 'product_id', 'fragment'
		delete data.parties
		cb null, data

getQueryLang = (url, cb) ->
	# Todo change find lang to regExp
	queryString = url.split('/')[1]
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
		
exports.ie = (req, res) ->
	View.render 'user/ie', res, {}