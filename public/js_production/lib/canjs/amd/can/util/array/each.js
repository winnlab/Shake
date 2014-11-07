/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/can"],function(e){var t=function(e){var t=e.length;return typeof arr!="function"&&(t===0||typeof t=="number"&&t>0&&t-1 in e)};return e.each=function(n,r,i){var s=0,o,u,a;if(n)if(t(n))if(e.List&&n instanceof e.List)for(u=n.attr("length");s<u;s++){a=n.attr(s);if(r.call(i||a,a,s,n)===!1)break}else for(u=n.length;s<u;s++){a=n[s];if(r.call(i||a,a,s,n)===!1)break}else if(typeof n=="object")if(e.Map&&n instanceof e.Map||n===e.route){var f=e.Map.keys(n);for(s=0,u=f.length;s<u;s++){o=f[s],a=n.attr(o);if(r.call(i||a,a,o,n)===!1)break}}else for(o in n)if(n.hasOwnProperty(o)&&r.call(i||n[o],n[o],o,n)===!1)break;return n},e});