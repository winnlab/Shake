/*!
 * CanJS - 2.1.2
 * http://canjs.us/
 * Copyright (c) 2014 Bitovi
 * Mon, 16 Jun 2014 20:44:18 GMT
 * Licensed MIT
 * Includes: CanJS default build
 * Download from: http://canjs.us/
 */

define(["can/util/library","can/view","can/util/string","can/compute","can/view/scanner","can/view/render"],function(e){var t=e.extend,n=function(e){if(this.constructor!==n){var r=new n(e);return function(e,t){return r.render(e,t)}}if(typeof e=="function"){this.template={fn:e};return}t(this,e),this.template=this.scanner.scan(this.text,this.name)};return e.EJS=n,n.prototype.render=function(e,t){return e=e||{},this.template.fn.call(e,e,new n.Helpers(e,t||{}))},t(n.prototype,{scanner:new e.view.Scanner({text:{outStart:"with(_VIEW) { with (_CONTEXT) {",outEnd:"}}",argNames:"_CONTEXT,_VIEW",context:"this"},tokens:[["templateLeft","<%%"],["templateRight","%>"],["returnLeft","<%=="],["escapeLeft","<%="],["commentLeft","<%#"],["left","<%"],["right","%>"],["returnRight","%>"]],helpers:[{name:/\s*\(([\$\w]+)\)\s*->([^\n]*)/,fn:function(e){var t=/\s*\(([\$\w]+)\)\s*->([^\n]*)/,n=e.match(t);return"can.proxy(function(__){var "+n[1]+"=can.$(__);"+n[2]+"}, this);"}}],transform:function(e){return e.replace(/<%([\s\S]+?)%>/gm,function(e,t){var n=[],r,i;t.replace(/[{}]/gm,function(e,t){n.push([e,t])});do{r=!1;for(i=n.length-2;i>=0;i--)if(n[i][0]==="{"&&n[i+1][0]==="}"){n.splice(i,2),r=!0;break}}while(r);if(n.length>=2){var s=["<%"],o,u=0;for(i=0;o=n[i];i++)s.push(t.substring(u,u=o[1])),o[0]==="{"&&i<n.length-1||o[0]==="}"&&i>0?s.push(o[0]==="{"?"{ %><% ":" %><% }"):s.push(o[0]),++u;return s.push(t.substring(u),"%>"),s.join("")}return"<%"+t+"%>"})}})}),n.Helpers=function(e,n){this._data=e,this._extras=n,t(this,n)},n.Helpers.prototype={list:function(t,n){e.each(t,function(e,r){n(e,r,t)})},each:function(t,n){e.isArray(t)?this.list(t,n):e.view.lists(t,n)}},e.view.register({suffix:"ejs",script:function(e,t){return"can.EJS(function(_CONTEXT,_VIEW) { "+(new n({text:t,name:e})).template.out+" })"},renderer:function(e,t){return n({text:t,name:e})}}),e.ejs.Helpers=n.Helpers,e});