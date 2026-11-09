/**
 * About Page Interaction
 * - Cont1 video playback rate control
 * - Cont2 line draw -> image switch -> blue background -> headline reveal
 * - History slider (latest -> oldest)
 * - Arrow navigation + mouse/touch drag
 */
$(function () {
    const section = document.querySelector('.cont1');
    const videos = Array.from(document.querySelectorAll('.cont1 .bgvideo, .cont1 .bgfill'));
    const tag = section ? section.querySelector('.tag') : null;
    const desc = section ? section.querySelector('.desc') : null;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastY = -1;

    if (section) {
        if (!prefersReduced && window.gsap && tag && desc) {
            const tl = window.gsap.timeline({ defaults: { ease: 'power2.out' } });
            window.gsap.set(tag, { autoAlpha: 0, y: -10 });
            window.gsap.set(desc, { autoAlpha: 0, y: 16 });
            tl.to(tag, { autoAlpha: 1, y: 0, duration: 0.9 })
                .to(desc, { autoAlpha: 1, y: 0, duration: 1.05 }, 0.28);
        } else {
            if (tag) {
                tag.style.opacity = '1';
                tag.style.transform = 'none';
            }
            if (desc) {
                desc.style.opacity = '1';
                desc.style.transform = 'none';
            }
        }
    }

    if (section && !prefersReduced) {
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

        const updateCont1 = () => {
            if (!section) return;
            const y = getScrollY();
            const top = section.offsetTop || 0;
            const height = Math.max(1, section.offsetHeight || 1);
            const rawProgress = (y - top) / (height * 0.92);
            const progress = clamp(rawProgress, 0, 1);
            const late = clamp((progress - 0.3) / 0.2, 0, 1);

            section.style.setProperty('--scroll-progress', progress.toFixed(4));
            section.classList.toggle('late', late > 0.04);
        };

        const watchScroll = () => {
            const currentY = getScrollY();
            if (Math.abs(currentY - lastY) > 0.4) {
                lastY = currentY;
                updateCont1();
            }
            window.requestAnimationFrame(watchScroll);
        };

        updateCont1();
        window.requestAnimationFrame(watchScroll);
        window.addEventListener('resize', updateCont1, { passive: true });
    } else if (section) {
        section.style.setProperty('--scroll-progress', '0');
        section.classList.remove('late');
    }

    if (videos.length) {
        const targetRate = 0.75;
        const applyRate = (video) => {
            video.defaultPlaybackRate = targetRate;
            video.playbackRate = targetRate;
        };

        videos.forEach((video) => {
            if (video.readyState >= 1) {
                applyRate(video);
            } else {
                video.addEventListener('loadedmetadata', () => applyRate(video), { once: true });
            }

            video.addEventListener('play', () => applyRate(video));
        });
    }
});

