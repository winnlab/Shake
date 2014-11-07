/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","./utils.js","can/view/live",function(e,t,n){n=n||e.view.live;var r=function(n){return t.isObserveLike(n)&&t.isArrayLike(n)&&n.attr("length")?n:e.isFunction(n)?n():n},i={each:function(i,s){var o=r(i),u=[],a,f,l;if(o instanceof e.List||i&&i.isComputed&&o===undefined)return function(e){var t=function(e,t,n){return s.fn(s.scope.add({"@index":t}).add(e),s.options,n)};n.list(e,i,t,s.context,e.parentNode,s.nodeList)};var c=o;if(!!c&&t.isArrayLike(c))for(l=0;l<c.length;l++)u.push(s.fn(s.scope.add({"@index":l}).add(c[l])));else if(t.isObserveLike(c)){a=e.Map.keys(c);for(l=0;l<a.length;l++)f=a[l],u.push(s.fn(s.scope.add({"@key":f}).add(c[f])))}else if(c instanceof Object)for(f in c)u.push(s.fn(s.scope.add({"@key":f}).add(c[f])));return u},"if":function(t,n){var i;return e.isFunction(t)?i=e.compute.truthy(t)():i=!!r(t),i?n.fn(n.scope||this):n.inverse(n.scope||this)},unless:function(t,n){return i["if"].apply(this,[e.isFunction(t)?e.compute(function(){return!t()}):!t,n])},"with":function(e,t){var n=e;e=r(e);if(!!e)return t.fn(n)},log:function(e,t){typeof console!="undefined"&&console.log&&(t?console.log(e,t.context):console.log(e.context))},data:function(t){var n=arguments.length===2?this:arguments[1];return function(r){e.data(e.$(r),t,n||this.context)}}};return{registerHelper:function(e,t){i[e]=t},getHelper:function(e,t){var n=t.attr("helpers."+e);n||(n=i[e]);if(n)return{fn:n}}}});