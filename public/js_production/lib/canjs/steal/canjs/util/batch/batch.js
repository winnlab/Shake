/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util/can.js",function(e){var t=1,n=0,r=[],i=[];e.batch={start:function(e){n++,e&&i.push(e)},stop:function(s,o){s?n=0:n--;if(n===0){var u=r.slice(0),a=i.slice(0),f,l;r=[],i=[],t++,o&&e.batch.start();for(f=0,l=u.length;f<l;f++)e.dispatch.apply(u[f][0],u[f][1]);for(f=0,l=a.length;f<a.length;f++)a[f]()}},trigger:function(i,s,o){if(!i._init){if(n===0)return e.dispatch.call(i,s,o);s=typeof s=="string"?{type:s}:s,s.batchNum=t,r.push([i,[s,o]])}}}});