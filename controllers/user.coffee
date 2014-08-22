express = require 'express'

View = require '../lib/view'
Main = require './user/main.coffee'

Router = express.Router()

Router.use (req, res, next) ->
	ie = (/MSIE ([0-9]{1,}[\.0-9]{0,})/g).exec req.headers['user-agent']
	if ie is null
		next()
	else
		version = parseFloat ie[0].replace('MSIE ', '')
		if version > 8
			next()
		else
			Main.ie req, res

Router.get '/', Main.index
Router.get '/products', Main.index
Router.get '/product/:name?', Main.index
Router.get '/parties', Main.index
Router.get '/podcast', Main.index
Router.get '/podcasts', Main.index
Router.get '/contacts', Main.index
Router.get '/shakeit', Main.index

exports.Router = Router