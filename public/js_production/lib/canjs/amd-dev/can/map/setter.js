/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/map"],function(e){e.classize=function(t,n){var r=t.split(e.undHash),i=0;for(;i<r.length;i++)r[i]=e.capitalize(r[i]);return r.join(n||"")};var t=e.classize,n=e.Map.prototype,r=n.__set;return n.__set=function(n,i,s,o,u){var a;e.dev.warn("can/map/setter is a deprecated plugin and will be removed in a future release. can/map/define provides the same functionality in a more complete API.");var f=t(n),l="set"+f,c=function(t){clearTimeout(a);var r=u&&u.call(h,t);return r!==!1&&e.trigger(h,"error",[n,t],!0),!1},h=this;if(this[l]){e.batch.start(),i=this[l](i,function(e){r.call(h,n,e,s,o,c),clearTimeout(a)},c);if(i===undefined){a=setTimeout(function(){e.dev.warn("can/map/setter.js: Setter "+l+" did not return a value or call the setter callback.")},e.dev.warnTimeout),e.batch.stop();return}return r.call(h,n,i,s,o,c),e.batch.stop(),this}return r.call(h,n,i,s,o,c),this},e.Map});