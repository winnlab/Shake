fs = require 'fs'
path = require 'path'
async = require 'async'
crypto = require 'crypto'
path = require 'path'
glob = require 'glob'
moment = require 'moment'
jade = require 'jade'
_ = require 'underscore'

# ###
# 	List of first segment's which will cached
# ###

exports.list = list = [
	{ 
		segment: '/', 
		name: 'Главная страница', 
		prefix: 'main_', 
		prefixKey: '' 
	}
	{ 
		segment: '/catalog', 
		name: 'Каталог', 
		prefix: 'catalog_', 
		prefixKey: 'catalog' 
	}
]


# ###
# 	Relative path to cache directory
# ###

cacheDirectory = "#{__dirname}/../cache"


# ###
# 	Directory of views
# ###

viewDirectory = "#{__dirname}/../view"


# ###
# 	Count of files by list
# ###

exports.cacheCount = (cacheOptions, callback)->
	glob "#{cacheDirectory}/#{cacheOptions.prefix}*", (err, files)->
		cacheOptions.count = files.length

		callback (err||null), (cacheOptions||null)


# ###
# 	Size of cache files by list
# ###

exports.cacheSize = (cacheOptions, callback)->
	async.waterfall [
		(next)->
			cacheOptions.sumSize = 0

			glob "#{cacheDirectory}/#{cacheOptions.prefix}*", (err, files)->
				if err
					return cb null, cacheOptions

				next null, files
		(files, next) ->
			options =
				encoding: 'utf-8'

			async.map files, (file, next2)->
				fs.readFile file, options, next2
			, next
		(filesLengths, next)->
			_.each filesLengths, (item, key, list)->
				cacheOptions.sumSize += item.length

			callback null, cacheOptions
	], callback


# ###
# 	Function which exist segment cache in path
# ###

existSegment = (path)->
	segments = path.split('/')

	if segments[1].length < 6
		segmentPrefix = segments[2] || segments[0]
	else
		segmentPrefix = segments[0]

	segmentList = _.pluck list, 'prefixKey'

	_.contains segmentList, segmentPrefix


# ###
# 	Remove expired files
# ###

removeExpired = (pathToFile, callback)->
	if not pathToFile
		return callback()

	fs.unlink pathToFile, callback

# ###
# 	Check cache file timestamp for putting cache
# ###

checkExpiredPut = (cachename, cb)->
	fName = cachename.split('/').pop()
	time = fName.split('_').pop()

	diff = (new Date().getTime())-time

	if diff > 1800000
		return cb null, cachename

	cb true


# ###
# 	Check cache file timestamp for request cache
# ###

checkExpiredRequest = (cachename, cb)->
	fName = cachename.split('/').pop()
	time = fName.split('_').pop()

	diff = (new Date().getTime())-time

	if diff < 1800000
		return cb null, cachename

	cb()


# ###
# 	Getting prefix by path(request or view)
# ###

cacheOptionsByPath = (path, cb)->
	async.waterfall [
		(next)->
			segments = path.split('/')

			if not segments
				return next new Error 'Fail parse Segments of cache'

			if segments[1].length < 6
				segmentPrefix = segments[2] || segments[0]
			else
				segmentPrefix = segments[0]

			return next null, segmentPrefix
		(segmentPrefix, next)->
			objCacheOptions = _.findWhere list, { prefixKey: segmentPrefix}

			if not objCacheOptions
				return cb new Error 'Options of cache not exist'

			cb null, objCacheOptions
	], cb


# ###
# 	Create cache file
# ###

exports.put = (viewPath, viewData, reqPath, globals, callback)->
	if typeof globasl is 'function'
		callback = globals
		globals = {}

	viewData = _.extend viewData, globals

	lang = globals.lang

	data = {}

	cacheRegExp = crypto
		.createHash('md5')
		.update(reqPath)
		.digest 'hex'

	async.waterfall [
		(next)->
			cacheOptionsByPath reqPath, next
		(options, next)->
			data.options = options

			globString = "#{cacheDirectory}/#{options.prefix}#{lang}_#{cacheRegExp}_*"

			glob globString, next
		(files, next) ->
			async.map files, checkExpiredPut, next
		(expiredFiles, next)->
			async.each expiredFiles, removeExpired, next
		(next)->
			jade.renderFile "#{viewDirectory}/#{viewPath}.jade", viewData, next
		(html, next)->
			time = new Date().getTime()
			filename = "#{cacheDirectory}/"+
				"#{data.options.prefix}#{lang}_#{cacheRegExp}_#{time}"

			fs.writeFile filename, html, next
		()->
			callback()
	], callback


###
	Request cachefile
###


exports.requestCache = (req, res, callback)->
	path = req.originalUrl

	if not existSegment path
		return callback()

	data = {}

	cacheRegExp = crypto
		.createHash('md5')
		.update(path)
		.digest 'hex'

	async.waterfall [
		(next)->
			cacheOptionsByPath path, next
		(options, next)->
			data.options = options

			globString = "#{cacheDirectory}/#{options.prefix}#{req.lang}_#{cacheRegExp}_*"

			glob globString, next
		(files, next)->
			async.map files, checkExpiredRequest, next
		(cacheArr, next)->
			cacheFileName = cacheArr.pop()

			if not cacheFileName
				return callback()

			optionsReadFile =
				encoding: 'utf-8'

			fs.readFile cacheFileName, optionsReadFile, next
		(html, next)->
			res.set 'Content-Type', 'text/html'

			res.send html
	], callback


# ###
# 	Remove cache by id
# ###

exports.erease = (id, cb)->
	async.waterfall [
		(next)->
			glob "#{cacheDirectory}/#{id}*", next
		(files, next)->
			async.each files, (file, next2)->
				fs.unlink file, next2
			, next
		(next)->
			cb null
	], cb
