define(
	[
		'canjs',
		'core/appState'
	], 

	function (can, appState) {

		return can.Control.extend({
			defaults: {
				fragmentForm: '.setFragment',
				viewpath: 'app/fragments/views/'
			}
		}, {
			init: function () {
				var self = this;

				self.element.html(can.view(self.options.viewpath + 'set.stache', {
					fragment: self.options.fragment,
                    langs: langs,
					product_id: can.route.attr('id'),
					days: self.options.days
				}));
			},

			'{fragmentForm} submit': function (el, ev) {
				ev.preventDefault();

				var self = this,
					fragmentData = can.deparam(el.serialize()),
					fragment = self.options.fragment;

				if (!fragmentData.active) {
					fragmentData.active = false;
				}

				fragment.attr(fragmentData);
				
				fragment.save()
				.done(function() {
					can.route.attr({'entity_id': fragment.attr('_id')});
					self.setNotification('success', 'Фрагмент "' + fragment.getName() + '" успешно сохранен!')
				})
				.fail(function (fragment) {
					console.error(fragment);
					self.setNotification('error', 'Ошибка сохранения фрагмента "' + fragment.getName() + '"!')
				});
				
			},

			setNotification: function (status, msg) {
				appState.attr('notification', {
					status: status,
					msg: msg
				});
			}
		});

	}
);