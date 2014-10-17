express = require 'express'

View = require '../lib/view'

Main = require './admin/main'
Products = require './admin/products'
Fragments = require './admin/fragments'
Days = require './admin/days'
NewPodcasts = require './admin/newPodcasts'
SoundCloudImages = require './admin/soundCloudImages'
Feedback = require './admin/feedback'

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

Router.use '/fragment/img', Fragments.restFile

Router.use '/fragment/video', Fragments.restFile

Router.use '/fragment/track', Fragments.restFile

Router.use '/fragment/:id?', Fragments.rest

#----------------#

Router.get '/feedback', Feedback.findAll
Router.delete '/feedback/:id?', Feedback.delete

#----------------#

exports.Router = Router
exports.layoutPage = Main.dashboard
