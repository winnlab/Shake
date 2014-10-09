/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/model/queue
 * Download from: http://canjs.com
 */

(function(e){var t=function(t){var n=t.isArray;t.Object={};var r=t.Object.same=function(s,o,u,a,f,l){var c=typeof s,h=n(s),p=typeof u,d;if(p==="string"||u===null)u=i[u],p="function";if(p==="function")return u(s,o,a,f);u=u||{};if(s===null||o===null)return s===o;if(s instanceof Date||o instanceof Date)return s===o;if(l===-1)return c==="object"||s===o;if(c!==typeof o||h!==n(o))return!1;if(s===o)return!0;if(h){if(s.length!==o.length)return!1;for(var v=0;v<s.length;v++){d=u[v]===e?u["*"]:u[v];if(!r(s[v],o[v],s,o,d))return!1}return!0}if(c==="object"||c==="function"){var m=t.extend({},o);for(var g in s){d=u[g]===e?u["*"]:u[g];if(!r(s[g],o[g],d,s,o,l===!1?-1:e))return!1;delete m[g]}for(g in m)if(u[g]===e||!r(e,o[g],u[g],s,o,l===!1?-1:e))return!1;return!0}return!1};t.Object.subsets=function(e,n,r){var i=n.length,s=[];for(var o=0;o<i;o++){var u=n[o];t.Object.subset(e,u,r)&&s.push(u)}return s},t.Object.subset=function(e,t,n){n=n||{};for(var i in t)if(!r(e[i],t[i],n[i],e,t))return!1;return!0};var i={"null":function(){return!0},i:function(e,t){return(""+e).toLowerCase()===(""+t).toLowerCase()},eq:function(e,t){return e===t},similar:function(e,t){return e==t}};return i.eqeq=i.similar,t.Object}(window.can),n=function(t){var n=function(e,t){var n={};for(var r in e)typeof e[r]!="object"||e[r]===null||e[r]instanceof Date?n[r]=e[r]:n[r]=t.attr(r);return n};return t.extend(t.Map.prototype,{backup:function(){return this._backupStore=this._attrs(),this},isDirty:function(n){return this._backupStore&&!t.Object.same(this._attrs(),this._backupStore,e,e,e,!!n)},restore:function(e){var t=e?this._backupStore:n(this._backupStore,this);return this.isDirty(e)&&this._attrs(t,!0),this}}),t.Map}(window.can,e,t),r=function(e){var t=function(t,n){var r=e.extend(!0,{},n),i,s;if(t)for(var o=0;o<t.length;o++){i=r,s=t[o].split(".");while(s.length>1)i=i&&i[s.shift()];i&&delete i[s.shift()]}return r},n=function(t,n,r,i){this._changedAttrs=this._changedAttrs||[];var s=new e.Deferred,o=this,u=this.serialize(),a=this._requestQueue,f=this._changedAttrs,l,c;return l=function(e,t,n,r){return function(){return e.constructor._makeRequest([e,u],t||(e.isNew()?"create":"update"),n,r,i)}}(this,r,function(){s.resolveWith(o,arguments),a.splice(0,1),a.length>0?a[0]=a[0]():f.splice(0)},function(){s.rejectWith(o,arguments),a.splice(0),f.splice(0)}),c=a.push(l)-1,a.length===1&&(a[0]=a[0]()),s.abort=function(){var e;return e=a[c].abort&&a[c].abort(),a.splice(c),a.length===0&&f.splice(0),e},s.then(t,n),s},r=e.Model.prototype._triggerChange,i=e.Model.prototype.destroy,s=e.Model.prototype.setup;return e.each(["created","updated","destroyed"],function(n){var r=e.Model.prototype[n];e.Model.prototype[n]=function(e){e&&typeof e=="object"&&(e=e.attr?e.attr():e,this._backupStore=e,e=t(this._changedAttrs||[],e)),r.call(this,e)}}),e.extend(e.Model.prototype,{setup:function(){s.apply(this,arguments),this._requestQueue=new e.List},_triggerChange:function(e,t,n,i){this._changedAttrs&&this._changedAttrs.push(e),r.apply(this,arguments)},hasQueuedRequests:function(){return this._requestQueue.attr("length")>1},save:function(){return n.apply(this,arguments)},destroy:function(e,t){return this.isNew()?i.call(this,e,t):n.call(this,e,t,"destroy","destroyed")}}),e}(window.can,e,n)})();