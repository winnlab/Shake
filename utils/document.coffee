exports.setDocumentData = (doc, data) ->
	for own prop, val of data
		unless prop is '_id' or val is undefined
			doc[prop] = val
	return doc
