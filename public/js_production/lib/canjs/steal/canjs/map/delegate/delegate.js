/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

steal("can/util","can/map",function(e){var t=function(e,t){var n=e.length,r=0,i=[],s;for(r;r<n;r++){s=t[r];if(typeof s!="string")return null;if(e[r]==="**")return t.join(".");if(e[r]==="*")i.push(s);else{if(s!==e[r])return null;i.push(s)}}return i.join(".")},n=function(n,r,i,s,o){var u=r.split("."),a=(this._observe_delegates||[]).slice(0),f,l,c,h,p;n.attr=r,n.lastAttr=u[u.length-1];for(var d=0;f=a[d++];){if(n.batchNum&&f.batchNum===n.batchNum||f.undelegated)continue;h=undefined,p=!0;for(var v=0;v<f.attrs.length;v++)l=f.attrs[v],c=t(l.parts,u),c&&(h=c),l.value&&p?p=l.value===""+this.attr(l.attr):p&&f.attrs.length>1&&(p=this.attr(l.attr)!==undefined);if(h&&p){var m=r.replace(h+".","");n.batchNum&&(f.batchNum=n.batchNum),f.event==="change"?(r=m,n.curAttr=h,f.callback.apply(this.attr(h),e.makeArray(arguments))):f.event===i?f.callback.apply(this.attr(h),[n,s,o,m]):f.event==="set"&&i==="add"&&f.callback.apply(this.attr(h),[n,s,o,m])}}};return e.extend(e.Map.prototype,{delegate:function(t,r,i){t=e.trim(t);var s=this._observe_delegates||(this._observe_delegates=[]),o=[],u=/([^\s=,]+)(?:=("[^",]*"|'[^',]*'|[^\s"',]*))?(,?)\s*/g,a;while((a=u.exec(t))!==null)a[2]&&e.inArray(a[2].substr(0,1),['"',"'"])>=0&&(a[2]=a[2].substr(1,-1)),o.push({attr:a[1],parts:a[1].split("."),value:a[2],or:a[3]===","});return s.push({selector:t,attrs:o,callback:i,event:r}),s.length===1&&this.bind("change",n),this},undelegate:function(t,r,i){t=t&&e.trim(t);var s=0,o=this._observe_delegates||[],u;if(t)while(s<o.length)u=o[s],u.callback===i||!i&&u.selector===t?(u.undelegated=!0,o.splice(s,1)):s++;else o=[];return o.length||this.unbind("change",n),this}}),e.Map.prototype.delegate.matches=t,e.Map});