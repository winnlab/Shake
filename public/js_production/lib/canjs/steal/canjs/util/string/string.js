/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util",function(e){var t=/_|-/,n=/\=\=/,r=/([A-Z]+)([A-Z][a-z])/g,i=/([a-z\d])([A-Z])/g,s=/([a-z\d])([A-Z])/g,o=/\{([^\}]+)\}/g,u=/"/g,a=/'/g,f=/-+(.)?/g,l=/[a-z][A-Z]/g,c=function(e,t,n){var r=e[t];return r===undefined&&n===!0&&(r=e[t]={}),r},h=function(e){return/^f|^o/.test(typeof e)},p=function(e){var t=e===null||e===undefined||isNaN(e)&&""+e=="NaN";return""+(t?"":e)};return e.extend(e,{esc:function(e){return p(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(u,"&#34;").replace(a,"&#39;")},getObject:function(t,n,r){var i=t?t.split("."):[],s=i.length,o,u=0,a,f,l;n=e.isArray(n)?n:[n||window],l=n.length;if(!s)return n[0];for(u;u<l;u++){o=n[u],f=undefined;for(a=0;a<s&&h(o);a++)f=o,o=c(f,i[a]);if(f!==undefined&&o!==undefined)break}r===!1&&o!==undefined&&delete f[i[a-1]];if(r===!0&&o===undefined){o=n[0];for(a=0;a<s&&h(o);a++)o=c(o,i[a],!0)}return o},capitalize:function(e,t){return e.charAt(0).toUpperCase()+e.slice(1)},camelize:function(e){return p(e).replace(f,function(e,t){return t?t.toUpperCase():""})},hyphenate:function(e){return p(e).replace(l,function(e,t){return e.charAt(0)+"-"+e.charAt(1).toLowerCase()})},underscore:function(e){return e.replace(n,"/").replace(r,"$1_$2").replace(i,"$1_$2").replace(s,"_").toLowerCase()},sub:function(t,n,r){var i=[];return t=t||"",i.push(t.replace(o,function(t,s){var o=e.getObject(s,n,r===!0?!1:undefined);return o===undefined||o===null?(i=null,""):h(o)&&i?(i.push(o),""):""+o})),i===null?i:i.length<=1?i[0]:i},replacer:o,undHash:t}),e});