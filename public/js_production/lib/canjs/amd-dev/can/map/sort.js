/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/list"],function(e){var t=e.List._bubbleRule;e.List._bubbleRule=function(e,n){return n.comparator?"change":t.apply(this,arguments)};if(e.Model){var n=e.Model.List._bubbleRule;e.Model.List._bubbleRule=function(e,t){return t.comparator?"change":n.apply(this,arguments)}}var r=e.List.prototype,i=r._changes,s=r.setup;e.extend(r,{comparator:undefined,sortIndexes:[],sortedIndex:function(e){var t=e.attr(this.comparator),n=0;for(var r=0,i=this.length;r<i;r++){if(e===this[r]){n=-1;continue}if(t<=this[r].attr(this.comparator))return r+n}return r+n},sort:function(t,n){var r=this.comparator,i=r?[function(e,t){return e=typeof e[r]=="function"?e[r]():e[r],t=typeof t[r]=="function"?t[r]():t[r],e===t?0:e<t?-1:1}]:[t];return n||e.trigger(this,"reset"),Array.prototype.sort.apply(this,i)}});var o=function(t){return t[0]&&e.isArray(t[0])?t[0]:e.makeArray(t)};return e.each({push:"length",unshift:0},function(t,n){var r=e.List.prototype,i=r[n];r[n]=function(){var n=o(arguments),r=t?this.length:0,s=i.apply(this,arguments);return this.comparator&&n.length&&(this.sort(null,!0),e.batch.trigger(this,"reset",[n]),this._triggerChange(""+r,"add",n,undefined)),s}}),r._changes=function(t,n,r,s,o){if(this.comparator&&/^\d+./.test(n)){var u=+/^\d+/.exec(n)[0],a=this[u];if(typeof a!="undefined"){var f=this.sortedIndex(a);if(f!==u){[].splice.call(this,u,1),[].splice.call(this,f,0,a),e.trigger(this,"move",[a,f,u]),e.trigger(this,"change",[n.replace(/^\d+/,f),r,s,o]);return}}}i.apply(this,arguments)},r.setup=function(e,t){s.apply(this,arguments),this.comparator&&this.sort()},e.Map});