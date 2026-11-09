/**
 * AI Solution Page
 * - Section 2: Auto-looping tilted card marquee
 * - Section 3: Coverflow showcase carousel
 */

$(function () {
    const section = document.querySelector('.cont1');
    const headline = section ? section.querySelector('[data-char-reveal]') : null;
    if (!section || !headline) return;

    const sourceText = (headline.textContent || '').replace(/\r/g, '');
    if (!sourceText.trim()) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chars = [];
    const fragment = document.createDocumentFragment();

    const normalizeTone = (node, parentTone = 'strong') => {
        if (!node || !node.classList) return parentTone;
        if (node.classList.contains('is-light')) return 'light';
        if (node.classList.contains('is-strong')) return 'strong';
        return parentTone;
    };

    const normalizeScale = (node, parentScale = 'base') => {
        if (!node || !node.classList) return parentScale;
        if (node.classList.contains('is-mid')) return 'mid';
        return parentScale;
    };

    const appendWordToken = (word, parentTone = 'strong', parentScale = 'base') => {
        if (!word) return;
        const wordWrap = document.createElement('span');
        wordWrap.className = 'headline-word';

        Array.from(word).forEach((char) => {
            const span = document.createElement('span');
            span.className = `headline-char tone-${parentTone} size-${parentScale}`;
            span.textContent = char;
            wordWrap.appendChild(span);
            chars.push(span);
        });

        fragment.appendChild(wordWrap);
    };

    const appendCharsFromNode = (node, parentTone = 'strong', parentScale = 'base') => {
        if (!node) return;

        if (node.nodeType === Node.TEXT_NODE) {
            const text = (node.nodeValue || '').replace(/\r/g, '');
            if (!text) return;

            const tokens = text.split(/(\s+)/);
            tokens.forEach((token) => {
                if (!token) return;
                if (/^\s+$/.test(token)) {
                    Array.from(token).forEach((char) => {
                        if (char === '\n') {
                            fragment.appendChild(document.createElement('br'));
                        } else {
                            fragment.appendChild(document.createTextNode(' '));
                        }
                    });
                    return;
                }
                appendWordToken(token, parentTone, parentScale);
            });
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.tagName === 'BR') {
            const breaker = document.createElement('span');
            breaker.className = `headline-break ${node.className || ''}`.trim();
            breaker.setAttribute('aria-hidden', 'true');
            fragment.appendChild(breaker);
            return;
        }

        const nextTone = normalizeTone(node, parentTone);
        const nextScale = normalizeScale(node, parentScale);
        Array.from(node.childNodes).forEach((child) => appendCharsFromNode(child, nextTone, nextScale));
    };

    Array.from(headline.childNodes).forEach((node) => appendCharsFromNode(node, 'strong', 'base'));

    headline.textContent = '';
    headline.appendChild(fragment);

    if (!chars.length) return;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const getScrollY = () => {
        const root = document.scrollingElement || document.documentElement || document.body;
        const rootY = root && typeof root.scrollTop === 'number' ? root.scrollTop : 0;
        const docY = document.documentElement && typeof document.documentElement.scrollTop === 'number'
            ? document.documentElement.scrollTop
            : 0;
        const bodyY = document.body && typeof document.body.scrollTop === 'number'
            ? document.body.scrollTop
            : 0;
        const winY = typeof window.scrollY === 'number' ? window.scrollY : (window.pageYOffset || 0);
        const smoothRaw = (
            window.scrollInstance
            && window.scrollInstance.scroll
            && window.scrollInstance.scroll.instance
            && window.scrollInstance.scroll.instance.scroll
        )
            ? window.scrollInstance.scroll.instance.scroll.y
            : 0;
        const smoothY = Math.abs(Number(smoothRaw) || 0);
        return Math.max(rootY, docY, bodyY, winY, smoothY);
    };

    let litCount = -1;
    const applyLit = (count) => {
        if (count === litCount) return;
        litCount = count;
        chars.forEach((charEl, index) => {
            charEl.classList.toggle('is-lit', index < count);
        });
    };

    if (prefersReduced) {
        applyLit(chars.length);
        return;
    }

    const update = () => {
        const sectionTop = section.offsetTop || 0;
        const sectionHeight = Math.max(1, section.offsetHeight || 1);
        const y = getScrollY();
        const startY = sectionTop;
        const travel = Math.max(1, sectionHeight * 0.22);
        const progress = 0.2 + (clamp((y - startY) / travel, 0, 1) * 0.8);
        const count = Math.round(chars.length * progress);
        applyLit(count);
    };

    let rafId = 0;
    const tick = () => {
        update();
        rafId = window.requestAnimationFrame(tick);
    };

    update();
    rafId = window.requestAnimationFrame(tick);

    window.addEventListener('beforeunload', () => {
        if (rafId) window.cancelAnimationFrame(rafId);
    }, { once: true });
});

$(function () {
    const wrap = document.querySelector('.cont2 .wrap');
    const lane = document.querySelector('.cont2 .lane');
    if (!wrap || !lane) return;

    const originalCards = Array.from(lane.children);
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (originalCards.length < 2 || prefersReduced) return;

    const clones = document.createDocumentFragment();
    originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clones.appendChild(clone);
    });
    lane.appendChild(clones);

    let trackWidth = 0;
    let x = 0;
    let lastTime = 0;
    let paused = false;
    let resizeTimer = 0;
    const getSpeed = () => {
        const viewport = window.innerWidth || document.documentElement.clientWidth || 0;
        return viewport <= 768 ? 150 : 220;
    };

    const measure = () => {
        lane.style.transform = 'translate3d(0, 0, 0)';
        const first = lane.children[0];
        const cloneFirst = lane.children[originalCards.length];

        if (first && cloneFirst) {
            trackWidth = cloneFirst.offsetLeft - first.offsetLeft;
        } else {
            trackWidth = lane.scrollWidth * 0.5;
        }

        x = 0;
        lastTime = 0;
    };

    const tick = (time) => {
        if (!lastTime) lastTime = time;
        const delta = (time - lastTime) / 1000;
        lastTime = time;

        if (!paused && trackWidth > 0) {
            x -= getSpeed() * delta;
            if (-x >= trackWidth) x += trackWidth;
            lane.style.transform = `translate3d(${x.toFixed(3)}px, 0, 0)`;
        }

        window.requestAnimationFrame(tick);
    };

    const bindCardPause = (card) => {
        card.addEventListener('mouseenter', () => { paused = true; });
        card.addEventListener('mouseleave', () => { paused = false; });
        card.addEventListener('focusin', () => { paused = true; });
        card.addEventListener('focusout', () => { paused = false; });
        card.addEventListener('touchstart', () => { paused = true; }, { passive: true });
        card.addEventListener('touchend', () => { paused = false; }, { passive: true });
    };

    Array.from(lane.children).forEach(bindCardPause);

    wrap.addEventListener('mouseleave', () => { paused = false; });

    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(measure, 120);
    }, { passive: true });

    measure();
    window.requestAnimationFrame(tick);
});

