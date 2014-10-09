/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library"],function(e){var t=e.isFunction,n=e.makeArray,r=1,i=function(e){var t=function(){return f.frag(e.apply(this,arguments))};return t.render=function(){return e.apply(e,arguments)},t},s=function(t,n){if(!t.length)throw e.dev.log("can/view/view.js: There is no template or an empty template at "+n),"can.view: No template or empty template:"+n},o=function(t,n){var r=typeof t=="string"?t:t.url,i=t.engine&&"."+t.engine||r.match(/\.[\w\d]+$/),o,u,a;r.match(/^#/)&&(r=r.substr(1));if(u=document.getElementById(r))i="."+u.type.match(/\/(x\-)?(.+)/)[2];!i&&!f.cached[r]&&(r+=i=f.ext),e.isArray(i)&&(i=i[0]),a=f.toId(r),r.match(/^\/\//)&&(r=r.substr(2),r=window.steal?steal.config().root.mapJoin(""+steal.id(r)):r),window.require&&require.toUrl&&(r=require.toUrl(r)),o=f.types[i];if(f.cached[a])return f.cached[a];if(u)return f.registerView(a,u.innerHTML,o);var l=new e.Deferred;return e.ajax({async:n,url:r,dataType:"text",error:function(e){s("",r),l.reject(e)},success:function(e){s(e,r),f.registerView(a,e,o,l)}}),l},u=function(t){var n=[];if(e.isDeferred(t))return[t];for(var r in t)e.isDeferred(t[r])&&n.push(t[r]);return n},a=function(t){return e.isArray(t)&&t[1]==="success"?t[0]:t},f=e.view=e.template=function(e,n,r,i){t(r)&&(i=r,r=undefined);var s;return t(e)?s=e(n,r,i):s=f.renderAs("fragment",e,n,r,i),s};return e.extend(f,{frag:function(e,t){return f.hookup(f.fragment(e),t)},fragment:function(t){if(typeof t!="string"&&t.nodeType===11)return t;var n=e.buildFragment(t,document.body);return n.childNodes.length||n.appendChild(document.createTextNode("")),n},toId:function(t){return e.map(t.toString().split(/\/|\./g),function(e){if(e)return e}).join("_")},toStr:function(e){return e==null?"":""+e},hookup:function(t,n){var r=[],i,s;return e.each(t.childNodes?e.makeArray(t.childNodes):t,function(t){t.nodeType===1&&(r.push(t),r.push.apply(r,e.makeArray(t.getElementsByTagName("*"))))}),e.each(r,function(e){e.getAttribute&&(i=e.getAttribute("data-view-id"))&&(s=f.hookups[i])&&(s(e,n,i),delete f.hookups[i],e.removeAttribute("data-view-id"))}),t},hookups:{},hook:function(e){return f.hookups[++r]=e," data-view-id='"+r+"'"},cached:{},cachedRenderers:{},cache:!0,register:function(t){this.types["."+t.suffix]=t,window.steal&&steal.type(t.suffix+" view js",function(e,t,n){var r=f.types["."+e.type],i=f.toId(e.id+"");e.text=r.script(i,e.text),t()}),e[t.suffix]=f[t.suffix]=function(e,n){var r,s;if(!n)return s=function(){return r||(t.fragRenderer?r=t.fragRenderer(null,e):r=i(t.renderer(null,e))),r.apply(this,arguments)},s.render=function(){var n=t.renderer(null,e);return n.apply(n,arguments)},s;var o=function(){return r||(t.fragRenderer?r=t.fragRenderer(e,n):r=t.renderer(e,n)),r.apply(this,arguments)};return t.fragRenderer?f.preload(e,o):f.preloadStringRenderer(e,o)}},types:{},ext:".ejs",registerScript:function(e,t,n){return"can.view.preloadStringRenderer('"+t+"',"+f.types["."+e].script(t,n)+");"},preload:function(t,n){var r=f.cached[t]=(new e.Deferred).resolve(function(e,t){return n.call(e,e,t)});return r.__view_id=t,f.cachedRenderers[t]=n,n},preloadStringRenderer:function(e,t){return this.preload(e,i(t))},render:function(t,n,r,i){return e.view.renderAs("string",t,n,r,i)},renderTo:function(e,t,n,r){return(e==="string"&&t.render?t.render:t)(n,r)},renderAs:function(r,i,s,l,c){t(l)&&(c=l,l=undefined);var h=u(s),p,d,v,m,g;if(h.length)return d=new e.Deferred,v=e.extend({},s),h.push(o(i,!0)),e.when.apply(e,h).then(function(t){var i=n(arguments),o=i.pop(),u;if(e.isDeferred(s))v=a(t);else for(var f in s)e.isDeferred(s[f])&&(v[f]=a(i.shift()));u=e.view.renderTo(r,o,v,l),d.resolve(u,v),c&&c(u,v)},function(){d.reject.apply(d,arguments)}),d;p=e.__clearReading(),m=t(c),d=o(i,m),p&&e.__setReading(p);if(m)g=d,d.then(function(t){c(s?e.view.renderTo(r,t,s,l):t)});else{if(d.state()==="resolved"&&d.__view_id){var y=f.cachedRenderers[d.__view_id];return s?e.view.renderTo(r,y,s,l):y}d.then(function(t){g=s?e.view.renderTo(r,t,s,l):t})}return g},registerView:function(t,n,r,s){var o=typeof r=="object"?r:f.types[r||f.ext],u;return o.fragRenderer?u=o.fragRenderer(t,n):u=i(o.renderer(t,n)),s=s||new e.Deferred,f.cache&&(f.cached[t]=s,s.__view_id=t,f.cachedRenderers[t]=u),s.resolve(u)}}),window.steal&&steal.type("view js",function(e,t,n){var r=f.types["."+e.type],i=f.toId(e.id),s=r.plugin||"can/view/"+e.type,o=r.fragRenderer?"preload":"preloadStringRenderer";e.text="steal('can/view','"+s+"',function(can){return "+"can.view."+o+"('"+i+"',"+e.text+");\n})",t()}),e});