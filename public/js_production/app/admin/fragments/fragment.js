define(["canjs","core/appState"],function(e,t){return e.Control.extend({defaults:{fragmentForm:".setFragment",viewpath:"app/fragments/views/"}},{init:function(){var t=this;t.element.html(e.view(t.options.viewpath+"set.stache",{fragment:t.options.fragment,langs:langs,product_id:e.route.attr("id"),days:t.options.days}))},"{fragmentForm} submit":function(t,n){n.preventDefault();var r=this,i=e.deparam(t.serialize()),s=r.options.fragment;i.active||(i.active=!1),s.attr(i),s.save().done(function(){e.route.attr({entity_id:s.attr("_id")}),r.setNotification("success",'Фрагмент "'+s.getName()+'" успешно сохранен!')}).fail(function(e){console.error(e),r.setNotification("error",'Ошибка сохранения фрагмента "'+e.getName()+'"!')})},setNotification:function(e,n){t.attr("notification",{status:e,msg:n})}})});