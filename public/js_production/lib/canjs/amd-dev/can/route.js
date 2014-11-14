/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/map","can/list","can/util/string/deparam"],function(e){var t=/\:([\w\.]+)/g,n=/^(?:&[^=]+=[^&]*)+/,r=function(t){var n=[];return e.each(t,function(t,r){n.push((r==="className"?"class":r)+'="'+(r==="href"?t:e.esc(t))+'"')}),n.join(" ")},i=function(e,t){var n=0,r=0,i={};for(var s in e.defaults)e.defaults[s]===t[s]&&(i[s]=1,n++);for(;r<e.names.length;r++){if(!t.hasOwnProperty(e.names[r]))return-1;i[e.names[r]]||n++}return n},s=window.location,o=function(e){return(e+"").replace(/([.?*+\^$\[\]\\(){}|\-])/g,"\\$1")},u=e.each,a=e.extend,f=function(t){return t&&typeof t=="object"?(t instanceof e.Map?t=t.attr():t=e.isFunction(t.slice)?t.slice():e.extend({},t),e.each(t,function(e,n){t[n]=f(e)})):t!==undefined&&t!==null&&e.isFunction(t.toString)&&(t=t.toString()),t},l=function(e){return e.replace(/\\/g,"")},c,h,p,d,v=function(t,n,r,i){d=1,clearTimeout(c),c=setTimeout(function(){d=0;var t=e.route.data.serialize(),n=e.route.param(t,!0);e.route._call("setURL",n),p=n},10)};e.route=function(n,r){var i=e.route._call("root");i.lastIndexOf("/")===i.length-1&&n.indexOf("/")===0&&(n=n.substr(1)),r=r||{};var s=[],u,a="",f=t.lastIndex=0,c,h=e.route._call("querySeparator"),p=e.route._call("matchSlashes");while(u=t.exec(n))s.push(u[1]),a+=l(n.substring(f,t.lastIndex-u[0].length)),c="\\"+(l(n.substr(t.lastIndex,1))||h+(p?"":"|/")),a+="([^"+c+"]"+(r[u[1]]?"*":"+")+")",f=t.lastIndex;return a+=n.substr(f).replace("\\",""),e.route.routes[n]={test:new RegExp("^"+a+"($|"+o(h)+")"),route:n,names:s,defaults:r,length:n.split("/").length},e.route},a(e.route,{param:function(n,r){var s,o=0,f,l=n.route,c=0;delete n.route,u(n,function(){c++}),u(e.route.routes,function(e,t){f=i(e,n),f>o&&(s=e,o=f);if(f>=c)return!1}),e.route.routes[l]&&i(e.route.routes[l],n)===o&&(s=e.route.routes[l]);if(s){var h=a({},n),p=s.route.replace(t,function(e,t){return delete h[t],n[t]===s.defaults[t]?"":encodeURIComponent(n[t])}).replace("\\",""),d;return u(s.defaults,function(e,t){h[t]===e&&delete h[t]}),d=e.param(h),r&&e.route.attr("route",s.route),p+(d?e.route._call("querySeparator")+d:"")}return e.isEmptyObject(n)?"":e.route._call("querySeparator")+e.param(n)},deparam:function(t){var n=e.route._call("root");n.lastIndexOf("/")===n.length-1&&t.indexOf("/")===0&&(t=t.substr(1));var r={length:-1},i=e.route._call("querySeparator"),s=e.route._call("paramsMatcher");u(e.route.routes,function(e,n){e.test.test(t)&&e.length>r.length&&(r=e)});if(r.length>-1){var o=t.match(r.test),f=o.shift(),l=t.substr(f.length-(o[o.length-1]===i?1:0)),c=l&&s.test(l)?e.deparam(l.slice(1)):{};return c=a(!0,{},r.defaults,c),u(o,function(e,t){e&&e!==i&&(c[r.names[t]]=decodeURIComponent(e))}),c.route=r.route,c}return t.charAt(0)!==i&&(t=i+t),s.test(t)?e.deparam(t.slice(1)):{}},data:new e.Map({}),map:function(t){var n;t.prototype instanceof e.Map?n=new t:n=t,e.route.data=n},routes:{},ready:function(t){return t!==!0&&(e.route._setup(),e.route.setState()),e.route},url:function(t,n){return n&&(t=e.extend({},e.route.deparam(e.route._call("matchingPartOfURL")),t)),e.route._call("root")+e.route.param(t)},link:function(t,n,i,s){return"<a "+r(a({href:e.route.url(n,s)},i))+">"+t+"</a>"},current:function(t){return this._call("matchingPartOfURL")===e.route.param(t)},bindings:{hashchange:{paramsMatcher:n,querySeparator:"&",matchSlashes:!1,bind:function(){e.bind.call(window,"hashchange",m)},unbind:function(){e.unbind.call(window,"hashchange",m)},matchingPartOfURL:function(){return s.href.split(/#!?/)[1]||""},setURL:function(e){return s.hash="#!"+e,e},root:"#!"}},defaultBinding:"hashchange",currentBinding:null,_setup:function(){e.route.currentBinding||(e.route._call("bind"),e.route.bind("change",v),e.route.currentBinding=e.route.defaultBinding)},_teardown:function(){e.route.currentBinding&&(e.route._call("unbind"),e.route.unbind("change",v),e.route.currentBinding=null),clearTimeout(c),d=0},_call:function(){var t=e.makeArray(arguments),n=t.shift(),r=e.route.bindings[e.route.currentBinding||e.route.defaultBinding],i=r[n];return i.apply?i.apply(r,t):i}}),u(["bind","unbind","on","off","delegate","undelegate","removeAttr","compute","_get","__get"],function(t){e.route[t]=function(){if(!e.route.data[t])return;return e.route.data[t].apply(e.route.data,arguments)}}),e.route.attr=function(t,n){var r=typeof t,i;return n===undefined?i=arguments:r!=="string"&&r!=="number"?i=[f(t),n]:i=[t,f(n)],e.route.data.attr.apply(e.route.data,i)};var m=e.route.setState=function(){var t=e.route._call("matchingPartOfURL"),n=h;h=e.route.deparam(t);if(!d||t!==p){e.batch.start();for(var r in n)h[r]||e.route.removeAttr(r);e.route.attr(h),e.batch.stop()}};return e.route});