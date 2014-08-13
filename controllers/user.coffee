express = require 'express'

View = require '../lib/view'
Main = require './user/main.coffee'

Router = express.Router()

Router.get '/', Main.index
Router.get '/products', Main.index
Router.get '/product/:name?', Main.index
Router.get '/parties', Main.index
Router.get '/podcast', Main.index
Router.get '/contacts', Main.index
Router.get '/shakeit', Main.index

exports.Router = Router