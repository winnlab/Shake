async = require 'async'

View = require '../../lib/view'
Auth = require '../../lib/auth'
Model = require '../../lib/model'
Admin = require '../../lib/admin'
Logger = require '../../lib/logger'

exports.index = (req, res) ->
	unless req.user
		res.redirect 'admin/login'
	else
		res.redirect 'admin/dashboard'

exports.login = (req, res)->
	View.render 'admin/auth/index', res

exports.logout = (req, res)->
	req.logout()
	res.redirect '/admin/login'

exports.doLogin = (req, res) ->
	Auth.authenticate('admin') req, res

exports.dashboard = (req, res) ->
	async.waterfall [
		(next) ->
			Model 'Language', 'find', next, active: true
		(langs) ->
			View.render 'admin/board/index', res, {langs}
	], (err) ->
		msg = "Error in #{__filename}: #{err.message or err}"
		Logger.log 'error', msg
		View.clientFail err, res