/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/construct",function(e,t){var n=e.isFunction,r=/xyz/.test(function(){return this.xyz})?/\b_super\b/:/.*/;return e.Construct._overwrite=function(e,t,i,s){e[i]=n(s)&&n(t[i])&&r.test(s)?function(e,n){return function(){var r=this._super,i;return this._super=t[e],i=n.apply(this,arguments),this._super=r,i}}(i,s):s},e.Construct._inherit=function(t,n,r){r=r||t;for(var i in t)e.Construct._overwrite(r,n,i,t[i])},e});