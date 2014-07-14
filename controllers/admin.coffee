express = require 'express'

View = require '../lib/view'

Main = require './admin/main'
Products = require './admin/products'
Fragments = require './admin/fragments'
Days = require './admin/days'

Router = express.Router()

#########################

Router.get '/', Main.index
Router.get '/login', Main.login
Router.get '/logout', Main.logout
Router.get '/dashboard', Main.dashboard

Router.post '/login', Main.doLogin

#----------------#

Router.get '/products', Products.index
Router.get '/product/set/:id?', Products.getProduct
Router.get '/product/remove/:id', Products.remove

Router.post '/product/save', Products.save

#----------------#

Router.get '/days', Days.index
Router.get '/day/set/:id?', Days.getDay
Router.get '/day/remove/:id', Days.remove

Router.post '/day/save', Days.save

#----------------#

Router.get '/fragments/:id', Fragments.index
Router.get '/fragment/set/:product_id/:id?', Fragments.getFragment
Router.get '/fragment/remove/:id', Fragments.remove

Router.post '/fragment/save', Fragments.save

#----------------#

exports.Router = Router