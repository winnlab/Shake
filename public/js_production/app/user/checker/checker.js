define(["canjs","core/appState","managers/TitleManager","css!app/checker/css/checker.css"],function(e,t,n){return e.Control.extend({defaults:{viewpath:"app/checker/"}},{init:function(){var r=this;r.element.html(e.view(r.options.viewpath+"index.stache",t)),r.options.isReady&&r.options.isReady.resolve(),r.titleManager=new n({bgColor:"transparent"}),setTimeout(function(){r.element.find(".checkerBtns").addClass("active")},1e3)},":module route":function(e){e.module=="checker"&&this.titleManager.animate.call(this.titleManager)},".yes click":function(){var n=t.attr("products"),r=Math.floor(Math.random()*n.length);e.route.attr({module:"product",id:n.attr(r+".link")},!0),this.titleManager.stopAnimate.call(this.titleManager)},".no click":function(){t.attr("is18Show",!1)}})});