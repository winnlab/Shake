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
]