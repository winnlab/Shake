/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/util/string"],function(e){var t=/^\d+$/,n=/([^\[\]]+)|(\[\])/g,r=/([^?#]*)(#.*)?$/,i=function(e){return decodeURIComponent(e.replace(/\+/g," "))};return e.extend(e,{deparam:function(s){var o={},u,a;return s&&r.test(s)&&(u=s.split("&"),e.each(u,function(e){var r=e.split("="),s=i(r.shift()),u=i(r.join("=")),f=o;if(s){r=s.match(n);for(var l=0,c=r.length-1;l<c;l++)f[r[l]]||(f[r[l]]=t.test(r[l+1])||r[l+1]==="[]"?[]:{}),f=f[r[l]];a=r.pop(),a==="[]"?f.push(u):f[a]=u}})),o}}),e});