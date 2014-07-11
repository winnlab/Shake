mongoose = require 'mongoose'
async = require 'async'

opts =
	server: { auto_reconnect: true, primary:null, poolSize: 50 },
	user: 'admin',
	pass: '8mvclqXSvv',
	host: 'localhost'
	port: '27017'
	database: 'Shake'
	primary: null

connString = 'mongodb://'+opts.user+":"+opts.pass+"@"+opts.host+":"+opts.port+"/"+opts.database+"?auto_reconnect=true"

mongoose.connect connString, opts