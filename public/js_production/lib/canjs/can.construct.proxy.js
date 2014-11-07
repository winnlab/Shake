/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/construct/proxy
 * Download from: http://canjs.com
 */

(function(e){var t=function(e,t){var n=e.isFunction,r=e.isArray,i=e.makeArray,s=function(e){var t=i(arguments),n;return e=t.shift(),r(e)||(e=[e]),n=this,function(){var o=t.concat(i(arguments)),u,a=e.length,f=0,l;for(;f<a;f++){l=e[f];if(!l)continue;u=typeof l=="string",o=(u?n[l]:l).apply(n,o||[]),f<a-1&&(o=!r(o)||o._use_call?[o]:o)}return o}};e.Construct.proxy=e.Construct.prototype.proxy=s;var o=[e.Map,e.Control,e.Model],u=0;for(;u<o.length;u++)o[u]&&(o[u].proxy=s);return e}(window.can,e)})();