$(function () {
    const section = document.querySelector('.cont3');
    const container = section ? section.querySelector('.container') : null;
    const wrap = section ? section.querySelector('[dataflow]') : null;
    const track = section ? section.querySelector('[datapaneltrack]') : null;
    const tabsWrap = section ? section.querySelector('[datatabs]') : null;
    const tabsRow = tabsWrap ? tabsWrap.querySelector('.tabsrow') : null;
    const tabs = tabsRow ? Array.from(tabsRow.querySelectorAll('[datatab]')) : [];
    const line = tabsWrap ? tabsWrap.querySelector('.line') : null;
    const fill = section ? section.querySelector('[dataline]') : null;
    const dot = section ? section.querySelector('[datadot]') : null;
    const items = wrap ? Array.from(wrap.querySelectorAll('[dataitem]')) : [];
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!section || !container || !wrap || !track || !tabsWrap || !tabs.length || !line || !fill || !dot || !items.length) return;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const mix = (from, to, amount) => Math.round(from + ((to - from) * amount));
    const smoothStep = (value) => {
        const t = clamp(value, 0, 1);
        return t * t * (3 - (2 * t));
    };
    const DEBUG_FLAG_KEY = '__AIS_DEBUG_SCROLL';
    window[DEBUG_FLAG_KEY] = false;
    const DEBUG_VERBOSE_KEY = '__AIS_DEBUG_SCROLL_VERBOSE';
    window[DEBUG_VERBOSE_KEY] = false;
    const isDebugOn = () => false;
    const isVerboseDebugOn = () => false;
    const debugLog = (...args) => {
        if (!isDebugOn()) return;
        console.log('[AI-SOLUTION][cont3]', ...args);
    };
    const debugEvent = (name, payload = {}) => {
        if (!isDebugOn()) return;
        console.log(`[AI-SOLUTION][cont3][${name}]`, payload);
    };
    const count = items.length;
    const maxIndex = Math.max(1, count - 1);

    const state = {
        progress: 0,
        index: 0,
        local: 0,
        tabCenters: []
    };

        const svgTemplates = [
        `<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M449.999 449.999C367.156 532.842 232.842 532.842 149.999 449.999C67.1565 367.156 67.1565 232.842 149.999 149.999C232.842 67.1565 367.156 67.1565 449.999 149.999C532.842 232.842 532.842 367.156 449.999 449.999Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <path d="M426.034 174.496C495.139 243.601 494.97 355.811 425.657 425.124C356.344 494.437 244.134 494.606 175.029 425.501C105.924 356.396 106.093 244.186 175.406 174.873C244.719 105.56 356.929 105.391 426.034 174.496Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <path d="M401.006 400.625C345.638 455.992 255.702 455.823 200.126 400.248C144.551 344.672 144.382 254.736 199.749 199.368C255.117 144.001 345.053 144.17 400.629 199.745C456.204 255.321 456.373 345.257 401.006 400.625Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <path d="M376.288 224.245C417.917 265.874 417.748 333.538 375.911 375.376C334.073 417.213 266.41 417.382 224.78 375.752C183.151 334.123 183.319 266.459 225.157 224.622C266.995 182.784 334.658 182.615 376.288 224.245Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <g filter="url(#filter0_f_32770_712)">
    <path d="M132.294 468.258L467.721 132.831M466.961 139.608L467.714 132.824L460.93 133.577" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="150.002" cy="451" r="4" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="175" cy="426" r="4" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="200" cy="401" r="4" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="225" cy="376" r="4" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="377.004" cy="225" r="4" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="401" cy="200" r="4" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="426" cy="175" r="4" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    </g>
    <path d="M132.294 468.258L467.721 132.831M466.961 139.608L467.714 132.824L460.93 133.577" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="149.517" cy="450.518" r="3.5" transform="rotate(-0.284162 149.517 450.518)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="174.515" cy="425.518" r="3.5" transform="rotate(-0.284162 174.515 425.518)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="199.517" cy="400.518" r="3.5" transform="rotate(-0.284162 199.517 400.518)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="224.517" cy="375.518" r="3.5" transform="rotate(-0.284162 224.517 375.518)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="377.062" cy="225.061" r="3.5" transform="rotate(-0.284162 377.062 225.061)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="400.939" cy="199.944" r="3.5" transform="rotate(-0.284162 400.939 199.944)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="425.812" cy="174.819" r="3.5" transform="rotate(-0.284162 425.812 174.819)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <defs>
    <filter id="filter0_f_32770_712" x="125.293" y="125.824" width="349.428" height="349.434" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="3" result="effect1_foregroundBlur_32770_712"/>
    </filter>
    </defs>
    </svg>`,
        `<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M482 459.64L300 398.28L118 459.64M482 459.64L300 521L118 459.64M482 459.64V346.36M118 459.64V346.36M482 346.36L300 285L118 346.36M482 346.36L300 407.72L118 346.36" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <path d="M482 201.648L300 140.296L118 201.648M482 201.648L300 263L118 201.648M482 201.648V147.352M118 201.648V147.352M482 147.352L300 86L118 147.352M482 147.352C410.925 169.749 371.075 186.307 300 208.704L118 147.352" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <path d="M439 297.101L300 250.203L161 297.101M439 297.101L300 344L161 297.101M439 297.101V276.899M161 297.101V276.899M439 276.899L300 230L161 276.899M439 276.899L300 323.797L161 276.899" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <g filter="url(#filter0_f_32770_744)">
    <path d="M300 536.631L300 62.2656" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="300.5" cy="536.5" r="4.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.5" cy="406.5" r="4.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.5" cy="63.5" r="4.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.5" cy="261.5" r="4.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.5" cy="283.5" r="4.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    </g>
    <path d="M300.455 536.631L300.455 62.2656" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="300.5" cy="536.5" r="3.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.5" cy="406.5" r="3.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.5" cy="63.5" r="3.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.5" cy="261.5" r="3.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.5" cy="283.5" r="3.5" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <defs>
    <filter id="filter0_f_32770_744" x="290" y="53" width="21" height="494" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="3" result="effect1_foregroundBlur_32770_744"/>
    </filter>
    </defs>
    </svg>`,
        `<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M303.25 258.012L400.46 258.012L449.06 173.832L400.46 89.6517L303.25 89.6517L254.65 173.832L303.25 258.012Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="240 20"/>
    <path d="M303.25 89.6517L400.46 258.012" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M254.65 173.828L449.06 173.828" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M157.25 342.012L254.46 342.012L303.06 257.832L254.46 173.652L157.25 173.652L108.65 257.832L157.25 342.012Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="240 20"/>
    <path d="M157.25 342.012L254.46 173.652" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M108.65 257.828L303.06 257.828" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M254.276 509.988L351.486 509.988L400.086 425.808L351.486 341.628L254.276 341.628L205.676 425.808L254.276 509.988Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="240 20"/>
    <path d="M254.275 509.988L351.485 341.628" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <g filter="url(#filter0_f_32770_719)">
    <path d="M303.998 90.0039L205.498 258.004L302.502 426" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="303.148" cy="90.1471" r="4.5" transform="rotate(60 303.148 90.1471)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="206.148" cy="258.147" r="4.5" transform="rotate(60 206.148 258.147)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    </g>
    <path d="M302.502 90.9961L205.5 258.5L302.502 425.996" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="302.781" cy="89.7811" r="3.5" transform="rotate(60 302.781 89.7811)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="205.514" cy="257.781" r="3.5" transform="rotate(60 205.514 257.781)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="302.5" cy="425.5" r="3.5" transform="rotate(90 302.5 425.5)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <defs>
    <filter id="filter0_f_32770_719" x="195.646" y="79.6445" width="118.002" height="353.355" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="3" result="effect1_foregroundBlur_32770_719"/>
    </filter>
    </defs>
    </svg>`,
        `<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M450.132 450.132C367.289 532.975 232.975 532.975 150.132 450.132C67.2893 367.289 67.2893 232.975 150.132 150.132C232.975 67.2893 367.289 67.2893 450.132 150.132C532.975 232.975 532.975 367.289 450.132 450.132Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <path d="M426.167 209.719C495.272 278.824 495.103 391.034 425.79 460.347C356.477 529.66 244.267 529.829 175.162 460.724C106.057 391.619 106.226 279.409 175.539 210.095C244.852 140.782 357.062 140.614 426.167 209.719Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <path d="M401.138 470.672C345.771 526.039 255.834 525.87 200.259 470.295C144.684 414.719 144.515 324.783 199.882 269.415C255.249 214.048 345.186 214.217 400.761 269.792C456.337 325.368 456.506 415.304 401.138 470.672Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <path d="M376.42 329.112C418.05 370.742 417.881 438.405 376.044 480.243C334.206 522.08 266.542 522.249 224.913 480.62C183.283 438.99 183.452 371.327 225.29 329.489C267.127 287.651 334.791 287.483 376.42 329.112Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-dasharray="240 10"/>
    <g filter="url(#filter0_f_32770_769)">
    <path d="M301.002 512.996L300.01 63.3518M304.264 68.6815L300 63.3516L295.736 68.6815" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="300.329" cy="512.996" r="4" transform="rotate(-45 300.329 512.996)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.657" cy="227.656" r="4" transform="rotate(-45 300.657 227.656)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="301.659" cy="295.656" r="4" transform="rotate(-45 301.659 295.656)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.329" cy="406.93" r="4" transform="rotate(-45 300.329 406.93)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="301.036" cy="192.676" r="4" transform="rotate(-45 301.036 192.676)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.329" cy="158.031" r="4" transform="rotate(-45 300.329 158.031)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.327" cy="122.676" r="4" transform="rotate(-45 300.327 122.676)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    </g>
    <path d="M301.275 513V63.3518M305.53 68.6815L301.266 63.3516L297.002 68.6815" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="300.952" cy="512.999" r="3.5" transform="rotate(-45.2842 300.952 512.999)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.952" cy="296.307" r="3.5" transform="rotate(-45.2842 300.952 296.307)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.952" cy="227.948" r="3.5" transform="rotate(-45.2842 300.952 227.948)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.952" cy="406.932" r="3.5" transform="rotate(-45.2842 300.952 406.932)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.952" cy="192.679" r="3.5" transform="rotate(-45.2842 300.952 192.679)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.952" cy="158.034" r="3.5" transform="rotate(-45.2842 300.952 158.034)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="300.952" cy="122.679" r="3.5" transform="rotate(-45.2842 300.952 122.679)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <defs>
    <filter id="filter0_f_32770_769" x="288.736" y="56.3516" width="22.9219" height="466.645" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="3" result="effect1_foregroundBlur_32770_769"/>
    </filter>
    </defs>
    </svg>`,
        `<svg width="323" height="425" viewBox="0 0 323 425" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.5 424.008L0.5 161.318C0.5 72.4962 72.496 0.5 161.318 0.5C250.14 0.5 322.136 72.4962 322.136 161.318V424.008" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="240 20"/>
    <path d="M31.3652 395.481V164.535C31.3652 92.8368 89.4794 34.7227 161.177 34.7227C232.875 34.7227 290.989 92.8368 290.989 164.535V395.481" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="240 20"/>
    <path d="M62.1973 366.964L62.1973 167.782C62.1973 113.228 106.43 68.9961 160.984 68.9961C215.538 68.9961 259.769 113.228 259.769 167.782V366.964" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="240 20"/>
    <path d="M93.043 338.441V171.003C93.043 133.573 123.393 103.223 160.823 103.223C198.253 103.223 228.603 133.573 228.603 171.003V338.441" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="240 20"/>
    <path d="M123.893 309.928L123.893 174.234C123.893 153.928 140.36 137.48 160.646 137.48C180.953 137.48 197.401 153.948 197.401 174.234V309.928" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="240 20"/>
    </svg>`,
        `<svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_f_32783_527)">
    <path d="M67.7111 299.936L533.656 299.936M527.438 294.972L533.656 299.947L527.438 304.922" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 140.047 303.902)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 201.883 304.785)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 263.719 304.781)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 337.221 303.906)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 462.061 304.785)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 399.059 304.785)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    </g>
    <path d="M67.7117 299.937L533.447 299.932M527.229 294.968L533.447 299.943L527.229 304.918" stroke="#63ACFF" style="stroke:#63ACFF;stroke:color(display-p3 0.3894 0.6744 1.0000);stroke-opacity:1;" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 140.051 303.898)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 201.887 304.785)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 263.723 304.785)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 337.225 303.898)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 462.061 304.781)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <circle cx="3.10925" cy="3.10925" r="3.10925" transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 399.059 304.785)" fill="#63ACFF" style="fill:#63ACFF;fill:color(display-p3 0.3894 0.6744 1.0000);fill-opacity:1;"/>
    <path d="M483.797 411.397L299.47 517.795L115.205 411.397V198.601L299.47 92.2031L483.797 198.601V411.397Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M391.663 251.77L299.468 198.602L207.336 251.77L299.468 305L391.663 251.77Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M299.469 305V411.398L391.663 358.168V251.77L299.469 305Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M207.336 251.77V358.168L299.468 411.398V305L207.336 251.77Z" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M115.205 411.398L207.337 358.168" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M299.469 92.2031V198.601" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M391.664 358.168L483.796 411.398" stroke="white" style="stroke:white;stroke-opacity:1;" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <defs>
    <filter id="filter0_f_32783_527" x="50.2109" y="277.473" width="500.945" height="44.9492" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="8.5" result="effect1_foregroundBlur_32783_527"/>
    </filter>
    </defs>
    </svg>`
        ];

    const overlayByIndex = new Map();
    const overlayLayouts = [];

    let trigger = null;
    let resizeTimer = 0;
    let activeTab = -1;
    let activePanel = -1;
    let setTrackX = null;
    let setFillWidth = null;
    let setDotLeft = null;
    let smoothBridgeEngine = null;
    let smoothBridgeHandler = null;
    let lastDebugUpdateAt = 0;
    let triggerScroller = null;
    let entryTrigger = null;
    let triggerBuiltWithSmooth = null;
    let mobileSwiper = null;
    let fallbackBound = false;
    let fallbackHandler = null;

    const mobilePagination = wrap ? wrap.querySelector('.mobile-swiper-pagination') : null;
    const MOBILE_MAX_WIDTH = 768;
    const isMobileViewport = () => (window.innerWidth || document.documentElement.clientWidth || 0) <= MOBILE_MAX_WIDTH;

    const spotOffsetX = -10;
    debugLog('init', { prefersReduced, panelCount: count, maxIndex });

    const timelineState = {
        inViewport: false,
        pinActive: false,
        sectionOutAbove: false,
        sectionOutBelow: true,
        footerOverlapPx: 0,
        pinEndReached: false,
        pageEndReached: false,
        lastSnapshotAt: 0,
        lastWheelAt: 0,
        lastNativeScrollAt: 0
    };

    const getFooterEl = (() => {
        let cached = null;
        return () => {
            if (cached && cached.isConnected) return cached;
            cached = document.querySelector('#footer-container .footer') || document.querySelector('.footer');
            return cached || null;
        };
    })();

    const roundIfFinite = (value, digits = 0) => {
        if (!Number.isFinite(value)) return null;
        const factor = Math.pow(10, digits);
        return Math.round(value * factor) / factor;
    };

    const getLiveScrollY = () => {
        if (trigger && typeof trigger.scroll === 'function') {
            const triggerY = trigger.scroll();
            if (Number.isFinite(triggerY)) return triggerY;
        }
        if (triggerScroller && typeof triggerScroller.scrollTop === 'number') {
            return triggerScroller.scrollTop;
        }
        const engineY = (
            window.scrollInstance
            && window.scrollInstance.scroll
            && window.scrollInstance.scroll.instance
            && window.scrollInstance.scroll.instance.scroll
            && typeof window.scrollInstance.scroll.instance.scroll.y === 'number'
        )
            ? window.scrollInstance.scroll.instance.scroll.y
            : NaN;
        if (Number.isFinite(engineY)) return engineY;
        return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    };

    const getLiveMaxScroll = () => {
        if (triggerScroller && typeof triggerScroller.scrollHeight === 'number') {
            const maxByCustom = Math.max(0, triggerScroller.scrollHeight - triggerScroller.clientHeight);
            if (maxByCustom > 0) return maxByCustom;
        }

        const doc = document.documentElement;
        const body = document.body;
        const viewportH = window.innerHeight || (doc ? doc.clientHeight : 0) || 0;
        const docScrollH = doc && typeof doc.scrollHeight === 'number' ? doc.scrollHeight : 0;
        const bodyScrollH = body && typeof body.scrollHeight === 'number' ? body.scrollHeight : 0;
        const maxHeight = Math.max(docScrollH, bodyScrollH);
        return Math.max(0, maxHeight - viewportH);
    };

    const overlapPxOfRects = (a, b) => {
        if (!a || !b) return 0;
        return Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    };

    const collectTimelineMetrics = () => {
        const sectionRect = section.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 1;
        const footerEl = getFooterEl();
        const footerRect = footerEl ? footerEl.getBoundingClientRect() : null;
        const footerOverlapPx = footerRect ? overlapPxOfRects(sectionRect, footerRect) : 0;
        const footerOverlapRatio = footerRect && footerRect.height > 0
            ? (footerOverlapPx / footerRect.height)
            : 0;
        const scrollY = getLiveScrollY();
        const maxScroll = getLiveMaxScroll();
        const pinProgress = trigger ? trigger.progress : 0;
        const pinActive = !!(trigger && trigger.isActive);
        const pinEndReached = !!(trigger && trigger.end <= (scrollY + 1));
        const pageEndReached = maxScroll > 0 && scrollY >= (maxScroll - 1);
        const inViewport = sectionRect.bottom > 0 && sectionRect.top < viewportH;
        const sectionOutAbove = sectionRect.bottom <= 0;
        const sectionOutBelow = sectionRect.top >= viewportH;
        const velocity = trigger && typeof trigger.getVelocity === 'function'
            ? trigger.getVelocity()
            : 0;

        return {
            viewportH,
            sectionRect,
            footerOverlapPx,
            footerOverlapRatio,
            scrollY,
            maxScroll,
            pinProgress,
            pinActive,
            pinEndReached,
            pageEndReached,
            inViewport,
            sectionOutAbove,
            sectionOutBelow,
            velocity
        };
    };

    const probeTimeline = (source = 'probe', options = {}) => {
        if (!isDebugOn()) return;
        const forceSnapshot = !!options.forceSnapshot;
        const metrics = collectTimelineMetrics();
        const now = Date.now();

        if (!timelineState.inViewport && metrics.inViewport) {
            debugEvent('section-enter', {
                label: '섹션 진입',
                source,
                scrollY: roundIfFinite(metrics.scrollY, 0),
                sectionTop: roundIfFinite(metrics.sectionRect.top, 1)
            });
        }
        if (timelineState.inViewport && !metrics.inViewport) {
            debugEvent('section-leave', {
                label: '섹션 나감',
                source,
                direction: metrics.sectionOutAbove ? 'up' : (metrics.sectionOutBelow ? 'down' : 'unknown'),
                scrollY: roundIfFinite(metrics.scrollY, 0),
                sectionTop: roundIfFinite(metrics.sectionRect.top, 1),
                sectionBottom: roundIfFinite(metrics.sectionRect.bottom, 1)
            });
        }

        if (!timelineState.pinActive && metrics.pinActive) {
            debugEvent('section-pin', {
                label: '섹션 pin',
                source,
                progress: roundIfFinite(metrics.pinProgress, 4),
                scrollY: roundIfFinite(metrics.scrollY, 0)
            });
        }
        if (timelineState.pinActive && !metrics.pinActive) {
            debugEvent('section-unpin', {
                label: '섹션 pin 해제',
                source,
                progress: roundIfFinite(metrics.pinProgress, 4),
                scrollY: roundIfFinite(metrics.scrollY, 0)
            });
        }

        if (timelineState.footerOverlapPx <= 0 && metrics.footerOverlapPx > 0) {
            debugEvent('section-footer-overlap-start', {
                label: '섹션이 푸터와 겹치기 시작',
                source,
                overlapPx: roundIfFinite(metrics.footerOverlapPx, 1),
                overlapRatio: roundIfFinite(metrics.footerOverlapRatio, 4)
            });
        }
        if (timelineState.footerOverlapPx > 0 && metrics.footerOverlapPx <= 0) {
            debugEvent('section-footer-overlap-end', {
                label: '섹션과 푸터 겹침 해소',
                source,
                overlapPx: 0
            });
        }
        if (metrics.footerOverlapPx > 0 && Math.abs(metrics.footerOverlapPx - timelineState.footerOverlapPx) >= 12) {
            debugEvent('section-footer-overlap-change', {
                label: '섹션/푸터 겹침 정도 변경',
                source,
                overlapPx: roundIfFinite(metrics.footerOverlapPx, 1),
                overlapRatio: roundIfFinite(metrics.footerOverlapRatio, 4)
            });
        }

        if (!timelineState.pinEndReached && metrics.pinEndReached) {
            debugEvent('scroll-reach-pin-end', {
                label: '스크롤이 pin 끝에 닿음',
                source,
                scrollY: roundIfFinite(metrics.scrollY, 0)
            });
        }
        if (!timelineState.pageEndReached && metrics.pageEndReached) {
            debugEvent('scroll-reach-page-end', {
                label: '스크롤이 페이지 끝에 닿음',
                source,
                scrollY: roundIfFinite(metrics.scrollY, 0),
                maxScroll: roundIfFinite(metrics.maxScroll, 0)
            });
        }

        if (isVerboseDebugOn() && (forceSnapshot || (now - timelineState.lastSnapshotAt) >= 180)) {
            timelineState.lastSnapshotAt = now;
            debugLog('timeline-snapshot', {
                source,
                scrollY: roundIfFinite(metrics.scrollY, 0),
                maxScroll: roundIfFinite(metrics.maxScroll, 0),
                sectionTop: roundIfFinite(metrics.sectionRect.top, 1),
                sectionBottom: roundIfFinite(metrics.sectionRect.bottom, 1),
                pinActive: metrics.pinActive,
                pinProgress: roundIfFinite(metrics.pinProgress, 4),
                velocity: roundIfFinite(metrics.velocity, 0),
                footerOverlapPx: roundIfFinite(metrics.footerOverlapPx, 1),
                footerOverlapRatio: roundIfFinite(metrics.footerOverlapRatio, 4)
            });
        }

        timelineState.inViewport = metrics.inViewport;
        timelineState.pinActive = metrics.pinActive;
        timelineState.sectionOutAbove = metrics.sectionOutAbove;
        timelineState.sectionOutBelow = metrics.sectionOutBelow;
        timelineState.footerOverlapPx = metrics.footerOverlapPx;
        timelineState.pinEndReached = metrics.pinEndReached;
        timelineState.pageEndReached = metrics.pageEndReached;
    };

    const prepareDrawables = (overlay) => {
        const strokeDrawables = overlay.querySelectorAll('path, line, polyline, polygon');
        strokeDrawables.forEach((shape) => {
            if (typeof shape.getTotalLength !== 'function') return;
            const length = shape.getTotalLength();
            if (!Number.isFinite(length) || length <= 0) return;
            shape.style.strokeDasharray = `${length}`;
            shape.style.strokeDashoffset = `${length}`;
            shape.dataset.length = String(length);
        });

        const markerDrawables = overlay.querySelectorAll('circle, rect, ellipse');
        markerDrawables.forEach((shape) => {
            shape.style.opacity = '0';
            shape.style.transformOrigin = '50% 50%';
            shape.style.transformBox = 'fill-box';
            shape.style.transform = 'scale(0.86)';
            shape.dataset.marker = 'true';
        });
    };

    const playCardDrawOnce = (index) => {
        const overlay = overlayByIndex.get(index);
        if (!overlay || overlay.dataset.played === 'true') return;

        overlay.classList.add('is-visible');
        window.requestAnimationFrame(() => {
            const strokeDrawables = overlay.querySelectorAll('path, line, polyline, polygon');
            strokeDrawables.forEach((shape) => {
                if (!shape.dataset.length) return;
                shape.style.strokeDashoffset = '0';
            });

            const markerDrawables = overlay.querySelectorAll('circle, rect, ellipse');
            markerDrawables.forEach((shape) => {
                if (shape.dataset.marker !== 'true') return;
                shape.style.opacity = '1';
                shape.style.transform = 'scale(1)';
            });
        });

        overlay.dataset.played = 'true';
    };

    const layoutOverlay = (entry) => {
        if (!entry || !entry.panel || !entry.overlay || !entry.pic) return;

        const width = entry.pic.offsetWidth || entry.pic.clientWidth;
        const height = entry.pic.offsetHeight || entry.pic.clientHeight;

        let centerX = entry.pic.offsetLeft + (width * 0.5);
        let centerY = entry.pic.offsetTop + (height * 0.5);

        if (!Number.isFinite(centerX) || !Number.isFinite(centerY) || width <= 0 || height <= 0) {
            const panelRect = entry.panel.getBoundingClientRect();
            const picRect = entry.pic.getBoundingClientRect();
            centerX = (picRect.left - panelRect.left) + (picRect.width * 0.5);
            centerY = (picRect.top - panelRect.top) + (picRect.height * 0.5);
        }

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const overlayMin = viewportWidth <= 480
            ? 220
            : (viewportWidth <= 768 ? 260 : 380);
        const overlayMax = viewportWidth <= 480
            ? 420
            : (viewportWidth <= 768 ? 520 : 740);
        const baseOverlayWidth = Math.max(overlayMin, Math.min(overlayMax, width * 0.92));
        const isFifthOverlay = entry.index === 4;
        const fifthOverlayRatio = viewportWidth <= 480
            ? 0.46
            : (viewportWidth <= 1024 ? 0.52 : 0.58);
        const fifthOverlayMin = viewportWidth <= 480 ? 200 : 240;
        const fifthOverlayMax = viewportWidth <= 1024 ? 460 : 540;
        const overlayWidth = isFifthOverlay
            ? Math.max(fifthOverlayMin, Math.min(fifthOverlayMax, baseOverlayWidth * fifthOverlayRatio))
            : baseOverlayWidth;

        entry.overlay.style.left = `${centerX.toFixed(3)}px`;
        entry.overlay.style.top = `${centerY.toFixed(3)}px`;
        entry.overlay.style.width = `${overlayWidth.toFixed(3)}px`;
    };

    const layoutAllOverlays = () => {
        overlayLayouts.forEach(layoutOverlay);
    };

    const initPanelLineOverlays = () => {
        items.forEach((panel, index) => {
            const pic = panel.querySelector('.pic');
            if (!pic) return;

            const overlay = document.createElement('div');
            overlay.className = 'panel-svg-draw';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = svgTemplates[index % svgTemplates.length];

            panel.appendChild(overlay);
            overlayByIndex.set(index, overlay);

            const layoutEntry = { panel, pic, overlay, index };
            overlayLayouts.push(layoutEntry);
            prepareDrawables(overlay);

            if (!pic.complete) {
                pic.addEventListener('load', () => {
                    layoutOverlay(layoutEntry);
                }, { once: true });
            }
        });

        layoutAllOverlays();
    };

    const setupMotionSetters = () => {
        if (!window.gsap) {
            setTrackX = null;
            setFillWidth = null;
            setDotLeft = null;
            return;
        }

        setTrackX = window.gsap.quickTo(track, 'xPercent', {
            duration: 0.08,
            ease: 'power2.out'
        });

        setFillWidth = window.gsap.quickTo(fill, 'width', {
            duration: 0.24,
            ease: 'power3.out'
        });

        setDotLeft = window.gsap.quickTo(dot, 'left', {
            duration: 0.24,
            ease: 'power3.out'
        });
    };

    const measureTabs = () => {
        const lineRect = line.getBoundingClientRect();
        const width = Math.max(1, lineRect.width);

        state.tabCenters = tabs.map((tab) => {
            const rect = tab.getBoundingClientRect();
            const center = ((rect.left + (rect.width * 0.5)) - lineRect.left) + spotOffsetX;
            return clamp(center, 0, width);
        });
    };

    const centerActiveTabOnMobile = (index, immediate = false) => {
        if (!tabsRow || !isMobileViewport()) return;
        const tab = tabs[index];
        if (!tab) return;

        const maxScroll = Math.max(0, tabsRow.scrollWidth - tabsRow.clientWidth);
        if (maxScroll <= 0) return;

        const target = clamp(
            (tab.offsetLeft + (tab.offsetWidth * 0.5)) - (tabsRow.clientWidth * 0.5),
            0,
            maxScroll
        );

        tabsRow.scrollTo({
            left: target,
            behavior: immediate ? 'auto' : 'smooth'
        });
    };

    const unbindSmoothBridge = () => {
        if (!smoothBridgeEngine || !smoothBridgeHandler) return;
        if (typeof smoothBridgeEngine.off === 'function') {
            smoothBridgeEngine.off('scroll', smoothBridgeHandler);
        }
        debugLog('smooth-bridge:off');
        smoothBridgeEngine = null;
        smoothBridgeHandler = null;
    };

    const bindSmoothBridge = () => {
        unbindSmoothBridge();
        const engine = window.scrollInstance;
        if (!engine || !engine.__isSmooth || typeof engine.on !== 'function') return;

        smoothBridgeEngine = engine;
        smoothBridgeHandler = () => {
            if (!window.ScrollTrigger) return;
            window.ScrollTrigger.update();
            probeTimeline('smooth-scroll');
        };
        smoothBridgeEngine.on('scroll', smoothBridgeHandler);
        debugLog('smooth-bridge:on', { isSmooth: !!engine.__isSmooth });
    };

    const syncScrollToProgress = (targetProgress, duration = 0.72) => {
        if (!trigger) return false;
        const safeProgress = clamp(targetProgress, 0, 1);
        const targetY = trigger.start + ((trigger.end - trigger.start) * safeProgress);
        const safeTargetY = Number.isFinite(targetY) ? targetY : 0;
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        debugLog('syncScrollToProgress', {
            targetProgress: Number(safeProgress.toFixed(4)),
            targetY: Math.round(safeTargetY)
        });
        debugEvent('scroll-sync-to-tab', {
            label: '탭 클릭 스크롤 연동',
            targetProgress: Number(safeProgress.toFixed(4)),
            targetY: Math.round(safeTargetY),
            duration: Number(duration.toFixed(3))
        });

        const engine = window.scrollInstance;
        if (engine && typeof engine.scrollTo === 'function') {
            engine.scrollTo(safeTargetY, { duration, ease: easeOutCubic });
            window.requestAnimationFrame(() => {
                if (window.ScrollTrigger) window.ScrollTrigger.update();
                probeTimeline('syncScrollToProgress:engine', { forceSnapshot: true });
            });
            return true;
        }

        if (window.gsap && window.ScrollToPlugin) {
            const targetEl = triggerScroller || window;
            window.gsap.to(targetEl, {
                duration,
                ease: 'power3.out',
                scrollTo: { y: safeTargetY, autoKill: false },
                autoKill: false,
                overwrite: 'auto',
                onUpdate: () => {
                    if (window.ScrollTrigger) window.ScrollTrigger.update();
                    probeTimeline('syncScrollToProgress:gsap');
                },
                onComplete: () => {
                    if (window.ScrollTrigger) window.ScrollTrigger.update();
                    probeTimeline('syncScrollToProgress:complete', { forceSnapshot: true });
                }
            });
            return true;
        }

        if (triggerScroller && typeof triggerScroller.scrollTop === 'number') {
            triggerScroller.scrollTop = safeTargetY;
        } else {
            window.scrollTo({ top: safeTargetY, behavior: 'auto' });
        }
        if (window.ScrollTrigger) window.ScrollTrigger.update();
        probeTimeline('syncScrollToProgress:direct', { forceSnapshot: true });
        return true;
    };

    const moveTrack = (xPercent, immediate = false) => {
        if (immediate) {
            if (window.gsap) {
                window.gsap.set(track, { xPercent });
            } else {
                track.style.transform = `translate3d(${xPercent}%, 0, 0)`;
            }
            return;
        }

        if (setTrackX) {
            setTrackX(xPercent);
            return;
        }

        if (window.gsap) {
            window.gsap.to(track, {
                xPercent,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
            return;
        }

        track.style.transform = `translate3d(${xPercent}%, 0, 0)`;
    };

    const apply = (progress, options = {}) => {
        const immediate = !!options.immediate;
        const instantTrack = !!options.instantTrack;
        const forceLineEnd = !!options.forceLineEnd;
        const safeProgress = clamp(progress, 0, 1);
        const scaled = safeProgress * maxIndex;
        const baseIndex = Math.min(maxIndex, Math.floor(scaled));
        let currentLocal = scaled - baseIndex;

        if (safeProgress >= 1) currentLocal = 1;

        const displayIndex = Math.min(maxIndex, Math.round(scaled));

        state.progress = safeProgress;
        state.index = displayIndex;
        state.local = clamp(currentLocal, 0, 1);

        const trackX = -(scaled * 100);
        moveTrack(trackX, immediate || instantTrack);

        const lineWidth = Math.max(0, line.clientWidth || line.getBoundingClientRect().width || 0);
        const currentCenter = state.tabCenters[baseIndex] ?? 0;
        const nextCenter = state.tabCenters[Math.min(maxIndex, baseIndex + 1)] ?? currentCenter;
        const activeX = currentCenter + ((nextCenter - currentCenter) * state.local);
        const endBlend = forceLineEnd ? 1 : smoothStep((safeProgress - 0.9) / 0.1);
        const targetX = Math.max(0, activeX + ((lineWidth - activeX) * endBlend));

        if (!immediate && setFillWidth && setDotLeft) {
            setFillWidth(targetX);
            setDotLeft(targetX);
        } else {
            fill.style.width = `${targetX.toFixed(3)}px`;
            dot.style.left = `${targetX.toFixed(3)}px`;
        }
        const panelChanged = activePanel !== displayIndex;
        activePanel = displayIndex;

        if (panelChanged) {
            playCardDrawOnce(displayIndex);
        }

        tabs.forEach((tab, index) => {
            let tabFill = 0;
            if (index < displayIndex) tabFill = 1;
            if (index === displayIndex) tabFill = 1;

            if (displayIndex === baseIndex && index === baseIndex) {
                tabFill = Math.max(0.15, state.local);
            }

            const colorAmount = clamp(tabFill, 0, 1);
            const red = mix(140, 27, colorAmount);
            const green = mix(140, 133, colorAmount);
            const blue = mix(140, 255, colorAmount);
            tab.style.color = `rgb(${red}, ${green}, ${blue})`;

            const selected = index === displayIndex;
            tab.classList.toggle('on', selected);
            tab.setAttribute('aria-selected', selected ? 'true' : 'false');
            tab.setAttribute('tabindex', selected ? '0' : '-1');

            const panel = items[index];
            if (panel) panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
        });

        if (activeTab !== displayIndex && tabs[displayIndex]) {
            activeTab = displayIndex;
        }
    };

    const goToTab = (index) => {
        const safeIndex = clamp(index, 0, maxIndex);

        if (isMobileViewport()) {
            if (mobileSwiper) {
                mobileSwiper.slideTo(safeIndex);
            } else {
                applyMobileIndex(safeIndex);
            }
            return;
        }

        const targetProgress = maxIndex === 0 ? 0 : (safeIndex / maxIndex);
        debugLog('goToTab', { index: safeIndex, targetProgress: Number(targetProgress.toFixed(4)) });
        debugEvent('tab-click', {
            label: '탭 클릭',
            index: safeIndex,
            targetProgress: Number(targetProgress.toFixed(4))
        });
        if (window.gsap) {
            window.gsap.set(container, { scale: 1, y: 0, transformOrigin: '50% 0%' });
        } else {
            container.style.transform = 'translate3d(0,0,0) scale(1)';
        }
        apply(targetProgress, { immediate: true });
        probeTimeline('goToTab', { forceSnapshot: true });

        if (trigger) {
            syncScrollToProgress(targetProgress, 0.72);
            return;
        }

        const sectionTop = section.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
        window.scrollTo({ top: sectionTop, behavior: 'smooth' });
    };

    const currentEngineIsSmooth = () => !!(window.scrollInstance && window.scrollInstance.__isSmooth);

    const rebuildTriggerIfEngineChanged = (source = 'engine-check', force = false) => {
        if (!window.gsap || !window.ScrollTrigger) return;
        if (isMobileViewport()) {
            killDesktopTrigger();
            return;
        }
        const smoothNow = currentEngineIsSmooth();
        if (!force && triggerBuiltWithSmooth !== null && smoothNow === triggerBuiltWithSmooth) return;

        debugEvent('engine-rebuild', {
            label: '엔진 상태 변경으로 트리거 재구성',
            source,
            previousSmooth: triggerBuiltWithSmooth,
            currentSmooth: smoothNow
        });

        const keepProgress = trigger && Number.isFinite(trigger.progress)
            ? trigger.progress
            : state.progress;
        buildTrigger();
        apply(clamp(keepProgress, 0, 1), { immediate: true });
        probeTimeline(`engine-rebuild:${source}`, { forceSnapshot: true });
    };

    const buildTrigger = () => {
        if (!window.gsap || !window.ScrollTrigger) return;

        if (window.ScrollToPlugin) {
            window.gsap.registerPlugin(window.ScrollTrigger, window.ScrollToPlugin);
        } else {
            window.gsap.registerPlugin(window.ScrollTrigger);
        }
        unbindSmoothBridge();
        if (trigger) trigger.kill();
        if (entryTrigger) entryTrigger.kill();
        triggerScroller = null;

        const cfgScroller = window.SancSmoothScrollConfig && window.SancSmoothScrollConfig.scroller;
        let customScroller = null;
        if (typeof cfgScroller === 'string') {
            customScroller = document.querySelector(cfgScroller);
        } else if (cfgScroller && cfgScroller.nodeType === 1) {
            customScroller = cfgScroller;
        }
        triggerScroller = customScroller || null;
        const isSmoothEngine = !!(window.scrollInstance && window.scrollInstance.__isSmooth);
        triggerBuiltWithSmooth = isSmoothEngine;
        const pinStartOffset = isSmoothEngine ? Math.round(Math.max(14, Math.min(26, (window.innerHeight || 900) * 0.022))) : 0;
        const pinStart = isSmoothEngine ? `top top+=${pinStartOffset}` : 'top top';
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        let lastPinCatchAt = 0;
        const softCatchPinStart = (self, reason) => {
            if (!isSmoothEngine || !self) return;
            const engine = window.scrollInstance;
            if (!engine || typeof engine.scrollTo !== 'function') return;

            const currentY = typeof self.scroll === 'function'
                ? self.scroll()
                : (
                    engine.scroll
                    && engine.scroll.instance
                    && engine.scroll.instance.scroll
                    && typeof engine.scroll.instance.scroll.y === 'number'
                        ? engine.scroll.instance.scroll.y
                        : (window.scrollY || window.pageYOffset || 0)
                );

            if (!Number.isFinite(currentY)) return;
            const delta = currentY - self.start;
            if (delta <= 10) return;
            const velocityAbs = typeof self.getVelocity === 'function'
                ? Math.abs(self.getVelocity())
                : 0;
            if (velocityAbs < 260 && delta < 28) return;
            const now = Date.now();
            if ((now - lastPinCatchAt) < 180) return;
            lastPinCatchAt = now;
            const distanceFactor = clamp((delta - 10) / 180, 0, 1);
            const velocityFactor = clamp((velocityAbs - 240) / 1300, 0, 1);
            const duration = 0.11 + (distanceFactor * 0.14) + (velocityFactor * 0.08);

            engine.scrollTo(self.start, {
                duration,
                ease: easeOutCubic
            });

            debugLog('pin-catch', {
                reason,
                currentY: Math.round(currentY),
                start: Math.round(self.start),
                delta: Math.round(delta),
                velocity: Math.round(velocityAbs),
                duration: Number(duration.toFixed(3))
            });
        };
        debugLog('build-trigger', {
            hasCustomScroller: !!customScroller,
            isSmoothEngine,
            pinStart
        });
        debugEvent('engine-detect', {
            label: '스크롤 엔진 감지',
            isSmoothEngine,
            hasCustomScroller: !!customScroller,
            pinStart
        });

        setupMotionSetters();
        measureTabs();

        entryTrigger = window.ScrollTrigger.create({
            trigger: section,
            ...(customScroller ? { scroller: customScroller } : {}),
            start: 'top 88%',
            end: pinStart,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                const eased = smoothStep(self.progress);
                const scale = 0.97 + (0.03 * eased);
                const y = (1 - eased) * 10;
                if (window.gsap) {
                    window.gsap.set(container, {
                        scale,
                        y,
                        transformOrigin: '50% 0%'
                    });
                } else {
                    container.style.transform = `translate3d(0, ${y.toFixed(3)}px, 0) scale(${scale.toFixed(5)})`;
                }

                if (trigger && !trigger.isActive && isSmoothEngine && self.progress > 0.72 && typeof trigger.scroll === 'function') {
                    const currentY = trigger.scroll();
                    const velocityAbs = typeof trigger.getVelocity === 'function'
                        ? Math.abs(trigger.getVelocity())
                        : 0;
                    if (Number.isFinite(currentY) && currentY > (trigger.start + 0.5) && (velocityAbs > 320 || (currentY - trigger.start) > 26)) {
                        softCatchPinStart(trigger, 'entry-overshoot');
                    }
                }
            },
            onEnterBack: () => {
                if (window.gsap) {
                    window.gsap.set(container, { scale: 1, y: 0, transformOrigin: '50% 0%' });
                } else {
                    container.style.transform = 'translate3d(0,0,0) scale(1)';
                }
            },
            onLeave: () => {
                if (window.gsap) {
                    window.gsap.set(container, { scale: 1, y: 0, transformOrigin: '50% 0%' });
                } else {
                    container.style.transform = 'translate3d(0,0,0) scale(1)';
                }
            }
        });

        trigger = window.ScrollTrigger.create({
            trigger: section,
            ...(customScroller ? { scroller: customScroller } : {}),
            start: pinStart,
            end: () => {
                const viewport = window.innerHeight || 900;
                const steps = Math.max(1, maxIndex);
                const compactRatio = clamp((1073 - viewport) / (1073 - 820), 0, 1);
                const stepBase = isSmoothEngine ? 1.18 : 1.28;
                const stepReduce = isSmoothEngine ? 0.14 : 0.2;
                const tailBase = isSmoothEngine ? 1.08 : 0.8;
                const tailReduce = isSmoothEngine ? 0.24 : 0.16;
                const stepDistance = stepBase - (stepReduce * compactRatio);
                const tailDistance = tailBase - (tailReduce * compactRatio);
                return `+=${Math.round(viewport * ((steps * stepDistance) + tailDistance))}`;
            },
            pin: true,
            pinSpacing: true,
            pinReparent: !!customScroller,
            pinType: customScroller ? 'transform' : 'fixed',
            scrub: isSmoothEngine ? 0.3 : true,
            anticipatePin: isSmoothEngine ? 1.4 : 0,
            fastScrollEnd: false,
            invalidateOnRefresh: true,
            onEnter: (self) => {
                section.classList.add('is-pinned');
                if (window.gsap) {
                    window.gsap.set(container, { scale: 1, y: 0, transformOrigin: '50% 0%' });
                }
                softCatchPinStart(self, 'onEnter');
                debugLog('onEnter');
                probeTimeline('onEnter', { forceSnapshot: true });
            },
            onEnterBack: () => {
                section.classList.add('is-pinned');
                if (window.gsap) {
                    window.gsap.set(container, { scale: 1, y: 0, transformOrigin: '50% 0%' });
                }
                debugLog('onEnterBack');
                probeTimeline('onEnterBack', { forceSnapshot: true });
            },
            onLeave: () => {
                section.classList.remove('is-pinned');
                if (window.gsap) {
                    window.gsap.set(container, { scale: 1, y: 0, transformOrigin: '50% 0%' });
                }
                debugLog('onLeave');
                apply(1, { forceLineEnd: true });
                probeTimeline('onLeave', { forceSnapshot: true });
            },
            onLeaveBack: () => {
                section.classList.remove('is-pinned');
                if (window.gsap) {
                    window.gsap.set(container, { scale: 0.97, y: 10, transformOrigin: '50% 0%' });
                }
                debugLog('onLeaveBack');
                apply(0);
                probeTimeline('onLeaveBack', { forceSnapshot: true });
            },
            onToggle: (self) => {
                debugLog('onToggle', {
                    isActive: self.isActive,
                    progress: Number(self.progress.toFixed(4)),
                    direction: self.direction
                });
                probeTimeline('onToggle', { forceSnapshot: true });
            },
            onUpdate: (self) => {
                apply(self.progress, { instantTrack: true });
                const now = Date.now();
                if ((now - lastDebugUpdateAt) >= 120) {
                    lastDebugUpdateAt = now;
                    const velocity = typeof self.getVelocity === 'function'
                        ? Math.round(self.getVelocity())
                        : 0;
                    debugLog('onUpdate', {
                        progress: Number(self.progress.toFixed(4)),
                        velocity,
                        scroll: Math.round(self.scroll()),
                        direction: self.direction
                    });
                }
                probeTimeline('onUpdate');
            },
            onRefreshInit: () => {
                debugLog('onRefreshInit');
                probeTimeline('onRefreshInit', { forceSnapshot: true });
            },
            onRefresh: (self) => {
                apply(self.progress, { immediate: true });
                debugLog('onRefresh', {
                    start: Math.round(self.start),
                    end: Math.round(self.end),
                    progress: Number(self.progress.toFixed(4))
                });
                probeTimeline('onRefresh', { forceSnapshot: true });
            }
        });
        bindSmoothBridge();
        probeTimeline('buildTrigger', { forceSnapshot: true });
    };

    const killDesktopTrigger = () => {
        unbindSmoothBridge();
        if (trigger) {
            trigger.kill();
            trigger = null;
        }
        if (entryTrigger) {
            entryTrigger.kill();
            entryTrigger = null;
        }
        triggerScroller = null;
        triggerBuiltWithSmooth = null;
        section.classList.remove('is-pinned');
        if (window.gsap) {
            window.gsap.set(container, { clearProps: 'transform' });
        } else {
            container.style.transform = '';
        }
    };

    const applyMobileIndex = (index, options = {}) => {
        const safeIndex = clamp(index, 0, maxIndex);
        const immediate = !!options.immediate;
        const selectedCenter = state.tabCenters[safeIndex] ?? 0;
        const changed = activePanel !== safeIndex;

        state.progress = maxIndex === 0 ? 0 : (safeIndex / maxIndex);
        state.index = safeIndex;
        state.local = 0;
        activePanel = safeIndex;

        fill.style.width = `${selectedCenter.toFixed(3)}px`;
        dot.style.left = `${selectedCenter.toFixed(3)}px`;

        tabs.forEach((tab, tabIndex) => {
            const selected = tabIndex === safeIndex;
            const colorAmount = selected ? 1 : 0;
            const red = mix(140, 27, colorAmount);
            const green = mix(140, 133, colorAmount);
            const blue = mix(140, 255, colorAmount);
            tab.style.color = `rgb(${red}, ${green}, ${blue})`;
            tab.classList.toggle('on', selected);
            tab.setAttribute('aria-selected', selected ? 'true' : 'false');
            tab.setAttribute('tabindex', selected ? '0' : '-1');

            const panel = items[tabIndex];
            if (panel) panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
        });

        if (changed) {
            playCardDrawOnce(safeIndex);
        }

        centerActiveTabOnMobile(safeIndex, immediate);
    };

    const destroyMobileSwiper = () => {
        if (!mobileSwiper) return;
        mobileSwiper.destroy(true, true);
        mobileSwiper = null;
        section.classList.remove('is-mobile-swiper');
    };

    const initMobileSwiper = () => {
        killDesktopTrigger();
        if (!window.Swiper) {
            measureTabs();
            applyMobileIndex(state.index || 0, { immediate: true });
            return;
        }
        if (mobileSwiper) {
            mobileSwiper.update();
            measureTabs();
            applyMobileIndex(mobileSwiper.activeIndex || 0, { immediate: true });
            return;
        }

        section.classList.add('is-mobile-swiper');
        mobileSwiper = new window.Swiper(wrap, {
            wrapperClass: 'panetrack',
            slideClass: 'panel',
            slidesPerView: 1,
            spaceBetween: 0,
            speed: 520,
            autoHeight: true,
            allowTouchMove: true,
            pagination: mobilePagination
                ? {
                    el: mobilePagination,
                    clickable: true
                }
                : undefined,
            on: {
                init(swiper) {
                    measureTabs();
                    applyMobileIndex(swiper.activeIndex || 0, { immediate: true });
                },
                slideChange(swiper) {
                    applyMobileIndex(swiper.activeIndex || 0);
                }
            }
        });
    };

    const bindFallbackMode = () => {
        if (fallbackBound || !fallbackHandler) return;
        window.addEventListener('scroll', fallbackHandler, { passive: true });
        fallbackBound = true;
    };

    const unbindFallbackMode = () => {
        if (!fallbackBound || !fallbackHandler) return;
        window.removeEventListener('scroll', fallbackHandler);
        fallbackBound = false;
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            goToTab(index);
        });
    });

    window.addEventListener('wheel', (event) => {
        if (!isDebugOn()) return;
        const now = Date.now();
        if ((now - timelineState.lastWheelAt) < 70) return;
        timelineState.lastWheelAt = now;
        const currentY = getLiveScrollY();
        const maxScroll = getLiveMaxScroll();
        const nearPageEnd = maxScroll > 0 && currentY >= (maxScroll - 1);
        debugEvent('scroll-detect', {
            label: '스크롤 감지',
            source: 'wheel',
            deltaY: roundIfFinite(event.deltaY, 1),
            deltaX: roundIfFinite(event.deltaX, 1),
            scrollY: roundIfFinite(currentY, 0),
            maxScroll: roundIfFinite(maxScroll, 0),
            nearPageEnd
        });
        if (event.deltaY > 0 && nearPageEnd) {
            debugEvent('scroll-end-hit', {
                label: '스크롤이 페이지 끝에 이미 닿은 상태',
                source: 'wheel',
                scrollY: roundIfFinite(currentY, 0),
                maxScroll: roundIfFinite(maxScroll, 0)
            });
        }
        probeTimeline('wheel', { forceSnapshot: true });
    }, { passive: true });

    window.addEventListener('scroll', () => {
        if (!isDebugOn()) return;
        const now = Date.now();
        if ((now - timelineState.lastNativeScrollAt) < 140) return;
        timelineState.lastNativeScrollAt = now;
        debugEvent('scroll-detect', {
            label: '스크롤 감지',
            source: 'native-scroll',
            scrollY: roundIfFinite(getLiveScrollY(), 0)
        });
        probeTimeline('native-scroll');
    }, { passive: true });

    if (window.jQuery) {
        window.jQuery(document).off('scrollengine:ready.aisolutionCont3');
        window.jQuery(document).on('scrollengine:ready.aisolutionCont3', (_event, payload) => {
            if (isMobileViewport()) return;
            debugEvent('engine-ready', {
                label: 'scrollengine:ready 수신',
                payloadEngine: payload && payload.engine ? payload.engine : 'unknown',
                instanceSmooth: currentEngineIsSmooth()
            });
            rebuildTriggerIfEngineChanged('scrollengine:ready', true);
        });
    }

    initPanelLineOverlays();
    probeTimeline('init', { forceSnapshot: true });

    window.addEventListener('load', () => {
        layoutAllOverlays();
        probeTimeline('load', { forceSnapshot: true });
        window.setTimeout(() => {
            if (isMobileViewport()) return;
            rebuildTriggerIfEngineChanged('load+240ms');
        }, 240);
        window.setTimeout(() => {
            if (isMobileViewport()) return;
            rebuildTriggerIfEngineChanged('load+800ms');
        }, 800);
    }, { once: true });

    const fallback = () => {
        const rect = section.getBoundingClientRect();
        const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
        const travel = Math.max(rect.height + viewport, 1);
        const ratio = clamp((viewport - rect.top) / travel, 0, 1);
        apply(ratio);
        probeTimeline('fallback-update');
    };

    fallbackHandler = fallback;

    const applyInteractionMode = (source = 'init') => {
        measureTabs();
        setupMotionSetters();

        if (isMobileViewport()) {
            unbindFallbackMode();
            initMobileSwiper();
            probeTimeline(`mode-mobile:${source}`, { forceSnapshot: true });
            return;
        }

        destroyMobileSwiper();

        if (prefersReduced) {
            killDesktopTrigger();
            unbindFallbackMode();
            apply(1, { immediate: true });
            probeTimeline(`mode-reduced:${source}`, { forceSnapshot: true });
            return;
        }

        if (window.gsap && window.ScrollTrigger) {
            unbindFallbackMode();
            buildTrigger();
            apply(clamp(state.progress, 0, 1), { immediate: true });
            probeTimeline(`mode-desktop-trigger:${source}`, { forceSnapshot: true });
            return;
        }

        killDesktopTrigger();
        bindFallbackMode();
        apply(0, { immediate: true });
        fallback();
        probeTimeline(`mode-fallback:${source}`, { forceSnapshot: true });
    };

    applyInteractionMode('init');

    window.addEventListener('load', () => {
        window.setTimeout(() => {
            if (!isMobileViewport() && window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
                rebuildTriggerIfEngineChanged('post-refresh+load', true);
            }
        }, 120);
    }, { once: true });

    const syncCont3LayoutOnResize = (source = 'resize') => {
        layoutAllOverlays();
        applyInteractionMode(source);
        if (isMobileViewport()) {
            if (mobileSwiper) {
                const activeIndex = mobileSwiper.activeIndex || 0;
                applyMobileIndex(activeIndex, { immediate: true });
            } else {
                applyMobileIndex(state.index || 0, { immediate: true });
            }
        } else if (window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
            if (trigger) {
                apply(clamp(trigger.progress, 0, 1), { immediate: true });
            }
        }
        probeTimeline(source, { forceSnapshot: true });
    };

    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            syncCont3LayoutOnResize('resize');
        }, 120);
    }, { passive: true });

    window.addEventListener('orientationchange', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            syncCont3LayoutOnResize('orientationchange');
        }, 120);
    }, { passive: true });
});
