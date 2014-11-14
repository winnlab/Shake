/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/util/object
 * Download from: http://canjs.com
 */

(function(e){var t=function(t){var n=t.isArray;t.Object={};var r=t.Object.same=function(s,o,u,a,f,l){var c=typeof s,h=n(s),p=typeof u,d;if(p==="string"||u===null)u=i[u],p="function";if(p==="function")return u(s,o,a,f);u=u||{};if(s===null||o===null)return s===o;if(s instanceof Date||o instanceof Date)return s===o;if(l===-1)return c==="object"||s===o;if(c!==typeof o||h!==n(o))return!1;if(s===o)return!0;if(h){if(s.length!==o.length)return!1;for(var v=0;v<s.length;v++){d=u[v]===e?u["*"]:u[v];if(!r(s[v],o[v],s,o,d))return!1}return!0}if(c==="object"||c==="function"){var m=t.extend({},o);for(var g in s){d=u[g]===e?u["*"]:u[g];if(!r(s[g],o[g],d,s,o,l===!1?-1:e))return!1;delete m[g]}for(g in m)if(u[g]===e||!r(e,o[g],u[g],s,o,l===!1?-1:e))return!1;return!0}return!1};t.Object.subsets=function(e,n,r){var i=n.length,s=[];for(var o=0;o<i;o++){var u=n[o];t.Object.subset(e,u,r)&&s.push(u)}return s},t.Object.subset=function(e,t,n){n=n||{};for(var i in t)if(!r(e[i],t[i],n[i],e,t))return!1;return!0};var i={"null":function(){return!0},i:function(e,t){return(""+e).toLowerCase()===(""+t).toLowerCase()},eq:function(e,t){return e===t},similar:function(e,t){return e==t}};return i.eqeq=i.similar,t.Object}(window.can)})();