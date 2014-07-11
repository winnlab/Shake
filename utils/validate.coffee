
exports.password = (pass) ->
	if (pass.length > 0) then true else false

exports.email = (email) ->
	[/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'The e-mail field cannot be empty']