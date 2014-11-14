/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/model","can/map/backup",function(e){var t=function(t,n){var r=e.extend(!0,{},n),i,s;if(t)for(var o=0;o<t.length;o++){i=r,s=t[o].split(".");while(s.length>1)i=i&&i[s.shift()];i&&delete i[s.shift()]}return r},n=function(t,n,r,i){this._changedAttrs=this._changedAttrs||[];var s=new e.Deferred,o=this,u=this.serialize(),a=this._requestQueue,f=this._changedAttrs,l,c;return l=function(e,t,n,r){return function(){return e.constructor._makeRequest([e,u],t||(e.isNew()?"create":"update"),n,r,i)}}(this,r,function(){s.resolveWith(o,arguments),a.splice(0,1),a.length>0?a[0]=a[0]():f.splice(0)},function(){s.rejectWith(o,arguments),a.splice(0),f.splice(0)}),c=a.push(l)-1,a.length===1&&(a[0]=a[0]()),s.abort=function(){var e;return e=a[c].abort&&a[c].abort(),a.splice(c),a.length===0&&f.splice(0),e},s.then(t,n),s},r=e.Model.prototype._triggerChange,i=e.Model.prototype.destroy,s=e.Model.prototype.setup;return e.each(["created","updated","destroyed"],function(n){var r=e.Model.prototype[n];e.Model.prototype[n]=function(e){e&&typeof e=="object"&&(e=e.attr?e.attr():e,this._backupStore=e,e=t(this._changedAttrs||[],e)),r.call(this,e)}}),e.extend(e.Model.prototype,{setup:function(){s.apply(this,arguments),this._requestQueue=new e.List},_triggerChange:function(e,t,n,i){this._changedAttrs&&this._changedAttrs.push(e),r.apply(this,arguments)},hasQueuedRequests:function(){return this._requestQueue.attr("length")>1},save:function(){return n.apply(this,arguments)},destroy:function(e,t){return this.isNew()?i.call(this,e,t):n.call(this,e,t,"destroy","destroyed")}}),e});