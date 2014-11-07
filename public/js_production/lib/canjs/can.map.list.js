/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/map/list
 * Download from: http://canjs.com
 */

(function(e){var t=function(e){return e.extend(e.List.prototype,{filter:function(t){var n=new this.constructor,r=this,i=function(i,s){var o=function(e,t){var r=n.indexOf(i);!t&&r!==-1&&n.splice(r,1),t&&r===-1&&n.push(i)},u=e.compute(function(){return t(i,r.indexOf(i),r)});u.bind("change",o),o(null,u())};return this.bind("add",function(t,n,r){e.each(n,function(e,t){i(e,r+t)})}),this.bind("remove",function(t,r,i){e.each(r,function(e,t){var r=n.indexOf(e);r!==-1&&n.splice(r,1)})}),this.forEach(i),n},map:function(t){var n=new e.List,r=this,i=function(i,s){var o=e.compute(function(){return t(i,s,r)});o.bind("change",function(e,t){n.splice(s,1,t)}),n.splice(s,0,o())};return this.forEach(i),this.bind("add",function(t,n,r){e.each(n,function(e,t){i(e,r+t)})}),this.bind("remove",function(e,t,r){n.splice(r,t.length)}),n}}),e.List}(window.can,e,e,e)})();