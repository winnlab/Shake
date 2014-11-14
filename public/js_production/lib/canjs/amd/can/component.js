/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/view/callbacks","can/control","can/observe","can/view/mustache","can/view/bindings"],function(e,t){var n=/^(dataViewId|class|id)$/i,r=/\{([^\}]+)\}/g,i=e.Component=e.Construct.extend({setup:function(){e.Construct.setup.apply(this,arguments);if(e.Component){var t=this,n=this.prototype.scope;this.Control=s.extend(this.prototype.events),!n||typeof n=="object"&&!(n instanceof e.Map)?this.Map=e.Map.extend(n||{}):n.prototype instanceof e.Map&&(this.Map=n),this.attributeScopeMappings={},e.each(this.Map?this.Map.defaults:{},function(e,n){e==="@"&&(t.attributeScopeMappings[n]=n)});if(this.prototype.template)if(typeof this.prototype.template=="function"){var r=this.prototype.template;this.renderer=function(){return e.view.frag(r.apply(null,arguments))}}else this.renderer=e.view.mustache(this.prototype.template);e.view.tag(this.prototype.tag,function(e,n){new t(e,n)})}}},{setup:function(r,i){var s={},o=this,u={},a,f,l;e.each(this.constructor.attributeScopeMappings,function(t,n){s[n]=r.getAttribute(e.hyphenate(t))}),e.each(e.makeArray(r.attributes),function(l,c){var h=e.camelize(l.nodeName.toLowerCase()),p=l.value;if(o.constructor.attributeScopeMappings[h]||n.test(h)||t.attr(l.nodeName))return;if(p[0]==="{"&&p[p.length-1]==="}")p=p.substr(1,p.length-2);else if(i.templateType!=="legacy"){s[h]=p;return}var d=i.scope.computeData(p,{args:[]}),v=d.compute,m=function(e,t){a=h,f.attr(h,t),a=null};v.bind("change",m),s[h]=v(),v.hasDependencies?(e.bind.call(r,"removed",function(){v.unbind("change",m)}),u[h]=d):v.unbind("change",m)});if(this.constructor.Map)f=new this.constructor.Map(s);else if(this.scope instanceof e.Map)f=this.scope;else if(e.isFunction(this.scope)){var c=this.scope(s,i.scope,r);c instanceof e.Map?f=c:c.prototype instanceof e.Map?f=new c(s):f=new(e.Map.extend(c))(s)}var h={};e.each(u,function(e,t){h[t]=function(n,r){a!==t&&e.compute(r)},f.bind(t,h[t])}),e.bind.call(r,"removed",function(){e.each(h,function(e,t){f.unbind(t,h[t])})}),(!e.isEmptyObject(this.constructor.attributeScopeMappings)||i.templateType!=="legacy")&&e.bind.call(r,"attributes",function(t){var n=e.camelize(t.attributeName);u[n]||f.attr(n,r.getAttribute(t.attributeName))}),this.scope=f,e.data(e.$(r),"scope",this.scope);var p=i.scope.add(this.scope),d={helpers:{}};e.each(this.helpers||{},function(t,n){e.isFunction(t)&&(d.helpers[n]=function(){return t.apply(f,arguments)})}),this._control=new this.constructor.Control(r,{scope:this.scope}),this.constructor.renderer?(d.tags||(d.tags={}),d.tags.content=function v(t,n){var r=i.subtemplate||n.subtemplate;r&&(delete d.tags.content,e.view.live.replace([t],r(n.scope,n.options)),d.tags.content=v)},l=this.constructor.renderer(p,i.options.add(d))):i.templateType==="legacy"?l=e.view.frag(i.subtemplate?i.subtemplate(p,i.options.add(d)):""):l=i.subtemplate?i.subtemplate(p,i.options.add(d)):document.createDocumentFragment(),e.appendChild(r,l)}}),s=e.Control.extend({_lookup:function(e){return[e.scope,e,window]},_action:function(t,n,i){var s,o;r.lastIndex=0,s=r.test(t);if(!i&&s)return;if(!s)return e.Control._action.apply(this,arguments);o=e.compute(function(){var i,s=t.replace(r,function(t,r){var s;return r==="scope"?(i=n.scope,""):(r=r.replace(/^scope\./,""),s=e.compute.read(n.scope,r.split("."),{isArgument:!0}).value,s===undefined&&(s=e.getObject(r)),typeof s=="string"?s:(i=s,""))}),o=s.split(/\s+/g),u=o.pop();return{processor:this.processors[u]||this.processors.click,parts:[s,o.join(" "),u],delegate:i||undefined}},this);var u=function(e,n){i._bindings.control[t](i.element),i._bindings.control[t]=n.processor(n.delegate||i.element,n.parts[2],n.parts[1],t,i)};return o.bind("change",u),i._bindings.readyComputes[t]={compute:o,handler:u},o()}},{setup:function(t,n){return this.scope=n.scope,e.Control.prototype.setup.call(this,t,n)},off:function(){this._bindings&&e.each(this._bindings.readyComputes||{},function(e){e.compute.unbind("change",e.handler)}),e.Control.prototype.off.apply(this,arguments),this._bindings.readyComputes={}}});return window.$&&$.fn&&($.fn.scope=function(e){return e?this.data("scope").attr(e):this.data("scope")}),e.scope=function(t,n){return t=e.$(t),n?e.data(t,"scope").attr(n):e.data(t,"scope")},i});