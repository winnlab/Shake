define(["canjs"],function(e){function n(e){var t=e.context.attr("visible");return t?e.fn():e.inverse()}var t=e.Map.extend({panels:[],active:null,addPanel:function(e){var t=this.attr("panels");t.push(e),e.attr("visible",!1),t.attr("length")===1&&this.activate(e)},removePanel:function(e){var t=this.attr("panels"),n=t.indexOf(e);t.splice(n,1),this.attr("active")===e&&(t.attr("length")?this.activate(t[0]):this.attr("active",null))},activate:function(e){var t=this.attr("active");t!==e&&(t&&t.attr("visible",!1),this.attr("active",e.attr("visible",!0)))}});e.Component.extend({tag:"tabs",scope:function(){return new t},template:'<div class="btn-group navTabs">{{#each panels}}<div class="btn{{#check}} btn-primary active{{else}} btn-default{{/check}}" can-click="activate">{{name}}</div>{{/each}}</div><content />',helpers:{check:n}}),e.Component.extend({tag:"panel",template:'<div style="display: {{#check}}block{{else}}none{{/check}}"><content /></div>',scope:{name:"@"},events:{inserted:function(){this.element.parent().scope().addPanel(this.scope)},removed:function(){this.element.parent().scope().removePanel(this.scope)}},helpers:{check:n}})});