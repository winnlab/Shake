/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util/string",function(e){var t=0;return e.Construct=function(){if(arguments.length)return e.Construct.extend.apply(e.Construct,arguments)},e.extend(e.Construct,{constructorExtends:!0,newInstance:function(){var e=this.instance(),t;return e.setup&&(t=e.setup.apply(e,arguments)),e.init&&e.init.apply(e,t||arguments),e},_inherit:function(t,n,r){e.extend(r||t,t||{})},_overwrite:function(e,t,n,r){e[n]=r},setup:function(t,n){this.defaults=e.extend(!0,{},t.defaults,this.defaults)},instance:function(){t=1;var e=new this;return t=0,e},extend:function(n,r,i){function v(){if(!t)return this.constructor!==v&&arguments.length&&v.constructorExtends&&e.dev.warn("can/construct/construct.js: extending a can.Construct without calling extend"),this.constructor!==v&&arguments.length&&v.constructorExtends?v.extend.apply(v,arguments):v.newInstance.apply(v,arguments)}typeof n!="string"&&(i=r,r=n,n=null),i||(i=r,r=null),i=i||{};var s=this,o=this.prototype,u,a,f,l,c,h,p,d;d=this.instance(),e.Construct._inherit(i,o,d);for(c in s)s.hasOwnProperty(c)&&(v[c]=s[c]);e.Construct._inherit(r,s,v),n&&(u=n.split("."),h=u.pop(),a=e.getObject(u.join("."),window,!0),p=a,f=e.underscore(n.replace(/\./g,"_")),l=e.underscore(h),a[h]&&e.dev.warn("can/construct/construct.js: There's already something called "+n),a[h]=v),e.extend(v,{constructor:v,prototype:d,namespace:p,_shortName:l,fullName:n,_fullName:f}),h!==undefined&&(v.shortName=h),v.prototype.constructor=v;var m=[s].concat(e.makeArray(arguments)),g=v.setup.apply(v,m);return v.init&&v.init.apply(v,g||m),v}}),e.Construct.prototype.setup=function(){},e.Construct.prototype.init=function(){},e.Construct});