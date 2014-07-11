express = require 'express'

View = require '../lib/view'
Main = require './user/main.coffee'

Router = express.Router()

Router.get '/', Main.index

exports.Router = Router