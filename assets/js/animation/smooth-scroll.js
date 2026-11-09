(function (w, d) {
    'use strict';

    // Reduced motion check
    function prefersReducedMotion() {
        return !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    // Scroll root selection
    function getScrollRoot() {
        var cfg = w.SancSmoothScrollConfig || {};
        var scroller = cfg.scroller;
        var doc = d.documentElement;
        var body = d.body;
        var fallback = d.scrollingElement || doc || body;
        var root = null;

        if (typeof scroller === 'string') {
            root = d.querySelector(scroller);
        } else if (scroller && scroller.nodeType === 1) {
            root = scroller;
        }

        if (!root) {
            if (doc && body) {
                var docScroll = (doc.scrollHeight || 0) - (doc.clientHeight || 0);
                var bodyScroll = (body.scrollHeight || 0) - (body.clientHeight || 0);
                root = bodyScroll > docScroll ? body : doc;
            } else {
                root = fallback;
            }
        }

        if (root && root !== fallback) {
            var scrollable = (root.scrollHeight || 0) > (root.clientHeight || 0) + 1;
            if (!scrollable) {
                root = fallback;
            }
        }

        return root || fallback;
    }

    // Scroll metrics helpers
    function getScrollY() {
        var root = getScrollRoot();
        if (root) return root.scrollTop || 0;
        return w.scrollY || 0;
    }

    function getScrollHeight() {
        var root = getScrollRoot();
        if (root && root.scrollHeight) return root.scrollHeight;
        var doc = d.documentElement;
        var body = d.body;
        var docH = doc ? doc.scrollHeight : 0;
        var bodyH = body ? body.scrollHeight : 0;
        return Math.max(docH, bodyH);
    }

    function getClientHeight() {
        var root = getScrollRoot();
        if (root && root.clientHeight) return root.clientHeight;
        return w.innerHeight || 0;
    }

    // Utility clamp helper
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // Duration normalization
    function normalizeDuration(duration) {
        if (typeof duration !== 'number' || !isFinite(duration)) return 0;
        if (duration <= 0) return 0;
        return duration < 10 ? duration * 1000 : duration;
    }

    // Target resolution helper
    function resolveTarget(target, offset) {
        var root = getScrollRoot();
        var rootTop = 0;
        if (root && root.getBoundingClientRect) {
            rootTop = root.getBoundingClientRect().top || 0;
        }
        if (typeof target === 'number' && isFinite(target)) return target + offset;
        if (typeof target === 'string') {
            var el = d.querySelector(target);
            if (el) {
                return (el.getBoundingClientRect().top - rootTop) + getScrollY() + offset;
            }
            return offset;
        }
        if (target && target.nodeType === 1) {
            return (target.getBoundingClientRect().top - rootTop) + getScrollY() + offset;
        }
        return offset;
    }

    // Scrollable parent lookup
    function findScrollableParent(el) {
        var root = getScrollRoot();
        var node = el;
        while (node && node !== d.body && node !== d.documentElement) {
            var style = w.getComputedStyle(node);
            var overflowY = style ? style.overflowY : '';
            var canScroll = (overflowY === 'auto' || overflowY === 'scroll')
                && node.scrollHeight > node.clientHeight + 1;
            if (canScroll && node !== root) return node;
            node = node.parentElement;
        }
        return null;
    }

    // Scrollability check
    function canScroll(node, deltaY) {
        if (!node) return false;
        if (deltaY < 0) return node.scrollTop > 0;
        if (deltaY > 0) return node.scrollTop < node.scrollHeight - node.clientHeight - 1;
        return false;
    }

    // Wheel delta normalize
    function normalizeWheelDelta(e) {
        var delta = e.deltaY;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return 0;
        if (!delta) return 0;
        if (e.deltaMode === 1) delta *= 16;
        if (e.deltaMode === 2) delta *= getClientHeight();
        return delta;
    }

    // Ease curve helper
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Smooth instance creator
    function createInstance() {
        var listeners = new Set();
        var reduceMotion = prefersReducedMotion();
        var config = w.SancSmoothScrollConfig || {};
        var respectReducedMotion = config.respectReducedMotion !== false;
        if (config.force === true || !respectReducedMotion) {
            reduceMotion = false;
        }
        var lerp = typeof config.lerp === 'number' ? config.lerp : 0.06;
        var wheelMultiplier = typeof config.wheelMultiplier === 'number' ? config.wheelMultiplier : 1;
        var mode = (config.mode === 'inertia') ? 'inertia' : 'lerp';
        var friction = typeof config.friction === 'number' ? config.friction : 0.92;
        var maxVelocity = typeof config.maxVelocity === 'number' ? config.maxVelocity : 120;
        lerp = clamp(lerp, 0.02, 0.3);
        friction = clamp(friction, 0.75, 0.99);
        maxVelocity = Math.max(20, maxVelocity);

        var currentY = getScrollY();
        var targetY = currentY;
        var maxScroll = Math.max(0, getScrollHeight() - getClientHeight());
        var rafId = null;
        var isRunning = true;
        var isAnimating = false;
        var activeTween = null;
        var velocity = 0;
        var lastEmittedY = NaN;

        // Scroll event emit
        function emit(y) {
            if (Number.isFinite(lastEmittedY) && Math.abs(lastEmittedY - y) < 0.1) return;
            lastEmittedY = y;
            instance.scroll.instance.scroll.y = y;
            listeners.forEach(function (fn) { fn({ scroll: { y: y } }); });
        }

        // Scroll bounds sync
        function syncMax() {
            maxScroll = Math.max(0, getScrollHeight() - getClientHeight());
        }

        // Apply scroll position
        function setScroll(y) {
            var next = clamp(y, 0, maxScroll);
            var root = getScrollRoot();
            if (root) root.scrollTop = next;
            if (root === d.documentElement || root === d.body || root === d.scrollingElement) {
                if (w.scrollTo) w.scrollTo(0, next);
            }
        }

        // Animation loop start
        function startLoop() {
            if (rafId !== null) return;
            rafId = w.requestAnimationFrame(loop);
        }

        // Animation loop stop
        function stopLoop() {
            if (rafId === null) return;
            w.cancelAnimationFrame(rafId);
            rafId = null;
        }

        // Main animation loop
        function loop(now) {
            rafId = w.requestAnimationFrame(loop);
            if (!isRunning) return;

            var next = null;
            if (activeTween) {
                var t = clamp((now - activeTween.startTime) / activeTween.duration, 0, 1);
                var eased = activeTween.ease(t);
                next = activeTween.startY + (activeTween.endY - activeTween.startY) * eased;
                if (t >= 1) {
                    activeTween = null;
                    isAnimating = false;
                    targetY = next;
                }
            } else if (mode === 'inertia') {
                if (Math.abs(velocity) < 0.06) {
                    velocity = 0;
                    next = null;
                } else {
                    if (Math.abs(velocity) > maxVelocity) {
                        velocity = maxVelocity * Math.sign(velocity);
                    }
                    next = currentY + velocity;
                    velocity *= friction;
                    if (Math.abs(velocity) < 0.06) velocity = 0;
                    if (next < 0 || next > maxScroll) {
                        next = clamp(next, 0, maxScroll);
                        velocity = 0;
                    }
                }
            } else if (isAnimating) {
                var diff = targetY - currentY;
                if (Math.abs(diff) <= 0.5) {
                    next = targetY;
                    isAnimating = false;
                } else {
                    next = currentY + diff * lerp;
                }
            }

            if (next === null) {
                stopLoop();
                return;
            }

            currentY = next;
            setScroll(next);
            emit(next);
        }

        // Wheel input handler
        function onWheel(e) {
            if (!isRunning || reduceMotion) return;
            if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;

            var scrollParent = findScrollableParent(e.target);
            if (scrollParent && canScroll(scrollParent, e.deltaY)) return;

            syncMax();
            if (maxScroll <= 0) return;

            var delta = normalizeWheelDelta(e);
            if (!delta) return;

            if ((currentY <= 0 && delta < 0) || (currentY >= maxScroll && delta > 0)) return;

            e.preventDefault();
            activeTween = null;
            if (mode === 'inertia') {
                velocity = clamp(velocity + delta * wheelMultiplier, -maxVelocity, maxVelocity);
            } else {
                var nextTarget = clamp(targetY + delta * wheelMultiplier, 0, maxScroll);
                if (nextTarget === targetY) return;
                targetY = nextTarget;
                isAnimating = true;
            }
            startLoop();
        }

        // Native scroll sync
        function onScroll() {
            var y = getScrollY();
            currentY = y;
            if (!isAnimating && !activeTween) targetY = y;
            emit(y);
        }

        // Resize sync handler
        function onResize() {
            syncMax();
            targetY = clamp(targetY, 0, maxScroll);
            currentY = clamp(currentY, 0, maxScroll);
        }

        // Programmatic scrollTo
        function scrollTo(target, opts) {
            var options = opts || {};
            var offset = typeof options.offset === 'number' ? options.offset : 0;
            var dest = resolveTarget(target, offset);
            syncMax();
            dest = clamp(dest, 0, maxScroll);

            var duration = normalizeDuration(options.duration);
            if (reduceMotion || options.disableLerp || duration === 0) {
                activeTween = null;
                isAnimating = false;
                velocity = 0;
                targetY = dest;
                currentY = dest;
                setScroll(dest);
                emit(dest);
                return;
            }

            activeTween = {
                startY: getScrollY(),
                endY: dest,
                startTime: w.performance ? w.performance.now() : Date.now(),
                duration: duration,
                ease: typeof options.ease === 'function' ? options.ease : easeOutCubic
            };
            isAnimating = false;
            velocity = 0;
            targetY = dest;
            startLoop();
        }

        // Public update hook
        function update() {
            syncMax();
            onScroll();
        }

        // Public stop hook
        function stop() {
            isRunning = false;
            activeTween = null;
            isAnimating = false;
            velocity = 0;
            stopLoop();
        }

        // Public start hook
        function start() {
            if (isRunning) return;
            isRunning = true;
            currentY = getScrollY();
            targetY = currentY;
            velocity = 0;
            startLoop();
        }

        // Instance public API
        var instance = {
            __isLoco: false,
            __isSmooth: !reduceMotion,
            scroll: { instance: { scroll: { y: currentY } } },
            on: function (event, fn) {
                if (event !== 'scroll' || typeof fn !== 'function') return;
                listeners.add(fn);
            },
            off: function (event, fn) {
                if (event !== 'scroll' || typeof fn !== 'function') return;
                listeners.delete(fn);
            },
            scrollTo: scrollTo,
            update: update,
            stop: stop,
            start: start
        };

        // Input listeners bind
        d.addEventListener('wheel', onWheel, { passive: false, capture: true });
        var scrollRoot = getScrollRoot();
        if (scrollRoot && scrollRoot !== d.documentElement && scrollRoot !== d.body) {
            scrollRoot.addEventListener('scroll', onScroll, { passive: true });
        }
        w.addEventListener('scroll', onScroll, { passive: true });
        w.addEventListener('resize', onResize, { passive: true });
        w.addEventListener('load', onResize, { once: true });

        return instance;
    }

    // Public namespace export
    w.SancSmoothScroll = w.SancSmoothScroll || {};
    w.SancSmoothScroll.init = function () {
        if (w.__sancSmoothScrollInstance) return w.__sancSmoothScrollInstance;
        w.__sancSmoothScrollInstance = createInstance();
        w.scrollInstance = w.__sancSmoothScrollInstance;
        return w.__sancSmoothScrollInstance;
    };
})(window, document);
