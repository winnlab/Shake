/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/view/elements.js",function(e){var t=!0;try{document.createTextNode("")._=0}catch(n){t=!1}var r={},i={},s="ejs_"+Math.random(),o=0,u=function(e,n){var r=n||i,u=a(e,r);return u?u:t||e.nodeType!==3?(++o,e[s]=(e.nodeName?"element_":"obj_")+o):(++o,r["text_"+o]=e,"text_"+o)},a=function(e,n){if(t||e.nodeType!==3)return e[s];for(var r in n)if(n[r]===e)return r},f=[].splice,l=[].push,c=function(e){var t=0;for(var n=0,r=e.length;n<r;n++){var i=e[n];i.nodeType?t++:t+=c(i)}return t},h=function(e,t){var n={};for(var r=0,i=e.length;r<i;r++){var s=p.first(e[r]);n[u(s,t)]=e[r]}return n},p={id:u,update:function(t,n){var r=p.unregisterChildren(t);n=e.makeArray(n);var i=t.length;return f.apply(t,[0,i].concat(n)),t.replacements?p.nestReplacements(t):p.nestList(t),r},nestReplacements:function(e){var t=0,n={},r=h(e.replacements,n),i=e.replacements.length;while(t<e.length&&i){var s=e[t],o=r[a(s,n)];o&&(e.splice(t,c(o),o),i--),t++}e.replacements=[]},nestList:function(e){var t=0;while(t<e.length){var n=e[t],i=r[u(n)];i?i!==e&&e.splice(t,c(i),i):r[u(n)]=e,t++}},last:function(e){var t=e[e.length-1];return t.nodeType?t:p.last(t)},first:function(e){var t=e[0];return t.nodeType?t:p.first(t)},register:function(e,t,n){return e.unregistered=t,e.parentList=n,n===!0?e.replacements=[]:n?(n.replacements.push(e),e.replacements=[]):p.nestList(e),e},unregisterChildren:function(t){var n=[];return e.each(t,function(e){e.nodeType?(t.replacements||delete r[u(e)],n.push(e)):l.apply(n,p.unregister(e))}),n},unregister:function(e){var t=p.unregisterChildren(e);if(e.unregistered){var n=e.unregistered;delete e.unregistered,delete e.replacements,n()}return t},nodeMap:r};return e.view.nodeLists=p,p});