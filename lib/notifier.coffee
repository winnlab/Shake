Server = require 'socket.io'
_ = require 'underscore'

meta = require '../meta/socket'

io = exports.io = new Server
	path: '/socket.io'

joinRoomInit = ()->
	io.on 'connection', (socket)->
		socket.on 'room', (room)->
			socket.join room

exports.emit = (name, data) ->
	io.emit name, data

exports.error = (err)->
	data =
		status: err.status or 500
		message: err.message or 'Unknown error'

	io.sockets.emit 'error', data

exports.roomEmit = (nameRoom, name, data)->
	io.to(nameRoom).emit(name, data)

exports.bindEvents = bindEvents = (callback)->
	_.each meta, (item, key, list)->
		io.sockets.on 'connection', (socket) ->
			library = require "./#{item.className}"
			
			if typeof library[item.methodName] is 'function'
				socket.on item.name, library[item.methodName]
			else
				console.log Error "Socket bind error: #{item.methodName} in #{item.className} not a function"

exports.init = (application, next) ->
	io = io.listen application

	joinRoomInit()

	bindEvents()

	next null
