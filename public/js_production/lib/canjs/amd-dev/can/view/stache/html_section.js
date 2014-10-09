/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/view/target","can/view/stache/utils","can/view/stache/mustache_core"],function(e,t,n,r){var i=function(){var e=document.createElement("div");return function(t){return t.indexOf("&")===-1?t.replace(/\r\n/g,"\n"):(e.innerHTML=t,e.childNodes.length===0?"":e.childNodes[0].nodeValue)}}(),s=function(){this.stack=[new o]};e.extend(s.prototype,n.mixins),e.extend(s.prototype,{startSubSection:function(e){var t=new o(e);return this.stack.push(t),t},endSubSectionAndReturnRenderer:function(){if(this.last().isEmpty())return this.stack.pop(),null;var t=this.endSection();return e.proxy(t.compiled.hydrate,t.compiled)},startSection:function(e){var t=new o(e);this.last().add(t.targetCallback),this.stack.push(t)},endSection:function(){return this.last().compile(),this.stack.pop()},inverse:function(){this.last().inverse()},compile:function(){var t=this.stack.pop().compile();return function(n,i){return n instanceof e.view.Scope||(n=new e.view.Scope(n||{})),i instanceof r.Options||(i=new r.Options(i||{})),t.hydrate(n,i)}},push:function(e){this.last().push(e)},pop:function(){return this.last().pop()}});var o=function(t){this.data="targetData",this.targetData=[],this.targetStack=[];var n=this;this.targetCallback=function(r,i,s){t.call(this,r,i,s,e.proxy(n.compiled.hydrate,n.compiled),n.inverseCompiled&&e.proxy(n.inverseCompiled.hydrate,n.inverseCompiled))}};return e.extend(o.prototype,{inverse:function(){this.inverseData=[],this.data="inverseData"},push:function(e){this.add(e),this.targetStack.push(e)},pop:function(){return this.targetStack.pop()},add:function(e){typeof e=="string"&&(e=i(e)),this.targetStack.length?this.targetStack[this.targetStack.length-1].children.push(e):this[this.data].push(e)},compile:function(){return this.compiled=t(this.targetData),this.inverseData&&(this.inverseCompiled=t(this.inverseData),delete this.inverseData),delete this.targetData,delete this.targetStack,this.compiled},children:function(){return this.targetStack.length?this.targetStack[this.targetStack.length-1].children:this[this.data]},isEmpty:function(){return!this.targetData.length}}),s});