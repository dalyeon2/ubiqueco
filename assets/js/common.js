/**
 * common.js
 * - Loads header/footer/subtop/cta components
 * - Smooth wheel scroll helper
 * - Header tone sync on scroll
 * - Subtop builder
 * - Scroll-to-top button
 */

// Keep page restoration consistent
window.scrollTo(0, 0);
window.addEventListener('pageshow', (e) => {
    if (e.persisted) requestAnimationFrame(() => window.scrollTo(0, 0));
});

/* ===== Global config ===== */
window.__snapOff = window.__snapOff || false;
window.__snapSetOff = window.__snapSetOff || function (v) { window.__snapOff = !!v; };
window.SancSmoothScrollConfig = window.SancSmoothScrollConfig || {};
const __isMainLanding = (() => {
    const body = document.body;
    if (body && body.dataset && body.dataset.page === 'main') return true;
    const path = (window.location && window.location.pathname ? window.location.pathname : '').toLowerCase();
    return path === '/' || path.endsWith('/index.html') || path.endsWith('/index.php');
})();
if (typeof window.SancSmoothScrollConfig.enabled !== 'boolean') {
    // Keep inertial smooth scrolling enabled by default.
    window.SancSmoothScrollConfig.enabled = true;
}
if (typeof window.SancSmoothScrollConfig.lerp !== 'number') {
    window.SancSmoothScrollConfig.lerp = __isMainLanding ? 0.028 : 0.03;
}
if (typeof window.SancSmoothScrollConfig.wheelMultiplier !== 'number') {
    window.SancSmoothScrollConfig.wheelMultiplier = __isMainLanding ? 0.05 : 0.06;
}
if (typeof window.SancSmoothScrollConfig.mode !== 'string') {
    window.SancSmoothScrollConfig.mode = 'inertia';
}
if (typeof window.SancSmoothScrollConfig.friction !== 'number') {
    window.SancSmoothScrollConfig.friction = __isMainLanding ? 0.95 : 0.94;
}
if (typeof window.SancSmoothScrollConfig.maxVelocity !== 'number') {
    window.SancSmoothScrollConfig.maxVelocity = __isMainLanding ? 72 : 80;
}
if (typeof window.SancSmoothScrollConfig.respectReducedMotion !== 'boolean') {
    window.SancSmoothScrollConfig.respectReducedMotion = false;
}
if (typeof window.SancSmoothScrollConfig.scroller === 'undefined') {
    window.SancSmoothScrollConfig.scroller = null;
}

/* ===== Script loader ===== */
const COMMON_SCRIPT_URL = (function () {
    const script = document.currentScript || document.querySelector('script[src*="assets/js/common.js"]');
    return script && script.src ? script.src : '';
})();

function resolveCommonAssetPath(relativePath) {
    if (!COMMON_SCRIPT_URL) return relativePath;
    try {
        return new URL(relativePath, COMMON_SCRIPT_URL).href;
    } catch (e) {
        return relativePath;
    }
}

const __commonScriptCache = new Map();
function loadCommonScriptOnce(src) {
    if (!src) return Promise.resolve();
    if (__commonScriptCache.has(src)) return __commonScriptCache.get(src);
    const promise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });
    __commonScriptCache.set(src, promise);
    return promise;
}

