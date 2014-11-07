define(["canjs","underscore","app/days/day","app/days/daysModel","app/fragments/fragmentsModel","app/products/productsModel","core/appState","css!app/days/css/days"],function(e,t,n,r,i,s,o){var u=e.Map.extend({define:{days:{value:new r.List({})},viewState:{value:"list",serialize:!1}},reOrder:function(e,t){t=t||"position";var n=this.attr(e);n.sort(function(e,n){return e[t]>n[t]?1:e[t]<n[t]?-1:0})},toList:function(){e.route.attr({module:"days",action:undefined,entity_id:undefined}),this.attr("viewState","list")},toEntity:function(t){e.route.attr({entity_id:t,action:"set",module:"days"})}});return e.Control.extend({defaults:{viewpath:"app/days/views/",DaysModel:r,ProductsModel:s,FragmentsModel:i}},{init:function(){var t=this,n=e.route.attr();t.viewModel=new u,t.viewModel.attr("fragments",new i.List({})),n.entity_id&&n.action&&(t.viewModel.attr("viewState","edit"),e.when(t.viewModel.attr("days")).then(function(){t.setDay(n.entity_id,n.action)})),t.element.html(e.view(t.options.viewpath+"index.stache",t.viewModel))},":module route":function(e){var t=this.viewModel.attr("viewState");e.module==="days"&&t!=="list"&&this.viewModel.toList(this.product_id)},":module/:action/:entity_id route":function(e){e.module==="days"&&this.setDay(e.entity_id,e.action)},".addDay click":function(e){this.viewModel.toEntity("0")},".editDay click":function(e){var t=e.parents(".day").data("day");this.viewModel.toEntity(t.attr("_id"))},setDay:function(e){this.viewModel.attr({id:Date.now(),viewState:"edit"});var i=this.element.find(".setDayWrap"),s=t.find(this.viewModel.days,function(t){return t&&t.attr("_id")===e});new n(i,{day:s?s:new r})},".removeDay click":function(e){var t=e.parents(".day").data("day");confirm('Вы действительно хотите удалить день: "'+t.attr("name")+'"?')&&t.destroy().always(function(e,t,n){o.attr("notification",{status:t,msg:e.name+". "+n.responseJSON.message})})},"{DaysModel} created":function(e,t,n){var r=this.viewModel.attr("days");r.push(n),this.viewModel.reOrder("days")},"{DaysModel} updated":function(){this.viewModel.reOrder("days")},"{FragmentsModel} created":function(e,t,n){var r=this.viewModel.attr("fragments");r.push(n),this.viewModel.reOrder("fragments")},"{FragmentsModel} updated":function(e){this.viewModel.reOrder("fragments")},"{ProductsModel} destroyed":function(n,r,i){console.log(i.attr());var s=i.attr("_id"),o=this.viewModel.attr("fragments"),u=[];t.each(o,function(e,t){e.attr("product_id")==s&&u.push(t)}),e.batch.start(),t.each(u,function(e){o.splice(e,1)}),e.batch.stop(),console.log("days product destroyed")}})});