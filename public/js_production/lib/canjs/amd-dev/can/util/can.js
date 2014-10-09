/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define([],function(){var e=window.can||{};if(typeof GLOBALCAN=="undefined"||GLOBALCAN!==!1)window.can=e;e.k=function(){},e.isDeferred=function(e){return e&&typeof e.then=="function"&&typeof e.pipe=="function"};var t=0;return e.cid=function(e,n){return e._cid||(t++,e._cid=(n||"")+t),e._cid},e.VERSION="2.1.2",e.simpleExtend=function(e,t){for(var n in t)e[n]=t[n];return e},e.frag=function(t){var n;return!t||typeof t=="string"?(n=e.buildFragment(t==null?"":""+t,document.body),n.childNodes.length||n.appendChild(document.createTextNode("")),n):t.nodeType===11?t:typeof t.nodeType=="number"?(n=document.createDocumentFragment(),n.appendChild(t),n):typeof t.length=="number"?(n=document.createDocumentFragment(),e.each(t,function(t){n.appendChild(e.frag(t))}),n):(n=e.buildFragment(""+t,document.body),n.childNodes.length||n.appendChild(document.createTextNode("")),n)},e.__reading=function(){},e.dev={warnTimeout:5e3,logLevel:0,warn:function(e){var t=this.logLevel;t<2&&(Array.prototype.unshift.call(arguments,"WARN:"),window.console&&console.warn?this._logger("warn",Array.prototype.slice.call(arguments)):window.console&&console.log?this._logger("log",Array.prototype.slice.call(arguments)):window.opera&&window.opera.postError&&window.opera.postError("steal.js WARNING: "+e))},log:function(e){var t=this.logLevel;t<1&&(window.console&&console.log?(Array.prototype.unshift.call(arguments,"Info:"),this._logger("log",Array.prototype.slice.call(arguments))):window.opera&&window.opera.postError&&window.opera.postError("steal.js INFO: "+e))},_logger:function(e,t){console.log.apply?console[e].apply(console,t):console[e](t)}},e});