const __commonStyleCache = new Set();
function loadCommonStyleOnce(href) {
    if (!href) return;
    if (__commonStyleCache.has(href)) return;
    if (document.querySelector(`link[href="${href}"]`)) {
        __commonStyleCache.add(href);
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    __commonStyleCache.add(href);
}

function ensureFontAwesome() {
    loadCommonStyleOnce('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
}

async function ensureGsapCssPlugin() {
    if (!window.gsap) return;
    if (window.gsap.plugins && window.gsap.plugins.css) return;
    await loadCommonScriptOnce('https://unpkg.com/gsap@3.12.2/dist/gsap.min.js');
    if (window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
}

/* ===== Components loader ===== */
async function loadComponents() {
    try {
        const isEN = location.pathname.startsWith('/en/');
        const compDir = isEN ? 'en/components' : 'components';
        const pageHref = window.location.href;

        const buildComponentBases = () => {
            const roots = [];
            const pushRoot = (url) => {
                if (!url) return;
                roots.push(url);
            };

            // Primary: derive project root from common.js path (most reliable with URL rewriting)
            if (COMMON_SCRIPT_URL) {
                try { pushRoot(new URL('../../', COMMON_SCRIPT_URL).href); } catch (e) {}
                try { pushRoot(new URL('../../../', COMMON_SCRIPT_URL).href); } catch (e) {}
            }

            // Root-served environment
            if (window.location.origin && window.location.origin !== 'null') {
                pushRoot(`${window.location.origin}/`);
            }

            // Fallback: current page relative roots
            try { pushRoot(new URL('./', pageHref).href); } catch (e) {}
            try { pushRoot(new URL('../', pageHref).href); } catch (e) {}
            try { pushRoot(new URL('../../', pageHref).href); } catch (e) {}

            const baseSet = new Set();
            roots.forEach((root) => {
                if (!root) return;
                try {
                    const base = new URL(`${compDir}/`, root).href;
                    baseSet.add(base);
                } catch (e) {}
            });

            return Array.from(baseSet);
        };
        const componentBases = buildComponentBases();

        const fetchComponentText = async (filename) => {
            for (const base of componentBases) {
                try {
                    const res = await fetch(new URL(filename, base).href, { cache: 'no-store' });
                    if (!res.ok) continue;
                    return await res.text();
                } catch (e) {}
            }
            return '';
        };

        const hasSubtop = !!$('#subtop-container').length;
        const hasCta = !!$('#cta-container').length;

        const [headerHtml, footerHtml, subtopHtml, ctaHtml, privacyModalHtml] = await Promise.all([
            fetchComponentText('header.html'),
            fetchComponentText('footer.html'),
            hasSubtop ? fetchComponentText('sub-top.html') : Promise.resolve(''),
            hasCta ? fetchComponentText('cta.html') : Promise.resolve(''),
            fetchComponentText('privacy-modal.html')
        ]);
        const fallbackRootHref = (() => {
            if (COMMON_SCRIPT_URL) {
                try {
                    return new URL('../../', COMMON_SCRIPT_URL).href;
                } catch (e) {}
            }
            try {
                return new URL('../', pageHref).href;
            } catch (e) {
                return '/';
            }
        })();
        const fallbackLogoSrc = '/assets/img/common/logo-sm-gray.png';
        const fallbackAboutHref = new URL('pages/about.html', fallbackRootHref).href;
        const fallbackPortfolioHref = new URL('pages/portfolio.html', fallbackRootHref).href;
        const fallbackAiSolutionHref = new URL('pages/aisolution.html', fallbackRootHref).href;
        const fallbackInquiryHref = new URL('pages/inquiry.html', fallbackRootHref).href;
        const fallbackHomeHref = fallbackRootHref;

        if (!headerHtml || !footerHtml) {
            console.warn('[common] component load fallback exhausted', {
                page: window.location.pathname,
                triedBases: componentBases,
                triedFooterUrls: componentBases.map((base) => {
                    try {
                        return new URL('footer.html', base).href;
                    } catch (e) {
                        return base;
                    }
                })
            });
        }

        const normalizeComponentPaths = () => {
            const isSubpage = !!window.location.pathname && window.location.pathname !== '/' && !/\/index\.html?$/i.test(window.location.pathname);
            const pagePrefix = isSubpage ? '../pages/' : './pages/';
            const assetPrefix = isSubpage ? '../assets/' : './assets/';
            const toCleanPath = (value) => (value || '').replace(/^(?:\.\/|\.\.\/|\/)+/, '');
            const toPageHref = (value) => {
                const clean = toCleanPath(value).replace(/^pages\//, '');
                return `${pagePrefix}${clean}`;
            };
            const toAssetHref = (value) => {
                const clean = toCleanPath(value).replace(/^assets\//, '');
                return `${assetPrefix}${clean}`;
            };

            $('#header-container .header, #header-container .main-header').each(function () {
                const $header = $(this);
                const $logoLink = $header.find('.logo').first();
                if ($logoLink.length) {
                    $logoLink.attr('href', isSubpage ? '../index.html' : './index.html');
                }

                const $logoImg = $header.find('.logo img').first();
                if ($logoImg.length) {
                    const src = `${assetPrefix}img/common/logo-sm.png`;
                    $logoImg.attr('src', src);
                    $logoImg.attr('data-logoscroll', src);
                    $logoImg.attr('data-logodefault', src);
                }

                $header.find('a[href], form[action]').each(function () {
                    const $el = $(this);
                    const current = $el.attr('href') || $el.attr('action') || '';
                    if (!current || /^https?:\/\//i.test(current) || current.startsWith('#') || current.startsWith('mailto:') || current.startsWith('tel:')) {
                        return;
                    }

                    if (current.startsWith('/')) {
                        const clean = toCleanPath(current);
                        if (clean.startsWith('pages/')) {
                            $el.attr('href', toPageHref(current));
                            if ($el.is('form')) $el.attr('action', toPageHref(current));
                        } else if (clean.startsWith('assets/')) {
                            $el.attr('href', toAssetHref(current));
                            if ($el.is('form')) $el.attr('action', toAssetHref(current));
                        }
                        return;
                    }

                    if (/^(?:\.\/|\.\.\/)?pages\//.test(current)) {
                        const next = toPageHref(current);
                        $el.attr('href', next);
                        if ($el.is('form')) $el.attr('action', next);
                    }

                    if (/^(?:\.\/|\.\.\/)?assets\//.test(current)) {
                        const next = toAssetHref(current);
                        $el.attr('href', next);
                        if ($el.is('form')) $el.attr('action', next);
                    }
                });

                $header.find('.mobilemenu a').each(function () {
                    const $item = $(this);
                    const current = $item.attr('href') || '';
                    if (!current || /^https?:\/\//i.test(current)) return;
                    if (/^(?:\.\/|\.\.\/)?pages\//.test(current)) {
                        $item.attr('href', toPageHref(current));
                    }
                });
            });

            $('#footer-container .footer').each(function () {
                const $footer = $(this);
                $footer.find('a[href], img[src]').each(function () {
                    const $el = $(this);
                    const current = $el.attr('href') || $el.attr('src') || '';
                    if (!current || /^https?:\/\//i.test(current) || current.startsWith('#') || current.startsWith('mailto:') || current.startsWith('tel:')) {
                        return;
                    }

                    if (current.startsWith('/')) {
                        const clean = toCleanPath(current);
                        if (clean.startsWith('pages/')) {
                            const next = toPageHref(current);
                            if ($el.is('img')) $el.attr('src', next);
                            else $el.attr('href', next);
                        } else if (clean.startsWith('assets/')) {
                            const next = toAssetHref(current);
                            if ($el.is('img')) $el.attr('src', next);
                            else $el.attr('href', next);
                        }
                        return;
                    }

                    if (/^(?:\.\/|\.\.\/)?pages\//.test(current)) {
                        const next = toPageHref(current);
                        if ($el.is('img')) $el.attr('src', next);
                        else $el.attr('href', next);
                    }

                    if (/^(?:\.\/|\.\.\/)?assets\//.test(current)) {
                        const next = toAssetHref(current);
                        if ($el.is('img')) $el.attr('src', next);
                        else $el.attr('href', next);
                    }
                });
            });
        };

        $('#header-container').html(headerHtml || '');
        normalizeComponentPaths();
        if (footerHtml) {
            $('#footer-container').html(footerHtml);
            normalizeComponentPaths();
        } else {
            $('#footer-container').html(`
                <footer class="footer">
                    <div class="inner">
                        <div class="top">
                            <nav class="menu" aria-label="Footer">
                                <a href="${fallbackAboutHref}">Company</a>
                                <a href="${fallbackAiSolutionHref}">AI Solution</a>
                                <a href="${fallbackPortfolioHref}">Portfolio</a>
                                <a href="${fallbackInquiryHref}">Contact Us</a>
                            </nav>
                        </div>
                        <div class="body">
                            <div class="left">
                                <div class="line contact">
                                    <div class="item">
                                        <span class="label">Phone</span>
                                        <a class="text" href="tel:0221180716">02. 2118. 0716 / 02. 2118. 0717</a>
                                    </div>
                                    <div class="item">
                                        <span class="label">Email</span>
                                        <a class="text" href="mailto:ubique7@naver.com">ubique7@naver.com</a>
                                    </div>
                                </div>
                            </div>
                            <a class="logo" href="${fallbackHomeHref}" aria-label="Home">
                                <img src="${fallbackLogoSrc}" alt="UBIQUE">
                            </a>
                        </div>
                        <p class="copy">COPYRIGHT (C) 2026 UBIQUE KOREA ALL RIGHT RESERVED</p>
                    </div>
                </footer>
            `);
        }

        if (hasSubtop) $('#subtop-container').html(subtopHtml);
        if (hasCta) $('#cta-container').html(ctaHtml);
        if (privacyModalHtml && !document.getElementById('privacybox')) {
            $('body').append(privacyModalHtml);
        }
        setHeaderActive();
        initHeaderNavTextRoll();
        initHeaderInquiryPanel();
        initHeaderMobileMenu();
        initPrivacyModal();

        $(document).trigger('components:ready');
        if (hasSubtop) window.Subtop?.init();
    } catch (err) {
        console.error(err);
    }
}

function initPrivacyModal() {
    const $modal = $('#privacybox');
    if (!$modal.length) return;

    const $dialog = $modal.find('.dialog').first();
    let lastTrigger = null;
    let prevOverflow = '';
    let overflowChangedByModal = false;

    const openModal = (trigger) => {
        lastTrigger = trigger || null;
        prevOverflow = document.body.style.overflow;
        document.body.classList.add('is-privacy-open');
        if (document.body.style.overflow !== 'hidden') {
            document.body.style.overflow = 'hidden';
            overflowChangedByModal = true;
        } else {
            overflowChangedByModal = false;
        }
        $modal.prop('hidden', false);
        const closeBtn = $modal.find('.close').get(0);
        if (closeBtn) closeBtn.focus();
    };

    const closeModal = () => {
        $modal.prop('hidden', true);
        document.body.classList.remove('is-privacy-open');
        if (overflowChangedByModal) {
            document.body.style.overflow = prevOverflow || '';
        }
        if (lastTrigger && typeof lastTrigger.focus === 'function') {
            lastTrigger.focus();
        }
    };

    $(document)
        .off('click.privacyOpen')
        .on('click.privacyOpen', '.privacyopen', function (event) {
            event.preventDefault();
            event.stopPropagation();
            openModal(this);
        })
        .off('keydown.privacyEsc')
        .on('keydown.privacyEsc', function (event) {
            if (event.key !== 'Escape') return;
            if ($modal.prop('hidden')) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            closeModal();
        });

    $modal
        .off('click.privacyStop')
        .on('click.privacyStop', function (event) {
            event.stopPropagation();
        })
        .off('click.privacyClose', '[data-privacy-close="true"]')
        .on('click.privacyClose', '[data-privacy-close="true"]', function (event) {
            event.preventDefault();
            event.stopPropagation();
            closeModal();
        })
        .off('click.privacyDialog')
        .on('click.privacyDialog', function (event) {
            if (!$dialog.length) return;
            if ($dialog.is(event.target) || $.contains($dialog.get(0), event.target)) return;
            event.stopPropagation();
            closeModal();
        });
}

/* ===== Scroll engine setup ===== */
const initSmoothScroll = (function () {
    const COMMON_SCRIPT_SRC = (function () {
        const script = document.currentScript || document.querySelector('script[src*="assets/js/common.js"]');
        return script && script.src ? script.src : '';
    })();

    function resolveCommonAssetPath(relativePath) {
        if (!COMMON_SCRIPT_SRC) return relativePath;
        try {
            return new URL(relativePath, COMMON_SCRIPT_SRC).href;
        } catch (e) {
            return relativePath;
        }
    }

    const loadScriptOnce = (function () {
        const cache = new Map();
        return function loadScriptOnce(src) {
            if (!src) return Promise.resolve();
            if (cache.has(src)) return cache.get(src);

            const promise = new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => resolve();
                document.head.appendChild(script);
            });

            cache.set(src, promise);
            return promise;
        };
    })();

    function createFallbackScrollInstance() {
        const listeners = new Set();
        const getY = () => window.scrollY || document.documentElement.scrollTop || 0;

        function emit() {
            const y = getY();
            fallback.scroll.instance.scroll.y = y;
            listeners.forEach((fn) => fn({ scroll: { y } }));
        }

        const fallback = {
            __isSmooth: false,
            scroll: { instance: { scroll: { y: getY() } } },
            on(event, fn) {
                if (event !== 'scroll' || typeof fn !== 'function') return;
                listeners.add(fn);
            },
            off(event, fn) {
                if (event !== 'scroll' || typeof fn !== 'function') return;
                listeners.delete(fn);
            },
            scrollTo(y, opts = {}) {
                const target = typeof y === 'number' ? y : 0;
                const duration = typeof opts.duration === 'number' ? Math.max(0, opts.duration) : 0.6;
                window.scrollTo({ top: target, behavior: duration === 0 ? 'auto' : 'smooth' });
                emit();
            },
            update: emit,
            stop() {
            },
            start() {
            }
        };

        window.addEventListener('scroll', emit, { passive: true });
        return fallback;
    }

    return async function initSmoothScroll() {
        const cfg = window.SancSmoothScrollConfig || {};
        if (cfg.enabled !== true) {
            const fallback = createFallbackScrollInstance();
            window.scrollInstance = fallback;
            return fallback;
        }

        const src = resolveCommonAssetPath('animation/smooth-scroll.js');
        await loadScriptOnce(src);

        if (window.SancSmoothScroll && typeof window.SancSmoothScroll.init === 'function') {
            return window.SancSmoothScroll.init();
        }

        const fallback = createFallbackScrollInstance();
        window.scrollInstance = fallback;
        return fallback;
    };
})();

/* ===== Header tone sync ===== */
function initHeader(scrollBus) {
    const headerEl = document.querySelector('.main-header') || document.querySelector('.header');
    if (!headerEl) return;

    const $header = $(headerEl);
    const isMainPage = document.body?.dataset?.page === 'main';
    const rootStyle = document.documentElement?.style;
    const noiseFloor = 0.01;
    const topThreshold = 5;
    const mainTopEnterThreshold = 2;
    const mainTopExitThreshold = 28;
    const hideHeaderThreshold = 180;
    const directionThreshold = 0.6;
    const mobileMaxWidth = 768;
    const mobileDirectionThreshold = 2.4;
    const mobileNoiseFloor = 0.9;
    const mobileHeaderToggleCooldownMs = 220;
    const isMobileViewport = () => (window.innerWidth || document.documentElement.clientWidth || 0) <= mobileMaxWidth;
    const getDirectionThreshold = () => (isMobileViewport() ? mobileDirectionThreshold : directionThreshold);
    const getNoiseFloor = () => (isMobileViewport() ? mobileNoiseFloor : noiseFloor);
    const logoImgEl = $header.find('.logo img').get(0) || null;
    const resolveAbsUrl = (value) => {
        if (!value || typeof value !== 'string') return '';
        try {
            return new URL(value, window.location.href).href;
        } catch (e) {
            return '';
        }
    };
    const defaultLogoSrc = logoImgEl
        ? resolveAbsUrl(
            logoImgEl.getAttribute('data-logodefault')
            || logoImgEl.getAttribute('src')
            || logoImgEl.currentSrc
            || logoImgEl.src
            || ''
        )
        : '';
    const inferredScrollLogoSrc = (() => {
        if (!defaultLogoSrc) return '';
        try {
            const next = new URL(defaultLogoSrc);
            next.pathname = next.pathname.replace(/[^/]+$/, 'logo-sm.png');
            return next.href;
        } catch (e) {
            return '';
        }
    })();
    const scrollLogoSrc = logoImgEl
        ? (resolveAbsUrl(logoImgEl.getAttribute('data-logoscroll') || '') || inferredScrollLogoSrc || defaultLogoSrc)
        : '';
    const fixedLogoSrc = scrollLogoSrc || defaultLogoSrc;
    let lastLogoSrc = logoImgEl ? resolveAbsUrl(logoImgEl.currentSrc || logoImgEl.src || logoImgEl.getAttribute('src') || '') : '';

    if (fixedLogoSrc && fixedLogoSrc !== defaultLogoSrc) {
        const preload = new Image();
        preload.src = fixedLogoSrc;
    }

    const syncHeaderLogo = () => {
        if (!logoImgEl) return;
        const targetSrc = fixedLogoSrc;
        if (!targetSrc) return;
        if (lastLogoSrc === targetSrc) return;
        logoImgEl.style.opacity = '0.82';
        logoImgEl.src = targetSrc;
        requestAnimationFrame(() => {
            logoImgEl.style.opacity = '1';
        });
        lastLogoSrc = targetSrc;
    };

    const syncHeaderHeightVar = () => {
        if (!rootStyle) return;
        const measured = Math.round(headerEl.getBoundingClientRect().height || headerEl.offsetHeight || 0);
        if (!measured) return;
        rootStyle.setProperty('--header-height', `${measured}px`);
    };

    const getScrollRootEl = () => {
        const scroller = window.SancSmoothScrollConfig?.scroller;
        if (typeof scroller === 'string') return document.querySelector(scroller);
        if (scroller && scroller.nodeType === 1) return scroller;
        return document.scrollingElement || document.documentElement || document.body;
    };

    const getVisualScrollFallbackY = () => {
        const anchor = document.querySelector('main')
            || document.querySelector('.subpage-content')
            || document.querySelector('section')
            || document.body;
        if (!anchor || typeof anchor.getBoundingClientRect !== 'function') return 0;
        const top = Number(anchor.getBoundingClientRect().top) || 0;
        return Math.max(0, -top);
    };

    const getGsapScrollY = () => {
        const scrollTrigger = window.ScrollTrigger;
        if (!scrollTrigger) return 0;

        let triggerScroll = 0;
        let gsapScroller = getScrollRootEl() || window;
        if (typeof scrollTrigger.getAll === 'function') {
            const triggers = scrollTrigger.getAll();
            for (let i = 0; i < triggers.length; i += 1) {
                const trigger = triggers[i];
                const rawScroller = trigger
                    ? (typeof trigger.scroller === 'function' ? trigger.scroller() : trigger.scroller)
                    : null;

                if (typeof trigger?.scroll === 'function') {
                    const value = Number(trigger.scroll());
                    if (Number.isFinite(value) && Math.abs(value) > Math.abs(triggerScroll)) {
                        triggerScroll = value;
                    }
                }

                if (rawScroller && rawScroller !== window) {
                    gsapScroller = rawScroller;
                    break;
                }
            }
        }

        if (Math.abs(triggerScroll) > 0) {
            return triggerScroll;
        }

        if (typeof scrollTrigger.getScrollFunc === 'function') {
            const getter = scrollTrigger.getScrollFunc(gsapScroller);
            if (typeof getter === 'function') {
                const value = Number(getter());
                if (Number.isFinite(value)) return value;
            }
        }

        if (typeof scrollTrigger.scroll === 'function') {
            const value = Number(scrollTrigger.scroll());
            if (Number.isFinite(value)) return value;
        }

        return 0;
    };

    const getScrollSnapshot = () => {
        const root = getScrollRootEl()
            || document.scrollingElement
            || document.documentElement
            || document.body;
        const rootY = root && typeof root.scrollTop === 'number' ? root.scrollTop : 0;
        const docY = document.documentElement && typeof document.documentElement.scrollTop === 'number'
            ? document.documentElement.scrollTop
            : 0;
        const bodyY = document.body && typeof document.body.scrollTop === 'number'
            ? document.body.scrollTop
            : 0;
        const winY = (typeof window.scrollY === 'number' ? window.scrollY : (window.pageYOffset || 0));
        const smoothRaw = (scrollBus && scrollBus.scroll?.instance?.scroll)
            ? (scrollBus.scroll.instance.scroll.y || 0)
            : 0;
        const smoothY = Number(smoothRaw) || 0;
        const smoothAbs = Math.abs(smoothY);
        const gsapY = Number(getGsapScrollY()) || 0;
        const gsapAbs = Math.abs(gsapY);
        const visualY = Number(getVisualScrollFallbackY()) || 0;
        const y = Math.max(rootY, docY, bodyY, winY, smoothAbs, gsapAbs, visualY);
        return { y, rootY, docY, bodyY, winY, smoothY, smoothAbs, gsapY, gsapAbs, visualY };
    };
    const applyState = (y, direction, logoCompactState) => {
        if (document.body?.classList.contains('is-header-sync-hold')) {
            return logoCompactState;
        }
        const atTop = y <= topThreshold;

        let compact = !!logoCompactState;
        if (atTop) {
            compact = false;
        } else if (direction > 0) {
            compact = true;
        } else if (direction < 0) {
            compact = false;
        }
        if (isMainPage) {
            if (atTop) {
                isMainTopState = true;
            } else if (isMainTopState) {
                isMainTopState = y <= mainTopExitThreshold;
            } else {
                isMainTopState = y <= mainTopEnterThreshold;
            }
        } else {
            isMainTopState = false;
        }

        const useMainTopState = isMainTopState;
        if (useMainTopState) {
            compact = false;
        }
        let nextHiddenState = headerHiddenState;
        if (atTop || useMainTopState) {
            nextHiddenState = false;
        } else if (direction > 0) {
            nextHiddenState = true;
        } else if (direction < 0) {
            nextHiddenState = false;
        } else if (y <= hideHeaderThreshold) {
            nextHiddenState = false;
        }

        if (nextHiddenState !== headerHiddenState) {
            const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
            const isMobile = isMobileViewport();
            const canToggle = !isMobile || (now - lastHeaderToggleAt) >= mobileHeaderToggleCooldownMs;
            const forceShow = !nextHiddenState && (atTop || direction < 0 || y <= hideHeaderThreshold + 24);
            if (canToggle || forceShow) {
                headerHiddenState = nextHiddenState;
                lastHeaderToggleAt = now;
            }
        }
        const useScrolledBackground = !atTop && !useMainTopState && !headerHiddenState;
        syncHeaderLogo();
        $header.toggleClass('is-at-top', atTop);
        $header.toggleClass('is-scrolled', useScrolledBackground);
        $header.toggleClass('is-scroll', compact);
        $header.toggleClass('is-main-top', useMainTopState);
        $header.removeClass('is-tone-dark').removeClass('is-tone-light');
        $header.removeClass('is-section2 is-white is-white-transparent is-transparent');
        document.body?.classList.toggle('header-is-hidden', headerHiddenState);
        return compact;
    };

    let lastY = getScrollSnapshot().y;
    let lastDirection = 0;
    let logoCompact = lastY > topThreshold;
    let isMainTopState = isMainPage && lastY <= mainTopExitThreshold;
    let headerHiddenState = false;
    let lastHeaderToggleAt = 0;
    let ticking = false;
    let queuedY = null;
    let rafWatchId = 0;
    let rafWatchLastY = lastY;

    const handleScroll = (y) => {
        const delta = y - lastY;
        const directionDelta = getDirectionThreshold();
        if (delta > directionDelta) {
            lastDirection = 1;
        } else if (delta < -directionDelta) {
            lastDirection = -1;
        }
        logoCompact = applyState(y, lastDirection, logoCompact);
        lastY = y;
    };

    const schedule = (nextY) => {
        if (Number.isFinite(nextY)) {
            queuedY = nextY;
        }
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            const y = Number.isFinite(queuedY) ? queuedY : getScrollSnapshot().y;
            queuedY = null;
            handleScroll(y);
        });
    };

    handleScroll(lastY);

    const watchScrollByRaf = () => {
        const y = getScrollSnapshot().y;
        if (Math.abs(y - rafWatchLastY) > getNoiseFloor()) {
            rafWatchLastY = y;
            schedule(y);
        }
        rafWatchId = requestAnimationFrame(watchScrollByRaf);
    };
    rafWatchId = requestAnimationFrame(watchScrollByRaf);

    const nativeScrollHandler = () => schedule();
    const scrollRoot = getScrollRootEl();

    // Always listen to native scroll as a fallback so scrollbar drag/keyboard scroll works too.
    window.addEventListener('scroll', nativeScrollHandler, { passive: true });
    if (
        scrollRoot
        && scrollRoot !== window
        && scrollRoot !== document.documentElement
        && scrollRoot !== document.body
        && scrollRoot !== document.scrollingElement
    ) {
        scrollRoot.addEventListener('scroll', nativeScrollHandler, { passive: true });
    }

    if (scrollBus && typeof scrollBus.on === 'function') {
        scrollBus.on('scroll', () => {
            schedule(getScrollSnapshot().y);
        });
    }

    // Wheel input helps state refresh instantly while smooth scrolling.
    window.addEventListener('wheel', (e) => {
        const dy = e.deltaY;
        if (dy && Math.abs(dy) > Math.abs(e.deltaX || 0)) {
            schedule(getScrollSnapshot().y);
            requestAnimationFrame(() => schedule(getScrollSnapshot().y));
        }
    }, { passive: true });
    const onHeaderSync = () => schedule();
    document.addEventListener('ubique:header-sync', onHeaderSync);
    // Backward compatibility with legacy event name.
    document.addEventListener('ubique:header-hide-toggle', onHeaderSync);

    syncHeaderHeightVar();
    if (typeof ResizeObserver === 'function') {
        const headerObserver = new ResizeObserver(() => syncHeaderHeightVar());
        headerObserver.observe(headerEl);
    }

    const onViewportResize = () => {
        syncHeaderHeightVar();
        schedule();
        requestAnimationFrame(() => {
            syncHeaderHeightVar();
            schedule();
        });
    };
    window.addEventListener('resize', onViewportResize, { passive: true });
    window.addEventListener('orientationchange', onViewportResize, { passive: true });
    if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
        window.visualViewport.addEventListener('resize', onViewportResize, { passive: true });
    }
    window.addEventListener('load', () => {
        syncHeaderHeightVar();
        schedule();
    }, { once: true });

}

/* ===== Header Active ===== */
function setHeaderActive() {
    const rawCat = document.body.dataset.category || '';
    if (!rawCat) return;

    const want = rawCat.trim().toUpperCase();
    const $hdr = $('.main-header');
    if (!$hdr.length) return;

    const $items = $hdr.find('.main-nav .menu-item');
    $items.removeClass('is-active')
        .find('a')
        .removeAttr('aria-current');

    $items.each(function () {
        const $li = $(this);
        const $a = $li.find('a').first();
        const label = ($a.text() || '').trim().toUpperCase();
        const menuKey = ($li.data('menu') || '').toString().trim().toUpperCase();

        if ((menuKey && menuKey === want) || label === want) {
            $li.addClass('is-active');
            $a.attr('aria-current', 'page');
        }
    });
}

/* ===== Header nav text roll ===== */
function initHeaderNavTextRoll() {
    const $header = $('.header');
    if (!$header.length) return;

    const $nav = $header.find('.nav').first();
    if (!$nav.length) return;

    const buildRollingLabels = () => {
        const buildLabel = (text, extraClass) => {
            const $label = $('<span></span>').addClass(`label ${extraClass}`);
            Array.from(text).forEach((char, i) => {
                const $char = $('<span class="char"></span>');
                $char.get(0)?.style.setProperty('--char-i', String(i));
                const glyph = char === ' ' ? '\u00A0' : char;
                $char.append($('<span class="char-glyph"></span>').text(glyph));
                $label.append($char);
            });
            return $label;
        };

        $nav.find('.text[data-text]').each(function () {
            const $text = $(this);
            if ($text.attr('data-roll-built') === 'true') return;
            const raw = ($text.attr('data-text') || $text.text() || '').trim();
            if (!raw) return;

            $text.empty();
            $text.append(buildLabel(raw, 'label-base'));
            $text.append(buildLabel(raw, 'label-clone').attr('aria-hidden', 'true'));
            $text.attr('data-roll-built', 'true');
        });
    };

    buildRollingLabels();

    const normalizePath = (value) => {
        if (!value) return '/';
        try {
            const url = new URL(value, window.location.href);
            const path = (url.pathname || '/').replace(/\/+$/, '');
            return path || '/';
        } catch (e) {
            const path = String(value).replace(/\/+$/, '');
            return path || '/';
        }
    };

    const currentPath = normalizePath(window.location.pathname || '/');
    const $topLinks = $nav.find('> .item');
    $topLinks.removeAttr('aria-current');

    $topLinks.each(function () {
        const $link = $(this);
        if ($link.is('button') || $link.attr('data-inquiry-toggle') === 'true') return;
        const href = ($link.attr('href') || '').trim();
        if (!href || href === '#') return;
        if (normalizePath(href) !== currentPath) return;
        $link.attr('aria-current', 'page');
    });
}

function initHeaderInquiryPanel() {
    const $header = $('.header').first();
    if (!$header.length) return;

    const $toggle = $header.find('[data-inquiry-toggle="true"]').first();
    let $panel = $header.find('#headerInquiryPanel').first();
    if (!$panel.length) {
        $panel = $('body > #headerInquiryPanel').first();
    }

    let $backdrop = $header.find('.backdrop').first();
    if (!$backdrop.length) {
        $backdrop = $('body > .backdrop').first();
    }

    if (!$toggle.length || !$panel.length) return;

    if ($panel.hasClass('inquiry') && !$panel.hasClass('inquirypanel')) {
        $panel.addClass('inquirypanel');
    }
    $panel.find('.link').addClass('metalink');
    $panel.find('.links').addClass('metalinkgroup');
    $panel.find('.txt').addClass('metatext');
    $panel.find('.nums').addClass('metanums');
    $panel.find('.num').addClass('metanum');
    $panel.find('.sep').addClass('metasep');
    $panel.find('.mail').addClass('iconmail');
    $panel.find('.tel').addClass('icontel');

    const $closeButtons = $panel.find('[data-inquiry-close="true"]').add($backdrop);
    const $revealTargets = $panel.find('.top, .close, .panel-head, .meta, .quick-form .field, .field, .quick-form .topics, .quick-form .cta-row, .foot, .panel-foot');
    const $magneticTargets = $panel.find('.quick-form .chip, .quick-form .cta, .send');
    const $form = $panel.find('.form').first();
    const openClass = 'is-inquiry-open';
    const panelNode = $panel.get(0);
    let bodyOverflowBeforeLock = '';
    let htmlOverflowBeforeLock = '';
    let openRafA = 0;
    let openRafB = 0;
    let openReadyTimer = 0;
    let pointerRaf = 0;
    let pointerX = 0;
    let pointerY = 0;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const cancelOpenReadyFrames = () => {
        if (openRafA) window.cancelAnimationFrame(openRafA);
        if (openRafB) window.cancelAnimationFrame(openRafB);
        if (openReadyTimer) window.clearTimeout(openReadyTimer);
        openRafA = 0;
        openRafB = 0;
        openReadyTimer = 0;
    };

    const cancelPointerFrame = () => {
        if (pointerRaf) {
            window.cancelAnimationFrame(pointerRaf);
            pointerRaf = 0;
        }
    };

    const resetPanelPointer = () => {
        if (!panelNode) return;
        panelNode.style.setProperty('--mx', '82%');
        panelNode.style.setProperty('--my', '18%');
    };

    const setPanelPointer = (clientX, clientY) => {
        if (!panelNode) return;
        const rect = panelNode.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        panelNode.style.setProperty('--mx', `${clamp(x, 8, 92).toFixed(2)}%`);
        panelNode.style.setProperty('--my', `${clamp(y, 8, 92).toFixed(2)}%`);
    };

    const updatePanelViewportMetrics = () => {
        if (!panelNode) return;
        const vv = window.visualViewport || null;
        const viewportHeight = Math.round(
            (vv && vv.height)
                ? vv.height
                : (window.innerHeight || document.documentElement.clientHeight || 0)
        );
        const viewportTop = Math.round(
            (vv && typeof vv.offsetTop === 'number')
                ? vv.offsetTop
                : 0
        );

        if (viewportHeight > 0) {
            panelNode.style.setProperty('--inquiry-vh', `${viewportHeight}px`);
        }
        panelNode.style.setProperty('--inquiry-vv-top', `${Math.max(0, viewportTop)}px`);
    };

    const syncPanelViewportMetrics = () => {
        updatePanelViewportMetrics();
        requestAnimationFrame(updatePanelViewportMetrics);
    };

    const resetMagnet = (node) => {
        if (!node || !node.style) return;
        node.style.setProperty('--magnet-x', '0px');
        node.style.setProperty('--magnet-y', '0px');
    };

    const lockBackgroundScroll = () => {
        bodyOverflowBeforeLock = document.body?.style?.overflow || '';
        htmlOverflowBeforeLock = document.documentElement?.style?.overflow || '';
        if (document.body) document.body.style.overflow = 'hidden';
        if (document.documentElement) document.documentElement.style.overflow = 'hidden';
        try {
            window.scrollInstance?.stop?.();
        } catch (e) {}
    };

    const unlockBackgroundScroll = () => {
        if (document.body) document.body.style.overflow = bodyOverflowBeforeLock || '';
        if (document.documentElement) document.documentElement.style.overflow = htmlOverflowBeforeLock || '';
        try {
            window.scrollInstance?.start?.();
        } catch (e) {}
    };

    const updateMagnet = (node, clientX, clientY) => {
        if (!node || !node.style) return;
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const strength = node.classList.contains('cta') ? 10 : 7;
        const offsetX = ((clientX - rect.left) / rect.width - 0.5) * strength;
        const offsetY = ((clientY - rect.top) / rect.height - 0.5) * strength;
        node.style.setProperty('--magnet-x', `${offsetX.toFixed(2)}px`);
        node.style.setProperty('--magnet-y', `${offsetY.toFixed(2)}px`);
    };

    $revealTargets.each(function (index) {
        this.setAttribute('data-inquiry-reveal', 'true');
        this.style.setProperty('--reveal-order', String(index));
    });

    $magneticTargets.each(function () {
        this.setAttribute('data-inquiry-magnetic', 'true');
        resetMagnet(this);
    });

    if ($panel.parent().get(0) !== document.body) {
        $panel.appendTo(document.body);
    }
    if ($backdrop.length && $backdrop.parent().get(0) !== document.body) {
        $backdrop.appendTo(document.body);
    }

    const schedulePanelReady = () => {
        cancelOpenReadyFrames();
        $panel.removeClass('is-ready');
        openRafA = window.requestAnimationFrame(() => {
            openRafB = window.requestAnimationFrame(() => {
                if (!$header.hasClass(openClass)) return;
                openReadyTimer = window.setTimeout(() => {
                    openReadyTimer = 0;
                    if (!$header.hasClass(openClass)) return;
                    $panel.addClass('is-ready');
                }, 320);
            });
        });
    };

    const openPanel = () => {
        $header.addClass(openClass);
        $('body').addClass(openClass);
        $toggle.attr('aria-expanded', 'true');
        $panel.attr('aria-hidden', 'false');
        lockBackgroundScroll();
        syncPanelViewportMetrics();
        schedulePanelReady();
    };

    const closePanel = () => {
        $header.removeClass(openClass);
        $('body').removeClass(openClass);
        $toggle.attr('aria-expanded', 'false');
        $panel.attr('aria-hidden', 'true').removeClass('is-ready');
        unlockBackgroundScroll();
        cancelOpenReadyFrames();
        cancelPointerFrame();
        resetPanelPointer();
        $magneticTargets.each(function () {
            resetMagnet(this);
        });
    };

    const togglePanel = () => {
        if ($header.hasClass(openClass)) {
            closePanel();
            return;
        }
        openPanel();
    };

    let isHeaderInquirySubmitting = false;
    let hasHeaderInquirySubmitted = false;
    const headerInquiryEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const headerInquiryTelPattern = /^[0-9+\-().\s]{8,20}$/;

    const getHeaderFieldErrorNode = ($input) => {
        const describedBy = (($input.attr('aria-describedby') || '') + '').trim();
        if (!describedBy) return $();
        const msgId = describedBy.split(/\s+/)[0];
        if (!msgId) return $();
        return $form.find(`#${msgId}`).first();
    };

    const clearHeaderFieldError = ($input) => {
        const $field = $input.closest('.field');
        const $msg = getHeaderFieldErrorNode($input);
        $field.removeClass('error');
        $input.attr('aria-invalid', 'false');
        if ($msg.length) $msg.text('');
    };

    const setHeaderFieldError = ($input, message) => {
        const $field = $input.closest('.field');
        const $msg = getHeaderFieldErrorNode($input);
        $field.addClass('error');
        $input.attr('aria-invalid', 'true');
        if ($msg.length) $msg.text(message || '');
    };

    const clearHeaderAgreeError = ($agree) => {
        const $agreeWrap = $agree.closest('.agree');
        const msgId = (($agree.attr('aria-describedby') || '') + '').trim().split(/\s+/)[0];
        const $msg = msgId ? $panel.find(`#${msgId}`).first() : $();
        $agreeWrap.removeClass('error');
        if ($msg.length) $msg.text('');
    };

    const setHeaderAgreeError = ($agree, message) => {
        const $agreeWrap = $agree.closest('.agree');
        const msgId = (($agree.attr('aria-describedby') || '') + '').trim().split(/\s+/)[0];
        const $msg = msgId ? $panel.find(`#${msgId}`).first() : $();
        $agreeWrap.addClass('error');
        if ($msg.length) $msg.text(message || '');
    };

    const resetHeaderInquiryErrors = () => {
        if (!$form.length) return;
        $form.find('input[name="name"], input[name="email"], input[name="contact"], textarea[name="message"]').each(function () {
            clearHeaderFieldError($(this));
        });
        const $agree = $panel.find('input[name="agree"]').first();
        if ($agree.length) clearHeaderAgreeError($agree);
    };

    const validateHeaderInquiryField = ($input) => {
        if (!$input.length) return true;
        const fieldName = (($input.attr('name') || '') + '').trim();
        const value = (($input.val() || '') + '').trim();

        if (fieldName === 'name') {
            if (!value) {
                setHeaderFieldError($input, '성함을 입력해주세요.');
                return false;
            }
            clearHeaderFieldError($input);
            return true;
        }

        if (fieldName === 'email') {
            if (!value) {
                setHeaderFieldError($input, '이메일을 입력해주세요.');
                return false;
            }
            if (!headerInquiryEmailPattern.test(value)) {
                setHeaderFieldError($input, '이메일 형식을 확인해주세요.');
                return false;
            }
            clearHeaderFieldError($input);
            return true;
        }

        if (fieldName === 'contact') {
            if (!value) {
                setHeaderFieldError($input, '연락처를 입력해주세요.');
                return false;
            }
            if (!headerInquiryTelPattern.test(value)) {
                setHeaderFieldError($input, '연락처 형식을 확인해주세요.');
                return false;
            }
            clearHeaderFieldError($input);
            return true;
        }

        if (fieldName === 'message') {
            if (!value) {
                setHeaderFieldError($input, '문의내용을 입력해주세요.');
                return false;
            }
            if (value.length < 10) {
                setHeaderFieldError($input, '문의 내용은 10자 이상 입력해주세요.');
                return false;
            }
            clearHeaderFieldError($input);
            return true;
        }

        clearHeaderFieldError($input);
        return true;
    };

    const validateHeaderInquiryAgree = ($agree) => {
        if (!$agree.length) return false;
        if (!$agree.prop('checked')) {
            setHeaderAgreeError($agree, '개인정보처리방침 동의가 필요합니다.');
            return false;
        }
        clearHeaderAgreeError($agree);
        return true;
    };

    const submitHeaderInquiry = async () => {
        if (!$form.length) return;

        const $name = $form.find('input[name="name"]').first();
        const $email = $form.find('input[name="email"]').first();
        const $contact = $form.find('input[name="contact"]').first();
        const $message = $form.find('textarea[name="message"]').first();
        const $agree = $panel.find('input[name="agree"]').first();
        const $topic = $form.find('#headerInquiryTopic').first();
        const $sendButton = $panel.find('.send[type="submit"]').first();

        const name = ($name.val() || '').toString().trim();
        const email = ($email.val() || '').toString().trim();
        const contact = ($contact.val() || '').toString().trim();
        const message = ($message.val() || '').toString().trim();
        const role = (($topic.val() || '').toString().trim());
        const roleForSubmit = role || '-';

        hasHeaderInquirySubmitted = true;
        let headerInquiryValid = true;
        let firstInvalid = null;

        const validateWithFocus = ($input) => {
            const ok = validateHeaderInquiryField($input);
            if (!ok && !firstInvalid) firstInvalid = $input;
            if (!ok) headerInquiryValid = false;
        };

        validateWithFocus($name);
        validateWithFocus($email);
        validateWithFocus($contact);
        validateWithFocus($message);

        const agreeValid = validateHeaderInquiryAgree($agree);
        if (!agreeValid) {
            headerInquiryValid = false;
            if (!firstInvalid) firstInvalid = $agree;
        }

        if (!headerInquiryValid) {
            if (firstInvalid && firstInvalid.length) {
                firstInvalid.trigger('focus');
            }
            return;
        }

        if (isHeaderInquirySubmitting) return;
        isHeaderInquirySubmitting = true;
        if ($sendButton.length) {
            $sendButton.prop('disabled', true).attr('aria-busy', 'true');
        }

        const body = new URLSearchParams({
            name,
            role: roleForSubmit,
            email,
            phone: contact,
            subject: `${name} / ${roleForSubmit}`,
            message,
            agree: '1'
        });

        try {
            const response = await fetch('/api/contact.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: body.toString()
            });

            let payload = null;
            try {
                payload = await response.json();
            } catch (e) {
                payload = null;
            }

            if (!response.ok || !payload || payload.success !== true) {
                throw new Error('header_inquiry_submit_failed');
            }

            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert('문의가 접수되었습니다. 빠르게 연락드리겠습니다.');
            }

            $form.get(0).reset();
            hasHeaderInquirySubmitted = false;
            resetHeaderInquiryErrors();
            closePanel();
        } catch (error) {
            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert('문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
            }
        } finally {
            isHeaderInquirySubmitting = false;
            if ($sendButton.length) {
                $sendButton.prop('disabled', false).attr('aria-busy', 'false');
            }
        }
    };

    $toggle.off('click.headerInquiry').on('click.headerInquiry', function (event) {
        event.preventDefault();
        togglePanel();
    });

    $closeButtons.off('click.headerInquiryClose').on('click.headerInquiryClose', function (event) {
        event.preventDefault();
        closePanel();
    });

    $panel.off('click.headerInquiryLinks').on('click.headerInquiryLinks', 'a[href]', function () {
        closePanel();
    });

    $panel.off('click.headerInquiryChip').on('click.headerInquiryChip', '.chip[data-topic]', function () {
        const $chip = $(this);
        const topic = ($chip.attr('data-topic') || '').trim();
        if (!topic) return;

        const $chips = $panel.find('.chip[data-topic]');
        $chips.removeClass('is-active').attr('aria-pressed', 'false');
        $chip.addClass('is-active').attr('aria-pressed', 'true');

        const $topicInput = $panel.find('#headerInquiryTopic').first();
        if ($topicInput.length) {
            $topicInput.val(topic);
        }
    });

    if ($form.length) {
        resetHeaderInquiryErrors();

        $form
            .off('blur.headerInquiryField input.headerInquiryField', 'input[name="name"], input[name="email"], input[name="contact"], textarea[name="message"]')
            .on('blur.headerInquiryField input.headerInquiryField', 'input[name="name"], input[name="email"], input[name="contact"], textarea[name="message"]', function () {
                if (!hasHeaderInquirySubmitted) return;
                validateHeaderInquiryField($(this));
            });

        $panel
            .off('change.headerInquiryAgree', 'input[name="agree"]')
            .on('change.headerInquiryAgree', 'input[name="agree"]', function () {
                if (!hasHeaderInquirySubmitted) return;
                validateHeaderInquiryAgree($(this));
            });

        $form.off('submit.headerInquiryForm').on('submit.headerInquiryForm', function (event) {
            event.preventDefault();
            submitHeaderInquiry();
        });
    }

    $panel
        .off('mousemove.headerInquiryPointer pointermove.headerInquiryPointer')
        .on('mousemove.headerInquiryPointer pointermove.headerInquiryPointer', function (event) {
            if (!$header.hasClass(openClass)) return;
            if (!panelNode) return;
            pointerX = event.clientX;
            pointerY = event.clientY;
            if (pointerRaf) return;
            pointerRaf = window.requestAnimationFrame(() => {
                pointerRaf = 0;
                setPanelPointer(pointerX, pointerY);
            });
        })
        .off('mouseleave.headerInquiryPointer pointerleave.headerInquiryPointer')
        .on('mouseleave.headerInquiryPointer pointerleave.headerInquiryPointer', function () {
            resetPanelPointer();
            cancelPointerFrame();
        })
        .off('mousemove.headerInquiryMagnet pointermove.headerInquiryMagnet', '[data-inquiry-magnetic="true"]')
        .on('mousemove.headerInquiryMagnet pointermove.headerInquiryMagnet', '[data-inquiry-magnetic="true"]', function (event) {
            if (!$header.hasClass(openClass)) return;
            updateMagnet(this, event.clientX, event.clientY);
        })
        .off('mouseleave.headerInquiryMagnet pointerleave.headerInquiryMagnet focusout.headerInquiryMagnet', '[data-inquiry-magnetic="true"]')
        .on('mouseleave.headerInquiryMagnet pointerleave.headerInquiryMagnet focusout.headerInquiryMagnet', '[data-inquiry-magnetic="true"]', function () {
            resetMagnet(this);
        });

    $(document)
        .off('click.headerInquiryOutside')
        .on('click.headerInquiryOutside', function (event) {
            if (!$header.hasClass(openClass)) return;
            if (document.body.classList.contains('is-privacy-open')) return;
            const target = event.target;
            if ($toggle.is(target) || $.contains($toggle.get(0), target)) return;
            if ($panel.is(target) || $.contains($panel.get(0), target)) return;
            closePanel();
        })
        .off('keydown.headerInquiryEscape')
        .on('keydown.headerInquiryEscape', function (event) {
            if (event.key !== 'Escape') return;
            if (!$header.hasClass(openClass)) return;
            if (document.body.classList.contains('is-privacy-open')) return;
            closePanel();
            $toggle.trigger('focus');
        });

    $(window)
        .off('resize.headerInquiry orientationchange.headerInquiry')
        .on('resize.headerInquiry orientationchange.headerInquiry', function () {
            if (!$header.hasClass(openClass)) return;
            syncPanelViewportMetrics();
        });

    if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
        const onVisualViewportChange = () => {
            if (!$header.hasClass(openClass)) return;
            syncPanelViewportMetrics();
        };
        window.visualViewport.addEventListener('resize', onVisualViewportChange, { passive: true });
        window.visualViewport.addEventListener('scroll', onVisualViewportChange, { passive: true });
    }

    resetPanelPointer();
    updatePanelViewportMetrics();
    closePanel();
}

