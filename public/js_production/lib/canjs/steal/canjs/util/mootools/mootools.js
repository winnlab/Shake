/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util/can.js","can/util/attr","mootools","can/event","can/util/fragment.js","can/util/deferred.js","can/util/array/each.js","can/util/object/isplain","can/util/inserted",function(e,t){e.trim=function(e){return e?e.trim():e};var n=function(){var t,n,r,i,s,o,u=arguments[0]||{},a=1,f=arguments.length,l=!1;typeof u=="boolean"&&(l=u,u=arguments[1]||{},a=2),typeof u!="object"&&!e.isFunction(u)&&(u={}),f===a&&(u=this,--a);for(;a<f;a++)if((t=arguments[a])!==null)for(n in t){r=u[n],i=t[n];if(u===i)continue;l&&i&&(e.isPlainObject(i)||(s=e.isArray(i)))?(s?(s=!1,o=r&&e.isArray(r)?r:[]):o=r&&e.isPlainObject(r)?r:{},u[n]=e.extend(l,o,i)):i!==undefined&&(u[n]=i)}return u};e.extend=n,e.makeArray=function(e){if(e===null)return[];try{return Type.isEnumerable(e)&&typeof e!="string"?Array.prototype.slice.call(e):[e]}catch(t){var n=[],r;for(r=0;r<e.length;++r)n.push(e[r]);return n}},e.isArray=function(e){return typeOf(e)==="array"},e.inArray=function(e,t,n){return t?Array.prototype.indexOf.call(t,e,n):-1},e.map=function(e,t){return Array.from(e||[]).map(t)},e.param=function(e){return Object.toQueryString(e)},e.isEmptyObject=function(e){return Object.keys(e).length===0},e.proxy=function(){var t=e.makeArray(arguments),n=t.shift();return n.bind.apply(n,t)},e.isFunction=function(e){return typeOf(e)==="function"},e.bind=function(t,n){return this.bind&&this.bind!==e.bind?this.bind(t,n):this.nodeName&&this.nodeType&&this.nodeType!==11?e.$(this).addEvent(t,n):this.addEvent?this.addEvent(t,n):e.addEvent.call(this,t,n),this},e.unbind=function(t,n){return this.unbind&&this.unbind!==e.unbind?this.unbind(t,n):this.nodeName&&this.nodeType&&this.nodeType!==11?e.$(this).removeEvent(t,n):this.removeEvent?this.removeEvent(t,n):e.removeEvent.call(this,t,n),this},e.on=e.bind,e.off=e.unbind,e.trigger=function(t,n,r,i){i=i===undefined?!0:i,r=r||[];var s=!0;if(t.fireEvent){t=t[0]||t;while(t&&s){n.type||(n={type:n,target:t,stopPropagation:function(){s=!1}});var o=t!==window?e.$(t).retrieve("events")[0]:t.retrieve("events");o&&o[n.type]&&o[n.type].keys.each(function(e){e.apply(t,[n].concat(r))},this),i&&t.parentNode&&t.parentNode.nodeType!==11?t=t.parentNode:t=null}}else typeof n=="string"&&(n={type:n}),n.target=n.target||t,e.dispatch.call(t,n,e.makeArray(r))},e.delegate=function(t,n,r){return this.delegate?this.delegate(t,n,r):this.addEvent?this.addEvent(n+":relay("+t+")",r):e.bind.call(this,n,r),this},e.undelegate=function(t,n,r){return this.undelegate?this.undelegate(t,n,r):this.removeEvent?this.removeEvent(n+":relay("+t+")",r):e.unbind.call(this,n,r),this};var r={type:"method",success:undefined,error:undefined},i=function(e,t){for(var n in e)typeof t[n]=="function"?t[n]=function(){e[n].apply(e,arguments)}:t[n]=n[e]};e.ajax=function(t){var n=e.Deferred(),s=e.extend({},t),o;for(var u in r)s[u]!==undefined&&(s[r[u]]=s[u],delete s[u]);s.method=s.method||"get",s.url=s.url.toString();var a=t.onSuccess||t.success,f=t.onFailure||t.error;return s.onSuccess=function(e,t){var r=e;i(o.xhr,n),n.resolve(r,"success",o.xhr),a&&a(r,"success",o.xhr)},s.onFailure=function(){i(o.xhr,n),n.reject(o.xhr,"error"),f&&f(o.xhr,"error")},t.dataType==="json"?o=new Request.JSON(s):o=new Request(s),o.send(),i(o.xhr,n),n},e.$=function(e){return e===window?window:$$(e&&e.nodeName?[e]:e)};var s=document.id;document.id=function(e){return e&&e.nodeType===11?e:s.apply(document,arguments)},e.append=function(t,n){return typeof n=="string"&&(n=e.buildFragment(n)),t.grab(n)},e.filter=function(e,t){return e.filter(t)},e.data=function(e,t,n){return n===undefined?e[0].retrieve(t):e.store(t,n)},e.addClass=function(e,t){return e.addClass(t)},e.remove=function(e){var t=e.filter(function(e){if(e.nodeType===1)return!0;e.parentNode.removeChild(e)});return t.destroy(),t},e.has=function(e,t){return Slick.contains(e[0],t)?e:[]};var o=Element.prototype.destroy,u=Element.prototype.grab,a=Element.prototype.set;Element.implement({destroy:function(){e.trigger(this,"removed",[],!1);var t=this.getElementsByTagName("*");for(var n=0,r;(r=t[n])!==undefined;n++)e.trigger(r,"removed",[],!1);o.apply(this,arguments)},grab:function(t){var n;t&&t.nodeType===11?n=e.makeArray(t.childNodes):n=[t];var r=u.apply(this,arguments);return e.inserted(n),r},set:function(t,n){var r=e.inArray(t,["events","html","load","morph","send","tag","tween"])===-1,i,s;r&&(s=this.get(t));var o=a.apply(this,arguments);return r&&(i=this.get(t)),i!==s&&e.attr.trigger(this,t,s),o}.overloadSetter()}),e.get=function(e,t){return e[t]};var f=Slick.uidOf;return Slick.uidOf=function(e){return e.nodeType===1||e===window||e.document===document?f(e):Math.random()},Element.NativeEvents.hashchange=2,e.attr=t,delete t.MutationObserver,Element.Events.attributes={onAdd:function(){var t=e.$(this);e.data(t,"canHasAttributesBindings",(e.data(t,"canHasAttributesBindings")||0)+1)},onRemove:function(){var t=e.$(this),n=e.data(t,"canHasAttributesBindings")||0;n<=0?e.cleanData(t,"canHasAttributesBindings"):e.data(t,"canHasAttributesBindings",n-1)}},e});