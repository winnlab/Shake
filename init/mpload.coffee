fs = require 'fs'

module.exports = (path, next) ->
	fs.readdir path, (err, files) ->
		throw err if err
		for file in files
			require path + file

		next()