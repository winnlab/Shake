fs = require 'fs'

moment = require 'moment'
_ = require 'underscore'
winston = require 'winston'

exports.init = (next)->
	dirToLogs = "#{__dirname}/../logs"

	startOfInit = moment().format 'DD_MM_YY_H_m_s'

	winston.add winston.transports.File,
		filename: "#{dirToLogs}/#{startOfInit}.log"

	next()

exports.log = winston.log

exports.error = winston.error

exports.info = winston.info
