define(
	['canjs'], 
	function (can) {
		can.Component.extend({
			tag: 'module',
			template: "{{#if active}}<content />{{/if}}"
		});
	}
);