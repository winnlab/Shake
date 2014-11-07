/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/view","./elements","can/view/live","can/util/string",function(e,t,n){var r=[],i=function(e){var n=t.tagMap[e]||"span";return n==="span"?"@@!!@@":"<"+n+">"+i(n)+"</"+n+">"},s=function(t,n){if(typeof t=="string")return t;if(!t&&t!==0)return"";var i=t.hookup&&function(e,n){t.hookup.call(t,e,n)}||typeof t=="function"&&t;if(i)return n?"<"+n+" "+e.view.hook(i)+"></"+n+">":(r.push(i),"");return""+t},o=function(t,n){return typeof t=="string"||typeof t=="number"?e.esc(t):s(t,n)},u=!1,a=function(){},f;return e.extend(e.view,{live:n,setupLists:function(){var t=e.view.lists,n;return e.view.lists=function(e,t){return n={list:e,renderer:t},Math.random()},function(){return e.view.lists=t,n}},getHooks:function(){var e=r.slice(0);return f=e,r=[],e},onlytxt:function(e,t){return o(t.call(e))},txt:function(l,c,h,p,d){var v=t.tagMap[c]||"span",m=!1,g,y,b,w=a,E;if(u)g=d.call(p);else{if(typeof h=="string"||h===1)u=!0;var S=e.view.setupLists();w=function(){b.unbind("change",a)},b=e.compute(d,p,!1),b.bind("change",a),y=S(),g=b(),u=!1,m=b.hasDependencies}if(y)return w(),"<"+v+e.view.hook(function(e,t){n.list(e,y.list,y.renderer,p,t)})+"></"+v+">";if(!m||typeof g=="function")return w(),(u||l===2||!l?s:o)(g,h===0&&v);var x=t.tagToContentPropMap[c];return h===0&&!x?"<"+v+e.view.hook(l&&typeof g!="object"?function(e,t){n.text(e,b,t),w()}:function(e,t){n.html(e,b,t),w()})+">"+i(v)+"</"+v+">":h===1?(r.push(function(e){n.attributes(e,b,b()),w()}),b()):l===2?(E=h,r.push(function(e){n.specialAttribute(e,E,b),w()}),b()):(E=h===0?x:h,(h===0?f:r).push(function(e){n.attribute(e,E,b),w()}),n.attributePlaceholder)}}),e});