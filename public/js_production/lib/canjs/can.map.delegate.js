/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:30 GMT
 * Licensed MIT
 * Includes: can/map/delegate
 * Download from: http://canjs.com
 */

(function(e){var t=function(t){var n=function(e,t){var n=e.length,r=0,i=[],s;for(r;r<n;r++){s=t[r];if(typeof s!="string")return null;if(e[r]==="**")return t.join(".");if(e[r]==="*")i.push(s);else{if(s!==e[r])return null;i.push(s)}}return i.join(".")},r=function(r,i,s,o,u){var a=i.split("."),f=(this._observe_delegates||[]).slice(0),l,c,h,p,d;r.attr=i,r.lastAttr=a[a.length-1];for(var v=0;l=f[v++];){if(r.batchNum&&l.batchNum===r.batchNum||l.undelegated)continue;p=e,d=!0;for(var m=0;m<l.attrs.length;m++)c=l.attrs[m],h=n(c.parts,a),h&&(p=h),c.value&&d?d=c.value===""+this.attr(c.attr):d&&l.attrs.length>1&&(d=this.attr(c.attr)!==e);if(p&&d){var g=i.replace(p+".","");r.batchNum&&(l.batchNum=r.batchNum),l.event==="change"?(i=g,r.curAttr=p,l.callback.apply(this.attr(p),t.makeArray(arguments))):l.event===s?l.callback.apply(this.attr(p),[r,o,u,g]):l.event==="set"&&s==="add"&&l.callback.apply(this.attr(p),[r,o,u,g])}}};return t.extend(t.Map.prototype,{delegate:function(e,n,i){e=t.trim(e);var s=this._observe_delegates||(this._observe_delegates=[]),o=[],u=/([^\s=,]+)(?:=("[^",]*"|'[^',]*'|[^\s"',]*))?(,?)\s*/g,a;while((a=u.exec(e))!==null)a[2]&&t.inArray(a[2].substr(0,1),['"',"'"])>=0&&(a[2]=a[2].substr(1,-1)),o.push({attr:a[1],parts:a[1].split("."),value:a[2],or:a[3]===","});return s.push({selector:e,attrs:o,callback:i,event:n}),s.length===1&&this.bind("change",r),this},undelegate:function(e,n,i){e=e&&t.trim(e);var s=0,o=this._observe_delegates||[],u;if(e)while(s<o.length)u=o[s],u.callback===i||!i&&u.selector===e?(u.undelegated=!0,o.splice(s,1)):s++;else o=[];return o.length||this.unbind("change",r),this}}),t.Map.prototype.delegate.matches=n,t.Map}(window.can,e)})();