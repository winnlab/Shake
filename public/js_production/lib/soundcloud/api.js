(function(){var requirejs,require,define,__inflate;(function(e){function t(e,t){var n=t&&t.split("/"),r=l.map,i=r&&r["*"]||{},s,o,u,a,f,c,h;if(e&&e.charAt(0)==="."&&t){n=n.slice(0,n.length-1),e=n.concat(e.split("/"));for(f=0;h=e[f];f++)if(h===".")e.splice(f,1),f-=1;else if(h===".."){if(f===1&&(e[2]===".."||e[0]===".."))return!0;f>0&&(e.splice(f-1,2),f-=2)}e=e.join("/")}if((n||i)&&r){s=e.split("/");for(f=s.length;f>0;f-=1){o=s.slice(0,f).join("/");if(n)for(c=n.length;c>0;c-=1){u=r[n.slice(0,c).join("/")];if(u){u=u[o];if(u){a=u;break}}}a=a||i[o];if(a){s.splice(0,f,a),e=s.join("/");break}}}return e}function n(t,n){return function(){return d.apply(e,h.call(arguments,0).concat([t,n]))}}function r(e){return function(n){return t(n,e)}}function i(e){return function(t){a[e]=t}}function s(t){if(f.hasOwnProperty(t)){var n=f[t];delete f[t],c[t]=!0,p.apply(e,n)}if(!a.hasOwnProperty(t))throw new Error("No "+t);return a[t]}function o(e,n){var i,o,u=e.indexOf("!");return u!==-1?(i=t(e.slice(0,u),n),e=e.slice(u+1),o=s(i),o&&o.normalize?e=o.normalize(e,r(n)):e=t(e,n)):e=t(e,n),{f:i?i+"!"+e:e,n:e,p:o}}function u(e){return function(){return l&&l.config&&l.config[e]||{}}}var a={},f={},l={},c={},h=[].slice,p,d;p=function(t,r,l,h){var p=[],d,v,m,g,y,b;h=h||t,typeof l=="string"&&(l=__inflate(t,l));if(typeof l=="function"){r=!r.length&&l.length?["require","exports","module"]:r;for(b=0;b<r.length;b++){y=o(r[b],h),m=y.f;if(m==="require")p[b]=n(t);else if(m==="exports")p[b]=a[t]={},d=!0;else if(m==="module")v=p[b]={id:t,uri:"",exports:a[t],config:u(t)};else if(a.hasOwnProperty(m)||f.hasOwnProperty(m))p[b]=s(m);else if(y.p)y.p.load(y.n,n(h,!0),i(m),{}),p[b]=a[m];else if(!c[m])throw new Error(t+" missing "+m)}g=l.apply(a[t],p);if(t)if(v&&v.exports!==e&&v.exports!==a[t])a[t]=v.exports;else if(g!==e||!d)a[t]=g}else t&&(a[t]=l)},requirejs=require=d=function(t,n,r,i){return typeof t=="string"?s(o(t,n).f):(t.splice||(l=t,n.splice?(t=n,n=r,r=null):t=e),n=n||function(){},i?p(e,t,n,r):setTimeout(function(){p(e,t,n,r)},15),d)},d.config=function(e){return l=e,d},define=function(e,t,n){t.splice||(n=t,t=[]),f[e]=[e,t,n]},define.amd={jQuery:!0}})(),__inflate=function(name,src){var r;return eval(["r = function(a,b,c){","\n};\n//@ sourceURL="+name+"\n"].join(src)),r},define("lib/api/events",["require","exports","module"],function(e,t,n){t.api={LOAD_PROGRESS:"loadProgress",PLAY_PROGRESS:"playProgress",PLAY:"play",PAUSE:"pause",FINISH:"finish",SEEK:"seek",READY:"ready",OPEN_SHARE_PANEL:"sharePanelOpened",CLICK_DOWNLOAD:"downloadClicked",CLICK_BUY:"buyClicked",ERROR:"error"},t.bridge={REMOVE_LISTENER:"removeEventListener",ADD_LISTENER:"addEventListener"}}),define("lib/api/getters",["require","exports","module"],function(e,t,n){n.exports={GET_VOLUME:"getVolume",GET_DURATION:"getDuration",GET_POSITION:"getPosition",GET_SOUNDS:"getSounds",GET_CURRENT_SOUND:"getCurrentSound",GET_CURRENT_SOUND_INDEX:"getCurrentSoundIndex",IS_PAUSED:"isPaused"}}),define("lib/api/setters",["require","exports","module"],function(e,t,n){n.exports={PLAY:"play",PAUSE:"pause",TOGGLE:"toggle",SEEK_TO:"seekTo",SET_VOLUME:"setVolume",NEXT:"next",PREV:"prev",SKIP:"skip"}}),define("lib/api/api",["require","exports","module","lib/api/events","lib/api/getters","lib/api/setters"],function(e,t,n){function r(e){return!!(e===""||e&&e.charCodeAt&&e.substr)}function i(e){return!!(e&&e.constructor&&e.call&&e.apply)}function s(e){return!!e&&e.nodeType===1&&e.nodeName.toUpperCase()==="IFRAME"}function o(e){var t=!1,n;for(n in T)if(T.hasOwnProperty(n)&&T[n]===e){t=!0;break}return t}function u(e){var t,n,r;for(t=0,n=A.length;t<n;t++){r=e(A[t]);if(r===!1)break}}function a(e){var t="",n,r,i;e.substr(0,2)==="//"&&(e=window.location.protocol+e),i=e.split("/");for(n=0,r=i.length;n<r;n++){if(!(n<3))break;t+=i[n],n<2&&(t+="/")}return t}function f(e){return e.contentWindow?e.contentWindow:e.contentDocument&&"parentWindow"in e.contentDocument?e.contentDocument.parentWindow:null}function l(e){var t=[],n;for(n in e)e.hasOwnProperty(n)&&t.push(e[n]);return t}function c(e,t,n){n.callbacks[e]=n.callbacks[e]||[],n.callbacks[e].push(t)}function h(e,t){var n=!0,r;return t.callbacks[e]=[],u(function(t){r=t.callbacks[e]||[];if(r.length)return n=!1,!1}),n}function p(e,t,n){var r=f(n),i,s;if(!r.postMessage)return!1;i=n.getAttribute("src").split("?")[0],s=JSON.stringify({method:e,value:t}),i.substr(0,2)==="//"&&(i=window.location.protocol+i),i=i.replace(/http:\/\/(w|wt).soundcloud.com/,"https://$1.soundcloud.com"),r.postMessage(s,i)}function d(e){var t;return u(function(n){if(n.instance===e)return t=n,!1}),t}function v(e){var t;return u(function(n){if(f(n.element)===e)return t=n,!1}),t}function m(e,t){return function(n){var r=i(n),s=d(this),o=!r&&t?n:null,u=r&&!t?n:null;return u&&c(e,u,s),p(e,o,s.element),this}}function g(e,t,n){var r,i,s;for(r=0,i=t.length;r<i;r++)s=t[r],e[s]=m(s,n)}function y(e,t,n){return e+"?url="+t+"&"+b(n)}function b(e){var t,n,r=[];for(t in e)e.hasOwnProperty(t)&&(n=e[t],r.push(t+"="+(t==="start_track"?parseInt(n,10):n?"true":"false")));return r.join("&")}function w(e,t,n){var r=e.callbacks[t]||[],i,s;for(i=0,s=r.length;i<s;i++)r[i].apply(e.instance,n);if(o(t)||t===C.READY)e.callbacks[t]=[]}function E(e){var t,n,r,i,s;try{n=JSON.parse(e.data)}catch(o){return!1}t=v(e.source),r=n.method,i=n.value;if(t&&S(e.origin)!==S(t.domain))return!1;if(!t)return r===C.READY&&L.push(e.source),!1;r===C.READY&&(t.isReady=!0,w(t,O),h(O,t)),r===C.PLAY&&!t.playEventFired&&(t.playEventFired=!0),r===C.PLAY_PROGRESS&&!t.playEventFired&&(t.playEventFired=!0,w(t,C.PLAY,[i])),s=[],i!==undefined&&s.push(i),w(t,r,s)}function S(e){return e.replace(_,"")}var x=e("lib/api/events"),T=e("lib/api/getters"),N=e("lib/api/setters"),C=x.api,k=x.bridge,L=[],A=[],O="__LATE_BINDING__",M="http://wt.soundcloud.dev:9200/",_=/^http(?:s?)/,D,P,H;window.addEventListener?window.addEventListener("message",E,!1):window.attachEvent("onmessage",E),n.exports=H=function(e,t,n){r(e)&&(e=document.getElementById(e));if(!s(e))throw new Error("SC.Widget function should be given either iframe element or a string specifying id attribute of iframe element.");t&&(n=n||{},e.src=y(M,t,n));var i=v(f(e)),o,u;return i&&i.instance?i.instance:(o=L.indexOf(f(e))>-1,u=new D(e),A.push(new P(u,e,o)),u)},H.Events=C,window.SC=window.SC||{},window.SC.Widget=H,P=function(e,t,n){this.instance=e,this.element=t,this.domain=a(t.getAttribute("src")),this.isReady=!!n,this.callbacks={}},D=function(){},D.prototype={constructor:D,load:function(e,t){if(!e)return;t=t||{};var n=this,r=d(this),i=r.element,s=i.src,o=s.substr(0,s.indexOf("?"));r.isReady=!1,r.playEventFired=!1,i.onload=function(){n.bind(C.READY,function(){var e,n=r.callbacks;for(e in n)n.hasOwnProperty(e)&&e!==C.READY&&p(k.ADD_LISTENER,e,r.element);t.callback&&t.callback()})},i.src=y(o,e,t)},bind:function(e,t){var n=this,r=d(this);return r&&r.element&&(e===C.READY&&r.isReady?setTimeout(t,1):r.isReady?(c(e,t,r),p(k.ADD_LISTENER,e,r.element)):c(O,function(){n.bind(e,t)},r)),this},unbind:function(e){var t=d(this),n;t&&t.element&&(n=h(e,t),e!==C.READY&&n&&p(k.REMOVE_LISTENER,e,t.element))}},g(D.prototype,l(T)),g(D.prototype,l(N),!0)}),window.SC=window.SC||{},window.SC.Widget=require("lib/api/api")})();