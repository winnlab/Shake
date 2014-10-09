/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/map/bubble.js",function(e){var t=e.bubble;return e.extend({},t,{childrenOf:function(e,n){e._nestedReference?e._nestedReference.each(function(r,i){r&&r.bind&&t.toParent(r,e,i(),n)}):t._each.apply(this,arguments)}})});