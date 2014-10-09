/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/construct"],function(e,t){var n=e.isFunction,r=e.isArray,i=e.makeArray,s=function(e){var t=i(arguments),s;e=t.shift(),r(e)||(e=[e]),s=this;for(var o=0;o<e.length;o++)if(typeof e[o]=="string"&&!n(this[e[o]]))throw"class.js "+(this.fullName||this.Class.fullName)+" does not have a "+e[o]+"method!";return function(){var o=t.concat(i(arguments)),u,a=e.length,f=0,l;for(;f<a;f++){l=e[f];if(!l)continue;u=typeof l=="string",o=(u?s[l]:l).apply(s,o||[]),f<a-1&&(o=!r(o)||o._use_call?[o]:o)}return o}};e.Construct.proxy=e.Construct.prototype.proxy=s;var o=[e.Map,e.Control,e.Model],u=0;for(;u<o.length;u++)o[u]&&(o[u].proxy=s);return e});