$(function () {
    const section = document.querySelector('.cont2');
    if (!section) return;

    const drawHost = section.querySelector('.draw');
    const photo = section.querySelector('.photo');
    const bg = section.querySelector('.overlay');
    const headline = section.querySelector('.headline');
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canAnimate = Boolean(window.gsap && window.ScrollTrigger);

    if (!drawHost || !photo || !bg || !headline) return;

    const lines = Array.from(headline.querySelectorAll('.line'));
    if (!lines.length) return;
    const mobileMql = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
    let isMobileFlow = mobileMql ? mobileMql.matches : false;

    section.classList.toggle('mobile-flow', Boolean(isMobileFlow));

    const showStatic = () => {
        drawHost.style.opacity = '0';
        photo.style.opacity = '1';
        photo.style.transform = 'scale(1.12)';
        bg.style.transform = 'translate3d(0, 0, 0)';
        headline.style.opacity = '1';
        lines.forEach((line) => {
            line.style.transform = 'translate3d(0, 0, 0)';
            line.style.opacity = '1';
        });
    };

    if (prefersReduced || !canAnimate) {
        showStatic();
        return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    const splitCompoundPaths = (svgEl) => {
        if (!svgEl) return;

        const chunkSize = 24;
        const paths = Array.from(svgEl.querySelectorAll('path'));
        paths.forEach((path) => {
            if (path.closest('defs, clipPath, mask, pattern, symbol')) return;
            const d = path.getAttribute('d');
            if (!d || !/[Mm].*[Mm]/.test(d)) return;

            const subpaths = d.match(/[Mm][^Mm]*/g);
            if (!subpaths || subpaths.length <= chunkSize) return;

            const fragment = document.createDocumentFragment();
            for (let i = 0; i < subpaths.length; i += chunkSize) {
                const clone = path.cloneNode(false);
                clone.setAttribute('d', subpaths.slice(i, i + chunkSize).join(' '));
                fragment.appendChild(clone);
            }
            path.replaceWith(fragment);
        });
    };

    const initTimeline = (drawTargets) => {
        const scene = section.querySelector('.scene') || section;
        const hasDraw = Array.isArray(drawTargets) && drawTargets.length > 0;

        if (isMobileFlow) {
            const swapPoint = hasDraw ? 0.44 : 0;

            window.gsap.set(drawHost, { autoAlpha: hasDraw ? 1 : 0 });
            window.gsap.set(photo, { autoAlpha: 0, y: 0, scale: 1.12 });
            window.gsap.set(bg, { yPercent: 114 });
            window.gsap.set(headline, { autoAlpha: 0, y: 34 });
            window.gsap.set(lines, { yPercent: 0, autoAlpha: 0 });

            const mobileTl = window.gsap.timeline({
                defaults: { ease: 'power3.out' },
                scrollTrigger: {
                    id: 'about-cont2-mobile',
                    trigger: scene,
                    start: 'top 78%',
                    invalidateOnRefresh: true,
                    once: true
                }
            });

            if (hasDraw) {
                mobileTl.to(drawTargets, {
                    strokeDashoffset: 0,
                    duration: 0.44,
                    stagger: 0
                }, 0);
            }

            mobileTl.addLabel('swap', swapPoint);

            mobileTl
                .to(bg, {
                    yPercent: 0,
                    duration: 0.56
                }, 'swap')
                .to(drawHost, {
                    autoAlpha: 0,
                    duration: 0.18
                }, 'swap')
                .to(photo, {
                    autoAlpha: 1,
                    duration: 0.24,
                    ease: 'power2.out'
                }, 'swap+=0.02')
                .to(headline, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.28
                }, 'swap+=0.16')
                .to(lines, {
                    autoAlpha: 1,
                    duration: 0.32,
                    stagger: 0.12
                }, 'swap+=0.2');

            return;
        }

        const swapPoint = hasDraw ? 0.42 : 0;
        let headlinePlayed = false;

        window.gsap.set(drawHost, { autoAlpha: hasDraw ? 1 : 0 });
        window.gsap.set(photo, { autoAlpha: 0, scale: 1.16 });
        window.gsap.set(bg, { yPercent: 112 });
        window.gsap.set(headline, { autoAlpha: 0 });
        window.gsap.set(lines, { yPercent: 118, autoAlpha: 0 });

        const headlineTl = window.gsap.timeline({
            paused: true,
            defaults: { ease: 'power3.out' }
        });
        headlineTl.to(headline, {
            autoAlpha: 1,
            duration: 0.01
        }, 0);
        headlineTl.to(lines, {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.26,
            stagger: 0.09
        }, 0);

        const playHeadline = () => {
            if (headlinePlayed) return;
            headlinePlayed = true;
            headlineTl.play(0);
        };

        const resetHeadline = () => {
            headlinePlayed = false;
            headlineTl.pause(0);
            window.gsap.set(headline, { autoAlpha: 0 });
            window.gsap.set(lines, { yPercent: 118, autoAlpha: 0 });
        };

        const tl = window.gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                id: 'about-cont2-desktop',
                trigger: scene,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.45,
                invalidateOnRefresh: true,
                onLeaveBack: resetHeadline
            }
        });

        if (hasDraw) {
            tl.to(drawTargets, {
                strokeDashoffset: 0,
                duration: 0.42,
                stagger: 0
            }, 0);
        }

        tl.addLabel('swap', swapPoint);
        tl.to(drawHost, {
            autoAlpha: 0,
            duration: 0.1
        }, 'swap');
        tl.to(photo, {
            autoAlpha: 1,
            scale: 1.12,
            duration: 0.18,
            ease: 'power2.out'
        }, 'swap');

        tl.addLabel('bgIn', 'swap+=0.08');
        tl.to(bg, {
            yPercent: 0,
            duration: 0.4,
            ease: 'power2.out'
        }, 'bgIn');

        tl.addLabel('headlineIn', 'swap+=0.06');
        tl.call(playHeadline, [], 'headlineIn');

        tl.to({}, { duration: 0.58 }, 'headlineIn+=0.22');
    };

    const prepareDrawTargets = (svgEl) => {
        if (!svgEl) return [];

        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        splitCompoundPaths(svgEl);

        const targets = [];
        const nodes = svgEl.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse');
        nodes.forEach((node) => {
            if (node.closest('defs, clipPath, mask, pattern, symbol')) return;
            node.style.fill = 'none';
            node.style.opacity = '0';
            node.style.strokeOpacity = '0';
            if (typeof node.getTotalLength !== 'function') return;
            let length = 0;
            try {
                length = node.getTotalLength();
            } catch (error) {
                return;
            }
            if (!Number.isFinite(length) || length <= 0) return;
            node.style.strokeDasharray = `${length} ${length}`;
            node.style.strokeDashoffset = `${length}`;
            node.style.opacity = '1';
            node.style.strokeOpacity = '1';
            targets.push(node);
        });

        return targets;
    };

    let didInitCont2 = false;

    const killCont2Triggers = () => {
        if (!window.ScrollTrigger) return;
        const mobileTrigger = window.ScrollTrigger.getById('about-cont2-mobile');
        const desktopTrigger = window.ScrollTrigger.getById('about-cont2-desktop');
        if (mobileTrigger) mobileTrigger.kill();
        if (desktopTrigger) desktopTrigger.kill();
    };

    const initCont2 = () => {
        if (didInitCont2) return;
        didInitCont2 = true;

        killCont2Triggers();
        section.classList.toggle('mobile-flow', Boolean(isMobileFlow));

        const svgUrl = drawHost.getAttribute('data-svg');
        if (!svgUrl) {
            initTimeline([]);
            return;
        }

        window.fetch(svgUrl)
            .then((response) => {
                if (!response.ok) throw new Error('SVG load failed');
                return response.text();
            })
            .then((svgText) => {
                drawHost.innerHTML = svgText;
                const svg = drawHost.querySelector('svg');
                const targets = prepareDrawTargets(svg);
                initTimeline(targets);
            })
            .catch(() => {
                drawHost.innerHTML = '';
                initTimeline([]);
            });
    };

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            const matched = entries.some((entry) => entry.isIntersecting);
            if (!matched) return;
            io.disconnect();
            initCont2();
        }, {
            root: null,
            rootMargin: '1600px 0px',
            threshold: 0
        });
        io.observe(section);
    } else {
        initCont2();
    }

    const refreshCont2 = () => {
        if (!window.ScrollTrigger) return;
        window.ScrollTrigger.refresh();
    };

    let resizeTimer = 0;
    const handleResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            const nextMobileFlow = mobileMql ? mobileMql.matches : false;
            if (nextMobileFlow !== isMobileFlow) {
                isMobileFlow = nextMobileFlow;
                didInitCont2 = false;
                killCont2Triggers();
                initCont2();
            }
            refreshCont2();
        }, 120);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    window.addEventListener('touchend', handleResize, { passive: true });
});

