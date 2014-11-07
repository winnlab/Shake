/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/map","can/util/object",function(e){var t=function(e,t){var n={};for(var r in e)typeof e[r]!="object"||e[r]===null||e[r]instanceof Date?n[r]=e[r]:n[r]=t.attr(r);return n};return e.extend(e.Map.prototype,{backup:function(){return this._backupStore=this._attrs(),this},isDirty:function(t){return this._backupStore&&!e.Object.same(this._attrs(),this._backupStore,undefined,undefined,undefined,!!t)},restore:function(e){var n=e?this._backupStore:t(this._backupStore,this);return this.isDirty(e)&&this._attrs(n,!0),this}}),e.Map});