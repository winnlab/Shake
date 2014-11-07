define(["../core","./support","../core/init"],function(e,t){var n=/\r/g;e.fn.extend({val:function(t){var r,i,s,o=this[0];if(!arguments.length){if(o)return r=e.valHooks[o.type]||e.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(i=r.get(o,"value"))!==undefined?i:(i=o.value,typeof i=="string"?i.replace(n,""):i==null?"":i);return}return s=e.isFunction(t),this.each(function(n){var i;if(this.nodeType!==1)return;s?i=t.call(this,n,e(this).val()):i=t,i==null?i="":typeof i=="number"?i+="":e.isArray(i)&&(i=e.map(i,function(e){return e==null?"":e+""})),r=e.valHooks[this.type]||e.valHooks[this.nodeName.toLowerCase()];if(!r||!("set"in r)||r.set(this,i,"value")===undefined)this.value=i})}}),e.extend({valHooks:{option:{get:function(t){var n=e.find.attr(t,"value");return n!=null?n:e.trim(e.text(t))}},select:{get:function(n){var r,i,s=n.options,o=n.selectedIndex,u=n.type==="select-one"||o<0,a=u?null:[],f=u?o+1:s.length,l=o<0?f:u?o:0;for(;l<f;l++){i=s[l];if((i.selected||l===o)&&(t.optDisabled?!i.disabled:i.getAttribute("disabled")===null)&&(!i.parentNode.disabled||!e.nodeName(i.parentNode,"optgroup"))){r=e(i).val();if(u)return r;a.push(r)}}return a},set:function(t,n){var r,i,s=t.options,o=e.makeArray(n),u=s.length;while(u--){i=s[u];if(i.selected=e.inArray(i.value,o)>=0)r=!0}return r||(t.selectedIndex=-1),o}}}}),e.each(["radio","checkbox"],function(){e.valHooks[this]={set:function(t,n){if(e.isArray(n))return t.checked=e.inArray(e(t).val(),n)>=0}},t.checkOn||(e.valHooks[this].get=function(e){return e.getAttribute("value")===null?"on":e.value})})});