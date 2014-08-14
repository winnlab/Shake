define([
    'canjs',
    'core/appState',
    'velocity',
    'css!app/shakeit/css/shakeit.css'
],
    function (can, appState) {

        return can.Control.extend({
            defaults: {
                viewpath: 'app/shakeit/'
            }
        }, {
            init: function () {
                var self = this;
                var wrapMinHeight = parseInt($(window).height()) - parseInt($('header.header .content').height());

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

                var $next = el;
                var $afterNext = $next.next();
                var $сurrent = el.prev();
                var halfWidth = $сurrent.width()/2;
                if ( $сurrent.prev().length > 0 ) {
                    var $prev = $сurrent.prev();
                } else {
                    var $prev = el.parents('.carouselWrap').children().last();
                }

                $сurrent.find('.fragmentItemInfoContent').velocity('fadeOut', function(){  // hide text content of current product

                    $prev.velocity({left: '-50%'}, 200, function(){
                        $prev.velocity({display: 'none'});
                    });

                    $сurrent.velocity({
                        scale: 0.5,
                        left: 0
                    }, 200);

                    $next.velocity({
                        scale: 1,
                        right: 'auto',
                        left: '50%',
                        'margin-left': -halfWidth
                    }, 200);

                    $afterNext.velocity({
                        right: '-50%'
                    }, 0, function () {
                        $afterNext.velocity({
                            right: 0,
                            display: 'block'
                        }, 200);
                    });
                });
            },

            '.previous click': function ( el, ev ) {

            }

/*            '.current click': function ( el, ev ) {
                console.log('current click');

                el.velocity({scale: 0.7});
            }*/
        });

    }
);
