/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["jquery","can/util/library","can/view"],function(e,t){var n,r,i,s,o,u,a={val:!0,text:!0};return n=function(n){var s=e.fn[n];e.fn[n]=function(){var e=t.makeArray(arguments),o,f,l=this,c;if(t.isDeferred(e[0]))return e[0].done(function(e){r.call(l,[e],s)}),this;if(i(e)){if(o=u(e))return f=e[o],e[o]=function(e){r.call(l,[e],s),f.call(l,e)},t.view.apply(t.view,e),this;c=t.view.apply(t.view,e);if(!!t.isDeferred(c))return c.done(function(e){r.call(l,[e],s)}),this;e=[c]}return a[n]?s.apply(this,e):r.call(this,e,s)}},r=function(e,n){var r;for(var i in t.view.hookups)break;return i&&e[0]&&s(e[0])&&(e[0]=t.view.frag(e[0]).childNodes),r=n.apply(this,e),r},i=function(e){var t=typeof e[1];return typeof e[0]=="string"&&(t==="object"||t==="function")&&!o(e[1])},o=function(e){return e.nodeType||e[0]&&e[0].nodeType},s=function(e){return o(e)?!0:typeof e=="string"?(e=t.trim(e),e.substr(0,1)==="<"&&e.substr(e.length-1,1)===">"&&e.length>=3):!1},u=function(e){return typeof e[3]=="function"?3:typeof e[2]=="function"&&2},e.fn.hookup=function(){return t.view.frag(this),this},t.each(["prepend","append","after","before","text","html","replaceWith","val"],function(e){n(e)}),t});