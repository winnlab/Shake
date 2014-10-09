/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/can"],function(e){var t=window.setImmediate||function(e){return setTimeout(e,0)},n={MutationObserver:window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver,map:{"class":"className",value:"value",innerText:"innerText",textContent:"textContent",checked:!0,disabled:!0,readonly:!0,required:!0,src:function(e,t){return t==null||t===""?(e.removeAttribute("src"),null):(e.setAttribute("src",t),t)},style:function(e,t){return e.style.cssText=t||""}},defaultValue:["input","textarea"],set:function(t,r,i){var s;n.MutationObserver||(s=n.get(t,r));var o=t.nodeName.toString().toLowerCase(),u=n.map[r],a;typeof u=="function"?a=u(t,i):u===!0?(a=t[r]=!0,r==="checked"&&t.type==="radio"&&e.inArray(o,n.defaultValue)>=0&&(t.defaultChecked=!0)):u?(a=t[u]=i,u==="value"&&e.inArray(o,n.defaultValue)>=0&&(t.defaultValue=i)):(t.setAttribute(r,i),a=i),!n.MutationObserver&&a!==s&&n.trigger(t,r,s)},trigger:function(n,r,i){if(e.data(e.$(n),"canHasAttributesBindings"))return t(function(){e.trigger(n,{type:"attributes",attributeName:r,target:n,oldValue:i,bubbles:!1},[])})},get:function(e,t){var r=n.map[t];return typeof r=="string"&&e[r]?e[r]:e.getAttribute(t)},remove:function(e,t){var r;n.MutationObserver||(r=n.get(e,t));var i=n.map[t];typeof i=="function"&&i(e,undefined),i===!0?e[t]=!1:typeof i=="string"?e[i]="":e.removeAttribute(t),!n.MutationObserver&&r!=null&&n.trigger(e,t,r)},has:function(){var e=document.createElement("div");return e.hasAttribute?function(e,t){return e.hasAttribute(t)}:function(e,t){return e.getAttribute(t)!==null}}()};return n});