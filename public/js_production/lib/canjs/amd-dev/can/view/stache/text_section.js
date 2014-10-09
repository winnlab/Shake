/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/view/live","can/view/stache/utils"],function(e,t,n){t=t||e.view.live;var r=function(){this.stack=[new o]},i=function(){};e.extend(r.prototype,n.mixins),e.extend(r.prototype,{startSection:function(e){var t=new o;this.last().add({process:e,truthy:t}),this.stack.push(t)},endSection:function(){this.stack.pop()},inverse:function(){this.stack.pop();var e=new o;this.last().last().falsey=e,this.stack.push(e)},compile:function(n){var r=this.stack[0].compile();return function(s,o){var u=e.compute(function(){return r(s,o)},this,!1,!0);u.bind("change",i);var a=u();u.hasDependencies?(n.attr?t.simpleAttribute(this,n.attr,u):t.attributes(this,u),u.unbind("change",i)):n.attr?e.attr.set(this,n.attr,a):t.setAttributes(this,a)}}});var s=function(e,t,n){return function(r,i){return e.call(this,r,i,t,n)}},o=function(){this.values=[]};return e.extend(o.prototype,{add:function(e){this.values.push(e)},last:function(){return this.values[this.values.length-1]},compile:function(){var e=this.values,t=e.length;for(var n=0;n<t;n++){var r=this.values[n];typeof r=="object"&&(e[n]=s(r.process,r.truthy&&r.truthy.compile(),r.falsey&&r.falsey.compile()))}return function(n,r){var i="",s;for(var o=0;o<t;o++)s=e[o],i+=typeof s=="string"?s:s.call(this,n,r);return i}}}),r});