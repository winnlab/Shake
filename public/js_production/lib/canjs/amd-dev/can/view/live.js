/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/view/elements","can/view","can/view/node_lists","can/view/parser"],function(e,t,n,r,i){t=t||e.view.elements,r=r||e.view.NodeLists,i=i||e.view.parser;var s=function(t,n,r){var i=!1,s=function(){return i||(i=!0,r(o),e.unbind.call(t,"removed",s)),!0},o={teardownCheck:function(e){return e?!1:s()}};return e.bind.call(t,"removed",s),n(o),o},o=function(e,t,n){return s(e,function(){t.bind("change",n)},function(e){t.unbind("change",n),e.nodeList&&r.unregister(e.nodeList)})},u=function(e){var t={},n;return i.parseAttrs(e,{attrStart:function(e){t[e]="",n=e},attrValue:function(e){t[n]+=e},attrEnd:function(){}}),t},a=[].splice,f=function(e){return e&&e.nodeType},l=function(e){e.childNodes.length||e.appendChild(document.createTextNode(""))},c={list:function(n,i,o,u,f,l){var h=l||[n],p=[],d=function(n,i,s){var f=document.createDocumentFragment(),c=[],d=[];e.each(i,function(t,n){var i=[];l&&r.register(i,null,!0);var a=e.compute(n+s),h=o.call(u,t,a,i),p=typeof h=="string",v=e.frag(h);v=p?e.view.hookup(v):v;var m=e.makeArray(v.childNodes);l?(r.update(i,m),c.push(i)):c.push(r.register(m)),f.appendChild(v),d.push(a)});var v=s+1;if(!h[v])t.after(v===1?[m]:[r.last(h[v-1])],f);else{var g=r.first(h[v]);e.insertBefore(g.parentNode,f,g)}a.apply(h,[v,0].concat(c)),a.apply(p,[s,0].concat(d));for(var y=s+d.length,b=p.length;y<b;y++)p[y](y)},v=function(t,n,i,s,o){if(!s&&w.teardownCheck(m.parentNode))return;var u=h.splice(i+1,n.length),a=[];e.each(u,function(e){var t=r.unregister(e);[].push.apply(a,t)}),p.splice(i,n.length);for(var f=i,l=p.length;f<l;f++)p[f](f);o||e.remove(e.$(a))},m=document.createTextNode(""),g,y=function(e){g&&g.unbind&&g.unbind("add",d).unbind("remove",v),v({},{length:h.length-1},0,!0,e)},b=function(e,t,n){y(),g=t||[],g.bind&&g.bind("add",d).bind("remove",v),d({},g,0)};f=t.getParentNode(n,f);var w=s(f,function(){e.isFunction(i)&&i.bind("change",b)},function(){e.isFunction(i)&&i.unbind("change",b),y(!0)});l?(t.replace(h,m),r.update(h,[m]),l.unregistered=w.teardownCheck):c.replace(h,m,w.teardownCheck),b({},e.isFunction(i)?i():i)},html:function(n,i,s,u){var a;s=t.getParentNode(n,s),a=o(s,i,function(e,t,n){var i=r.first(c).parentNode;i&&h(t),a.teardownCheck(r.first(c).parentNode)});var c=u||[n],h=function(n){var i=!f(n),o=e.frag(n),u=e.makeArray(c);l(o),i&&(o=e.view.hookup(o,s)),u=r.update(c,o.childNodes),t.replace(u,o)};a.nodeList=c,u?u.unregistered=a.teardownCheck:r.register(c,a.teardownCheck),h(i())},replace:function(n,i,s){var o=n.slice(0),u=e.frag(i);return r.register(n,s),typeof i=="string"&&(u=e.view.hookup(u,n[0].parentNode)),r.update(n,u.childNodes),t.replace(o,u),n},text:function(n,i,s,u){var a=t.getParentNode(n,s),f=o(a,i,function(t,n,r){typeof l.nodeValue!="unknown"&&(l.nodeValue=e.view.toStr(n)),f.teardownCheck(l.parentNode)}),l=document.createTextNode(e.view.toStr(i()));u?(u.unregistered=f.teardownCheck,f.nodeList=u,r.update(u,[l]),t.replace([n],l)):f.nodeList=c.replace([n],l,f.teardownCheck)},setAttributes:function(t,n){var r=u(n);for(var i in r)e.attr.set(t,i,r[i])},attributes:function(n,r,i){var s={},a=function(r){var i=u(r),o;for(o in i){var a=i[o],f=s[o];a!==f&&e.attr.set(n,o,a),delete s[o]}for(o in s)t.removeAttr(n,o);s=i};o(n,r,function(e,t){a(t)}),arguments.length>=3?s=u(i):a(r())},attributePlaceholder:"__!!__",attributeReplace:/__!!__/g,attribute:function(n,r,i){o(n,i,function(e,i){t.setAttr(n,r,h.render())});var s=e.$(n),u;u=e.data(s,"hooks"),u||e.data(s,"hooks",u={});var a=t.getAttr(n,r),f=a.split(c.attributePlaceholder),l=[],h;l.push(f.shift(),f.join(c.attributePlaceholder)),u[r]?u[r].computes.push(i):u[r]={render:function(){var e=0,n=a?a.replace(c.attributeReplace,function(){return t.contentText(h.computes[e++]())}):t.contentText(h.computes[e++]());return n},computes:[i],batchNum:undefined},h=u[r],l.splice(1,0,i()),t.setAttr(n,r,l.join(""))},specialAttribute:function(e,n,r){o(e,r,function(r,i){t.setAttr(e,n,p(i))}),t.setAttr(e,n,p(r()))},simpleAttribute:function(e,n,r){o(e,r,function(r,i){t.setAttr(e,n,i)}),t.setAttr(e,n,r())}};c.attr=c.simpleAttribute,c.attrs=c.attributes;var h=/(\r|\n)+/g,p=function(e){var n=/^["'].*["']$/;return e=e.replace(t.attrReg,"").replace(h,""),n.test(e)?e.substr(1,e.length-2):e};return e.view.live=c,c});