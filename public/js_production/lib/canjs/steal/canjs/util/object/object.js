/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util",function(e){var t=e.isArray;e.Object={};var n=e.Object.same=function(i,s,o,u,a,f){var l=typeof i,c=t(i),h=typeof o,p;if(h==="string"||o===null)o=r[o],h="function";if(h==="function")return o(i,s,u,a);o=o||{};if(i===null||s===null)return i===s;if(i instanceof Date||s instanceof Date)return i===s;if(f===-1)return l==="object"||i===s;if(l!==typeof s||c!==t(s))return!1;if(i===s)return!0;if(c){if(i.length!==s.length)return!1;for(var d=0;d<i.length;d++){p=o[d]===undefined?o["*"]:o[d];if(!n(i[d],s[d],i,s,p))return!1}return!0}if(l==="object"||l==="function"){var v=e.extend({},s);for(var m in i){p=o[m]===undefined?o["*"]:o[m];if(!n(i[m],s[m],p,i,s,f===!1?-1:undefined))return!1;delete v[m]}for(m in v)if(o[m]===undefined||!n(undefined,s[m],o[m],i,s,f===!1?-1:undefined))return!1;return!0}return!1};e.Object.subsets=function(t,n,r){var i=n.length,s=[];for(var o=0;o<i;o++){var u=n[o];e.Object.subset(t,u,r)&&s.push(u)}return s},e.Object.subset=function(e,t,r){r=r||{};for(var i in t)if(!n(e[i],t[i],r[i],e,t))return!1;return!0};var r={"null":function(){return!0},i:function(e,t){return(""+e).toLowerCase()===(""+t).toLowerCase()},eq:function(e,t){return e===t},similar:function(e,t){return e==t}};return r.eqeq=r.similar,e.Object});