function initHeaderMobileMenu() {
    const $header = $('.header').first();
    if (!$header.length) return;

    const $toggle = $header.find('[data-nav-toggle="true"]').first();
    const $menu = $header.find('#headerMobileMenu').first();
    if (!$toggle.length || !$menu.length) return;

    const openClass = 'is-nav-open';
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

    const closeMenu = () => {
        $header.removeClass(openClass);
        $toggle.attr('aria-expanded', 'false');
        $menu.attr('aria-hidden', 'true');
    };

    const openMenu = () => {
        if (!isMobile()) return;
        $header.addClass(openClass);
        $toggle.attr('aria-expanded', 'true');
        $menu.attr('aria-hidden', 'false');
    };

    const toggleMenu = () => {
        if ($header.hasClass(openClass)) {
            closeMenu();
            return;
        }
        openMenu();
    };

    const syncByViewport = () => {
        if (!isMobile()) {
            closeMenu();
        }
    };

    closeMenu();

    $toggle.off('click.headerMobileMenu').on('click.headerMobileMenu', function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggleMenu();
    });

    $menu.off('click.headerMobileMenu').on('click.headerMobileMenu', 'a[href]', function () {
        closeMenu();
    });

    $(document)
        .off('click.headerMobileMenuOutside')
        .on('click.headerMobileMenuOutside', function (event) {
            if (!$header.hasClass(openClass)) return;
            const target = event.target;
            if ($toggle.is(target) || $.contains($toggle.get(0), target)) return;
            if ($menu.is(target) || $.contains($menu.get(0), target)) return;
            closeMenu();
        })
        .off('keydown.headerMobileMenuEscape')
        .on('keydown.headerMobileMenuEscape', function (event) {
            if (event.key !== 'Escape') return;
            if (!$header.hasClass(openClass)) return;
            closeMenu();
            $toggle.trigger('focus');
        });

    $(window)
        .off('resize.headerMobileMenu orientationchange.headerMobileMenu')
        .on('resize.headerMobileMenu orientationchange.headerMobileMenu', syncByViewport);

    syncByViewport();
}

