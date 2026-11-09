/* 
---------------------------------------------
    Animation + Interaction Effects
---------------------------------------------
Usage (add classes):
  - .fx-follow: hover follow text (children .tab)
  - .tilt-glare: hover tilt + glare (data-rx, data-ry, data-tint)
*/
(function (w, d) {
    'use strict';

    if (!w || !d) return;

    var FOLLOW_SELECTOR = '.fx-follow';
    var TAB_SELECTOR = '.tab';

    function toNumber(value, fallback) {
        var n = parseFloat(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function parseColor(value) {
        if (!value) return [0, 0, 0];
        var v = value.trim();
        if (/^#/.test(v)) {
            var hex = v.slice(1);
            if (hex.length === 3) {
                hex = hex.split('').map(function (c) { return c + c; }).join('');
            }
            if (hex.length === 6) {
                return [
                    parseInt(hex.slice(0, 2), 16),
                    parseInt(hex.slice(2, 4), 16),
                    parseInt(hex.slice(4, 6), 16)
                ];
            }
        }
        if (/^rgb/i.test(v)) {
            var m = (v.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
            if (m.length === 3) return m;
        }
        return [0, 0, 0];
    }

    function mixColor(a, b, t) {
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t)
        ];
    }

    function initFollow(root) {
        var scope = root && root.nodeType === 1 ? root : d;
        var list = scope.querySelectorAll(FOLLOW_SELECTOR);
        if (!list.length) return;
        list.forEach(function (tabs) {
            if (!tabs) return;
            var indicator = tabs.querySelector('.tab-indicator');
            if (tabs.dataset.followInit === '1' && indicator) return;

            var items = Array.prototype.slice.call(tabs.querySelectorAll(TAB_SELECTOR));
            if (!items.length) return;

            tabs.dataset.followInit = '1';

            if (!indicator) {
                indicator = d.createElement('span');
                indicator.className = 'tab-indicator';
                indicator.setAttribute('aria-hidden', 'true');
                tabs.appendChild(indicator);
            }

            var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var styles = w.getComputedStyle ? w.getComputedStyle(tabs) : null;
            var padX = toNumber(
                tabs.dataset.followPadX,
                toNumber(styles && styles.getPropertyValue('--tab-indicator-pad-x'), 12)
            );
            var padY = toNumber(
                tabs.dataset.followPadY,
                toNumber(styles && styles.getPropertyValue('--tab-indicator-pad-y'), 6)
            );
            var lerp = clamp(toNumber(tabs.dataset.followLerp, 0.18), 0.05, 0.45);
            var fromColor = parseColor(
                (styles && styles.getPropertyValue('--fx-follow-from')) || (styles && styles.getPropertyValue('--black-900'))
            );
            var toColor = parseColor(
                (styles && styles.getPropertyValue('--fx-follow-to')) || (styles && styles.getPropertyValue('--black-800'))
            );

            var current = { x: 0, y: 0, w: 0, h: 0 };
            var target = { x: 0, y: 0, w: 0, h: 0 };
            var rafId = 0;

            function readRect(el) {
                return {
                    x: el.offsetLeft,
                    y: el.offsetTop,
                    w: el.offsetWidth,
                    h: el.offsetHeight
                };
            }

            function apply(rect) {
                var x = rect.x - padX;
                var y = rect.y - padY;
                var w = rect.w + padX * 2;
                var h = rect.h + padY * 2;
                indicator.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
                indicator.style.width = w + 'px';
                indicator.style.height = h + 'px';
            }

            function updateProgress(rect) {
                var max = Math.max(1, tabs.scrollWidth - rect.w);
                var progress = max > 0 ? rect.x / max : 0;
                var t = clamp(progress, 0, 1);
                tabs.style.setProperty('--tab-progress', t.toFixed(4));
                if (fromColor && toColor) {
                    var mixed = mixColor(fromColor, toColor, t);
                    tabs.style.setProperty('--fx-follow-color', 'rgb(' + mixed[0] + ',' + mixed[1] + ',' + mixed[2] + ')');
                }
            }

            function setTarget(el, immediate) {
                if (!el) return;
                target = readRect(el);
                if (reduce || immediate) {
                    current = { x: target.x, y: target.y, w: target.w, h: target.h };
                    apply(current);
                    updateProgress(current);
                    if (rafId) {
                        w.cancelAnimationFrame(rafId);
                        rafId = 0;
                    }
                    return;
                }
                if (!rafId) rafId = w.requestAnimationFrame(tick);
            }

            function tick() {
                current.x += (target.x - current.x) * lerp;
                current.y += (target.y - current.y) * lerp;
                current.w += (target.w - current.w) * lerp;
                current.h += (target.h - current.h) * lerp;
                apply(current);
                updateProgress(current);
                var done =
                    Math.abs(target.x - current.x) < 0.5
                    && Math.abs(target.y - current.y) < 0.5
                    && Math.abs(target.w - current.w) < 0.5
                    && Math.abs(target.h - current.h) < 0.5;
                if (done) {
                    current = { x: target.x, y: target.y, w: target.w, h: target.h };
                    apply(current);
                    updateProgress(current);
                    rafId = 0;
                    return;
                }
                rafId = w.requestAnimationFrame(tick);
            }

            var active = tabs.querySelector('.tab.is-active, .tab[aria-current="page"]') || items[0];

            function setFollowed(el) {
                items.forEach(function (item) {
                    item.classList.toggle('is-followed', item === el);
                });
            }

            function clearFollowed() {
                items.forEach(function (item) {
                    item.classList.remove('is-followed');
                });
            }

            setTarget(active, true);
            tabs.classList.add('is-follow-ready');

            items.forEach(function (item) {
                item.addEventListener('mouseenter', function () {
                    setTarget(item);
                    setFollowed(item);
                });
                item.addEventListener('focus', function () {
                    setTarget(item);
                    setFollowed(item);
                });
            });

            tabs.addEventListener('mouseleave', function () {
                setTarget(active);
                clearFollowed();
            });
            tabs.addEventListener('focusout', function () {
                if (!tabs.contains(d.activeElement)) {
                    setTarget(active);
                    clearFollowed();
                }
            });
            tabs.addEventListener('tabs:refresh', function () {
                active = tabs.querySelector('.tab.is-active, .tab[aria-current="page"]') || items[0];
                setTarget(active, true);
                clearFollowed();
            });

            w.addEventListener('resize', function () {
                setTarget(active, true);
            }, { passive: true });
        });
    }

    w.MotionEffects = w.MotionEffects || {};
    w.MotionEffects.follow = initFollow;
})(window, document);

/* ===== Tilt + Glare ===== */
(function (w) {
    'use strict';
    if (!w.jQuery) return;
    var $ = w.jQuery;
    var doc = w.document;

    function hexToRgb(str) {
        if (!str) return [255, 255, 255];
        if (/^rgb/i.test(str)) {
            var m = (str.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
            return (m.length === 3 ? m : [255, 255, 255]);
        }
        var c = str.replace('#', '').trim();
        if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
        if (c.length !== 6) return [255, 255, 255];
        var n = parseInt(c, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function bind($el) {
        if ($el.data('tgBound')) return;
        $el.data('tgBound', 1);
        if (!$el.attr('tabindex')) $el.attr('tabindex', '0');

        var $g = $el.children('.tg-glare');
        if (!$g.length) $g = $('<span class="tg-glare" aria-hidden="true"></span>').appendTo($el);

        var tint = $el.data('tint');
        if (tint) {
            var rgb = hexToRgb(tint);
            $g.css('background', 'radial-gradient(90px 90px at center, rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.35), transparent 60%)');
        }

        var RX = Number($el.data('rx')) || 6;
        var RY = Number($el.data('ry')) || 8;
        var tiltFlag = $el.data('tilt');
        var noTilt = tiltFlag === false
            || tiltFlag === 0
            || tiltFlag === '0'
            || tiltFlag === 'false'
            || tiltFlag === 'off'
            || (RX === 0 && RY === 0);
        var ax = 0, ay = 0, gx = -9999, gy = -9999, raf = 0, active = false;
        var mouse = { x: 0, y: 0 };
        var hasMouse = false;

        function setMouse(e) {
            if (!e) return;
            if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            hasMouse = true;
        }

        function ensureMouse(r) {
            if (hasMouse) return;
            mouse.x = r.left + r.width * 0.5;
            mouse.y = r.top + r.height * 0.5;
        }

        function loop() {
            if (!active) return;
            var r = $el[0].getBoundingClientRect();
            ensureMouse(r);
            var px = mouse.x - r.left;
            var py = mouse.y - r.top;
            var nx = (px / r.width) - 0.5;
            var ny = (py / r.height) - 0.5;

            var tx = -ny * RX;
            var ty = nx * RY;

            ax += (tx - ax) * 0.22;
            ay += (ty - ay) * 0.22;

            if (!noTilt) {
                $el[0].style.transform = 'translateZ(0) rotateX(' + ax + 'deg) rotateY(' + ay + 'deg)';
            } else {
                $el[0].style.transform = 'translateZ(0)';
            }

            var tgx = px - 80;
            var tgy = py - 80;
            gx += (tgx - gx) * 0.25;
            gy += (tgy - gy) * 0.25;
            $g[0].style.transform = 'translate(' + gx + 'px,' + gy + 'px)';

            raf = w.requestAnimationFrame(loop);
        }

        $el.on('mousemove.tg', function (e) {
            setMouse(e);
        });
        $el.on('mouseenter.tg focusin.tg', function (e) {
            setMouse(e);
            active = true;
            w.cancelAnimationFrame(raf);
            raf = w.requestAnimationFrame(loop);
        });
        $el.on('mouseleave.tg focusout.tg', function () {
            active = false;
            w.cancelAnimationFrame(raf);
            ax = ay = 0;
            hasMouse = false;
            $el[0].style.transform = 'translateZ(0)';
        });
    }

    function tiltInit(root) {
        var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var isTouch = w.matchMedia && w.matchMedia('(pointer: coarse)').matches;
        if (reduce || isTouch) return;

        (root ? $(root) : $(doc)).find('.tilt-glare').each(function () {
            bind($(this));
        });
    }

    w.MotionEffects = w.MotionEffects || {};
    w.MotionEffects.tiltGlare = tiltInit;
    w.TiltGlareInit = tiltInit;
})(window);

/* ===== Motion Effects ===== */
(function (w, d) {
    'use strict';
    if (!w || !d) return;

    function init(root) {
        w.MotionEffects?.follow?.(root);
        w.MotionEffects?.tiltGlare?.(root);
    }

    w.MotionEffects = w.MotionEffects || {};
    w.MotionEffects.init = init;

    if (d.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', function () {
            w.MotionEffects?.init?.();
        });
    } else {
        w.MotionEffects?.init?.();
    }
})(window, document);
