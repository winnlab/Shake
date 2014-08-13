url = require 'url'

passport = require 'passport'

params =
	admin:
		failureRedirect: '/admin/login'
		successRedirect: '/admin/dashboard'
		session: true
	user:
		failureRedirect: '/account/signin'
		successRedirect: '/account'
		session: true

exports.isAuth = (req, res, next)->
	path = url.parse req.path

	if path.path == '/login'
		return next()

	if not req.user or not req.isAuthenticated()
		return res.redirect '/admin/login'

	next()

exports.authenticate = (strategy) ->
	passport.authenticate strategy, params[strategy]
