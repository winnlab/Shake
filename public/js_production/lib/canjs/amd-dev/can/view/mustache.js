/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/view/scope","can/view","can/view/scanner","can/compute","can/view/render"],function(e){e.view.ext=".mustache";var t="scope",n="___h4sh",r="{scope:"+t+",options:options}",i="{scope:"+t+",options:options, special: true}",s=t+",options",o=/((([^\s]+?=)?('.*?'|".*?"))|.*?)\s/g,u=/^(('.*?'|".*?"|[0-9]+\.?[0-9]*|true|false|null|undefined)|((.+?)=(('.*?'|".*?"|[0-9]+\.?[0-9]*|true|false)|(.+))))$/,a=function(e){return'{get:"'+e.replace(/"/g,'\\"')+'"}'},f=function(e){return e&&typeof e.get=="string"},l=function(t){return t instanceof e.Map||t&&!!t._get},c=function(e){return e&&e.splice&&typeof e.length=="number"},h=function(t,n,r){var i=function(e,r){return t(e||n,r)};return function(t,s){return t!==undefined&&!(t instanceof e.view.Scope)&&(t=n.add(t)),s!==undefined&&!(s instanceof e.view.Options)&&(s=r.add(s)),i(t,s||r)}},p=function(t,n){if(this.constructor!==p){var r=new p(t);return function(e,t){return r.render(e,t)}}if(typeof t=="function"){this.template={fn:t};return}e.extend(this,t),this.template=this.scanner.scan(this.text,this.name)};e.Mustache=window.Mustache=p,p.prototype.render=function(t,n){return t instanceof e.view.Scope||(t=new e.view.Scope(t||{})),n instanceof e.view.Options||(n=new e.view.Options(n||{})),n=n||{},this.template.fn.call(t,t,n)},e.extend(p.prototype,{scanner:new e.view.Scanner({text:{start:"",scope:t,options:",options: options",argNames:s},tokens:[["returnLeft","{{{","{{[{&]"],["commentFull","{{!}}","^[\\s\\t]*{{!.+?}}\\n"],["commentLeft","{{!","(\\n[\\s\\t]*{{!|{{!)"],["escapeFull","{{}}","(^[\\s\\t]*{{[#/^][^}]+?}}\\n|\\n[\\s\\t]*{{[#/^][^}]+?}}\\n|\\n[\\s\\t]*{{[#/^][^}]+?}}$)",function(e){return{before:/^\n.+?\n$/.test(e)?"\n":"",content:e.match(/\{\{(.+?)\}\}/)[1]||""}}],["escapeLeft","{{"],["returnRight","}}}"],["right","}}"]],helpers:[{name:/^>[\s]*\w*/,fn:function(t,n){var r=e.trim(t.replace(/^>\s?/,"")).replace(/["|']/g,"");return"can.Mustache.renderPartial('"+r+"',"+s+")"}},{name:/^\s*data\s/,fn:function(e,n){var r=e.match(/["|'](.*)["|']/)[1];return"can.proxy(function(__){can.data(can.$(__),'"+r+"', this.attr('.')); }, "+t+")"}},{name:/\s*\(([\$\w]+)\)\s*->([^\n]*)/,fn:function(e){var n=/\s*\(([\$\w]+)\)\s*->([^\n]*)/,r=e.match(n);return"can.proxy(function(__){var "+r[1]+"=can.$(__);with("+t+".attr('.')){"+r[2]+"}}, this);"}},{name:/^.*$/,fn:function(t,f){var l=!1,c={content:"",startTxt:!1,startOnlyTxt:!1,end:!1};t=e.trim(t);if(t.length&&(l=t.match(/^([#^/]|else$)/))){l=l[0];switch(l){case"#":case"^":f.specialAttribute?c.startOnlyTxt=!0:(c.startTxt=!0,c.escaped=0);break;case"/":return c.end=!0,c.content+='return ___v1ew.join("");}}])',c}t=t.substring(1)}if(l!=="else"){var h=[],p=[],d=0,v;c.content+="can.Mustache.txt(\n"+(f.specialAttribute?i:r)+",\n"+(l?'"'+l+'"':"null")+",",(e.trim(t)+" ").replace(o,function(e,t){d&&(v=t.match(u))?v[2]?h.push(v[0]):p.push(v[4]+":"+(v[6]?v[6]:a(v[5]))):h.push(a(t)),d++}),c.content+=h.join(","),p.length&&(c.content+=",{"+n+":{"+p.join(",")+"}}")}l&&l!=="else"&&(c.content+=",[\n\n");switch(l){case"^":case"#":c.content+="{fn:function("+s+"){var ___v1ew = [];";break;case"else":c.content+='return ___v1ew.join("");}},\n{inverse:function('+s+"){\nvar ___v1ew = [];";break;default:c.content+=")"}return l||(c.startTxt=!0,c.end=!0),c}}]})});var d=e.view.Scanner.prototype.helpers;for(var v=0;v<d.length;v++)p.prototype.scanner.helpers.unshift(d[v]);return p.txt=function(t,r,i){var s=t.scope,o=t.options,u=[],a={fn:function(){},inverse:function(){}},d,v=s.attr("."),m=!0,g;for(var y=3;y<arguments.length;y++){var b=arguments[y];if(r&&e.isArray(b))a=e.extend.apply(e,[a].concat(b));else if(b&&b[n]){d=b[n];for(var w in d)f(d[w])&&(d[w]=p.get(d[w].get,t,!1,!0))}else b&&f(b)?u.push(p.get(b.get,t,!1,!0)):u.push(b)}if(f(i)){var E=i.get;i=p.get(i.get,t,u.length,!1),m=E===i}a.fn=h(a.fn,s,o),a.inverse=h(a.inverse,s,o);if(r==="^"){var S=a.fn;a.fn=a.inverse,a.inverse=S}return(g=m&&typeof i=="string"&&p.getHelper(i,o)||e.isFunction(i)&&!i.isComputed&&{fn:i})?(e.extend(a,{context:v,scope:s,contexts:s,hash:d}),u.push(a),function(){return g.fn.apply(v,u)||""}):function(){var t;e.isFunction(i)&&i.isComputed?t=i():t=i;var n=u.length?u:[t],s=!0,o=[],f,h,p;if(r)for(f=0;f<n.length;f++)p=n[f],h=typeof p!="undefined"&&l(p),c(p)?r==="#"?s=s&&(h?!!p.attr("length"):!!p.length):r==="^"&&(s=s&&(h?!p.attr("length"):!p.length)):s=r==="#"?s&&!!p:r==="^"?s&&!p:s;if(s){if(r==="#"){if(c(t)){var d=l(t);for(f=0;f<t.length;f++)o.push(a.fn(d?t.attr(""+f):t[f]));return o.join("")}return a.fn(t||{})||""}return r==="^"?a.inverse(t||{})||"":""+(t!=null?t:"")}return""}},p.get=function(t,n,r,i){var s=n.scope.attr("."),o=n.options||{};if(r){if(p.getHelper(t,o))return t;if(n.scope&&e.isFunction(s[t]))return s[t];e.dev.warn('can/view/mustache/mustache.js: Unable to find helper "'+t+'".')}var u=n.scope.computeData(t,{isArgument:i,args:[s,n.scope]}),a=u.compute;e.compute.temporarilyBind(a);var f=u.initialValue;return f===undefined&&!r&&e.dev.warn('can/view/mustache/mustache.js: Unable to find key "'+t+'".'),f!==undefined&&u.scope===n.scope||!p.getHelper(t,o)?a.hasDependencies?a:f:t},p.resolve=function(t){return l(t)&&c(t)&&t.attr("length")?t:e.isFunction(t)?t():t},e.view.Options=e.view.Scope.extend({init:function(t,n){!t.helpers&&!t.partials&&!t.tags&&(t={helpers:t}),e.view.Scope.prototype.init.apply(this,arguments)}}),p._helpers={},p.registerHelper=function(e,t){this._helpers[e]={name:e,fn:t}},p.getHelper=function(e,t){var n=t.attr("helpers."+e);return n?{fn:n}:this._helpers[e]},p.render=function(t,n,r){if(!e.view.cached[t]){var i=e.__clearReading();n.attr("partial")&&(t=n.attr("partial")),e.__setReading(i)}return e.view.render(t,n,r)},p.safeString=function(e){return{toString:function(){return e}}},p.renderPartial=function(t,n,r){var i=r.attr("partials."+t);return i?i.render?i.render(n,r):i(n,r):e.Mustache.render(t,n,r)},e.each({"if":function(t,n){var r;return e.isFunction(t)?r=e.compute.truthy(t)():r=!!p.resolve(t),r?n.fn(n.contexts||this):n.inverse(n.contexts||this)},unless:function(t,n){return p._helpers["if"].fn.apply(this,[e.isFunction(t)?e.compute(function(){return!t()}):!t,n])},each:function(t,n){var r=p.resolve(t),i=[],s,o,u;if(e.view.lists&&(r instanceof e.List||t&&t.isComputed&&r===undefined))return e.view.lists(t,function(e,t){return n.fn(n.scope.add({"@index":t}).add(e))});t=r;if(!!t&&c(t)){for(u=0;u<t.length;u++)i.push(n.fn(n.scope.add({"@index":u}).add(t[u])));return i.join("")}if(l(t)){s=e.Map.keys(t);for(u=0;u<s.length;u++)o=s[u],i.push(n.fn(n.scope.add({"@key":o}).add(t[o])));return i.join("")}if(t instanceof Object){for(o in t)i.push(n.fn(n.scope.add({"@key":o}).add(t[o])));return i.join("")}},"with":function(e,t){var n=e;e=p.resolve(e);if(!!e)return t.fn(n)},log:function(e,t){typeof console!="undefined"&&console.log&&(t?console.log(e,t.context):console.log(e.context))}},function(e,t){p.registerHelper(t,e)}),e.view.register({suffix:"mustache",contentType:"x-mustache-template",script:function(e,t){return"can.Mustache(function("+s+") { "+(new p({text:t,name:e})).template.out+" })"},renderer:function(e,t){return p({text:t,name:e})}}),e.mustache.registerHelper=e.proxy(e.Mustache.registerHelper,e.Mustache),e.mustache.safeString=e.Mustache.safeString,e});