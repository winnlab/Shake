/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/view"],function(e){var t=function(){return e.$(document.createComment("~")).length===1}(),n={tagToContentPropMap:{option:"textContent"in document.createElement("option")?"textContent":"innerText",textarea:"value"},attrMap:e.attr.map,attrReg:/([^\s=]+)[\s]*=[\s]*/,defaultValue:e.attr.defaultValue,tagMap:{"":"span",colgroup:"col",table:"tbody",tr:"td",ol:"li",ul:"li",tbody:"tr",thead:"tr",tfoot:"tr",select:"option",optgroup:"option"},reverseTagMap:{col:"colgroup",tr:"tbody",option:"select",td:"tr",th:"tr",li:"ul"},getParentNode:function(e,t){return t&&e.parentNode.nodeType===11?t:e.parentNode},setAttr:e.attr.set,getAttr:e.attr.get,removeAttr:e.attr.remove,contentText:function(e){return typeof e=="string"?e:!e&&e!==0?"":""+e},after:function(t,n){var r=t[t.length-1];r.nextSibling?e.insertBefore(r.parentNode,n,r.nextSibling):e.appendChild(r.parentNode,n)},replace:function(r,i){n.after(r,i),e.remove(e.$(r)).length<r.length&&!t&&e.each(r,function(e){e.nodeType===8&&e.parentNode.removeChild(e)})}};return e.view.elements=n,n});