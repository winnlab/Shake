/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/construct","can/map","can/list","can/view","can/compute",function(e){var t=/(\\)?\./g,n=/\\\./g,r=function(e){var r=[],i=0;return e.replace(t,function(t,s,o){s||(r.push(e.slice(i,o).replace(n,".")),i=o+t.length)}),r.push(e.slice(i).replace(n,".")),r},i=e.Construct.extend({read:e.compute.read},{init:function(e,t){this._context=e,this._parent=t,this.__cache={}},attr:function(t){var n=e.__clearReading(),r=this.read(t,{isArgument:!0,returnObserveMethods:!0,proxyMethods:!1}).value;return e.__setReading(n),r},add:function(e){return e!==this._context?new this.constructor(e,this):this},computeData:function(t,n){n=n||{args:[]};var r=this,i,s,o={compute:e.compute(function(u){if(!arguments.length){if(i)return e.compute.read(i,s,n).value;var f=r.read(t,n);return i=f.rootObserve,s=f.reads,o.scope=f.scope,o.initialValue=f.value,o.reads=f.reads,o.root=i,f.value}if(i.isComputed&&!s.length)i(u);else{var a=s.length-1;e.compute.read(i,s.slice(0,a)).value.attr(s[a],u)}})};return o},compute:function(e,t){return this.computeData(e,t).compute},read:function(t,n){var i;if(t.substr(0,2)==="./")i=!0,t=t.substr(2);else{if(t.substr(0,3)==="../")return this._parent.read(t.substr(3),n);if(t==="..")return{value:this._parent._context};if(t==="."||t==="this")return{value:this._context}}var s=t.indexOf("\\.")===-1?t.split("."):r(t),o,u=this,a,f=[],l=-1,c,h,p,d;while(u){o=u._context;if(o!==null){var v=e.compute.read(o,s,e.simpleExtend({foundObservable:function(e,t){p=e,d=s.slice(t)},earlyExit:function(t,n){n>l&&(a=p,f=d,l=n,h=u,c=e.__clearReading())},executeAnonymousFunctions:!0},n));if(v.value!==undefined)return{scope:u,rootObserve:p,value:v.value,reads:d}}e.__clearReading(),i?u=null:u=u._parent}return a?(e.__setReading(c),{scope:h,rootObserve:a,reads:f,value:undefined}):{names:s,value:undefined}}});return e.view.Scope=i,i});