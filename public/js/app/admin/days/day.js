define(
	[
		'canjs',
		'core/appState'
	], 

	function (can, appState) {

		return can.Control.extend({
			defaults: {
				dayForm: '.setDay',
				viewpath: 'app/days/views/'
			}
		}, {
			init: function () {
				var options = this.options;

				this.element.html(can.view(options.viewpath + 'set.stache', {
					day: options.day
				}));
			},

			'{dayForm} submit': function (el, ev) {
				ev.preventDefault();

				var self = this,
					dayData = can.deparam(el.serialize()),
					day = self.options.day;				

				if (!dayData.active) {
					dayData.active = false;
				}

				day.attr(dayData);
				
				day.save()
				.done(function() {					
					can.route.attr({'entity_id': day.attr('_id')});					
					self.setNotification('success', 'День "' + day.name + '" успешно сохранен!')					
				})
				.fail(function (day) {
					console.error(day);
					self.setNotification('error', 'Ошибка сохранения дня "' + day.name + '"!')
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