$(function () {
    const section = document.querySelector('.cont3');
    if (!section) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const useFx = !prefersReduced;

    const track = section.querySelector('.track');
    const panels = Array.from(section.querySelectorAll('.panel'));
    const prevBtn = section.querySelector('.arrow.prev');
    const nextBtn = section.querySelector('.arrow.next');
    const container = section.querySelector('.container');
    const cards = panels.map((panel) => panel.querySelector('.card')).filter(Boolean);

    if (!track || !panels.length || !prevBtn || !nextBtn) return;

    if (useFx) {
        section.classList.add('has-fx');
    } else {
        section.classList.add('is-visible');
    }

    const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const useDistortFx = useFx && canHover;
    const useCardFx = useFx && canHover && cards.length > 0;
    const useTrailFx = useCardFx && Boolean(container);
    if (useDistortFx) {
        section.classList.add('has-distort');

        let distortRaf = 0;
        let distortX = 0;
        let distortY = 0;
        let hideTimer = 0;

        const commitDistortPosition = () => {
            section.style.setProperty('--distort-x', `${distortX.toFixed(2)}px`);
            section.style.setProperty('--distort-y', `${distortY.toFixed(2)}px`);
            distortRaf = 0;
        };

        const queueDistortPosition = (clientX, clientY) => {
            const rect = section.getBoundingClientRect();
            distortX = clientX - rect.left;
            distortY = clientY - rect.top;

            if (!distortRaf) {
                distortRaf = window.requestAnimationFrame(commitDistortPosition);
            }
        };

        const showDistort = () => {
            window.clearTimeout(hideTimer);
            section.style.setProperty('--distort-opacity', '1');
        };

        const hideDistort = () => {
            window.clearTimeout(hideTimer);
            hideTimer = window.setTimeout(() => {
                section.style.setProperty('--distort-opacity', '0');
            }, 40);
        };

        const onDistortMove = (event) => {
            queueDistortPosition(event.clientX, event.clientY);
            showDistort();
        };

        section.addEventListener('pointerenter', onDistortMove);
        section.addEventListener('pointermove', onDistortMove);
        section.addEventListener('pointerleave', hideDistort);
        section.addEventListener('pointercancel', hideDistort);
    }

    let index = 0;
    let step = 0;
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let deltaX = 0;
    let baseX = 0;
    let lastTrailStamp = 0;
    let lastTrailDelta = 0;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const getActiveCard = () => (panels[index] ? panels[index].querySelector('.card') : null);
    const resetCardPose = (card) => {
        if (!card) return;
        card.classList.remove('is-depth', 'is-card-dragging');
        card.style.setProperty('--card-shift-x', '0px');
        card.style.setProperty('--card-shift-y', '0px');
        card.style.setProperty('--card-z', '0px');
        card.style.setProperty('--card-rot-x', '0deg');
        card.style.setProperty('--card-rot-y', '0deg');
        card.style.setProperty('--card-scale', '1');
    };
    const applyHoverPose = (card, clientX, clientY) => {
        if (!card || dragging) return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const nx = clamp((((clientX - rect.left) / rect.width) * 2) - 1, -1, 1);
        const ny = clamp((((clientY - rect.top) / rect.height) * 2) - 1, -1, 1);

        card.classList.add('is-depth');
        card.classList.remove('is-card-dragging');
        card.style.setProperty('--card-shift-x', `${(nx * 7).toFixed(2)}px`);
        card.style.setProperty('--card-shift-y', `${(ny * 4).toFixed(2)}px`);
        card.style.setProperty('--card-z', '-38px');
        card.style.setProperty('--card-rot-x', `${(-ny * 6).toFixed(2)}deg`);
        card.style.setProperty('--card-rot-y', `${(nx * 8).toFixed(2)}deg`);
        card.style.setProperty('--card-scale', '0.968');
    };

    let trailLayer = null;
    const emitTrailGhost = (velocityX) => {
        if (!useTrailFx || !trailLayer || !container) return;
        const activeCard = getActiveCard();
        if (!activeCard) return;

        const cardRect = activeCard.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (!cardRect.width || !cardRect.height) return;

        const ghost = document.createElement('span');
        ghost.className = 'card-trail-ghost';
        ghost.style.left = `${(cardRect.left - containerRect.left).toFixed(2)}px`;
        ghost.style.top = `${(cardRect.top - containerRect.top).toFixed(2)}px`;
        ghost.style.width = `${cardRect.width.toFixed(2)}px`;
        ghost.style.height = `${cardRect.height.toFixed(2)}px`;
        ghost.style.borderRadius = window.getComputedStyle(activeCard).borderRadius || '20px';
        trailLayer.appendChild(ghost);

        const driftX = clamp((-velocityX) * 0.8, -42, 42);
        const driftY = clamp((Math.random() - 0.5) * 14, -7, 7);
        const driftRot = clamp((-velocityX) * 0.05, -6, 6);
        window.requestAnimationFrame(() => {
            ghost.style.transform = `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) rotate(${driftRot.toFixed(2)}deg) scale(0.94)`;
            ghost.style.opacity = '0';
            ghost.style.filter = 'blur(7px)';
        });

        window.setTimeout(() => {
            ghost.remove();
        }, 560);
    };

    if (useTrailFx && container) {
        trailLayer = document.createElement('div');
        trailLayer.className = 'card-trail-layer';
        container.insertBefore(trailLayer, container.firstChild);
    }

    if (useCardFx) {
        cards.forEach((card) => {
            card.classList.add('card-fx-enabled');

            card.addEventListener('pointerenter', (event) => {
                const activeCard = getActiveCard();
                if (card !== activeCard) return;
                applyHoverPose(card, event.clientX, event.clientY);
            });

            card.addEventListener('pointermove', (event) => {
                const activeCard = getActiveCard();
                if (card !== activeCard) return;
                applyHoverPose(card, event.clientX, event.clientY);
            });

            card.addEventListener('pointerleave', () => {
                if (dragging) return;
                const activeCard = getActiveCard();
                if (card !== activeCard) return;
                resetCardPose(card);
            });
        });
    }

    const getGap = () => {
        const styles = window.getComputedStyle(track);
        const raw = parseFloat(styles.columnGap || styles.gap || '0');
        return Number.isFinite(raw) ? raw : 0;
    };

    const updateButtons = () => {
        prevBtn.disabled = index <= 0;
        nextBtn.disabled = index >= panels.length - 1;
    };

    const setTrackX = (x, animate) => {
        if (animate) {
            track.classList.remove('dragging');
        } else {
            track.classList.add('dragging');
        }
        track.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const updatePanels = () => {
        panels.forEach((panel, panelIndex) => {
            const active = panelIndex === index;
            panel.classList.toggle('is-active', active);
            if (!useFx || active) {
                panel.classList.add('is-shown');
            }
        });

        if (useCardFx) {
            cards.forEach((card, cardIndex) => {
                if (cardIndex !== index) {
                    resetCardPose(card);
                }
            });
        }
    };

    const snapTo = (nextIndex, animate = true) => {
        const clamped = clamp(nextIndex, 0, panels.length - 1);
        index = clamped;

        const x = -(index * step);
        setTrackX(x, animate);
        updatePanels();
        updateButtons();

        if (!animate) {
            window.requestAnimationFrame(() => track.classList.remove('dragging'));
        }
    };

    const measure = () => {
        const first = panels[0];
        if (!first) return;

        const panelWidth = first.getBoundingClientRect().width || track.getBoundingClientRect().width;
        step = panelWidth + getGap();
        snapTo(index, false);
    };

    const goPrev = () => snapTo(index - 1, true);
    const goNext = () => snapTo(index + 1, true);

    const onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (step <= 0) return;

        dragging = true;
        pointerId = e.pointerId;
        startX = e.clientX;
        deltaX = 0;
        baseX = -(index * step);
        lastTrailStamp = 0;
        lastTrailDelta = 0;

        track.classList.add('dragging');
        track.setPointerCapture(pointerId);

        if (useCardFx) {
            const activeCard = getActiveCard();
            if (activeCard) {
                activeCard.classList.add('is-depth', 'is-card-dragging');
                activeCard.style.setProperty('--card-shift-x', '0px');
                activeCard.style.setProperty('--card-shift-y', '0px');
                activeCard.style.setProperty('--card-z', '-46px');
                activeCard.style.setProperty('--card-rot-x', '0deg');
                activeCard.style.setProperty('--card-rot-y', '0deg');
                activeCard.style.setProperty('--card-scale', '0.964');
            }
        }
    };

    const onPointerMove = (e) => {
        if (!dragging || e.pointerId !== pointerId) return;

        deltaX = e.clientX - startX;

        const minX = -(step * (panels.length - 1));
        const raw = baseX + deltaX;

        let x = raw;
        if (raw > 0) {
            x = raw * 0.35;
        } else if (raw < minX) {
            x = minX + (raw - minX) * 0.35;
        }

        setTrackX(x, false);

        if (useCardFx) {
            const activeCard = getActiveCard();
            if (activeCard) {
                activeCard.classList.add('is-depth', 'is-card-dragging');
                activeCard.style.setProperty('--card-shift-x', `${clamp(deltaX * 0.08, -16, 16).toFixed(2)}px`);
                activeCard.style.setProperty('--card-shift-y', '0px');
                activeCard.style.setProperty('--card-z', '-48px');
                activeCard.style.setProperty('--card-rot-x', '0deg');
                activeCard.style.setProperty('--card-rot-y', `${clamp(deltaX / 24, -9, 9).toFixed(2)}deg`);
                activeCard.style.setProperty('--card-scale', '0.962');
            }
        }

        if (useTrailFx) {
            const velocityX = deltaX - lastTrailDelta;
            const now = window.performance ? window.performance.now() : Date.now();
            if (Math.abs(velocityX) > 3.2 && (now - lastTrailStamp) > 34) {
                emitTrailGhost(velocityX);
                lastTrailStamp = now;
            }
            lastTrailDelta = deltaX;
        }
    };

    const endDrag = (e) => {
        if (!dragging) return;
        if (e && pointerId !== null && e.pointerId !== pointerId) return;

        dragging = false;
        if (pointerId !== null) {
            try {
                track.releasePointerCapture(pointerId);
            } catch (err) {
                // no-op
            }
        }

        pointerId = null;

        if (useCardFx) {
            const activeCard = getActiveCard();
            if (activeCard) {
                resetCardPose(activeCard);
            }
        }

        const threshold = Math.min(180, Math.max(60, track.clientWidth * 0.12));
        if (Math.abs(deltaX) > threshold) {
            if (deltaX < 0) {
                goNext();
            } else {
                goPrev();
            }
        } else {
            snapTo(index, true);
        }
    };

    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('dragstart', (e) => e.preventDefault());

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(measure, 100);
    }, { passive: true });

    updateButtons();
    measure();

    if (!useFx) {
        panels.forEach((panel) => panel.classList.add('is-shown'));
        return;
    }

    const revealSection = () => {
        section.classList.add('is-visible');
        updatePanels();
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                revealSection();
                observer.disconnect();
            });
        }, {
            threshold: 0.18,
            rootMargin: '0px 0px -12% 0px'
        });

        observer.observe(section);
    } else {
        revealSection();
    }
});
