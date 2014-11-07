/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/can"],function(e){e.inserted=function(t){t=e.makeArray(t);var n=!1,r=e.$(document.contains?document:document.body),i;for(var s=0,o;(o=t[s])!==undefined;s++){if(!n){if(!o.getElementsByTagName)continue;if(!e.has(r,o).length)return;n=!0}if(n&&o.getElementsByTagName){i=e.makeArray(o.getElementsByTagName("*")),e.trigger(o,"inserted",[],!1);for(var u=0,a;(a=i[u])!==undefined;u++)e.trigger(a,"inserted",[],!1)}}},e.appendChild=function(t,n){var r;n.nodeType===11?r=e.makeArray(n.childNodes):r=[n],t.appendChild(n),e.inserted(r)},e.insertBefore=function(t,n,r){var i;n.nodeType===11?i=e.makeArray(n.childNodes):i=[n],t.insertBefore(n,r),e.inserted(i)}});