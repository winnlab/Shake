define(["canjs","core/appState","app/soundCloudWidget/soundCloudWidget","css!app/menu/css/menu"],function(e,t,n){return e.Control.extend({defaults:{viewpath:"app/menu/"}},{init:function(){var t=this,n=t.options;n.state||(n.state=new e.Map),t.element.prepend(e.view(t.options.viewpath+"index.stache",{appState:n.state}))},".menu click":function(){var e=this.options.state,t=e.attr("menu");e.attr("menu",t=="opened"?"closed":"opened")},".pages .module click":function(){this.options.state.attr("menu","closed")},".playBtn click":function(){t.attr("paused",!t.attr("paused")),n.togglePause()},".soundIcon click":function(){t.attr("muted",!t.attr("muted")),n.toggleMute()}})});