/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("jquery","can/util","can/control",function(e,t){var n,r=function(e,t){var r=e.constructor.pluginName||e.constructor._shortName;for(n=0;n<t.length;n++)if(typeof t[n]=="string"?r===t[n]:e instanceof t[n])return!0;return!1},i=t.makeArray,s=t.Control.setup;return t.Control.setup=function(){if(this!==t.Control){var e=this.pluginName||this._fullName;e!=="can_control"&&this.plugin(e),s.apply(this,arguments)}},e.fn.extend({controls:function(){var e=i(arguments),n=[],s,o;return this.each(function(){s=t.$(this).data("controls");if(!s)return;for(var i=0;i<s.length;i++)o=s[i],(!e.length||r(o,e))&&n.push(o)}),n},control:function(e){return this.controls.apply(this,arguments)[0]}}),t.Control.plugin=function(n){var r=this;e.fn[n]||(e.fn[n]=function(n){var s=i(arguments),o=typeof n=="string"&&e.isFunction(r.prototype[n]),u=s[0],a;return this.each(function(){var e=t.$(this).control(r);e?o?a=e[u].apply(e,s.slice(1)):e.update.apply(e,s):r.newInstance.apply(r,[this].concat(s))}),a!==undefined?a:this})},t.Control.prototype.update=function(e){t.extend(this.options,e),this.on()},t});