mongoose = require 'mongoose'

module.exports = [
	modelName: 'permission'
	data: [
		_id: 'denied'
		name: 'access_denied'
	,
		_id: 'dashboard'
		name: 'dashboard'
	,
		_id: 'users'
		name: 'users'
	,
		_id: 'clients'
		name: 'clients'
	,
		_id: 'cache'
		name: 'cache'
	,
		_id: 'roles'
		name: 'roles'
	,
		_id: 'permisions'
		name: 'permissions'
	]
,
	modelName: 'role'
	data: [
		_id: 'admin'
		name: 'admin'
		'permissions': [
			'denied'
			'dashboard'
			'users'
			'clients'
			'cache'
			'roles'
			'permisions'
		]
	,
		_id: 'user'
		name: 'user'
		permissions: []
	]
,
	modelName: 'user'
	data: [
		_id: '53b54577f5adc6a9932b1aec'
		username: 'admin'
		email: 'admin@admin.com'
		password: '202cb962ac59075b964b07152d234b70'
		role: 'admin'
		status: 1
	]
,
	modelName: 'language'
	data: [
		'_id' : '53db9bd57ae86638de0fc922'
		'name' : 'Украинский'
		'isoCode' : 'ua'
		'active' : true
		'default': true
	,
		'_id' : '53db9c277ae86638de0fc923'
		'name' : 'Русский'
		'isoCode' : 'ru'
		'active' : true
		'default': false
	,
		'_id' : '53db9c427ae86638de0fc924'
		'name' : 'Английский',
		'isoCode' : 'en',
		'active' : true
		'default': false
	]
]