define(
	
	['canjs'],

	function (can) {
		var TabsViewModel = can.Map.extend({
			panels: [],
			active: null,

			addPanel: function (panel) {
				var panels = this.attr('panels');
				panels.push(panel);
				panel.attr('visible', false);
				//activate panel if it is the first one
				if (panels.attr('length') === 1){
					this.activate(panel);
				}
			},

			removePanel: function (panel) {
				var panels = this.attr('panels');
				var index = panels.indexOf(panel);
				panels.splice(index, 1);
				//activate a new panel if panel being removed was the active panel
				if (this.attr('active') === panel){
					panels.attr('length') ? this.activate(panels[0]) : this.attr('active', null);
				}
			},

			activate: function (panel) {
				var active = this.attr('active')				
				if (active !== panel) {
					active && active.attr('visible', false);
					this.attr('active', panel.attr('visible', true));
				}
			}
		});

		can.Component.extend({
			tag: 'tabs',
			scope: function () {
				return new TabsViewModel();
			},
			template: 
				'<div class="btn-group navTabs">' +					
					'{{#each panels}}' +
						'<div class="btn{{#check}} btn-primary active{{else}} btn-default{{/check}}" can-click="activate">{{name}}</div>' +
					'{{/each}}' +
				'</div>'+
				'<content />',
			helpers: {
				check: checkVisibility
			}
		});

		can.Component.extend({
			tag: 'panel',
			template: 
				'<div style="display: {{#check}}block{{else}}none{{/check}}">' + 				
					'<content />' +
				'</div>',
			scope: {
				name: '@'
			},
			events: {
				inserted: function() {
					this.element.parent().scope().addPanel(this.scope);					
				},
				removed: function() {
					this.element.parent().scope().removePanel(this.scope);
				}
			},
			helpers: {
				check: checkVisibility
			}
		});

		function checkVisibility (options) {
			var visible = options.context.attr('visible')
			return visible ? options.fn() : options.inverse();
		}

	}
);