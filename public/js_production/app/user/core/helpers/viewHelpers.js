define(["canjs"],function(e){function t(e){return typeof e=="function"&&(e=e()),e}e.mustache.registerHelper("isPrimitive",function(e,t,n){return e()===t?n.fn():n.inverse()}),e.mustache.registerHelper("convertTrackDate",function(e){var t=e.split(" "),n=t[0].split("/");return n[2]+"/"+n[1]}),e.mustache.registerHelper("showPlaylistNumber",function(e){return e()+1}),e.mustache.registerHelper("is",function(){var e=arguments[arguments.length-1],n=t(arguments[0]),r=!0;for(var i=1,s=arguments.length-1;i<s;i+=1)if(n!==t(arguments[i])){r=!1;break}return r?e.fn():e.inverse()}),e.mustache.registerHelper("and",function(){var e=arguments[arguments.length-1],n=!0;for(var r=1,i=arguments.length-1;r<i;r+=1)if(!t(arguments[r])){n=!1;break}return n?e.fn():e.inverse()})});