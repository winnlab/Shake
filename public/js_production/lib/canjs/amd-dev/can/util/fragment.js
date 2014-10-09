/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/can"],function(e){var t=/^\s*<(\w+)[^>]*>/,n={}.toString,r=function(e,r){r===undefined&&(r=t.test(e)&&RegExp.$1),e&&n.call(e.replace)==="[object Function]"&&(e=e.replace(/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,"<$1></$2>"));var i=document.createElement("div"),s=document.createElement("div");r==="tbody"||r==="tfoot"||r==="thead"?(s.innerHTML="<table>"+e+"</table>",i=s.firstChild.nodeType===3?s.lastChild:s.firstChild):r==="tr"?(s.innerHTML="<table><tbody>"+e+"</tbody></table>",i=s.firstChild.nodeType===3?s.lastChild:s.firstChild.firstChild):r==="td"||r==="th"?(s.innerHTML="<table><tbody><tr>"+e+"</tr></tbody></table>",i=s.firstChild.nodeType===3?s.lastChild:s.firstChild.firstChild.firstChild):r==="option"?(s.innerHTML="<select>"+e+"</select>",i=s.firstChild.nodeType===3?s.lastChild:s.firstChild):i.innerHTML=""+e;var o={},u=i.childNodes;o.length=u.length;for(var a=0;a<u.length;a++)o[a]=u[a];return[].slice.call(o)};return e.buildFragment=function(e,t){if(e&&e.nodeType===11)return e;var n=r(e),i=document.createDocumentFragment();for(var s=0,o=n.length;s<o;s++)i.appendChild(n[s]);return i},function(){var t="<-\n>",n=e.buildFragment(t,document);if(t!==n.childNodes[0].nodeValue){var r=e.buildFragment;e.buildFragment=function(e,t){var n=r(e,t);return n.childNodes.length===1&&n.childNodes[0].nodeType===3&&(n.childNodes[0].nodeValue=e),n}}}(),e});