/* ===== Overlay navigation ===== */
function initNavOverlay() {
    const $menuList = $('.overlay .menu-list').first();
    const $overlay = $menuList.closest('.overlay');
    const $toggle = $('.nav-toggle');
    const $close = $overlay.find('.close-btn');
    const $menuItems = $('.main-nav .menu-item');
    const $previewTitle = $overlay.find('.preview-title');
    const $previewDesc = $overlay.find('.preview-desc');
    const $previewLinks = $overlay.find('.preview-links');
    const $previewGrid = $overlay.find('.preview-grid');
    const $previewWrap = $overlay.find('.overlay-preview');
    const menuData = [];
    const defaultPreviewDesc = $previewDesc.length ? ($previewDesc.text() || '').trim() : '';

    if (!$overlay.length || !$toggle.length || !$menuList.length || !$menuItems.length) return;

    const closeAllDrawers = () => {
        $menuList.find('.drawer-item').removeClass('is-open');
        $menuList.find('.drawer-toggle[aria-expanded]').attr('aria-expanded', 'false');
        $menuList.find('.drawer-panel').attr('aria-hidden', 'true');
    };

    const setPreview = (index) => {
        if (!menuData.length) return;
        const safeIndex = Number.isFinite(index) && index >= 0 ? Math.min(index, menuData.length - 1) : 0;
        const item = menuData[safeIndex] || menuData[0];

        $menuList.find('.drawer-item').removeClass('is-active');
        $menuList.find(`.drawer-item[data-index="${safeIndex}"]`).addClass('is-active');

        if ($previewTitle.length) $previewTitle.text(item.label);
        if ($previewDesc.length) $previewDesc.text(item.previewDesc || item.desc || defaultPreviewDesc || '');
        if (item.previewAccent) {
            $overlay.get(0)?.style.setProperty('--overlay-accent', item.previewAccent);
        }

        if ($previewLinks.length) {
            $previewLinks.empty();
            let links = item.subs.length ? item.subs : [];
            if (!links.length && item.href && item.href !== '#') {
                links = [{ label: `View ${item.label}`, href: item.href }];
            }
            links.forEach((link) => {
                if (!link || !link.label) return;
                $previewLinks.append(
                    $('<a class="preview-link"></a>').attr('href', link.href || '#').text(link.label)
                );
            });
        }

        if ($previewGrid.length) {
            $previewGrid.empty();
            const images = item.previewImages || [];
            const labels = item.previewLabels || [];
            $previewGrid.css('display', images.length ? 'grid' : 'none');
            images.slice(0, 3).forEach((src, i) => {
                const cardClass = i === 0 ? 'card-a' : (i === 1 ? 'card-b' : 'card-c');
                const $card = $('<a class="preview-card"></a>')
                    .addClass(cardClass)
                    .attr('href', item.href || '#');
                if (src) {
                    $card.append($('<img/>').attr('src', src).attr('alt', ''));
                }
                const label = labels[i] || item.label;
                if (label) {
                    $card.append($('<span class="caption"></span>').text(label));
                }
                $previewGrid.append($card);
            });
        }
    };

    const openNav = () => {
        $('body').addClass('nav-open');
        $overlay.attr('aria-hidden', 'false');
        $toggle.attr('aria-expanded', 'true');
        if ($previewWrap.length) $previewWrap.attr('aria-hidden', 'false');

        const activeIndex = menuData.findIndex((item) => item.isActive);
        setPreview(activeIndex >= 0 ? activeIndex : 0);
    };

    const closeNav = () => {
        $('body').removeClass('nav-open');
        $overlay.attr('aria-hidden', 'true');
        $toggle.attr('aria-expanded', 'false');
        if ($previewWrap.length) $previewWrap.attr('aria-hidden', 'true');
        closeAllDrawers();
    };

    const buildMenu = () => {
        $menuList.empty();
        menuData.length = 0;

        $menuItems.each(function () {
            const $item = $(this);
            const $link = $item.children('a').first();
            if (!$link.length) return;

            const label = ($link.text() || '').trim();
            const href = $link.attr('href') || '#';
            const $subLinks = $item.find('.submenu a');
            const hasSub = $subLinks.length > 0;
            const previewDesc = ($item.data('preview-desc') || '').toString();
            const previewImages = ($item.data('preview-images') || '').toString();
            const previewLabels = ($item.data('preview-labels') || '').toString();
            const previewAccent = ($item.data('preview-accent') || '').toString();

            const itemData = {
                label,
                href,
                subs: [],
                isActive: $item.hasClass('is-active') || $link.attr('aria-current') === 'page',
                previewDesc: previewDesc.trim(),
                previewImages: previewImages ? previewImages.split('|').map((s) => s.trim()).filter(Boolean) : [],
                previewLabels: previewLabels ? previewLabels.split('|').map((s) => s.trim()).filter(Boolean) : [],
                previewAccent: previewAccent.trim()
            };

            $subLinks.each(function () {
                const $sub = $(this);
                const subLabel = ($sub.text() || '').trim();
                const subHref = $sub.attr('href') || '#';
                if (!subLabel) return;
                itemData.subs.push({ label: subLabel, href: subHref });
            });

            const index = menuData.push(itemData) - 1;
            const $drawer = $('<div class="drawer-item"></div>').attr('data-index', index);

            if (hasSub) {
                const $btn = $('<button class="drawer-toggle" type="button" aria-expanded="false"></button>')
                    .text(label)
                    .attr('data-cursor', label);
                const $panel = $('<div class="drawer-panel" aria-hidden="true"></div>');

                itemData.subs.forEach((sub) => {
                    $panel.append(
                        $('<a class="drawer-link"></a>')
                            .attr('href', sub.href)
                            .attr('data-cursor', sub.label)
                            .text(sub.label)
                    );
                });

                $drawer.append($btn, $panel);
            } else {
                $drawer.append(
                    $('<a class="drawer-toggle is-link"></a>')
                        .attr('href', href)
                        .attr('data-cursor', label)
                        .text(label)
                );
            }

            $menuList.append($drawer);
        });
    };

    buildMenu();
    closeAllDrawers();
    setPreview(menuData.findIndex((item) => item.isActive));

    $toggle.off('click.nav').on('click.nav', function (e) {
        e.preventDefault();
        if ($('body').hasClass('nav-open')) {
            closeNav();
        } else {
            openNav();
        }
    });

    $close.off('click.nav').on('click.nav', function (e) {
        e.preventDefault();
        closeNav();
    });

    $overlay.off('click.nav').on('click.nav', function (e) {
        if ($(e.target).closest('.overlay .inner').length) return;
        closeNav();
    });

    $menuList.off('mouseenter.navitem').on('mouseenter.navitem', '.drawer-item', function () {
        const index = Number($(this).data('index'));
        if (Number.isFinite(index)) setPreview(index);
    });

    $menuList.off('focusin.navitem').on('focusin.navitem', '.drawer-toggle, .drawer-link', function () {
        const index = Number($(this).closest('.drawer-item').data('index'));
        if (Number.isFinite(index)) setPreview(index);
    });

    $menuList.off('click.nav').on('click.nav', '.drawer-toggle', function (e) {
        const $btn = $(this);
        if (!$btn.is('button')) return;
        e.preventDefault();

        const $item = $btn.closest('.drawer-item');
        const index = Number($item.data('index'));
        if (Number.isFinite(index)) setPreview(index);

        const isMobile = window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;
        if (!isMobile) return;

        const isOpen = $item.hasClass('is-open');
        closeAllDrawers();

        if (!isOpen) {
            $item.addClass('is-open');
            $btn.attr('aria-expanded', 'true');
            $item.find('.drawer-panel').attr('aria-hidden', 'false');
        }
    });

    $overlay.off('click.navlink').on('click.navlink', 'a', function () {
        closeNav();
    });

    $(document).off('keydown.nav').on('keydown.nav', function (e) {
        if (e.key === 'Escape') closeNav();
    });
}

