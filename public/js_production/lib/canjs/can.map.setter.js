/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/map/setter
 * Download from: http://canjs.com
 */

(function(e){var t=function(t){t.classize=function(e,n){var r=e.split(t.undHash),i=0;for(;i<r.length;i++)r[i]=t.capitalize(r[i]);return r.join(n||"")};var n=t.classize,r=t.Map.prototype,i=r.__set;return r.__set=function(r,s,o,u,a){var f=n(r),l="set"+f,c=function(e){var n=a&&a.call(h,e);return n!==!1&&t.trigger(h,"error",[r,e],!0),!1},h=this;if(this[l]){t.batch.start(),s=this[l](s,function(e){i.call(h,r,e,o,u,c)},c);if(s===e){t.batch.stop();return}return i.call(h,r,s,o,u,c),t.batch.stop(),this}return i.call(h,r,s,o,u,c),this},t.Map}(window.can,e)})();