express = require 'express'

View = require '../lib/view'

Main = require './admin/main'
Products = require './admin/products'
Fragments = require './admin/fragments'
Days = require './admin/days'
NewPodcasts = require './admin/newPodcasts'
SoundCloudImages = require './admin/soundCloudImages'

Router = express.Router()

#########################

Router.get '/', Main.index
Router.get '/login', Main.login
Router.get '/logout', Main.logout
Router.get '/dashboard', Main.dashboard

Router.post '/login', Main.doLogin

# Product REST api

Router.post '/product/img', Products.imgSave
Router.delete '/product/img', Products.imgDelete

Router.get '/product', Products.findAll
Router.get '/product/:id?', Products.findOne
Router.post '/product', Products.save
Router.put '/product/:id?', Products.save
Router.delete '/product/:id?', Products.delete

#----------------#

Router.get '/day', Days.findAll
Router.post '/day', Days.save
Router.put '/day/:id?', Days.save
Router.delete '/day/:id?', Days.delete

#----------------#

Router.get '/newPodcast', NewPodcasts.findAll
Router.post '/newPodcast', NewPodcasts.save
Router.put '/newPodcast/:id?', NewPodcasts.save
Router.delete '/newPodcast/:id?', NewPodcasts.delete

#----------------#

Router.get '/soundCloudImage', SoundCloudImages.findAll
Router.post '/soundCloudImage/:id?', SoundCloudImages.save
Router.delete '/soundCloudImage/:id?', SoundCloudImages.delete

#----------------#

Router.post '/fragment/img', Fragments.imgSave
Router.delete '/fragment/img', Fragments.imgDelete

Router.post '/fragment/video', Fragments.videoSave
Router.delete '/fragment/video', Fragments.videoDelete

Router.get '/fragment', Fragments.findAll
Router.post '/fragment', Fragments.save
Router.put '/fragment/:id?', Fragments.save
Router.delete '/fragment/:id?', Fragments.delete

#----------------#

exports.Router = Router
exports.layoutPage = Main.dashboard