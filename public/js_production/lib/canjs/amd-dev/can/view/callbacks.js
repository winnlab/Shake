/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/view"],function(e){var t=e.view.attr=function(e,t){if(!t){var i=n[e];if(!i)for(var s=0,o=r.length;s<o;s++){var u=r[s];if(u.match.test(e)){i=u.handler;break}}return i}typeof e=="string"?n[e]=t:r.push({match:e,handler:t})},n={},r=[],i=/[-\:]/,s=e.view.tag=function(e,t){if(!t){var n=o[e.toLowerCase()];return!n&&i.test(e)&&(n=function(){}),n}window.html5&&(window.html5.elements+=" "+e,window.html5.shivDocument()),o[e.toLowerCase()]=t},o={};return e.view.callbacks={_tags:o,_attributes:n,_regExpAttributes:r,tag:s,attr:t,tagHandler:function(t,n,r){var i=r.options.attr("tags."+n),s=i||o[n],u=r.scope,a;if(s){var f=e.__clearReading();a=s(t,r),e.__setReading(f)}else a=u;s||e.dev.warn("can/view/scanner.js: No custom element found for "+n);if(a&&r.subtemplate){u!==a&&(u=u.add(a));var l=r.subtemplate(u,r.options),c=typeof l=="string"?e.view.frag(l):l;e.appendChild(t,c)}}},e.view.callbacks});