/* ===== Subtop builder ===== */
window.Subtop = (function () {
    const normalizePath = (path) => {
        if (!path) return '/';
        const cleaned = path.replace(/\/+$/, '');
        return cleaned || '/';
    };

    const resolvePath = (href) => {
        if (!href) return '';
        try {
            return normalizePath(new URL(href, window.location.href).pathname);
        } catch (e) {
            return '';
        }
    };

    const setText = (el, value) => {
        if (!el) return;
        if (value) {
            el.textContent = value;
            el.hidden = false;
        } else {
            el.textContent = '';
            el.hidden = true;
        }
    };

    const getDataValue = (data, ...keys) => {
        if (!data) return '';
        for (const key of keys) {
            const value = data[key];
            if (typeof value === 'string' && value.trim()) return value.trim();
        }
        return '';
    };

    const bindHorizontalScroll = (el) => {
        if (!el) return;
        el.addEventListener('wheel', (e) => {
            const canScroll = el.scrollWidth > el.clientWidth + 1;
            if (!canScroll) return;
            const dy = e.deltaY || 0;
            const dx = e.deltaX || 0;
            if (Math.abs(dy) <= Math.abs(dx)) return;
            el.scrollLeft += dy;
            e.preventDefault();
        }, { passive: false });
    };

    function init() {
        const host = document.getElementById('subtop-container');
        if (!host) return;

        const subtop = host.querySelector('.subtop');
        if (!subtop) return;

        const data = host.dataset || {};
        const eyebrow = getDataValue(data, 'stEyebrow', 'subtopEyebrow')
            || (document.body.dataset.category || '').trim();
        const rawTitle = getDataValue(data, 'stTitle', 'subtopTitle')
            || (document.body.dataset.title || document.title || '').trim();
        const title = rawTitle.split('|')[0].trim();
        const desc = getDataValue(data, 'stDesc', 'subtopDesc');
        const group = getDataValue(data, 'stGroup', 'subtopGroup');

        setText(subtop.querySelector('[data-subtop-eyebrow], .eyebrow'), eyebrow);
        const titleEl = subtop.querySelector('[data-subtop-title], .title');
        if (titleEl) titleEl.textContent = title;
        setText(subtop.querySelector('[data-subtop-desc], .desc'), desc);

        const tabs = subtop.querySelector('[data-subtop-tabs], .tabs');
        if (tabs) {
            tabs.innerHTML = '';
            if (group) {
                const tpl = host.querySelector(`template[data-subtop-group="${group}"]`);
                if (tpl && tpl.content) {
                    tabs.appendChild(tpl.content.cloneNode(true));
                }
            }

            const links = Array.from(tabs.querySelectorAll('a'));
            if (!links.length) {
                tabs.style.display = 'none';
                return;
            }

            tabs.style.display = '';
            bindHorizontalScroll(tabs);

            const explicit = getDataValue(data, 'stActive', 'subtopActive');
            let activeLink = null;

            if (explicit) {
                const lower = explicit.toLowerCase();
                activeLink = links.find((link) => {
                    const href = (link.getAttribute('href') || '').toLowerCase();
                    const text = (link.textContent || '').trim().toLowerCase();
                    return href.includes(lower) || text === lower;
                }) || null;
            }

            if (!activeLink) {
                const currentPath = normalizePath(window.location.pathname);
                activeLink = links.find((link) => {
                    const href = link.getAttribute('href') || '';
                    return resolvePath(href) === currentPath;
                }) || null;
            }

            if (activeLink) {
                links.forEach((link) => {
                    const isActive = link === activeLink;
                    link.classList.toggle('is-active', isActive);
                    if (isActive) {
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            }
        }
    }
    return { init: init };
})();

/* ===== Scroll-to-top button ===== */
function initScrollTop(scrollBus) {
    const $btn = $("#scrollTopBtn");
    if (!$btn.length) return;

    const scrollTopDuration = 1.0;
    const scrollTopEase = (t) => (
        t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2
    );
    const durationToMs = (duration) => {
        if (typeof duration !== 'number' || !isFinite(duration) || duration <= 0) return 0;
        return duration < 10 ? duration * 1000 : duration;
    };

    // Button dock settings
    const btnEl = $btn.get(0);
    const dockGap = 24;
    const dockDisableMql = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
    let isScrollTopAnimating = false;
    let scrollRootOverride = null;
    const isMainLanding = document.body?.dataset?.page === 'main';
    const $guide = isMainLanding ? $('#mainFloatingAiGuide') : $();
    const guideEl = $guide.length ? $guide.get(0) : null;
    const $guideBubble = $guide.find('.bubble');
    const $guideClose = $guide.find('.close');
    const $guideChar = $guide.find('.char');
    const $guideQuestions = $guide.find('.q');
    const $guideChat = $guide.find('.chat');
    const guideAnswers = {
        agency: {
            text: '웹에이전시 서비스는 기획, UI/UX 디자인, 퍼블리싱, 개발, 운영/유지보수까지 전체 구간으로 진행 가능합니다. 필요하신 범위를 말씀해 주시면 맞춤형으로 안내해드리겠습니다.'
        },
        factory: {
            text: '스마트팩토리는 보통 사전 진단, 목표 설정, 구축 범위 정의, 단계별 실행 순서로 진행됩니다. 현재 공정 상황을 알려주시면 현실적인 단계부터 제안드리겠습니다.'
        },
        support: {
            text: '정부지원사업 연계도 가능합니다. 기업 규모와 업종, 진행하려는 과제에 따라 가능한 사업을 먼저 확인한 뒤 준비 서류와 절차를 함께 안내해드리고 있습니다.'
        },
        homepage: {
            text: '홈페이지 제작 기간은 요구사항과 범위에 따라 달라지며, 보통 기획부터 오픈까지 단계별로 진행됩니다. 오픈 후 유지보수도 함께 운영 가능하니 필요 범위를 말씀해 주세요.'
        }
    };

    const parsePx = (value) => {
        const num = parseFloat(value);
        return Number.isFinite(num) ? num : 0;
    };

    const getBaseInset = () => {
        const style = window.getComputedStyle(btnEl);
        const inset = style.getPropertyValue('inset-block-end') || style.insetBlockEnd || '';
        const bottom = style.getPropertyValue('bottom') || style.bottom || '';
        return parsePx(inset) || parsePx(bottom);
    };

    const setDockValue = (value) => {
        const dockValue = `${value}px`;
        btnEl?.style.setProperty('--scroll-top-dock', dockValue);
        guideEl?.style.setProperty('--scroll-top-dock', dockValue);
    };

    const openGuide = () => {
        if (!guideEl) return;
        $guide.addClass('open');
        $guideBubble.attr('aria-hidden', 'false');
        $guideChar.attr('aria-expanded', 'true');
    };

    const closeGuide = () => {
        if (!guideEl) return;
        $guide.removeClass('open');
        $guideBubble.attr('aria-hidden', 'true');
        $guideChar.attr('aria-expanded', 'false');
    };

    const setGuideAnswer = (topic) => {
        if (!guideEl) return;
        const key = (topic || '').toString();
        const item = guideAnswers[key];
        if (!item) return;

        $guideQuestions.removeClass('on').attr('aria-pressed', 'false');
        const $active = $guideQuestions.filter('[data-topic="' + key + '"]').first();
        if ($active.length) {
            $active.addClass('on').attr('aria-pressed', 'true');
        }

        const askText = ($active.text() || '').trim();
        if (!$guideChat.length) return;
        if (askText) {
            $('<p class="msg user"></p>').text(askText).appendTo($guideChat);
        }
        $('<p class="msg bot"></p>').text(item.text).appendTo($guideChat);

        const chatEl = $guideChat.get(0);
        if (chatEl) {
            chatEl.scrollTop = chatEl.scrollHeight;
        }
    };

    const syncGuide = (visible) => {
        if (!guideEl) return;
        const shouldShow = !!visible;
        $guide.toggleClass('show', shouldShow);
        if (!shouldShow) {
            closeGuide();
        }
    };

    if (guideEl) {
        $guideClose.off('click.aiguide').on('click.aiguide', function (e) {
            e.preventDefault();
            closeGuide();
        });
        $guideChar.off('click.aiguide').on('click.aiguide', function (e) {
            e.preventDefault();
            if ($guide.hasClass('open')) {
                closeGuide();
            } else {
                openGuide();
            }
        });
        $guideQuestions.off('click.aiguide').on('click.aiguide', function (e) {
            e.preventDefault();
            setGuideAnswer($(this).data('topic'));
            openGuide();
        });
        $(document).off('mousedown.aiguideoutside touchstart.aiguideoutside').on('mousedown.aiguideoutside touchstart.aiguideoutside', function (e) {
            if (!$guide.hasClass('open')) return;
            if ($(e.target).closest('#mainFloatingAiGuide').length) return;
            closeGuide();
        });
    }

    // Footer overlap docking
    const updateDock = () => {
        const footerEl = document.querySelector('.footer, .site-footer');
        if (isScrollTopAnimating) {
            setDockValue(0);
            return;
        }
        if (dockDisableMql && dockDisableMql.matches) {
            setDockValue(0);
            return;
        }
        if (!footerEl || !btnEl) {
            setDockValue(0);
            return;
        }
        if (!$btn.hasClass('show')) {
            setDockValue(0);
            return;
        }
        const baseInset = getBaseInset();
        const footerRect = footerEl.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
        const overlap = Math.max(0, viewportH - baseInset - footerRect.top + dockGap);
        setDockValue(overlap);
    };

    const getVisualScrollFallbackY = () => {
        const anchor = document.querySelector('main')
            || document.querySelector('.subpage-content')
            || document.querySelector('section')
            || document.body;
        if (!anchor || typeof anchor.getBoundingClientRect !== 'function') return 0;
        const top = Number(anchor.getBoundingClientRect().top) || 0;
        return Math.max(0, -top);
    };

    const getGsapScrollY = () => {
        const scrollTrigger = window.ScrollTrigger;
        if (!scrollTrigger) return 0;

        let triggerScroll = 0;
        let gsapScroller = scrollRootOverride
            || document.scrollingElement
            || document.documentElement
            || document.body
            || window;
        if (typeof scrollTrigger.getAll === 'function') {
            const triggers = scrollTrigger.getAll();
            for (let i = 0; i < triggers.length; i += 1) {
                const trigger = triggers[i];
                const rawScroller = trigger
                    ? (typeof trigger.scroller === 'function' ? trigger.scroller() : trigger.scroller)
                    : null;

                if (typeof trigger?.scroll === 'function') {
                    const value = Number(trigger.scroll());
                    if (Number.isFinite(value) && Math.abs(value) > Math.abs(triggerScroll)) {
                        triggerScroll = value;
                    }
                }

                if (rawScroller && rawScroller !== window) {
                    gsapScroller = rawScroller;
                    break;
                }
            }
        }

        if (Math.abs(triggerScroll) > 0) {
            return triggerScroll;
        }

        if (typeof scrollTrigger.getScrollFunc === 'function') {
            const getter = scrollTrigger.getScrollFunc(gsapScroller);
            if (typeof getter === 'function') {
                const value = Number(getter());
                if (Number.isFinite(value)) return value;
            }
        }

        if (typeof scrollTrigger.scroll === 'function') {
            const value = Number(scrollTrigger.scroll());
            if (Number.isFinite(value)) return value;
        }

        return 0;
    };

    // Active scroll position
    const getScrollSnapshot = () => {
        const root = scrollRootOverride
            || document.scrollingElement
            || document.documentElement
            || document.body;
        const rootY = root && typeof root.scrollTop === 'number' ? root.scrollTop : 0;
        const docY = document.documentElement && typeof document.documentElement.scrollTop === 'number'
            ? document.documentElement.scrollTop
            : 0;
        const bodyY = document.body && typeof document.body.scrollTop === 'number'
            ? document.body.scrollTop
            : 0;
        const winY = (typeof window.scrollY === 'number' ? window.scrollY : (window.pageYOffset || 0));
        const smoothRaw = (scrollBus && scrollBus.scroll?.instance?.scroll)
            ? (scrollBus.scroll.instance.scroll.y || 0)
            : 0;
        const smoothY = Number(smoothRaw) || 0;
        const smoothAbs = Math.abs(smoothY);
        const gsapY = Number(getGsapScrollY()) || 0;
        const gsapAbs = Math.abs(gsapY);
        const visualY = Number(getVisualScrollFallbackY()) || 0;
        const y = Math.max(rootY, docY, bodyY, winY, smoothAbs, gsapAbs, visualY);
        return { y, rootY, docY, bodyY, winY, smoothY, smoothAbs, gsapY, gsapAbs, visualY };
    };

    // Main scroll element
    const isMainScrollTarget = (el) => {
        if (!el || el === document || el === window) return false;
        const h = el.clientHeight || 0;
        const scrollable = (el.scrollHeight || 0) > h + 1;
        if (!scrollable) return false;
        return h >= window.innerHeight * 0.6;
    };

    // Scroll root lookup
    const findMainScrollRoot = (start) => {
        let node = start;
        while (node && node !== document.body && node !== document.documentElement) {
            if (isMainScrollTarget(node)) return node;
            node = node.parentElement;
        }
        if (isMainScrollTarget(document.scrollingElement)) return document.scrollingElement;
        if (isMainScrollTarget(document.documentElement)) return document.documentElement;
        if (isMainScrollTarget(document.body)) return document.body;
        return null;
    };

    // Toggle button visibility
    const toggle = (snapshot) => {
        const current = snapshot || getScrollSnapshot();
        const y = current.y || 0;
        const shouldShow = y >= 50;
        $btn.toggleClass("show", shouldShow);
        syncGuide(shouldShow);
        updateDock();
    };
    scrollRootOverride = findMainScrollRoot(btnEl);
    toggle(getScrollSnapshot());

    const useScrollBus = !!(scrollBus && scrollBus.__isSmooth && typeof scrollBus.on === 'function');
    if (useScrollBus) {
        scrollBus.on('scroll', () => toggle(getScrollSnapshot()));
    }
    window.addEventListener('wheel', () => {
        const snap = getScrollSnapshot();
        // Some smooth-scroll setups do not emit native scroll events reliably.
        // Use wheel snapshots directly so the floating button can react to actual movement.
        toggle(snap);
        requestAnimationFrame(() => toggle(getScrollSnapshot()));
    }, { passive: true });
    window.addEventListener('scroll', () => toggle(getScrollSnapshot()), { passive: true });
    window.addEventListener('resize', () => toggle(getScrollSnapshot()), { passive: true });
    window.addEventListener('load', () => toggle(getScrollSnapshot()), { once: true });

    $btn.on("click", function (e) {
        e.preventDefault();
        window.__snapSetOff(true);
        isScrollTopAnimating = true;
        setDockValue(0);
        const duration = scrollTopDuration;
        const snapReleaseMs = durationToMs(duration) + 50;
        const releaseScrollTopState = () => {
            isScrollTopAnimating = false;
            window.__snapSetOff(false);
            toggle(getScrollSnapshot());
            requestAnimationFrame(() => toggle(getScrollSnapshot()));
        };
        if (scrollBus && typeof scrollBus.scrollTo === 'function') {
            scrollBus.scrollTo(0, { duration, ease: scrollTopEase });
            setTimeout(releaseScrollTopState, snapReleaseMs);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(releaseScrollTopState, snapReleaseMs || 300);
        }
    });
}

/* ===== GSAP mobile touch sync ===== */
function initGsapTouchBridge(scrollBus) {
    if (window.__ubiqueGsapTouchBridgeBound) return;
    const st = window.ScrollTrigger;
    if (!st) return;

    const isTouchDevice = ('ontouchstart' in window)
        || (window.navigator && Number(window.navigator.maxTouchPoints) > 0)
        || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const isMobileViewport = !!(window.matchMedia && window.matchMedia('(max-width: 1024px)').matches);
    if (!isTouchDevice || !isMobileViewport) return;

    window.__ubiqueGsapTouchBridgeBound = true;

    let rafId = 0;
    let refreshTimer = 0;

    const scheduleUpdate = () => {
        if (rafId) return;
        rafId = window.requestAnimationFrame(() => {
            rafId = 0;
            if (!window.ScrollTrigger) return;
            window.ScrollTrigger.update();
        });
    };

    const scheduleRefresh = (delay = 120) => {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = 0;
        }
        refreshTimer = window.setTimeout(() => {
            refreshTimer = 0;
            if (!window.ScrollTrigger) return;
            window.ScrollTrigger.refresh();
            window.ScrollTrigger.update();
        }, Math.max(0, delay));
    };

    if (scrollBus && typeof scrollBus.on === 'function') {
        scrollBus.on('scroll', scheduleUpdate);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    document.addEventListener('ubique:header-sync', scheduleUpdate);
    document.addEventListener('ubique:header-hide-toggle', scheduleUpdate);
    window.addEventListener('pageshow', () => {
        scheduleUpdate();
        scheduleRefresh(60);
    });

    window.addEventListener('touchstart', scheduleUpdate, { passive: true });
    window.addEventListener('touchmove', scheduleUpdate, { passive: true });
    window.addEventListener('touchend', () => {
        scheduleUpdate();
        scheduleRefresh(80);
    }, { passive: true });
    window.addEventListener('touchcancel', () => {
        scheduleUpdate();
        scheduleRefresh(80);
    }, { passive: true });
    window.addEventListener('pointerdown', scheduleUpdate, { passive: true });
    window.addEventListener('pointermove', scheduleUpdate, { passive: true });
    window.addEventListener('pointerup', () => {
        scheduleUpdate();
        scheduleRefresh(80);
    }, { passive: true });
    window.addEventListener('pointercancel', () => {
        scheduleUpdate();
        scheduleRefresh(80);
    }, { passive: true });
    window.addEventListener('orientationchange', () => {
        scheduleUpdate();
        scheduleRefresh(140);
    }, { passive: true });

    window.addEventListener('resize', () => {
        scheduleUpdate();
        scheduleRefresh(140);
    }, { passive: true });

    scheduleUpdate();
    scheduleRefresh(0);
    window.setTimeout(scheduleUpdate, 180);
    window.setTimeout(() => scheduleRefresh(0), 420);
}

/* ===== Boot ===== */
$(async function () {
    ensureFontAwesome();
    await loadComponents();
    await loadCommonScriptOnce(resolveCommonAssetPath('animation/reveal.js'));
    await loadCommonScriptOnce(resolveCommonAssetPath('animation/effects.js'));

    const scroller = await initSmoothScroll();
    if (scroller) {
        window.scrollInstance = scroller;
    }
    if (!window.__scrollEngineReady) {
        window.__scrollEngineReady = true;
        const engine = scroller?.__isSmooth ? 'smooth' : 'native';
        $(document).trigger('scrollengine:ready', { engine });
    }
    initHeader(scroller);
    initNavOverlay();
    initScrollTop(scroller);
    if (document.querySelector('.photo01, .photo02, .photo03, .photo04')) {
        await loadCommonScriptOnce(resolveCommonAssetPath('pages/sub04.js'));
    }
    if (window.location.pathname.toLowerCase().includes('sub0502')) {
        await loadCommonScriptOnce(resolveCommonAssetPath('pages/sub0502.js'));
    }
    await ensureGsapCssPlugin();
    window.Reveal?.init?.();
    window.MotionEffects?.init?.();
    initGsapTouchBridge(scroller);

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }

});

