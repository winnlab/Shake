/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/view/stache
 * Download from: http://canjs.com
 */

(function(undefined){var __m11=function(e,t){function o(e,i,s){var o,u=s,a=typeof e,f,l,c,h,p=function(){return o||(o={path:s,callbacks:[]},i.push(o),u=[]),o};if(a==="object"){if(e.tag){f=document.createElement(e.tag);if(e.attrs)for(var d in e.attrs){var v=e.attrs[d];typeof v=="function"?p().callbacks.push({callback:v}):f.setAttribute(d,v)}if(e.attributes)for(c=0,h=e.attributes.length;c<h;c++)p().callbacks.push({callback:e.attributes[c]});e.children&&e.children.length&&(o?l=o.paths=[]:l=i,f.appendChild(n(e.children,l,u)))}else if(e.comment){f=document.createComment(e.comment);if(e.callbacks)for(c=0,h=e.attributes.length;c<h;c++)p().callbacks.push({callback:e.callbacks[c]})}}else a==="string"?f=document.createTextNode(e):a==="function"&&(r?(f=document.createTextNode(""),p().callbacks.push({callback:e})):(f=document.createComment("~"),p().callbacks.push({callback:function(){var n=document.createTextNode("");return t.replace([this],n),e.apply(n,arguments)}})));return f}function u(e,t,n){var r=t.path,i=t.callbacks,s=t.paths,o,a=e;for(var f=0,l=r.length;f<l;f++)a=a.childNodes[r[f]];for(f=0,l=i.length;f<l;f++)o=i[f],o.callback.apply(a,n);if(s&&s.length)for(f=s.length-1;f>=0;f--)u(a,s[f],n)}function a(t){var r=[],i=n(t,r,[]);return{paths:r,clone:i,hydrate:function(){var t=s(this.clone),n=e.makeArray(arguments);for(var i=r.length-1;i>=0;i--)u(t,r[i],n);return t}}}var n=function(e,t,n){var r=document.createDocumentFragment();for(var i=0,s=e.length;i<s;i++){var u=e[i];r.appendChild(o(u,t,n.concat(i)))}return r},r=function(){var e=document.createDocumentFragment(),t=document.createElement("div");t.appendChild(document.createTextNode("")),t.appendChild(document.createTextNode("")),e.appendChild(t);var n=e.cloneNode(!0);return n.childNodes[0].childNodes.length===2}(),i=function(){var e=document.createElement("a");e.innerHTML="<xyz></xyz>";var t=e.cloneNode(!0);return t.innerHTML==="<xyz></xyz>"}(),s=i?function(e){return e.cloneNode(!0)}:function(t){var n;t.nodeType===1?n=document.createElement(t.nodeName):t.nodeType===3?n=document.createTextNode(t.nodeValue):t.nodeType===8?n=document.createComment(t.nodeValue):t.nodeType===11&&(n=document.createDocumentFragment());if(t.attributes){var r=e.makeArray(t.attributes);e.each(r,function(e){e&&e.specified&&n.setAttribute(e.nodeName,e.nodeValue)})}return t.childNodes&&e.each(t.childNodes,function(e){n.appendChild(s(e))}),n};return a.keepsTextNodes=r,e.view.target=a,a}(window.can,undefined),__m14=function(){return{isArrayLike:function(e){return e&&e.splice&&typeof e.length=="number"},isObserveLike:function(e){return e instanceof can.Map||e&&!!e._get},emptyHandler:function(){},jsonParse:function(str){return str[0]==="'"?str.substr(1,str.length-2):str==="undefined"?undefined:window.JSON?JSON.parse(str):eval("("+str+")")},mixins:{last:function(){return this.stack[this.stack.length-1]},add:function(e){this.last().add(e)},subSectionDepth:function(){return this.stack.length-1}}}}(window.can),__m16=function(e,t,n){n=n||e.view.live;var r=function(n){return t.isObserveLike(n)&&t.isArrayLike(n)&&n.attr("length")?n:e.isFunction(n)?n():n},i={each:function(i,s){var o=r(i),u=[],a,f,l;if(o instanceof e.List||i&&i.isComputed&&o===undefined)return function(e){var t=function(e,t,n){return s.fn(s.scope.add({"@index":t}).add(e),s.options,n)};n.list(e,i,t,s.context,e.parentNode,s.nodeList)};var c=o;if(!!c&&t.isArrayLike(c))for(l=0;l<c.length;l++)u.push(s.fn(s.scope.add({"@index":l}).add(c[l])));else if(t.isObserveLike(c)){a=e.Map.keys(c);for(l=0;l<a.length;l++)f=a[l],u.push(s.fn(s.scope.add({"@key":f}).add(c[f])))}else if(c instanceof Object)for(f in c)u.push(s.fn(s.scope.add({"@key":f}).add(c[f])));return u},"if":function(t,n){var i;return e.isFunction(t)?i=e.compute.truthy(t)():i=!!r(t),i?n.fn(n.scope||this):n.inverse(n.scope||this)},unless:function(t,n){return i["if"].apply(this,[e.isFunction(t)?e.compute(function(){return!t()}):!t,n])},"with":function(e,t){var n=e;e=r(e);if(!!e)return t.fn(n)},log:function(e,t){typeof console!="undefined"&&console.log&&(t?console.log(e,t.context):console.log(e.context))},data:function(t){var n=arguments.length===2?this:arguments[1];return function(r){e.data(e.$(r),t,n||this.context)}}};return{registerHelper:function(e,t){i[e]=t},getHelper:function(e,t){var n=t.attr("helpers."+e);n||(n=i[e]);if(n)return{fn:n}}}}(window.can,__m14,undefined),__m15=function(e,t,n,r,i,s,o){r=r||e.view.live,i=i||e.view.elements,s=s||e.view.Scope,o=o||e.view.nodeLists;var u=/((([^\s]+?=)?('.*?'|".*?"))|.*?)\s/g,a=/^(?:(?:('.*?'|".*?")|([0-9]+\.?[0-9]*|true|false|null|undefined))|(?:(.+?)=(?:(?:('.*?'|".*?")|([0-9]+\.?[0-9]*|true|false|null|undefined))|(.+))))$/,f=/(?:(?:^|(\r?)\n)(\s*)(\{\{([^\}]*)\}\}\}?)([^\S\n\r]*)($|\r?\n))|(\{\{([^\}]*)\}\}\}?)/g,l=function(e){return e&&typeof e.get=="string"},c=function(e,t,n,r){var i=document.createDocumentFragment();for(var s=0,o=e.length;s<o;s++)h(i,n.fn(t?e.attr(""+s):e[s],r));return i},h=function(e,t){t&&e.appendChild(typeof t=="string"?document.createTextNode(t):t)},p=function(e,t,n,r){var i="";for(var s=0,o=e.length;s<o;s++)i+=n.fn(t?e.attr(""+s):e[s],r);return i},d=function(t,n,r){var i=n.computeData(t,{isArgument:r,args:[n.attr("."),n]});return e.compute.temporarilyBind(i.compute),i},v=function(e,t){var n=d(e,t,!0);return n.compute.hasDependencies?n.compute:n.initialValue},m=function(e,t,n,r,i,s){i&&(e.fn=g(i,t,n,r)),s&&(e.inverse=g(s,t,n,r))},g=function(t,n,r,i){var s=function(e,r,i){return t(e||n,r,i)};return function(t,o,u){var a=e.__clearReading();t!==undefined&&!(t instanceof e.view.Scope)&&(t=n.add(t)),o!==undefined&&!(o instanceof y.Options)&&(o=r.add(o));var f=s(t,o||r,u||i);return e.__setReading(a),f}},y={expressionData:function(n){var r=[],i={},s=0;return(e.trim(n)+" ").replace(u,function(e,n){var o;s&&(o=n.match(a))?o[1]||o[2]?r.push(t.jsonParse(o[1]||o[2])):i[o[3]]=o[6]?{get:o[6]}:t.jsonParse(o[4]||o[5]):r.push({get:n}),s++}),{name:r.shift(),args:r,hash:i}},makeEvaluator:function(r,i,s,o,u,a,f,h){var g=[],y={},b={fn:function(){},inverse:function(){}},w=r.attr("."),E=u.name,S,x=u.args.length||!e.isEmptyObject(u.hash),T;for(var N=0,C=u.args.length;N<C;N++){var k=u.args[N];k&&l(k)?g.push(v(k.get,r,!0)):g.push(k)}for(var L in u.hash)l(u.hash[L])?y[L]=v(u.hash[L].get,r):y[L]=u.hash[L];if(l(E)){x&&(S=n.getHelper(E.get,i),!S&&typeof w[E.get]=="function"&&(S={fn:w[E.get]}));if(!S){var A=E.get,O=d(E.get,r,!1),M=O.compute;T=O.initialValue,O.reads&&O.reads.length===1&&O.root instanceof e.Map&&(M=e.compute(O.root,O.reads[0])),O.compute.hasDependencies?E=M:E=T,!x&&T===undefined?S=n.getHelper(A,i):typeof T=="function"&&(S={fn:T})}}if(o==="^"){var _=a;a=f,f=_}if(S)return m(b,r,i,s,a,f),e.simpleExtend(b,{context:w,scope:r,contexts:r,hash:y,nodeList:s}),g.push(b),function(){return S.fn.apply(w,g)||""};if(!o)return E&&E.isComputed?E:function(){return""+(E!=null?E:"")};if(o==="#"||o==="^")return m(b,r,i,s,a,f),function(){var n;e.isFunction(E)&&E.isComputed?n=E():n=E;if(t.isArrayLike(n)){var s=t.isObserveLike(n);return(s?n.attr("length"):n.length)?(h?p:c)(n,s,b,i):b.inverse(r,i)}return n?b.fn(n||r,i):b.inverse(r,i)}},makeLiveBindingPartialRenderer:function(t,n){return t=e.trim(t),function(r,s,u){var a=s.attr("partials."+t),f;a?f=a.render?a.render(r,s):a(r,s):f=e.view.render(t,r,s),f=e.frag(f);var l=[this];o.register(l,null,n.directlyNested?u||!0:!0),o.update(l,f.childNodes),i.replace([this],f)}},makeStringBranchRenderer:function(e,t){var n=w(t),r=e+t;return function(i,s,o,u){var a=i.__cache[r];if(e||!a)a=b(i,s,null,e,n,o,u,!0),e||(i.__cache[r]=a);var f=a();return f==null?"":""+f}},makeLiveBindingBranchRenderer:function(t,n,s){var u=w(n);return function(f,l,c,h,p){var d=[this];d.expression=n,o.register(d,null,s.directlyNested?c||!0:!0);var v=b(f,l,d,t,u,h,p,s.tag),m=e.compute(v,null,!1,!0);m.bind("change",e.k);var g=m();if(typeof g=="function"){var y=e.__clearReading();g(this),e.__setReading(y)}else m.hasDependencies?s.attr?r.simpleAttribute(this,s.attr,m):s.tag?r.attributes(this,m):s.text&&typeof g!="object"?r.text(this,m,this.parentNode,d):r.html(this,m,this.parentNode,d):s.attr?e.attr.set(this,s.attr,g):s.tag?r.setAttributes(this,g):s.text&&typeof g=="string"?this.nodeValue=g:g&&i.replace([this],e.frag(g));m.unbind("change",e.k)}},splitModeFromExpression:function(t,n){t=e.trim(t);var r=t[0];return"#/{&^>!".indexOf(r)>=0?t=e.trim(t.substr(1)):r=null,r==="{"&&n.node&&(r=null),{mode:r,expression:t}},cleanLineEndings:function(e){return e.replace(f,function(e,t,n,r,i,s,o,u,a,f){s=s||"",t=t||"",n=n||"";var l=E(i||a,{});return u||">{".indexOf(l.mode)>=0?e:"^#!/".indexOf(l.mode)>=0?r+(f!==0&&o.length?t+"\n":""):n+r+s+(n.length||f!==0?t+"\n":"")})},Options:e.view.Scope.extend({init:function(t,n){!t.helpers&&!t.partials&&!t.tags&&(t={helpers:t}),e.view.Scope.prototype.init.apply(this,arguments)}})},b=y.makeEvaluator,w=y.expressionData,E=y.splitModeFromExpression;return y}(window.can,__m14,__m16,undefined,undefined,undefined,undefined),__m13=function(e,t,n,r){var i=function(){var e=document.createElement("div");return function(t){return t.indexOf("&")===-1?t.replace(/\r\n/g,"\n"):(e.innerHTML=t,e.childNodes.length===0?"":e.childNodes[0].nodeValue)}}(),s=function(){this.stack=[new o]};e.extend(s.prototype,n.mixins),e.extend(s.prototype,{startSubSection:function(e){var t=new o(e);return this.stack.push(t),t},endSubSectionAndReturnRenderer:function(){if(this.last().isEmpty())return this.stack.pop(),null;var t=this.endSection();return e.proxy(t.compiled.hydrate,t.compiled)},startSection:function(e){var t=new o(e);this.last().add(t.targetCallback),this.stack.push(t)},endSection:function(){return this.last().compile(),this.stack.pop()},inverse:function(){this.last().inverse()},compile:function(){var t=this.stack.pop().compile();return function(n,i){return n instanceof e.view.Scope||(n=new e.view.Scope(n||{})),i instanceof r.Options||(i=new r.Options(i||{})),t.hydrate(n,i)}},push:function(e){this.last().push(e)},pop:function(){return this.last().pop()}});var o=function(t){this.data="targetData",this.targetData=[],this.targetStack=[];var n=this;this.targetCallback=function(r,i,s){t.call(this,r,i,s,e.proxy(n.compiled.hydrate,n.compiled),n.inverseCompiled&&e.proxy(n.inverseCompiled.hydrate,n.inverseCompiled))}};return e.extend(o.prototype,{inverse:function(){this.inverseData=[],this.data="inverseData"},push:function(e){this.add(e),this.targetStack.push(e)},pop:function(){return this.targetStack.pop()},add:function(e){typeof e=="string"&&(e=i(e)),this.targetStack.length?this.targetStack[this.targetStack.length-1].children.push(e):this[this.data].push(e)},compile:function(){return this.compiled=t(this.targetData),this.inverseData&&(this.inverseCompiled=t(this.inverseData),delete this.inverseData),delete this.targetData,delete this.targetStack,this.compiled},children:function(){return this.targetStack.length?this.targetStack[this.targetStack.length-1].children:this[this.data]},isEmpty:function(){return!this.targetData.length}}),s}(window.can,__m11,__m14,__m15),__m28=function(e,t,n){t=t||e.view.live;var r=function(){this.stack=[new o]},i=function(){};e.extend(r.prototype,n.mixins),e.extend(r.prototype,{startSection:function(e){var t=new o;this.last().add({process:e,truthy:t}),this.stack.push(t)},endSection:function(){this.stack.pop()},inverse:function(){this.stack.pop();var e=new o;this.last().last().falsey=e,this.stack.push(e)},compile:function(n){var r=this.stack[0].compile();return function(s,o){var u=e.compute(function(){return r(s,o)},this,!1,!0);u.bind("change",i);var a=u();u.hasDependencies?(n.attr?t.simpleAttribute(this,n.attr,u):t.attributes(this,u),u.unbind("change",i)):n.attr?e.attr.set(this,n.attr,a):t.setAttributes(this,a)}}});var s=function(e,t,n){return function(r,i){return e.call(this,r,i,t,n)}},o=function(){this.values=[]};return e.extend(o.prototype,{add:function(e){this.values.push(e)},last:function(){return this.values[this.values.length-1]},compile:function(){var e=this.values,t=e.length;for(var n=0;n<t;n++){var r=this.values[n];typeof r=="object"&&(e[n]=s(r.process,r.truthy&&r.truthy.compile(),r.falsey&&r.falsey.compile()))}return function(n,r){var i="",s;for(var o=0;o<t;o++)s=e[o],i+=typeof s=="string"?s:s.call(this,n,r);return i}}}),r}(window.can,undefined,__m14),__m1=function(e,t,n,r,i,s,o,u){function a(n){n=s.cleanLineEndings(n);var o=new r,a={node:null,attr:null,sectionElementStack:[],text:!1},f=function(e,t,n){if(t===">")e.add(s.makeLiveBindingPartialRenderer(n,a));else if(t==="/")e.endSection(),e instanceof r&&a.sectionElementStack.pop();else if(t==="else")e.inverse();else{var i=e instanceof r?s.makeLiveBindingBranchRenderer:s.makeStringBranchRenderer;t==="{"||t==="&"?e.add(i(null,n,l())):t==="#"||t==="^"?(e.startSection(i(t,n,l())),e instanceof r&&a.sectionElementStack.push("section")):e.add(i(null,n,l({text:!0})))}},l=function(t){var n={tag:a.node&&a.node.tag,attr:a.attr&&a.attr.name,directlyNested:a.sectionElementStack[a.sectionElementStack.length-1]==="section"};return t?e.simpleExtend(n,t):n},c=function(e,t){e.attributes||(e.attributes=[]),e.attributes.push(t)};return t(n,{start:function(e,t){a.node={tag:e,children:[]}},end:function(e,t){var n=u.tag(e);t?(o.add(a.node),n&&c(a.node,function(t,n){u.tagHandler(this,e,{scope:t,options:n,subtemplate:null,templateType:"stache"})})):(o.push(a.node),a.sectionElementStack.push("element"),n&&o.startSubSection()),a.node=null},close:function(e){var t=u.tag(e),n;t&&(n=o.endSubSectionAndReturnRenderer());var r=o.pop();t&&c(r,function(t,r){u.tagHandler(this,e,{scope:t,options:r,subtemplate:n,templateType:"stache"})}),a.sectionElementStack.pop()},attrStart:function(e){a.node.section?a.node.section.add(e+'="'):a.attr={name:e,value:""}},attrEnd:function(e){if(a.node.section)a.node.section.add('" ');else{a.node.attrs||(a.node.attrs={}),a.node.attrs[a.attr.name]=a.attr.section?a.attr.section.compile(l()):a.attr.value;var t=u.attr(e);t&&(a.node.attributes||(a.node.attributes=[]),a.node.attributes.push(function(n,r){t(this,{attributeName:e,scope:n,options:r})})),a.attr=null}},attrValue:function(e){var t=a.node.section||a.attr.section;t?t.add(e):a.attr.value+=e},chars:function(e){o.add(e)},special:function(e){var t=s.splitModeFromExpression(e,a),n=t.mode,r=t.expression;if(r==="else"){(a.attr&&a.attr.section?a.attr.section:o).inverse();return}if(n==="!")return;if(a.node&&a.node.section)f(a.node.section,n,r),a.node.section.subSectionDepth()===0&&(a.node.attributes.push(a.node.section.compile(l())),delete a.node.section);else if(a.attr)a.attr.section||(a.attr.section=new i,a.attr.value&&a.attr.section.add(a.attr.value)),f(a.attr.section,n,r);else if(a.node){a.node.attributes||(a.node.attributes=[]);if(!n)a.node.attributes.push(s.makeLiveBindingBranchRenderer(null,r,l()));else{if(n!=="#"&&n!=="^")throw n+" is currently not supported within a tag.";a.node.section||(a.node.section=new i),f(a.node.section,n,r)}}else f(o,n,r)},comment:function(e){o.add({comment:e})},done:function(){}}),o.compile()}t=t||e.view.parser,u=u||e.view.callbacks;var f={"\n":"\\n","\r":"\\r","\u2028":"\\u2028","\u2029":"\\u2029"},l=function(e){return(""+e).replace(/["'\\\n\r\u2028\u2029]/g,function(e){return"'\"\\".indexOf(e)>=0?"\\"+e:f[e]})};return e.view.register({suffix:"stache",contentType:"x-stache-template",fragRenderer:function(e,t){return a(t)},script:function(e,t){return'can.stache("'+l(t)+'")'}}),e.view.ext=".stache",e.extend(e.stache,o),e.extend(a,o),e.stache.safeString=a.safeString=function(e){return{toString:function(){return e}}},a}(window.can,undefined,__m11,__m13,__m28,__m15,__m16,undefined)})();