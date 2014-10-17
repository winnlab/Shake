define([
    'canjs',
    'core/appState',
	'underscore',
    'velocity',
	'social/fb/fb_sdk',
    'css!app/shakeit/css/shakeit.css'
],
    function (can, appState, _) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/shakeit/',
                animTime: 300,
                prevNextScale: 0.5
            }
        }, {
            init: function () {
                var self = this;
                var wrapMinHeight = $(window).height();

                self.element.html(
                    can.view(self.options.viewpath + 'index.stache', {
                        appState: appState,
                        wrapMinHeight: wrapMinHeight + 'px'
                    })
                );

                this.initCarousel( $('.shakeitWrap', self.element) );

                if (self.options.isReady) {
                    self.options.isReady.resolve();
                }
            },

            initCarousel: function ( $wrapper ) {

                var $current = $wrapper.children().first();
                var $next = $current.next(),
                    $previous = $wrapper.children().last();

                $current.addClass('current');
                var $currentInfoContent = $current.find('.fragmentItemInfoContent');
                $currentInfoContent.velocity('fadeIn');
                var $videoBlock = $current.find('.video'),
                    $audioBlock = $current.find('.audio');
                $videoBlock.velocity('fadeIn', function () {
                    $videoBlock.find('video')[0].play();
                    $videoBlock.find('audio')[0].play();
	                $currentInfoContent.velocity('fadeOut');
/*                    setTimeout(function () {
                        $currentInfoContent.velocity('fadeOut', 1000);
                    }, 3000);*/
                });

                $next.velocity({scale: 0.5}, 100, function () {
                    $next.addClass('next');
                });
                if ( $next.next() ) {
                    $next.next().css('right', '-50%');
                }

                $previous.velocity({scale: 0.5}, 100, function () {
                    $previous.addClass('previous');
                });
                if ( $previous.prev() ) {
                    $previous.prev().css('left', '-50%');
                }

            },

            '.ringtone a click': function (el, ev) {
                ev.stopPropagation();                
            },

            '.next click': function ( el, ev ) {

                var animTime = this.options.animTime;
                var prevNextScale = this.options.prevNextScale;
                var currentImageTop = '-1em';
                var prevNextImageTop = '-6.5em';

                var $next = el;

                if ( $next.next().length > 0 ) {
                    var $afterNext = $next.next();
                } else {
                    var $afterNext = el.parents('.carouselWrap').children().first();
                }

                if ( el.prev().length > 0 ) {
                    var $сurrent = el.prev();
                } else {
                    var $сurrent = el.parents('.carouselWrap').children().last();
                }

                var halfWidth = $сurrent.width()/2;

                if ( $сurrent.prev().length > 0 ) {
                    var $prev = $сurrent.prev();
                } else {
                    var $prev = el.parents('.carouselWrap').children().last();
                }

                var $videoBlock = $сurrent.find('.video');
                $videoBlock.velocity('fadeOut', function () {
                    $(this).find('video')[0].pause();
                    $(this).find('audio')[0].pause();
                });
                $сurrent.find('.fragmentItemInfoContent').velocity('fadeOut', function(){  // hide text content of current product

                    $prev.velocity({left: '-50%'}, animTime, function(){
                        $prev.css({display: 'none'});
                        $prev.removeClass('previous');
                    });

                    $сurrent.velocity({
                        scale: prevNextScale,
                        left: 0
                    }, animTime, function () {
                        $(this).removeClass('current');
                        $(this).addClass('previous');
                    });
                    $сurrent.find('.image').velocity({
                        top: prevNextImageTop,
                        opacity: 0
                    });

                    $next.velocity({
                        scale: 1,
                        right: 'auto',
                        left: '50%',
                        'margin-left': -halfWidth
                    }, animTime, function () {
                        $(this).removeClass('next');
                        $(this).addClass('current');
                        $(this).find('.fragmentItemInfoContent').velocity('fadeIn');
                        $(this).find('.video').velocity('fadeIn', function () {
                            $(this).find('video')[0].play();
                            $(this).find('audio')[0].play();
                        });
                    });
                    $next.find('.image').velocity({
                        top: currentImageTop,
                        opacity: 1
                    });

                    $afterNext.velocity({
                        right: '-50%',
                        scale: prevNextScale
                    }, 0, function () {
                        $afterNext.css({
                            display: 'block',
                            left: 'auto'
                        });
                        $afterNext.velocity({
                            right: 0,
                            'margin-right': -halfWidth
                        }, animTime, function () {
                            $(this).addClass('next');
                        });
                    });
                    $afterNext.find('.image').velocity({
                        top: prevNextImageTop
                    });
                });
            },

            '.previous click': function ( el, ev ) {

                var animTime = this.options.animTime;
                var prevNextScale = this.options.prevNextScale;
                var currentImageTop = '-1em';
                var prevNextImageTop = '-6.5em';

                var $prev = el;
                var $carouselWrapChildren = el.parents('.carouselWrap').children();

                if ( $prev.prev().length > 0 ) {
                    var $beforePrev = $prev.prev();
                } else {
                    var $beforePrev = $carouselWrapChildren.last();
                }

                if ( el.next().length > 0 ) {
                    var $сurrent = el.next();
                } else {
                    var $сurrent = $carouselWrapChildren.first();
                }

                var halfWidth = $сurrent.width()/2;

                if ( $сurrent.next().length > 0 ) {
                    var $next = $сurrent.next();
                } else {
                    var $next = $carouselWrapChildren.first();
                }

                var $videoBlock = $сurrent.find('.video');
                $videoBlock.velocity('fadeOut', function () {
                    $(this).find('video')[0].pause();
                    $(this).find('audio')[0].pause();
                });
                $сurrent.find('.fragmentItemInfoContent').velocity('fadeOut', function () {

                    $next.velocity({right: '-50%'}, animTime, function(){
                        $next.css({display: 'none'});
                        $next.removeClass('next');
                    });

                    $сurrent.css({left: 'auto'});
                    $сurrent.velocity({
                        scale: prevNextScale,
                        right: 0
                    }, animTime, function () {
                        $(this).removeClass('current');
                        $(this).addClass('next');
                    });
                    $сurrent.find('.image').velocity({
                        top: prevNextImageTop,
                        opacity: 0
                    });

                    $prev.velocity({
                        scale: 1,
                        right: 'auto',
                        left: '50%',
                        'margin-left': -halfWidth
                    }, animTime, function () {
                        $(this).removeClass('previous');
                        $(this).addClass('current');
                        $(this).find('.fragmentItemInfoContent').velocity('fadeIn');
                        $(this).find('.video').velocity('fadeIn', function () {
                            $(this).find('video')[0].play();
                            $(this).find('audio')[0].play();
                        });
                    });
                    $prev.find('.image').velocity({
                        top: currentImageTop,
                        opacity: 1
                    });

                    $beforePrev.velocity({
                        left: '-50%',
                        scale: prevNextScale
                    }, 0, function () {
                        $beforePrev.css({
                            display: 'block',
                            right: 'auto'
                        });
                        $beforePrev.velocity({
                            left: 0,
                            'margin-left': -halfWidth
                        }, animTime, function () {
                            $(this).addClass('previous');
                        });
                    });
                    $beforePrev.find('.image').velocity({
                        top: prevNextImageTop
                    });
                });
            },

            '.fragmentItemContent mouseenter': function ( el, ev ) {
                if ( el.parents('.current').length > 0 ) {
                    el.find('.fragmentItemInfoContent').velocity('fadeIn', 200);
                } else {
                    el.find('.image').velocity({opacity: 1}, 200);
                }
            },

            '.fragmentItemContent mouseleave': function ( el, ev ) {
                if ( el.parents('.current').length > 0 ) {
                    el.find('.fragmentItemInfoContent').velocity('fadeOut', 200);
                } else {
                    el.find('.image').velocity({opacity: 0}, 200);
                }
            },

	        '.fbShare click': function (el, ev) {
		        ev.preventDefault();
		        var imageName = el.data('link');

		        console.log();
		        var sloganIndex = Math.floor(Math.random() * (parseInt(appState.locale.shareSlogans.length)));
		        var randomSlogan = appState.locale.shareSlogans[sloganIndex];

		        this.fbShare(imageName, randomSlogan);
	        },

	        fbShare: function (imageName, slogan) {

		        console.log ('' + window.location.origin + appState.attr('imgPath') + 'shakeItShare/' + imageName + '.jpg');
		        FB.ui({
			        method: 'feed',
			        name: slogan.title,
			        link: window.location.origin,
			        picture: '' + window.location.origin + appState.attr('imgPath') + 'shakeItShare/' + imageName + '.jpg',
			        description: slogan.content,
			        message: 'Shake test message'
		        });
	        },

	        '.vkShare click': function (el, ev) {
		        ev.preventDefault();
		        var link = el.data('link');

		        var sloganIndex = Math.floor(Math.random() * (parseInt(appState.locale.shareSlogans.length)));
		        var randomSlogan = appState.locale.shareSlogans[sloganIndex];

		        var imgReference = _.find(
			        appState.social.imgReferences.attr(), function(element){
			        return element.name == link;
		        });
		        var imageName = imgReference.photo;

		        this.vkShare(imageName, randomSlogan);
	        },

	        vkShare: function (imageName, slogan) {
		        var attachments = '';

		        attachments += window.location.origin;

		        attachments += (attachments.length ? ',' : '') + imageName;

		        VK.Api.call('wall.post', {
			        message: slogan.title + slogan.content,
			        attachments: attachments
		        }, function (response) {
			        if (response && !response.error) {
				        cb(response.response.post_id);
			        }
		        })
	        }
        });

    }
);
