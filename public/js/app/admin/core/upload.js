define([
	'canjs',
	'core/appState',
	'css!core/css/upload'
],

	function (can, appState) {
		var UploadViewModel = can.Map.extend({
			// url - upload action
			'url': '@',
			// delete-url - action to delete uploaded file
			'delete-url': '@',
			// accept - mime types of upload files
			'accept': '@',
			'name': '@',
			'multiple': '@',
			'files': [],
			'progress': 0,

			define: {
				'uploadId': {
					value: function () {
						var result = 'uploader-' + Math.ceil(Math.random() * 1000);						
						return result;
					}
				},
				'uploaded': {
					set: function (newVal) {
						var uploaded = new can.List([]),
							files = this.attr('files');						
						files.replace([]);
						if (newVal) {
							if (this.attr('multiple')) {
								uploaded.push(newVal);
							} else {
								uploaded.splice(0, 1, newVal);
							}
						}
						return uploaded;
					}
				}
			},

			upload: function (form) {
				var self = this,
					files = self.attr('files'),
					name = self.attr('name'),
					entity = self.attr('entity'),
					entity_id = entity.attr('id') || entity.attr('_id'),
					options;
				if (files.length && entity_id) {
					options = {
						data: {
							name: name,
							id: entity_id
						},
						beforeSend: function() {
							self.attr('progress', 0);
						},
						uploadProgress: function(event, position, total, percentComplete) {
							self.attr('progress', percentComplete);
						},
						success: function() {
							self.attr('progress', 100);
						}
					};
					
					var formSubmited = form.ajaxSubmit(options);
					var xhr = formSubmited.data('jqxhr');

					xhr.done(function (data) {
						// self.attr('uploaded', data.message.name);

						if (entity.uploaded) {
							entity.uploaded(name, data.message.name);
						}

						appState.attr('notification', {
							status: 'success',
							msg: 'Файл успешно выгружен'
						});

						self.attr('progress', 0);
					}).fail(function (data) {
						appState.attr('notification', {
							status: 'error',
							msg: 'Ошибка выгрузки файла'
						});
					});
				} else if (files.length) {
					appState.attr('notification', {
						status: 'error',
						msg: 'Ошибка идентификации связи файла!'
					});
				}
			},

			remove: function (sourceName) {
				var self = this,
					uploaded = self.attr('uploaded'),
					name = self.attr('name'),
					entity = self.attr('entity'),
					sourceIndex = uploaded.indexOf(sourceName);

				can.ajax({
					url: self.attr('delete-url'),
					data: {
						name: name,
						sourceName: sourceName,
						id: self.attr('entity.id') || self.attr('entity._id')
					},
					type: 'DELETE'
				}).done(function (data) {
					uploaded.splice(sourceIndex, 1);
					if (entity.removeUploaded) {
						entity.removeUploaded(name);
					}
					appState.attr('notification', {
						status: 'success',
						msg: data.message
					});
				}).fail(function (data) {
					appState.attr('notification', {
						status: 'error',
						msg: data.message
					});
				});
			}
		});

		can.Component.extend({
			tag: "upload",
			scope: UploadViewModel,
			template: 
				'<label class="btn btn-primary" for="{{uploadId}}">' +
					'<content />' +
				'</label>' + 
					'{{#if progress}}' +
						'<div class="progress">' +
							'<div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="{{progress}}" aria-valuemin="0" aria-valuemax="100" style="width: {{progress}}%;">' +
								'{{progress}}%' +
							'</div>' +
						'</div>' +
					'{{/if}}' +
				'<form action="{{url}}" method="POST" enctype="multipart/form-data">' +
					'<input type="file" name="{{name}}{{#if multiple}}[]{{/if}}" accept="{{accept}}" id="{{uploadId}}" {{#if multiple}}multiple{{/if}}/>' +
				'</form>' +
				'{{#if files.length}}' +
					'<div class="queue">' +
						'{{#each files}}' +
							'<div>{{name}}</div>' +
						'{{/each}}' +
					'</div>' +
				'{{/if}}' +
				'{{#if uploaded.length}}' +
					'<div class="uploadedWrap">' +
						'{{#each uploaded}}' +
							'{{{renderUploaded}}}' +
							'{{#isDeleteBtn}}' +
								'<div {{data "uploaded"}} class="remove btn btn-danger">' +
									'<i class="fa fa-trash-o"></i>' +
								'</div>' +
							'{{/isDeleteBtn}}' +
						'{{/each}}' +
					'</div>' +
				'{{/if}}'
			,			
			events: {				
				'input change': function (el, ev) {
					var scope = this.scope,
						scopeFiles = scope.attr('files'),
						files = el[0].files;
					
					scopeFiles.replace(files);
					scope.upload(el.parents('form'));
				},
				'.remove click': function (el, ev) {
					var sourceName = el.data('uploaded');
					if (confirm('Вы действительно хотите удалить этот файл?')) {
						this.scope.remove(sourceName);
					}
				}
			},
			helpers: {
				isDeleteBtn: function (options) {
					var files = this.attr('uploaded');
					return this.attr('delete-url') && files.length
						? options.fn() 
						: options.inverse();
				},
				renderUploaded: function (options) {
					var accept = this.attr('accept') || 'image',
						source = options.context,
						html;					
					if (accept.indexOf('image') !== -1) {
						html = '<span class="uploaded thumbnail" style="background-image: url(\'/uploads/' + source + '\')"></span>';
					} else {
						html = '<span>' + source + '</span>&nbsp;';
					}
					return html;
				}
			}
		});
	}
);