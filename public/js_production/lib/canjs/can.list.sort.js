/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/map/sort
 * Download from: http://canjs.com
 */

(function(e){var t=function(t){var n=t.List._bubbleRule;t.List._bubbleRule=function(e,t){return t.comparator?"change":n.apply(this,arguments)};if(t.Model){var r=t.Model.List._bubbleRule;t.Model.List._bubbleRule=function(e,t){return t.comparator?"change":r.apply(this,arguments)}}var i=t.List.prototype,s=i._changes,o=i.setup;t.extend(i,{comparator:e,sortIndexes:[],sortedIndex:function(e){var t=e.attr(this.comparator),n=0;for(var r=0,i=this.length;r<i;r++){if(e===this[r]){n=-1;continue}if(t<=this[r].attr(this.comparator))return r+n}return r+n},sort:function(e,n){var r=this.comparator,i=r?[function(e,t){return e=typeof e[r]=="function"?e[r]():e[r],t=typeof t[r]=="function"?t[r]():t[r],e===t?0:e<t?-1:1}]:[e];return n||t.trigger(this,"reset"),Array.prototype.sort.apply(this,i)}});var u=function(e){return e[0]&&t.isArray(e[0])?e[0]:t.makeArray(e)};return t.each({push:"length",unshift:0},function(n,r){var i=t.List.prototype,s=i[r];i[r]=function(){var r=u(arguments),i=n?this.length:0,o=s.apply(this,arguments);return this.comparator&&r.length&&(this.sort(null,!0),t.batch.trigger(this,"reset",[r]),this._triggerChange(""+i,"add",r,e)),o}}),i._changes=function(e,n,r,i,o){if(this.comparator&&/^\d+./.test(n)){var u=+/^\d+/.exec(n)[0],a=this[u];if(typeof a!="undefined"){var f=this.sortedIndex(a);if(f!==u){[].splice.call(this,u,1),[].splice.call(this,f,0,a),t.trigger(this,"move",[a,f,u]),t.trigger(this,"change",[n.replace(/^\d+/,f),r,i,o]);return}}}s.apply(this,arguments)},i.setup=function(e,t){o.apply(this,arguments),this.comparator&&this.sort()},t.Map}(window.can,e)})();