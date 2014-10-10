define(["canjs","core/appState","velocity","css!app/shakeit/css/shakeit.css"],function(e,t){return e.Control.extend({defaults:{viewpath:"app/shakeit/",animTime:300,prevNextScale:.5}},{init:function(){var n=this,r=$(window).height();n.element.html(e.view(n.options.viewpath+"index.stache",{appState:t,wrapMinHeight:r+"px"})),this.initCarousel($(".shakeitWrap",n.element)),n.options.isReady&&n.options.isReady.resolve()},initCarousel:function(e){var t=e.children().first(),n=t.next(),r=e.children().last();t.addClass("current");var i=t.find(".fragmentItemInfoContent");i.velocity("fadeIn");var s=t.find(".video"),o=t.find(".audio");s.velocity("fadeIn",function(){s.find("video")[0].play(),s.find("audio")[0].play(),setTimeout(function(){i.velocity("fadeOut",1e3)},3e3)}),n.velocity({scale:.5},100,function(){n.addClass("next")}),n.next()&&n.next().css("right","-50%"),r.velocity({scale:.5},100,function(){r.addClass("previous")}),r.prev()&&r.prev().css("left","-50%")},".next click":function(e,t){var n=this.options.animTime,r=this.options.prevNextScale,i="-1em",s="-6.5em",o=e;if(o.next().length>0)var u=o.next();else var u=e.parents(".carouselWrap").children().first();if(e.prev().length>0)var a=e.prev();else var a=e.parents(".carouselWrap").children().last();var f=a.width()/2;if(a.prev().length>0)var l=a.prev();else var l=e.parents(".carouselWrap").children().last();var c=a.find(".video");c.velocity("fadeOut",function(){$(this).find("video")[0].pause(),$(this).find("audio")[0].pause()}),a.find(".fragmentItemInfoContent").velocity("fadeOut",function(){l.velocity({left:"-50%"},n,function(){l.css({display:"none"}),l.removeClass("previous")}),a.velocity({scale:r,left:0},n,function(){$(this).removeClass("current"),$(this).addClass("previous")}),a.find(".image").velocity({top:s,opacity:0}),o.velocity({scale:1,right:"auto",left:"50%","margin-left":-f},n,function(){$(this).removeClass("next"),$(this).addClass("current"),$(this).find(".fragmentItemInfoContent").velocity("fadeIn"),$(this).find(".video").velocity("fadeIn",function(){$(this).find("video")[0].play(),$(this).find("audio")[0].play()})}),o.find(".image").velocity({top:i,opacity:1}),u.velocity({right:"-50%",scale:r},0,function(){u.css({display:"block",left:"auto"}),u.velocity({right:0,"margin-right":-f},n,function(){$(this).addClass("next")})}),u.find(".image").velocity({top:s})})},".previous click":function(e,t){var n=this.options.animTime,r=this.options.prevNextScale,i="-1em",s="-6.5em",o=e,u=e.parents(".carouselWrap").children();if(o.prev().length>0)var a=o.prev();else var a=u.last();if(e.next().length>0)var f=e.next();else var f=u.first();var l=f.width()/2;if(f.next().length>0)var c=f.next();else var c=u.first();var h=f.find(".video");h.velocity("fadeOut",function(){$(this).find("video")[0].pause(),$(this).find("audio")[0].pause()}),f.find(".fragmentItemInfoContent").velocity("fadeOut",function(){c.velocity({right:"-50%"},n,function(){c.css({display:"none"}),c.removeClass("next")}),f.css({left:"auto"}),f.velocity({scale:r,right:0},n,function(){$(this).removeClass("current"),$(this).addClass("next")}),f.find(".image").velocity({top:s,opacity:0}),o.velocity({scale:1,right:"auto",left:"50%","margin-left":-l},n,function(){$(this).removeClass("previous"),$(this).addClass("current"),$(this).find(".fragmentItemInfoContent").velocity("fadeIn"),$(this).find(".video").velocity("fadeIn",function(){$(this).find("video")[0].play(),$(this).find("audio")[0].play()})}),o.find(".image").velocity({top:i,opacity:1}),a.velocity({left:"-50%",scale:r},0,function(){a.css({display:"block",right:"auto"}),a.velocity({left:0,"margin-left":-l},n,function(){$(this).addClass("previous")})}),a.find(".image").velocity({top:s})})},".fragmentItemContent mouseenter":function(e,t){e.parents(".current").length>0?e.find(".fragmentItemInfoContent").velocity("fadeIn",200):e.find(".image").velocity({opacity:1},200)},".fragmentItemContent mouseleave":function(e,t){e.parents(".current").length>0?e.find(".fragmentItemInfoContent").velocity("fadeOut",200):e.find(".image").velocity({opacity:0},200)}})});