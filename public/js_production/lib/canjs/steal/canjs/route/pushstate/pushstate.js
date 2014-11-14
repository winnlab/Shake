/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/route",function(e){if(window.history&&history.pushState){e.route.bindings.pushstate={root:"/",matchSlashes:!1,paramsMatcher:/^\?(?:[^=]+=[^&]*&)*[^=]+=[^&]*/,querySeparator:"?",bind:function(){e.delegate.call(e.$(document.documentElement),"a","click",t),e.each(r,function(t){i[t]=window.history[t],window.history[t]=function(n,r,s){var o=s.indexOf("http")===0,u=window.location.search+window.location.hash;if(!o&&s!==window.location.pathname+u||o&&s!==window.location.href+u)i[t].apply(window.history,arguments),e.route.setState()}}),e.bind.call(window,"popstate",e.route.setState)},unbind:function(){e.undelegate.call(e.$(document.documentElement),"click","a",t),e.each(r,function(e){window.history[e]=i[e]}),e.unbind.call(window,"popstate",e.route.setState)},matchingPartOfURL:function(){var e=n(),t=location.pathname+location.search,r=t.indexOf(e);return t.substr(r+e.length)},setURL:function(t){s&&t.indexOf("#")===-1&&window.location.hash&&(t+=window.location.hash),window.history.pushState(null,null,e.route._call("root")+t)}};var t=function(t){if(t.isDefaultPrevented?!t.isDefaultPrevented():t.defaultPrevented!==!0){var r=this._node||this,i=r.host||window.location.host;if(window.location.host===i){var o=n();if(r.pathname.indexOf(o)===0){var u=(r.pathname+r.search).substr(o.length),a=e.route.deparam(u);a.hasOwnProperty("route")&&(s=!0,window.history.pushState(null,null,r.href),t.preventDefault&&t.preventDefault())}}}},n=function(){var t=location.protocol+"//"+location.host,n=e.route._call("root"),r=n.indexOf(t);return r===0?n.substr(t.length):n},r=["pushState","replaceState"],i={},s=!1;e.route.defaultBinding="pushstate"}return e});