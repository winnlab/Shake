/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util",function(){return{isArrayLike:function(e){return e&&e.splice&&typeof e.length=="number"},isObserveLike:function(e){return e instanceof can.Map||e&&!!e._get},emptyHandler:function(){},jsonParse:function(str){return str[0]==="'"?str.substr(1,str.length-2):str==="undefined"?undefined:window.JSON?JSON.parse(str):eval("("+str+")")},mixins:{last:function(){return this.stack[this.stack.length-1]},add:function(e){this.last().add(e)},subSectionDepth:function(){return this.stack.length-1}}}});