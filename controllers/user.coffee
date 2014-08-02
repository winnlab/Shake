express = require 'express'

View = require '../lib/view'
Main = require './user/main.coffee'

Router = express.Router()

Router.get '/', Main.index
Router.get '/products', Main.index
Router.get '/product/:name?', Main.index
Router.get '/parties', Main.index

exports.Router = Router