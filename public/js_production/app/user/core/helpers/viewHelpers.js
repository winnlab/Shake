define(["canjs"],function(e){e.mustache.registerHelper("isPrimitive",function(e,t,n){return e()===t?n.fn():n.inverse()}),e.mustache.registerHelper("convertTrackDate",function(e){var t=e.split(" "),n=t[0].split("/");return n[2]+"/"+n[1]}),e.mustache.registerHelper("showPlaylistNumber",function(e){return e()+1})});