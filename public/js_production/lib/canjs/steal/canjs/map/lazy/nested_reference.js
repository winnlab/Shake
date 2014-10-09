/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util",function(e){var t=function(e,t,n){var r=t.split("."),i=e,s;while(s=r.shift())i=i[s],n&&n(i,s);return i},n=function(e){this.array=e};n.prototype.toString=function(){return""+e.inArray(this.item,this.array)};var r=function(e){this.root=e,this.references=[]};r.ArrIndex=n,e.extend(r.prototype,{make:function(r){var i=[],s;if(e.isArray(this.root)||this.root instanceof e.LazyList)s=new n(this.root);t(this.root,r,function(t,r){s?(s.item=t,i.push(s),s=undefined):(i.push(r),e.isArray(t)&&(s=new n(t)))});var o=function(){return i.join(".")};return this.references.push(o),o},removeChildren:function(e,t){var n=0;while(n<this.references.length){var r=this.references[n]();r.indexOf(e)===0?(t(this.get(r),r),this.references.splice(n,1)):n++}},get:function(e){return t(this.root,e)},each:function(t){var n=this;e.each(this.references,function(e){var r=e();t(n.get(r),e,r)})}}),e.NestedReference=r});