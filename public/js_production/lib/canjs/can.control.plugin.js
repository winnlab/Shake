/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/control/plugin
 * Download from: http://canjs.com
 */

(function(e){var t=function(t,n){var r,i=function(e,t){var n=e.constructor.pluginName||e.constructor._shortName;for(r=0;r<t.length;r++)if(typeof t[r]=="string"?n===t[r]:e instanceof t[r])return!0;return!1},s=n.makeArray,o=n.Control.setup;return n.Control.setup=function(){if(this!==n.Control){var e=this.pluginName||this._fullName;e!=="can_control"&&this.plugin(e),o.apply(this,arguments)}},t.fn.extend({controls:function(){var e=s(arguments),t=[],r,o;return this.each(function(){r=n.$(this).data("controls");if(!r)return;for(var s=0;s<r.length;s++)o=r[s],(!e.length||i(o,e))&&t.push(o)}),t},control:function(e){return this.controls.apply(this,arguments)[0]}}),n.Control.plugin=function(r){var i=this;t.fn[r]||(t.fn[r]=function(r){var o=s(arguments),u=typeof r=="string"&&t.isFunction(i.prototype[r]),a=o[0],f;return this.each(function(){var e=n.$(this).control(i);e?u?f=e[a].apply(e,o.slice(1)):e.update.apply(e,o):i.newInstance.apply(i,[this].concat(o))}),f!==e?f:this})},n.Control.prototype.update=function(e){n.extend(this.options,e),this.on()},n}(jQuery,window.can,e)})();