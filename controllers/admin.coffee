express = require 'express'

View = require '../lib/view'

Main = require './admin/main'
Products = require './admin/products'
Fragments = require './admin/fragments'

Router = express.Router()

#########################

Router.get '/', Main.index
Router.get '/login', Main.login
Router.get '/logout', Main.logout
Router.get '/dashboard', Main.dashboard

Router.post '/login', Main.doLogin

#----------------#

Router.get '/products', Products.index
Router.get '/product/set', Products.getProduct
Router.get '/product/set/:id', Products.getProduct
Router.get '/product/remove/:id', Products.remove

Router.post '/product/save', Products.save

#----------------#

Router.get '/product/fragments/:id', Fragments.index

exports.Router = Router