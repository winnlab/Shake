define(["canjs","core/appState","underscore","velocity","social/fb/fb_sdk","css!app/shakeit/css/shakeit.css"],function(e,t,n){return e.Control.extend({defaults:{viewpath:"app/shakeit/",animTime:300,prevNextScale:.5}},{init:function(){var e=this;e.render(),e.initBindings()},render:function(){var n=this,r=$(window).height();n.element.html(e.view(n.options.viewpath+"index.stache",{appState:t,wrapMinHeight:r+"px"})),this.initCarousel($(".shakeitWrap",n.element)),n.options.isReady&&n.options.isReady.resolve()},initBindings:function(){var e=this;t.bind("shakeItProduct",function(){e.render()})},"{can.route} module set":function(e){if(e!="shakeit")$("audio",self.element).each(function(){this.pause()});else{var t=$(".fragmentItem.current",self.element);if(t.length>0){var n=t.find("audio");n.length>0&&$(n).each(function(){this.play()})}}},initCarousel:function(e){var n=null,r=null,i=null;if(t.attr("shakeItProduct")){console.log(t.attr("shakeItProduct"));var s=t.attr("products").attr(),o=-1;for(var u in s)if(s.hasOwnProperty(u)&&s[u].link===t.attr("shakeItProduct")){o=u;break}o!==-1?(n=e.children().eq(o),o==0?(r=n.next(),i=e.children().last()):o==s.length-1?(r=e.children().first(),i=n.prev()):(r=n.next(),i=n.prev())):(n=e.children().first(),r=n.next(),i=e.children().last())}else n=e.children().first(),r=n.next(),i=e.children().last();n.addClass("current");var a=n.find(".fragmentItemInfoContent");a.velocity("fadeIn");var f=n.find(".video"),l=n.find(".audio");f.velocity("fadeIn",function(){f.find("video")[0].play(),f.find("audio")[0].play(),a.velocity("fadeOut")}),r.velocity({scale:.5},100,function(){r.addClass("next")}),r.next()&&r.next().css("right","-50%"),i.velocity({scale:.5},100,function(){i.addClass("previous")}),i.prev()&&i.prev().css("left","-50%")},".ringtone a click":function(e,t){t.stopPropagation()},".next click":function(e,t){var n=this.options.animTime,r=this.options.prevNextScale,i="-1em",s="-6.5em",o=e;if(o.next().length>0)var u=o.next();else var u=e.parents(".carouselWrap").children().first();if(e.prev().length>0)var a=e.prev();else var a=e.parents(".carouselWrap").children().last();var f=a.width()/2;if(a.prev().length>0)var l=a.prev();else var l=e.parents(".carouselWrap").children().last();var c=a.find(".video");c.velocity("fadeOut",function(){$(this).find("video")[0].pause(),$(this).find("audio")[0].pause()}),a.find(".fragmentItemInfoContent").velocity("fadeOut",function(){l.velocity({left:"-50%"},n,function(){l.css({display:"none"}),l.removeClass("previous")}),a.find(".image").velocity({top:s,opacity:0}),a.velocity({scale:r,left:0},n,function(){$(this).removeClass("current"),$(this).addClass("previous")}),o.velocity({scale:1,right:"auto",left:"50%","margin-left":-f},n,function(){$(this).removeClass("next"),$(this).addClass("current"),$(this).find(".fragmentItemInfoContent").velocity("fadeIn",function(){var e=$(this);setTimeout(function(){e.velocity("fadeOut")},1e3)}),$(this).find(".video").velocity("fadeIn",function(){$(this).find("video")[0].play(),$(this).find("audio")[0].play()}),$(this).find(".image").velocity({top:i,opacity:1})}),u.velocity({right:"-50%",scale:r},0,function(){u.css({display:"block",left:"auto"}),u.velocity({right:0,"margin-right":-f},n,function(){$(this).addClass("next")})}),u.find(".image").velocity({top:s})})},".previous click":function(e,t){var n=this.options.animTime,r=this.options.prevNextScale,i="-1em",s="-6.5em",o=e,u=e.parents(".carouselWrap").children();if(o.prev().length>0)var a=o.prev();else var a=u.last();if(e.next().length>0)var f=e.next();else var f=u.first();var l=f.width()/2;if(f.next().length>0)var c=f.next();else var c=u.first();var h=f.find(".video");h.velocity("fadeOut",function(){$(this).find("video")[0].pause(),$(this).find("audio")[0].pause()}),f.find(".fragmentItemInfoContent").velocity("fadeOut",function(){c.velocity({right:"-50%"},n,function(){c.css({display:"none"}),c.removeClass("next")}),f.css({left:"auto"}),f.find(".image").velocity({top:s,opacity:0}),f.velocity({scale:r,right:0},n,function(){$(this).removeClass("current"),$(this).addClass("next")}),o.velocity({scale:1,right:"auto",left:"50%","margin-left":-l},n,function(){$(this).removeClass("previous"),$(this).addClass("current"),$(this).find(".fragmentItemInfoContent").velocity("fadeIn",function(){var e=$(this);setTimeout(function(){e.velocity("fadeOut")},1e3)}),$(this).find(".video").velocity("fadeIn",function(){$(this).find("video")[0].play(),$(this).find("audio")[0].play()}),$(this).find(".image").velocity({top:i,opacity:1})}),a.velocity({left:"-50%",scale:r},0,function(){a.css({display:"block",right:"auto"}),a.velocity({left:0,"margin-left":-l},n,function(){$(this).addClass("previous")})}),a.find(".image").velocity({top:s})})},".fragmentItemContent mouseenter":function(e,t){e.parents(".current").length>0?e.find(".fragmentItemInfoContent").velocity("fadeIn",200):e.find(".image").velocity({opacity:1},200)},".fragmentItemContent mouseleave":function(e,t){e.parents(".current").length>0?e.find(".fragmentItemInfoContent").velocity("fadeOut",200):e.find(".image").velocity({opacity:0},200)},".fbShare click":function(e,n){n.preventDefault();var r=e.data("link"),i=Math.floor(Math.random()*parseInt(t.locale.shareSlogans.length)),s=t.locale.shareSlogans[i];this.fbShare(r,s)},fbShare:function(e,n){FB.ui({method:"feed",name:n.title,link:window.location.origin,picture:""+window.location.origin+t.attr("imgPath")+"shakeItShare/"+e+".jpg",description:n.content,message:"Shake test message"},function(e){e&&!e.error_code?console.info(e):alert("Error while posting.")})},".vkShare click":function(e,r){r.preventDefault();var i=e.data("link"),s=Math.floor(Math.random()*parseInt(t.locale.shareSlogans.length)),o=t.locale.shareSlogans[s],u=n.find(t.social.imgReferences.attr(),function(e){return e.name==i}),a=u.photo;this.vkShare(a,o)},vkShare:function(e,t){var n="";n+=window.location.origin,n+=(n.length?",":"")+e,VK.Api.call("wall.post",{message:t.title+t.content,attachments:n},function(e){e&&!e.error&&console.info(e.response.post_id)})}})});