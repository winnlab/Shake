define([
    'canjs',
    'core/appState',
    'velocity',
    'css!app/shakeit/css/shakeit.css'
],
    function (can, appState) {

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
            },

            initCarousel: function ( $wrapper ) {

                var $current = $wrapper.children().first();
                var $next = $current.next(),
                    $previous = $wrapper.children().last();

                $current.addClass('current');
                $current.find('.fragmentItemInfoContent').velocity('fadeIn');
                var $videoBlock = $current.find('.video');
                $videoBlock.velocity('fadeIn', function () {
                    $videoBlock.find('video')[0].play();
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

            '.next click': function ( el, ev ) {

                var animTime = this.options.animTime;
                var prevNextScale = this.options.prevNextScale;

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
                        });
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
                });
            },

            '.previous click': function ( el, ev ) {

                var animTime = this.options.animTime;
                var prevNextScale = this.options.prevNextScale;

                var $prev = el;

                if ( $prev.prev().length > 0 ) {
                    var $beforePrev = $prev.prev();
                } else {
                    var $beforePrev = el.parents('.carouselWrap').children().last();
                }

                if ( el.next().length > 0 ) {
                    var $сurrent = el.next();
                } else {
                    var $сurrent = el.parents('.carouselWrap').children().first();
                }

                var halfWidth = $сurrent.width()/2;

                if ( $сurrent.next().length > 0 ) {
                    var $next = $сurrent.next();
                } else {
                    var $next = el.parents('.carouselWrap').children().first();
                }

                var $videoBlock = $сurrent.find('.video');
                $videoBlock.velocity('fadeOut', function () {
                    $(this).find('video')[0].pause();
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
                        });
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
                });
            }
        });

    }
);
