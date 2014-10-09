/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/list"],function(e){var t=can.List.prototype.replace;can.List.prototype.replace=function(e){var n=t.apply(this,arguments);if(can.isDeferred(e)){can.batch.start(),this.attr("state",e.state()),this.removeAttr("reason"),can.batch.stop();var r=this,i=this._deferred=new can.Deferred;e.then(function(){r.attr("state",e.state()),i.resolve(r)},function(t){can.batch.start(),r.attr("state",e.state()),r.attr("reason",t),can.batch.stop(),i.reject(t)})}return n},can.each({isResolved:"resolved",isPending:"pending",isRejected:"rejected"},function(e,t){can.List.prototype[t]=function(){return this.attr("state")===e}}),can.each(["then","done","fail","always","promise"],function(e){can.List.prototype[e]=function(){return this._deferred||(this._deferred=new can.Deferred,this._deferred.resolve(this)),this._deferred[e].apply(this._deferred,arguments)}})});