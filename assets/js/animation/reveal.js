/* 
---------------------------------------------
            Reveal Effects
---------------------------------------------
Usage (add classes to elements):
  - .reveal-up: scroll-up reveal (default)
  - .reveal-up-slow: slower, longer rise
  - .reveal-up-simple: shorter, subtle rise
  - .reveal-up-quick: faster rise
  - optional overrides: data-reveal-start, data-reveal-y, data-reveal-duration, data-reveal-opacity, data-reveal-reset-delay
  - .reveal-group: stagger children (.reveal-item)
  - .reveal-left / .reveal-right: horizontal reveal (data-distance, data-duration)
  - .reveal-fade: fade-in reveal
  - .reveal-wipe: bottom-to-top soft reveal (no y move)
  - .reveal-wipe-down: top-to-bottom soft reveal (no y move)
  - .reveal-zoomwide: clip expand + .is-zoomed class
  - .reveal-zoomimg: zoom image (data-scale, data-start, data-end)
  - .hl-ink: underline bar (data-color, data-delay, data-duration)

Init from common.js:
  window.Reveal?.init();
*/
(function (w, d) {
    'use strict';

    if (!w.jQuery) return;
    var $ = w.jQuery;

    var SINGLE_PRESETS = [
        { selector: '.reveal-up-slow', y: 80, yDur: 1.35, oDur: 1.6, ease: 'power3.out', start: 'top 80%' },
        { selector: '.reveal-up', y: 60, yDur: 0.85, oDur: 1.05, ease: 'power3.out' },
        { selector: '.reveal-up-simple', y: 24, yDur: 0.5, oDur: 0.6, ease: 'power2.out' },
        { selector: '.reveal-up-quick', y: 40, yDur: 0.6, oDur: 0.7, ease: 'power2.out' }
    ];
    var SELECTOR_GROUP = '.reveal-group';
    var CHILD_SELECTOR = '.reveal-item';
    var SELECTOR_LEFT = '.reveal-left';
    var SELECTOR_RIGHT = '.reveal-right';
    var SELECTOR_ZOOMWIDE = '.reveal-zoomwide';
    var SELECTOR_FADE = '.reveal-fade';
    var SELECTOR_WIPE = '.reveal-wipe';
    var SELECTOR_WIPE_DOWN = '.reveal-wipe-down';
    var SELECTOR_ZOOMIMG = '.reveal-zoomimg';
    var SELECTOR_INK = '.hl-ink';

    var GROUP_DEFAULT_DURATION = 0.9;
    var GROUP_OPACITY_PAD = 0.25;
    var REVEAL_RESET_DELAY = 60000; // 1 minute default

    var isReduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var touchUpdateBound = false;

    function hasGsap() {
        return !!(w.gsap && w.ScrollTrigger);
    }

    function setAutoAlpha(el, value) {
        if (!el || !el.style) return;
        el.style.opacity = value;
        el.style.visibility = value === 0 ? 'hidden' : 'visible';
    }

    function setClip(el, value) {
        if (!el || !el.style) return;
        el.style.clipPath = value;
        el.style.webkitClipPath = value;
    }

    function syncClip(el) {
        if (!el || !el.style) return;
        el.style.webkitClipPath = el.style.clipPath;
    }

    function bound(el) {
        if (!el) return true;
        var $el = $(el);
        if ($el.data('revealBound')) return true;
        $el.data('revealBound', 1);
        return false;
    }

    function scroller() {
        if (w.scrollInstance && w.scrollInstance.__isLoco) {
            return $('[data-scroll-container]').get(0) || w;
        }
        if (w.SancSmoothScrollConfig && w.SancSmoothScrollConfig.scroller) {
            var cfgScroller = w.SancSmoothScrollConfig.scroller;
            var el = null;
            if (typeof cfgScroller === 'string') {
                el = d.querySelector(cfgScroller);
            } else if (cfgScroller && cfgScroller.nodeType === 1) {
                el = cfgScroller;
            }
            if (el && el !== d.documentElement && el !== d.body && el !== d.scrollingElement) {
                return el;
            }
        }
        return w;
    }

    function getResetDelay(el) {
        var raw = el && el.dataset && el.dataset.revealResetDelay;
        var delay = Number(raw);
        if (isFinite(delay)) return delay;
        return REVEAL_RESET_DELAY;
    }

    function clearResetTimer(el) {
        if (!el) return;
        var $el = $(el);
        var id = $el.data('revealResetTimer');
        if (id) clearTimeout(id);
        $el.removeData('revealResetTimer');
    }

    function scheduleReset(el, reset) {
        if (!el || typeof reset !== 'function') return;
        var delay = getResetDelay(el);
        clearResetTimer(el);
        if (!delay || delay <= 0) {
            reset();
            return;
        }
        var id = setTimeout(function () {
            clearResetTimer(el);
            reset();
        }, delay);
        $(el).data('revealResetTimer', id);
    }

    function bindRepeatPlay(triggerEl, start, play) {
        w.ScrollTrigger.create({
            trigger: triggerEl,
            scroller: scroller(),
            start: start,
            onEnter: function () {
                clearResetTimer(triggerEl);
                play();
            },
            onLeaveBack: function () {
                clearResetTimer(triggerEl);
                play();
            }
        });
    }

    function bindRepeatReset(triggerEl, reset) {
        w.ScrollTrigger.create({
            trigger: triggerEl,
            scroller: scroller(),
            start: 'top bottom',
            end: 'bottom top',
            onLeave: function () {
                scheduleReset(triggerEl, reset);
            },
            onLeaveBack: function () {
                scheduleReset(triggerEl, reset);
            }
        });
    }

    function makeSingle(el, preset) {
        if (bound(el)) return;
        var cfg = preset || {};
        var start = (el && el.dataset && el.dataset.revealStart) || cfg.start || 'top 90%';
        var dist = Number(el && el.dataset && el.dataset.revealY);
        if (!isFinite(dist)) dist = cfg.y || 60;
        var yDur = Number(el && el.dataset && el.dataset.revealDuration);
        if (!isFinite(yDur)) yDur = cfg.yDur || 0.85;
        var oDur = Number(el && el.dataset && el.dataset.revealOpacity);
        if (!isFinite(oDur)) oDur = cfg.oDur || 1.05;
        var ease = cfg.ease || 'power3.out';

        function reset() {
            w.gsap.killTweensOf(el);
            w.gsap.set(el, { y: dist, autoAlpha: 0 });
        }

        function play() {
            w.gsap.killTweensOf(el);
            var tl = w.gsap.timeline();
            tl.to(el, { y: 0, duration: yDur, ease: ease }, 0);
            tl.to(el, { autoAlpha: 1, duration: oDur, ease: ease }, 0);
        }

        reset();
        bindRepeatPlay(el, start, play);
        bindRepeatReset(el, reset);
    }

    function makeGroup(group) {
        if (bound(group)) return;

        var $group = $(group);
        var $items = $group.find(CHILD_SELECTOR);
        if (!$items.length) return;

        var $splitTargets = $group.find('.split-text');
        $splitTargets.each(function () { splitCharsOnce($(this)); });

        var $descEl = $splitTargets.eq(0);
        var $headEl = $splitTargets.eq(1);

        var start = $group.data('revealStart') || 'top 70%';
        var duration = Number($group.data('revealDuration'));
        if (!isFinite(duration) || duration <= 0) duration = GROUP_DEFAULT_DURATION;
        var opacityDuration = duration + GROUP_OPACITY_PAD;
        var stagger = Number($group.data('revealStagger'));
        if (!isFinite(stagger) || stagger < 0) stagger = 0.3;
        var offsetY = Number($group.data('revealY'));
        if (!isFinite(offsetY)) offsetY = 60;

        function reset() {
            w.gsap.killTweensOf($items);
            w.gsap.set($items, { y: offsetY, autoAlpha: 0 });
            clearSplitTimers($group);
            $group.find('.char').removeClass('is-in');
        }

        function play() {
            var tl = w.gsap.timeline();
            tl.to($items, {
                y: 0,
                duration: duration,
                ease: 'power3.out',
                stagger: stagger
            }, 0);
            tl.to($items, {
                autoAlpha: 1,
                duration: opacityDuration,
                ease: 'power3.out',
                stagger: stagger
            }, 0);

            if ($splitTargets.length === 0) return;
            clearSplitTimers($group);
            var timers = null;
            if ($splitTargets.length === 1) {
                timers = playSplitSequence($descEl, $descEl);
            } else {
                timers = playSplitSequence($descEl, $headEl);
            }
            if (timers && timers.length) $group.data('splitTimers', timers);
        }

        reset();
        bindRepeatPlay(group, start, play);
        bindRepeatReset(group, reset);
    }

    function makeHSingle(el, dir) {
        if (bound(el)) return;
        var dist = Number(el && el.dataset && el.dataset.distance) || 160;
        var dur = Number(el && el.dataset && el.dataset.duration) || 0.9;

        function reset() {
            w.gsap.killTweensOf(el);
            w.gsap.set(el, { x: dist * dir, autoAlpha: 0 });
        }

        function play() {
            w.gsap.to(el, {
                x: 0,
                autoAlpha: 1,
                duration: dur,
                ease: 'power2.out',
                clearProps: 'transform,opacity'
            });
        }

        reset();
        bindRepeatPlay(el, 'top 80%', play);
        bindRepeatReset(el, reset);
    }

    function makeZoomWide(el) {
        if (bound(el)) return;

        var fromClip = 'polygon(15% 0%, 85% 0%, 85% 100%, 15% 100%)';
        var toClip = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';

        w.gsap.set(el, {
            clipPath: fromClip,
            overflow: 'hidden',
            css: { '-webkit-clip-path': fromClip }
        });

        var tl = w.gsap.timeline({ paused: true });
        tl.to(el, {
            clipPath: toClip,
            ease: 'none',
            duration: 1,
            css: { '-webkit-clip-path': toClip }
        }, 0);

        w.ScrollTrigger.create({
            trigger: el,
            scroller: scroller(),
            start: 'top 85%',
            end: 'top center',
            scrub: 1.2,
            animation: tl
        });

        w.ScrollTrigger.create({
            trigger: el,
            scroller: scroller(),
            start: 'top center',
            end: '+=1',
            toggleActions: 'play none none reverse',
            onEnter: function () { el.classList.add('is-zoomed'); },
            onEnterBack: function () { el.classList.add('is-zoomed'); },
            onLeaveBack: function () { el.classList.remove('is-zoomed'); }
        });
    }

    function makeZoomImg(el) {
        if (bound(el)) return;
        var img = el.querySelector('img, picture img');
        if (!img) return;

        var scaleTo = Number(el && el.dataset && el.dataset.scale) || 1.4;
        var startPos = (el && el.dataset && el.dataset.start) || 'top 75%';
        var endPos = (el && el.dataset && el.dataset.end) || 'top 35%';

        w.gsap.set(img, { scale: 1, transformOrigin: 'center center', willChange: 'transform' });
        var tween = w.gsap.to(img, { scale: scaleTo, ease: 'none', paused: true });

        w.ScrollTrigger.create({
            trigger: el,
            scroller: scroller(),
            start: startPos,
            end: endPos,
            scrub: 0.8,
            animation: tween
        });
    }

    function makeFade(el) {
        if (bound(el)) return;
        function reset() {
            w.gsap.killTweensOf(el);
            w.gsap.set(el, { autoAlpha: 0 });
        }

        function play() {
            w.gsap.to(el, {
                autoAlpha: 1,
                duration: 0.8,
                ease: 'power3.out',
                clearProps: 'opacity,visibility'
            });
        }

        reset();
        bindRepeatPlay(el, 'top 50%', play);
        bindRepeatReset(el, reset);
    }

    function makeWipe(el) {
        if (bound(el)) return;

        var fromClip = 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)';
        var toClip = 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)';

        var isVoid = /^(AREA|BASE|BR|COL|EMBED|HR|IMG|INPUT|LINK|META|PARAM|SOURCE|TRACK|WBR)$/i.test(el.tagName);
        var sheen = null;
        var scrubAttr = el && el.dataset && el.dataset.revealScrub;
        var isScrub = scrubAttr === '' || scrubAttr === '1' || scrubAttr === 'true';
        var start = (el && el.dataset && el.dataset.revealStart) || (isScrub ? 'top bottom' : 'top 80%');
        var end = (el && el.dataset && el.dataset.revealEnd) || (isScrub ? 'bottom top' : 'bottom 20%');

        if (!isVoid) {
            sheen = el.querySelector('.reveal-sheen');
            if (!sheen) {
                sheen = d.createElement('span');
                sheen.className = 'reveal-sheen';
                sheen.setAttribute('aria-hidden', 'true');
                el.appendChild(sheen);
            }
        }

        if (w.getComputedStyle(el).position === 'static') {
            el.style.position = 'relative';
        }

        function reset() {
            w.gsap.killTweensOf(el.style);
            setAutoAlpha(el, 0.01);
            setClip(el, fromClip);
            if (sheen) {
                sheen.style.opacity = '0';
                sheen.style.transform = 'translateY(140%)';
            }
        }

        setAutoAlpha(el, isScrub ? 1 : 0.01);
        setClip(el, fromClip);

        if (sheen) {
            sheen.style.position = 'absolute';
            sheen.style.left = '-12%';
            sheen.style.right = '-12%';
            sheen.style.height = '16%';
            sheen.style.top = '0';
            sheen.style.pointerEvents = 'none';
            sheen.style.opacity = '0';
            sheen.style.transform = 'translateY(140%)';
            sheen.style.background = 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)';
            sheen.style.mixBlendMode = 'screen';
            sheen.style.filter = 'blur(0.6px)';
        }

        var delay = Number(el && el.dataset && el.dataset.revealDelay);
        if (!isFinite(delay) || delay < 0) delay = 0;

        function play() {
            var tl = w.gsap.timeline({ defaults: { ease: 'power2.out' } });
            var startAt = delay;
            tl.to(el.style, {
                clipPath: toClip,
                duration: 1.25,
                onUpdate: function () { syncClip(el); }
            }, startAt);
            tl.to(el.style, {
                opacity: 1,
                duration: 0.9,
                onStart: function () { el.style.visibility = 'visible'; }
            }, startAt + 0.05);

            if (sheen) {
                tl.to(sheen, { opacity: 0.38, duration: 0.25 }, startAt + 0.1);
                tl.to(sheen, { y: '-160%', duration: 1.25 }, startAt + 0.1);
                tl.to(sheen, { opacity: 0, duration: 0.3 }, startAt + 0.72);
            }
        }

        if (isScrub) {
            var scrubTl = w.gsap.timeline({ paused: true });
            scrubTl.to(el.style, {
                clipPath: toClip,
                duration: 1,
                ease: 'none',
                onUpdate: function () { syncClip(el); }
            }, 0);
            w.ScrollTrigger.create({
                trigger: el,
                scroller: scroller(),
                start: start,
                end: end,
                scrub: 0.9,
                animation: scrubTl
            });
            return;
        }

        reset();
        bindRepeatPlay(el, start, play);
        bindRepeatReset(el, reset);
    }

    function makeWipeDown(el) {
        if (bound(el)) return;

        var isVoid = /^(AREA|BASE|BR|COL|EMBED|HR|IMG|INPUT|LINK|META|PARAM|SOURCE|TRACK|WBR)$/i.test(el.tagName);
        var sheen = null;
        var fromClip = 'polygon(0 0, 100% 0, 100% 0, 0 0)';
        var toClip = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
        var delay = Number(el && el.dataset && el.dataset.revealDelay);
        if (!isFinite(delay) || delay < 0) delay = 0;

        if (!isVoid) {
            sheen = el.querySelector('.reveal-sheen');
            if (!sheen) {
                sheen = d.createElement('span');
                sheen.className = 'reveal-sheen';
                sheen.setAttribute('aria-hidden', 'true');
                el.appendChild(sheen);
            }
        }

        if (w.getComputedStyle(el).position === 'static') {
            el.style.position = 'relative';
        }

        function reset() {
            w.gsap.killTweensOf(el.style);
            setAutoAlpha(el, 0);
            setClip(el, fromClip);
            if (sheen) {
                sheen.style.opacity = '0';
                sheen.style.transform = 'translateY(-140%)';
            }
        }

        setAutoAlpha(el, 0);
        setClip(el, fromClip);

        if (sheen) {
            sheen.style.position = 'absolute';
            sheen.style.left = '-12%';
            sheen.style.right = '-12%';
            sheen.style.height = '16%';
            sheen.style.top = '0';
            sheen.style.pointerEvents = 'none';
            sheen.style.opacity = '0';
            sheen.style.transform = 'translateY(-140%)';
            sheen.style.background = 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)';
            sheen.style.mixBlendMode = 'screen';
            sheen.style.filter = 'blur(0.6px)';
        }

        function play() {
            var tl = w.gsap.timeline({ defaults: { ease: 'power2.out' } });
            var startAt = delay;
            tl.to(el.style, {
                clipPath: toClip,
                duration: 2.0,
                onUpdate: function () { syncClip(el); }
            }, startAt);
            tl.to(el.style, {
                opacity: 1,
                duration: 1.4,
                onStart: function () { el.style.visibility = 'visible'; }
            }, startAt + 0.08);

            if (sheen) {
                tl.to(sheen, { opacity: 0.32, duration: 0.4 }, startAt + 0.16);
                tl.to(sheen, { y: '160%', duration: 2.0 }, startAt + 0.16);
                tl.to(sheen, { opacity: 0, duration: 0.4 }, startAt + 1.2);
            }
        }

        reset();
        bindRepeatPlay(el, 'top 80%', play);
        bindRepeatReset(el, reset);
    }

    function makeInk(el) {
        var bar = el.querySelector('.hl-ink-bar');
        if (!bar) {
            bar = d.createElement('span');
            bar.className = 'hl-ink-bar';
            var color = el.getAttribute('data-color');
            if (color) bar.style.background = color;
            el.appendChild(bar);
        }

        function reset() {
            w.gsap.killTweensOf(bar);
            w.gsap.set(bar, { scaleX: 0.05, skewX: -10, transformOrigin: '0 50%' });
        }

        function play() {
            w.gsap.to(bar, {
                delay: Number(el.getAttribute('data-delay') || 0.18),
                duration: Number(el.getAttribute('data-duration') || 0.55),
                ease: 'power2.out',
                scaleX: 1,
                skewX: -2
            });
        }

        reset();
        bindRepeatPlay(el, 'top 85%', play);
        bindRepeatReset(el, reset);
    }

    function splitCharsOnce($el) {
        if ($el.data('splitDone')) return;
        $el.data('splitDone', 1);
        var raw = $el.text().replace(/\s+/g, ' ').trim();
        var html = '';
        for (var i = 0; i < raw.length; i++) {
            var ch = raw[i] === ' ' ? '&nbsp;' : raw[i];
            html += '<span class="char">' + ch + '</span>';
        }
        $el.html(html);
    }

    function clearSplitTimers($group) {
        if (!$group || !$group.length) return;
        var timers = $group.data('splitTimers');
        if (timers && timers.length) {
            timers.forEach(function (id) { clearTimeout(id); });
        }
        $group.removeData('splitTimers');
    }

    function playSplitSequence($descEl, $headEl) {
        var $descChars = $descEl.find('.char');
        var $headChars = $headEl.find('.char');
        var perChar = 25;
        var gapNext = 120;
        var timers = [];

        $descChars.each(function (i) {
            var $c = $(this);
            timers.push(setTimeout(function () { $c.addClass('is-in'); }, i * perChar));
        });

        var baseDelay = ($descChars.length * perChar) + gapNext;
        $headChars.each(function (i) {
            var $c = $(this);
            timers.push(setTimeout(function () { $c.addClass('is-in'); }, baseDelay + i * perChar));
        });

        return timers;
    }

    function isTouchDevice() {
        return ('ontouchstart' in w)
            || (w.navigator && w.navigator.maxTouchPoints > 0)
            || (w.matchMedia && w.matchMedia('(pointer: coarse)').matches);
    }

    function bindTouchUpdate() {
        if (touchUpdateBound) return;
        if (!isTouchDevice()) return;
        if (w.matchMedia && !w.matchMedia('(max-width: 1024px)').matches) return;
        if (!w.ScrollTrigger) return;
        touchUpdateBound = true;

        var ticking = false;
        var refreshTimer = 0;
        var schedule = function () {
            if (ticking) return;
            ticking = true;
            w.requestAnimationFrame(function () {
                ticking = false;
                if (w.ScrollTrigger) w.ScrollTrigger.update();
            });
        };
        var scheduleRefresh = function (delay) {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
                refreshTimer = 0;
            }
            refreshTimer = setTimeout(function () {
                refreshTimer = 0;
                if (!w.ScrollTrigger) return;
                w.ScrollTrigger.refresh();
                w.ScrollTrigger.update();
            }, delay || 80);
        };

        w.addEventListener('touchstart', schedule, { passive: true });
        w.addEventListener('touchmove', schedule, { passive: true });
        w.addEventListener('touchend', function () {
            schedule();
            scheduleRefresh(80);
        }, { passive: true });
        w.addEventListener('touchcancel', function () {
            schedule();
            scheduleRefresh(80);
        }, { passive: true });
        w.addEventListener('pointerdown', schedule, { passive: true });
        w.addEventListener('pointermove', schedule, { passive: true });
        w.addEventListener('pointerup', function () {
            schedule();
            scheduleRefresh(80);
        }, { passive: true });
        w.addEventListener('pointercancel', function () {
            schedule();
            scheduleRefresh(80);
        }, { passive: true });
        w.addEventListener('orientationchange', function () {
            schedule();
            scheduleRefresh(140);
        }, { passive: true });
        if (w.scrollInstance && typeof w.scrollInstance.on === 'function') {
            w.scrollInstance.on('scroll', schedule);
        }
        schedule();
        scheduleRefresh(0);
    }

    function revealInit() {
        if (isReduce && !$('body').data('revealForce')) return;
        if (!hasGsap()) return;
        if (w.gsap && w.ScrollTrigger) {
            w.gsap.registerPlugin(w.ScrollTrigger);
        }
        bindTouchUpdate();

        SINGLE_PRESETS.forEach(function (preset) {
            $(preset.selector).each(function (_, el) { makeSingle(el, preset); });
        });
        $(SELECTOR_GROUP).each(function (_, el) { makeGroup(el); });
        $(SELECTOR_LEFT).each(function (_, el) { makeHSingle(el, -1); });
        $(SELECTOR_RIGHT).each(function (_, el) { makeHSingle(el, 1); });
        $(SELECTOR_ZOOMWIDE).each(function (_, el) { makeZoomWide(el); });
        $(SELECTOR_FADE).each(function (_, el) { makeFade(el); });
        $(SELECTOR_WIPE).each(function (_, el) { makeWipe(el); });
        $(SELECTOR_WIPE_DOWN).each(function (_, el) { makeWipeDown(el); });
        $(SELECTOR_ZOOMIMG).each(function (_, el) { makeZoomImg(el); });
        $(SELECTOR_INK).each(function (_, el) { makeInk(el); });
    }

    w.Reveal = {
        init: revealInit,
        refresh: function () {
            if (w.ScrollTrigger) w.ScrollTrigger.refresh();
            if (w.scrollInstance && typeof w.scrollInstance.update === 'function') {
                w.scrollInstance.update();
            }
        }
    };
})(window, document);
