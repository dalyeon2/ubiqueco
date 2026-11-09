/**
 * Portfolio Page
 */
$(function () {
    const $section = $('.cont1');
    if (!$section.length) return;

    const $typing = $section.find('.typing').first();
    const $menuItems = $section.find('.menu .item');
    const $listwrap = $section.find('.listwrap').first();
    const $subtabs = $section.find('.subtabs').first();
    const $subtablist = $section.find('.subtabs .list').first();
    const $search = $section.find('.search').first();
    const $searchInput = $section.find('.search input').first();
    const $searchClear = $section.find('.clear').first();
    const $list = $section.find('.listwrap .list').first();
    const $guard = $section.find('.moreguard').first();
    const $loading = $section.find('.loading').first();
    const $pop = $('.cont2 .pop').first();
    const $popBox = $pop.find('.box').first();
    const $popClose = $pop.find('.close').first();
    const $popLeft = $pop.find('.left').first();
    const $popPrev = $pop.find('.prev').first();
    const $popNext = $pop.find('.next').first();
    const $popPrevName = $pop.find('.prevname').first();
    const $popNextName = $pop.find('.nextname').first();
    const $popMeta = $pop.find('.meta').first();
    const $popName = $pop.find('.name').first();
    const $popTop = $pop.find('.top').first();
    const $popInfos = $pop.find('.infos').first();
    const $popRows = $popInfos.find('.row');
    const $popClientRow = $popRows.eq(0);
    const $popDateRow = $popRows.eq(1);
    const $popLinkRow = $popRows.eq(2);
    const $popClient = $pop.find('.popclient').first();
    const $popDate = $pop.find('.popdate').first();
    const $popLink = $pop.find('.poplink').first();
    const $popDesc = $pop.find('.desc').first();
    const $popHero = $pop.find('.pophero').first();
    const $popHoverMeta = $pop.find('.hovermeta').first();
    const $popGal = $pop.find('.popgal').first();
    const $popRight = $pop.find('.right').first();
    const $popSecMain = $pop.find('.secmain').first();
    if (
        !$typing.length
        || !$menuItems.length
        || !$listwrap.length
        || !$subtabs.length
        || !$subtablist.length
        || !$search.length
        || !$searchInput.length
        || !$searchClear.length
        || !$list.length
        || !$guard.length
        || !$loading.length
        || !$pop.length
        || !$popBox.length
        || !$popClose.length
        || !$popLeft.length
        || !$popPrev.length
        || !$popNext.length
        || !$popPrevName.length
        || !$popNextName.length
        || !$popMeta.length
        || !$popName.length
        || !$popTop.length
        || !$popInfos.length
        || !$popRows.length
        || !$popClientRow.length
        || !$popDateRow.length
        || !$popLinkRow.length
        || !$popClient.length
        || !$popDate.length
        || !$popLink.length
        || !$popDesc.length
        || !$popHero.length
        || !$popHoverMeta.length
        || !$popGal.length
        || !$popRight.length
        || !$popSecMain.length
    ) return;

    const formatDotMeta = (main, sub) => {
        const mainText = ((main || '') + '').trim();
        const subText = ((sub || '') + '').trim();
        if (mainText && subText) return `${mainText} · ${subText}`;
        return mainText || subText;
    };

    const listEl = $list.get(0);
    const guardEl = $guard.get(0);
    const rightEl = $popRight.get(0);
    if (!listEl || !guardEl || !rightEl) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const typingSpeed = 90;
    const typingDelay = 240;
    const revealDelay = 220;
    const batchSize = 4;
    const minBatchIntervalMs = 700;
    const batchVisualDelayMs = 560;
    const revealStaggerMs = prefersReduced ? 0 : 280;
    const revealBaseDelayMs = prefersReduced ? 0 : 260;
    const batchGroupPauseMs = prefersReduced ? 0 : 420;
    const masonryMinIntervalMs = 90;
    const masonryResizeDelayMs = 110;
    const masonryImageDelayMs = 130;
    const searchDebounceMs = 1200;
    const minQueryLength = 2;
    const state = {
        cate: 'all',
        inner: 'all',
        popKey: '',
        popCate: '',
        popInner: '',
        query: '',
        offset: 0,
        busy: false,
        ready: false,
        observer: null,
        lastLoadAt: 0,
        noResult: false,
        booting: false,
        firstBatchPlayed: false
    };
    const popCloseDurationMs = 560;
    let searchTimer = null;
    let batchTimer = null;
    let stagedBatchTimers = [];
    let postBatchEnsureTimer = null;
    let popCloseTimer = null;
    let headerSyncHoldTimer = null;
    let scrollHoldTimer = null;
    let scrollHoldActive = false;
    let scrollHoldY = 0;
    const innerLabelMap = {
        all: 'All',
        web: 'WEB',
        webCatalog: 'Web Catalog',
        platformCms: 'Platform CMS',
        cibi: 'CI/BI',
        logo: 'Logo',
        graphicApplication: 'Graphic Application',
        character: 'Character',
        etc: 'Etc',
        promotionFilm: 'Promotion Film',
        motionCg: 'Motion & CG',
        showroom: 'Showroom',
        vr: 'VR',
        brochure: 'Brochure',
        catalog: 'Catalog'
    };
    const innerOptionsByCate = {
        ux: ['all', 'web', 'webCatalog', 'platformCms'],
        bx: ['all', 'cibi', 'logo', 'graphicApplication', 'character', 'etc'],
        video: ['all', 'promotionFilm', 'motionCg'],
        space: ['all', 'showroom', 'vr'],
        print: ['all', 'brochure', 'catalog']
    };
    const cateOptions = ['all', 'ux', 'bx', 'video', 'space', 'print'];
    const normalizeCate = (value) => {
        const lower = ((value || '') + '').trim().toLowerCase();
        return cateOptions.includes(lower) ? lower : 'all';
    };
    const normalizeInner = (cate, value) => {
        if (cate === 'all') return 'all';
        const options = innerOptionsByCate[cate] || ['all'];
        const key = ((value || '') + '').trim();
        return options.includes(key) ? key : 'all';
    };
    const getPortfolioPathParts = () => {
        const rawPath = (window.location.pathname || '').split('/').filter(Boolean);
        if (!rawPath.length) return null;
        if ((rawPath[0] || '').toLowerCase() !== 'portfolio') return null;
        return rawPath.slice(1);
    };
    const isPortfolioPath = () => {
        const rawPath = (window.location.pathname || '').split('/').filter(Boolean);
        return rawPath.length > 0 && (rawPath[0] || '').toLowerCase() === 'portfolio';
    };
    const readStateFromUrl = () => {
        const pathParts = getPortfolioPathParts();
        if (pathParts && pathParts.length) {
            const rawCate = decodeURIComponent(pathParts[0] || '').toLowerCase();
            if (cateOptions.includes(rawCate)) {
                const pathInner = pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : 'all';
                const pathPop = pathParts.length > 2 ? decodeURIComponent(pathParts[2]) : '';
                return {
                    cate: rawCate,
                    inner: normalizeInner(rawCate, pathInner),
                    pop: pathPop
                };
            }
        }

        const hashRaw = (window.location.hash || '').replace(/^#/, '').trim();
        if (hashRaw) {
            const hashParts = hashRaw.split('/').map((item) => item.trim()).filter(Boolean);
            const rawCate = (hashParts[0] || '').toLowerCase();
            if (cateOptions.includes(rawCate)) {
                const hashInner = hashParts.length > 1 ? decodeURIComponent(hashParts[1]) : 'all';
                const hashPop = hashParts.length > 2 ? decodeURIComponent(hashParts[2]) : '';
                return {
                    cate: rawCate,
                    inner: normalizeInner(rawCate, hashInner),
                    pop: hashPop
                };
            }
        }

        const params = new URLSearchParams(window.location.search || '');
        const queryCate = normalizeCate(params.get('cate'));
        return {
            cate: queryCate,
            inner: normalizeInner(queryCate, params.get('inner')),
            pop: ((params.get('pop') || '') + '').trim()
        };
    };
    const syncStateToUrl = () => {
        if (!window.history || typeof window.history.replaceState !== 'function') return;
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('cate');
        nextUrl.searchParams.delete('inner');
        nextUrl.searchParams.delete('pop');

        if (isPortfolioPath()) {
            const buildPathSegments = () => {
                if (state.popKey) {
                    const popCate = normalizeCate(state.popCate || state.cate);
                    const popInner = normalizeInner(popCate, state.popInner || state.inner);
                    return [popCate, popInner, state.popKey];
                }
                if (state.cate === 'all') return [];
                if (state.inner !== 'all') return [state.cate, state.inner];
                return [state.cate];
            };
            const segments = ['portfolio', ...buildPathSegments()].map((segment) => encodeURIComponent(segment));
            nextUrl.pathname = `/${segments.join('/')}`;
            nextUrl.hash = '';
        } else {
            if (state.popKey) {
                const popCate = normalizeCate(state.popCate || state.cate);
                const popInner = normalizeInner(popCate, state.popInner || state.inner);
                nextUrl.hash = `${popCate}/${encodeURIComponent(popInner)}/${encodeURIComponent(state.popKey)}`;
            } else if (state.cate === 'all') {
                nextUrl.hash = '';
            } else {
                const hashValue = state.inner !== 'all'
                    ? `${state.cate}/${encodeURIComponent(state.inner)}`
                    : state.cate;
                nextUrl.hash = hashValue;
            }
        }

        const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (nextPath !== currentPath) {
            window.history.replaceState(null, '', nextPath);
        }
    };
    const getViewportHeight = () => window.innerHeight || document.documentElement.clientHeight || 0;
    const getDocumentHeight = () => Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
    );
    const refreshGlobalScroll = () => {
        if (window.scrollInstance && typeof window.scrollInstance.update === 'function') {
            window.scrollInstance.update();
        }
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    };
    const holdHeaderSync = (duration = 520) => {
        const body = document.body;
        if (!body) return;
        body.classList.add('is-header-sync-hold');
        if (headerSyncHoldTimer) {
            window.clearTimeout(headerSyncHoldTimer);
        }
        headerSyncHoldTimer = window.setTimeout(() => {
            headerSyncHoldTimer = null;
            body.classList.remove('is-header-sync-hold');
            document.dispatchEvent(new CustomEvent('ubique:header-sync'));
        }, Math.max(120, duration));
    };
    let globalRefreshTimer = null;
    const scheduleGlobalScrollRefresh = (delay = 180) => {
        if (globalRefreshTimer) {
            window.clearTimeout(globalRefreshTimer);
        }
        globalRefreshTimer = window.setTimeout(() => {
            globalRefreshTimer = null;
            window.requestAnimationFrame(() => {
                refreshGlobalScroll();
            });
        }, Math.max(0, delay));
    };
    const normalizeQuery = (value) => (value || '').trim().toLowerCase();
    const setLoading = (active) => {
        $loading.toggleClass('on', Boolean(active));
        $loading.attr('aria-hidden', active ? 'false' : 'true');
    };
    const cancelPendingBatch = () => {
        if (batchTimer) {
            window.clearTimeout(batchTimer);
            batchTimer = null;
        }
        if (stagedBatchTimers.length) {
            stagedBatchTimers.forEach((timerId) => window.clearTimeout(timerId));
            stagedBatchTimers = [];
        }
        if (postBatchEnsureTimer) {
            window.clearTimeout(postBatchEnsureTimer);
            postBatchEnsureTimer = null;
        }
        releaseViewportScrollHold();
        if (headerSyncHoldTimer) {
            window.clearTimeout(headerSyncHoldTimer);
            headerSyncHoldTimer = null;
        }
        document.body?.classList.remove('is-header-sync-hold');
        state.busy = false;
        setLoading(false);
    };
    const updateSearchUi = () => {
        const value = (($searchInput.val() || '') + '').trim();
        const hasValue = value.length > 0;
        $searchClear.css('visibility', hasValue ? 'visible' : 'hidden');
        $search.toggleClass('hasvalue', hasValue);
    };
    const scrollToPageTop = () => {
        const target = 0;
        if (window.scrollInstance && typeof window.scrollInstance.scrollTo === 'function') {
            window.scrollInstance.scrollTo(target, { duration: 0, disableLerp: true });
            if (typeof window.scrollInstance.update === 'function') {
                window.scrollInstance.update();
            }
        } else {
            window.scrollTo(0, target);
            document.documentElement.scrollTop = target;
            if (document.body) {
                document.body.scrollTop = target;
            }
        }

        window.requestAnimationFrame(() => {
            if (window.scrollInstance && typeof window.scrollInstance.scrollTo === 'function') {
                window.scrollInstance.scrollTo(target, { duration: 0, disableLerp: true });
                if (typeof window.scrollInstance.update === 'function') {
                    window.scrollInstance.update();
                }
                return;
            }
            window.scrollTo(0, target);
        });
    };
    const getPageScrollY = () => {
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
            : null;
        const smoothY = Number.isFinite(smoothRaw) ? Math.abs(smoothRaw) : 0;
        return Math.max(rootY, docY, bodyY, winY, smoothY);
    };
    const setPageScrollY = (target) => {
        const safeTarget = Math.max(0, Number.isFinite(target) ? target : 0);
        if (window.scrollInstance && typeof window.scrollInstance.scrollTo === 'function') {
            window.scrollInstance.scrollTo(safeTarget, { duration: 0, disableLerp: true });
            if (typeof window.scrollInstance.update === 'function') {
                window.scrollInstance.update();
            }
            return;
        }
        window.scrollTo(0, safeTarget);
        document.documentElement.scrollTop = safeTarget;
        if (document.body) {
            document.body.scrollTop = safeTarget;
        }
    };
    const isEditableTarget = (target) => {
        if (!target) return false;
        const tag = ((target.tagName || '') + '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
        return Boolean(target.isContentEditable);
    };
    const enforceScrollHold = () => {
        if (!scrollHoldActive) return;
        setPageScrollY(scrollHoldY);
    };
    const onScrollHoldWheel = (event) => {
        if (!scrollHoldActive) return;
        event.preventDefault();
        enforceScrollHold();
    };
    const onScrollHoldTouchMove = (event) => {
        if (!scrollHoldActive) return;
        event.preventDefault();
        enforceScrollHold();
    };
    const onScrollHoldKeydown = (event) => {
        if (!scrollHoldActive) return;
        if (isEditableTarget(event.target)) return;
        const blockedKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
        if (!blockedKeys.includes(event.key)) return;
        event.preventDefault();
        enforceScrollHold();
    };
    const onScrollHoldNativeScroll = () => {
        if (!scrollHoldActive) return;
        enforceScrollHold();
    };
    const releaseViewportScrollHold = () => {
        if (scrollHoldTimer) {
            window.clearTimeout(scrollHoldTimer);
            scrollHoldTimer = null;
        }
        if (!scrollHoldActive) return;
        scrollHoldActive = false;
        document.body?.classList.remove('is-portfolio-scroll-hold');
        window.removeEventListener('wheel', onScrollHoldWheel, true);
        window.removeEventListener('touchmove', onScrollHoldTouchMove, true);
        window.removeEventListener('keydown', onScrollHoldKeydown, true);
        window.removeEventListener('scroll', onScrollHoldNativeScroll, true);
    };
    const holdViewportScroll = (duration = 520) => {
        scrollHoldY = getPageScrollY();
        if (!scrollHoldActive) {
            scrollHoldActive = true;
            document.body?.classList.add('is-portfolio-scroll-hold');
            window.addEventListener('wheel', onScrollHoldWheel, { passive: false, capture: true });
            window.addEventListener('touchmove', onScrollHoldTouchMove, { passive: false, capture: true });
            window.addEventListener('keydown', onScrollHoldKeydown, { capture: true });
            window.addEventListener('scroll', onScrollHoldNativeScroll, { passive: true, capture: true });
        }
        enforceScrollHold();
        window.requestAnimationFrame(enforceScrollHold);
        if (scrollHoldTimer) {
            window.clearTimeout(scrollHoldTimer);
        }
        scrollHoldTimer = window.setTimeout(() => {
            releaseViewportScrollHold();
            window.requestAnimationFrame(() => {
                setPageScrollY(scrollHoldY);
            });
        }, Math.max(160, duration));
    };
    const restoreFocusWithoutScrollShift = (el) => {
        if (!el || typeof el.focus !== 'function' || !document.contains(el)) return;
        const beforeY = getPageScrollY();
        let usedPreventScroll = false;
        try {
            el.focus({ preventScroll: true });
            usedPreventScroll = true;
        } catch (error) {
            el.focus();
        }
        if (usedPreventScroll) return;
        const afterY = getPageScrollY();
        if (Math.abs(afterY - beforeY) < 1) return;
        setPageScrollY(beforeY);
        window.requestAnimationFrame(() => {
            setPageScrollY(beforeY);
        });
    };

    const setupMenuRoll = () => {
        $menuItems.each(function (index) {
            const el = this;
            if (!el || el.dataset.rollReady === '1') return;
            const raw = ((el.textContent || '') + '').trim();
            if (!raw) return;
            el.dataset.rollReady = '1';
            const frag = document.createDocumentFragment();
            Array.from(raw).forEach((char, charIndex) => {
                const roll = document.createElement('span');
                roll.className = 'roll';
                roll.style.setProperty('--char-index', charIndex);
                if (char === ' ') {
                    roll.classList.add('space');
                }
                const inner = document.createElement('span');
                inner.className = 'roll-inner';
                const line1 = document.createElement('span');
                line1.className = 'roll-line';
                line1.textContent = char === ' ' ? '' : char;
                const line2 = document.createElement('span');
                line2.className = 'roll-line';
                line2.textContent = char === ' ' ? '' : char;
                inner.appendChild(line1);
                inner.appendChild(line2);
                roll.appendChild(inner);
                frag.appendChild(roll);
            });
            el.textContent = '';
            el.appendChild(frag);
        });
    };

    const masonryState = {
        rafId: 0,
        resizeTimer: 0,
        lastRunAt: 0,
        observer: null
    };

    if ('ResizeObserver' in window) {
        masonryState.observer = new ResizeObserver(() => {
            scheduleMasonry(masonryResizeDelayMs);
        });
    }

    const applyMasonryLayout = () => {
        if (!listEl || !listEl.children.length) return;
        const styles = window.getComputedStyle(listEl);
        const rawColumns = parseInt(styles.getPropertyValue('--masonry-columns'), 10);
        const columns = Number.isFinite(rawColumns) && rawColumns > 0 ? rawColumns : 1;
        const gapX = parseFloat(styles.getPropertyValue('--masonry-gap-x')) || 0;
        const gapY = parseFloat(styles.getPropertyValue('--masonry-gap-y')) || 0;
        const containerWidth = listEl.clientWidth || 0;
        if (!containerWidth) return;

        const cards = Array.from(listEl.querySelectorAll('.card'));
        const regularCards = cards.filter((card) => !card.classList.contains('noresult'));
        const emptyCard = cards.find((card) => card.classList.contains('noresult'));

        if (!regularCards.length && emptyCard) {
            emptyCard.style.position = 'relative';
            emptyCard.style.left = '0px';
            emptyCard.style.top = '0px';
            emptyCard.style.width = '100%';
            listEl.style.height = `${emptyCard.offsetHeight || 0}px`;
            return;
        }

        const colWidth = Math.max(0, (containerWidth - gapX * (columns - 1)) / columns);
        const colHeights = new Array(columns).fill(0);

        regularCards.forEach((card) => {
            card.style.position = 'absolute';
            card.style.width = `${colWidth}px`;
            const minHeight = Math.min(...colHeights);
            const colIndex = colHeights.indexOf(minHeight);
            const left = (colWidth + gapX) * colIndex;
            const top = minHeight;
            card.style.left = `${left}px`;
            card.style.top = `${top}px`;
            const height = card.offsetHeight || 0;
            colHeights[colIndex] = top + height + gapY;
        });

        const maxHeight = colHeights.length ? Math.max(...colHeights) : 0;
        listEl.style.height = `${Math.max(0, maxHeight - gapY)}px`;
    };

    const scheduleMasonry = (delay = 0) => {
        if (masonryState.resizeTimer) {
            window.clearTimeout(masonryState.resizeTimer);
            masonryState.resizeTimer = 0;
        }
        const elapsed = Date.now() - masonryState.lastRunAt;
        const wait = Math.max(delay, Math.max(0, masonryMinIntervalMs - elapsed));
        masonryState.resizeTimer = window.setTimeout(() => {
            masonryState.resizeTimer = 0;
            if (masonryState.rafId) {
                window.cancelAnimationFrame(masonryState.rafId);
            }
            masonryState.rafId = window.requestAnimationFrame(() => {
                masonryState.rafId = 0;
                masonryState.lastRunAt = Date.now();
                applyMasonryLayout();
            });
        }, wait);
    };

    const watchCardImages = (cards) => {
        cards.forEach((card) => {
            if (masonryState.observer && card && card.dataset.masonryObserved !== '1') {
                masonryState.observer.observe(card);
                card.dataset.masonryObserved = '1';
            }
            const images = card.querySelectorAll('img');
            images.forEach((image) => {
                if (image.complete) return;
                image.addEventListener('load', () => scheduleMasonry(masonryImageDelayMs), { once: true });
                image.addEventListener('error', () => scheduleMasonry(masonryImageDelayMs), { once: true });
            });
        });
    };

    const popDetailLayoutState = {
        timer: 0,
        rafId: 0
    };

    const resetPopDetailGroup = (group) => {
        group.classList.remove('is-masonry2');
        group.style.position = '';
        group.style.height = '';
        const figures = Array.from(group.querySelectorAll('figure'));
        figures.forEach((figure) => {
            figure.style.position = '';
            figure.style.left = '';
            figure.style.top = '';
            figure.style.width = '';
            figure.style.marginTop = '';
        });
    };

    const applyPopDetailMasonry = () => {
        const galleryEl = $popGal.get(0);
        if (!galleryEl) return;
        const groups = Array.from(galleryEl.querySelectorAll('.dimgs.col2'));
        groups.forEach((group) => {
            resetPopDetailGroup(group);

            const groupStyle = window.getComputedStyle(group);
            const templateColumns = (groupStyle.gridTemplateColumns || '')
                .split(' ')
                .map((token) => token.trim())
                .filter(Boolean)
                .filter((token) => token !== 'none');
            if (templateColumns.length < 2) {
                return;
            }

            const containerWidth = group.clientWidth || 0;
            if (!containerWidth) return;

            const columnGap = parseFloat(groupStyle.columnGap || groupStyle.gap) || 28;
            const columnWidth = Math.max(0, (containerWidth - columnGap) / 2);
            const colHeights = [0, 0];
            const figures = Array.from(group.querySelectorAll('figure'));

            const measuredHeights = figures
                .map((figure) => figure.offsetHeight || 0)
                .filter((value) => value > 0);

            if (measuredHeights.length >= 2) {
                const minHeight = Math.min(...measuredHeights);
                const maxHeight = Math.max(...measuredHeights);
                const ratio = minHeight > 0 ? (maxHeight / minHeight) : 1;
                if (ratio < 2) {
                    return;
                }
            }

            group.classList.add('is-masonry2');
            group.style.position = 'relative';

            figures.forEach((figure) => {
                const colIndex = colHeights[0] <= colHeights[1] ? 0 : 1;
                const left = colIndex === 0 ? 0 : (columnWidth + columnGap);
                const top = colHeights[colIndex];

                figure.style.position = 'absolute';
                figure.style.width = `${columnWidth}px`;
                figure.style.left = `${left}px`;
                figure.style.top = `${top}px`;
                figure.style.marginTop = '0px';

                const height = figure.offsetHeight || 0;
                colHeights[colIndex] = top + height + columnGap;
            });

            group.style.height = `${Math.max(0, Math.max(...colHeights) - columnGap)}px`;
        });
    };

    const schedulePopDetailLayout = (delay = 0) => {
        if (popDetailLayoutState.timer) {
            window.clearTimeout(popDetailLayoutState.timer);
            popDetailLayoutState.timer = 0;
        }
        popDetailLayoutState.timer = window.setTimeout(() => {
            popDetailLayoutState.timer = 0;
            if (popDetailLayoutState.rafId) {
                window.cancelAnimationFrame(popDetailLayoutState.rafId);
            }
            popDetailLayoutState.rafId = window.requestAnimationFrame(() => {
                popDetailLayoutState.rafId = 0;
                applyPopDetailMasonry();
            });
        }, Math.max(0, delay));
    };

    const watchPopDetailImages = () => {
        const galleryEl = $popGal.get(0);
        if (!galleryEl) return;
        const images = Array.from(galleryEl.querySelectorAll('.dimgs.col2 img'));
        images.forEach((image) => {
            if (image.complete) return;
            image.addEventListener('load', () => schedulePopDetailLayout(60), { once: true });
            image.addEventListener('error', () => schedulePopDetailLayout(60), { once: true });
        });
    };

    const defaultProjects = [
        {
            cate: 'ux',
            main: 'UX',
            sub: 'WEB',
            inner: 'web',
            client: 'Hanjin GTC',
            image: '../assets/img/main/visual01.png'
        },
        {
            cate: 'ux',
            main: 'UX',
            sub: 'Web Catalog',
            inner: 'webCatalog',
            client: 'Thomas MCO',
            image: '../assets/img/main/visual02.png'
        },
        {
            cate: 'ux',
            main: 'UX',
            sub: 'Platform CMS',
            inner: 'platformCms',
            client: 'Future Lab',
            image: '../assets/img/main/visual06.png'
        },
        {
            cate: 'ux',
            main: 'UX',
            sub: 'WEB',
            inner: 'web',
            client: 'Threeview',
            image: '../assets/img/main/visual03.png'
        },
        {
            cate: 'bx',
            main: 'BX',
            sub: 'Graphic Application',
            inner: 'graphicApplication',
            client: 'Brandzin',
            image: '../assets/img/main/visual07.png'
        },
        {
            cate: 'bx',
            main: 'BX',
            sub: 'CI/BI',
            inner: 'cibi',
            client: 'Ubique Korea',
            image: '../assets/img/main/graphic01.png'
        },
        {
            cate: 'bx',
            main: 'BX',
            sub: 'Logo',
            inner: 'logo',
            client: 'NeoMark',
            image: '../assets/img/main/visual07.png'
        },
        {
            cate: 'bx',
            main: 'BX',
            sub: 'Character',
            inner: 'character',
            client: 'Momo Friends',
            image: '../assets/img/main/hero-bg02.jpg'
        },
        {
            cate: 'bx',
            main: 'BX',
            sub: 'Etc',
            inner: 'etc',
            client: 'Etc Studio',
            image: '../assets/img/main/hero-bg03.jpg'
        },
        {
            cate: 'video',
            main: 'VIDEO',
            sub: 'Promotion Film',
            inner: 'promotionFilm',
            client: 'Mode Seoul',
            image: '../assets/img/main/hero-bg04.jpg'
        },
        {
            cate: 'video',
            main: 'VIDEO',
            sub: 'Motion & CG',
            inner: 'motionCg',
            client: 'Studio One',
            image: '../assets/img/main/hero-bg01.jpg'
        },
        {
            cate: 'space',
            main: 'SPACE',
            sub: 'Showroom',
            inner: 'showroom',
            client: 'House of Lab',
            image: '../assets/img/main/hero-bg03.jpg'
        },
        {
            cate: 'space',
            main: 'SPACE',
            sub: 'VR',
            inner: 'vr',
            client: 'Green Tech',
            image: '../assets/img/main/hero-bg02.jpg'
        },
        {
            cate: 'print',
            main: 'PRINT',
            sub: 'Brochure',
            inner: 'brochure',
            client: 'Caring Lab',
            image: '../assets/img/common/default-image.png'
        },
        {
            cate: 'print',
            main: 'PRINT',
            sub: 'Catalog',
            inner: 'catalog',
            client: 'Design Pack',
            image: '../assets/img/main/hero-bg04.jpg'
        }
    ];

    const toKey = (value) => ((value || '') + '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const escapeAttr = (value) => ((value || '') + '').replace(/"/g, '&quot;');
    const escapeHtml = (value) => ((value || '') + '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const isYoutubeUrl = (value) => /(?:youtube\.com|youtu\.be)/i.test((value || '') + '');
    const toYoutubeEmbedUrl = (value) => {
        const raw = ((value || '') + '').trim();
        if (!raw) return '';
        let match = raw.match(/youtu\.be\/([^?&#/]+)/i);
        if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
        match = raw.match(/youtube\.com\/watch\?v=([^?&#/]+)/i);
        if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
        match = raw.match(/youtube\.com\/shorts\/([^?&#/]+)/i);
        if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
        match = raw.match(/youtube\.com\/embed\/([^?&#/]+)/i);
        if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
        return '';
    };
    const buildPopHash = (item) => (
        `${item.cate}/${encodeURIComponent(item.inner || 'all')}/${encodeURIComponent(item.key)}`
    );
    const buildPopUrl = (item) => {
        const url = new URL(window.location.href);
        if (isPortfolioPath()) {
            const segments = ['portfolio', item.cate, item.inner || 'all', item.key]
                .map((segment) => encodeURIComponent(segment));
            url.pathname = `/${segments.join('/')}`;
            url.hash = '';
        } else {
            url.hash = buildPopHash(item);
        }
        return url.toString();
    };
    const mainByCate = {
        ux: 'UX',
        bx: 'BX',
        video: 'VIDEO',
        space: 'SPACE',
        print: 'PRINT'
    };
    const fallbackThumbSrc = '../assets/img/common/default-image.png';
    const toStringArray = (value) => {
        if (Array.isArray(value)) {
            return value.map((item) => ((item || '') + '').trim()).filter(Boolean);
        }
        if (typeof value === 'string') {
            return value.split(/[\r\n,]+/).map((item) => item.trim()).filter(Boolean);
        }
        return [];
    };
    const normalizeDetailBlocks = (value) => {
        if (!Array.isArray(value)) return [];
        const blocks = [];
        value.forEach((block) => {
            if (!block || typeof block !== 'object') return;
            const type = ((block.type || '') + '').trim().toLowerCase();
            if (type === 'text') {
                const text = ((block.text || '') + '').trim();
                if (!text) return;
                blocks.push({ type: 'text', text });
                return;
            }
            if (type === 'video') {
                const rawItems = Array.isArray(block.items) ? block.items : [];
                let src = '';
                if (rawItems.length) {
                    const first = rawItems[0];
                    if (typeof first === 'string') {
                        src = first.trim();
                    } else if (first && typeof first === 'object') {
                        src = ((first.src || first.video || '') + '').trim();
                    }
                }
                if (!src) return;
                blocks.push({ type: 'video', items: [{ src }] });
                return;
            }
            if (type !== 'images') return;
            let columns = parseInt(block.columns, 10);
            if (![1, 2, 3].includes(columns)) columns = 3;
            const rawItems = Array.isArray(block.items) ? block.items : [];
            const seen = new Set();
            const items = [];
            rawItems.forEach((entry) => {
                let src = '';
                if (typeof entry === 'string') {
                    src = entry.trim();
                } else if (entry && typeof entry === 'object') {
                    src = ((entry.src || entry.image || '') + '').trim();
                }
                if (!src || seen.has(src)) return;
                seen.add(src);
                items.push({ src });
            });
            if (!items.length) return;
            blocks.push({ type: 'images', columns, items });
        });
        return blocks;
    };
    const collectDetailImages = (blocks) => {
        const images = [];
        const seen = new Set();
        if (!Array.isArray(blocks)) return images;
        blocks.forEach((block) => {
            if (!block || block.type !== 'images' || !Array.isArray(block.items)) return;
            block.items.forEach((item) => {
                const src = ((item && item.src) ? item.src : '').trim();
                if (!src || seen.has(src)) return;
                seen.add(src);
                images.push(src);
            });
        });
        return images;
    };
    const normalizeProjectItem = (source, index, usedKeys) => {
        const item = Object.assign({}, source || {});
        const fallback = `p${index + 1}`;
        const cate = normalizeCate(item.cate || 'ux');
        item.cate = cate === 'all' ? 'ux' : cate;

        const innerOptions = (innerOptionsByCate[item.cate] || ['all']).filter((option) => option !== 'all');
        const inner = ((item.inner || '') + '').trim();
        item.inner = innerOptions.includes(inner) ? inner : (innerOptions[0] || 'all');

        item.main = ((item.main || '') + '').trim() || mainByCate[item.cate] || item.cate.toUpperCase();
        item.sub = ((item.sub || '') + '').trim() || innerLabelMap[item.inner] || item.inner;
        item.title = ((item.title || item.projectName || item.subject || '') + '').trim()
            || ((item.client || '') + '').trim()
            || `Project ${index + 1}`;
        item.client = ((item.client || item.company || '') + '').trim();

        const keyBase = ((item.key || '') + '').trim() || `${item.cate}${item.inner}${item.title}${item.client}`;
        let key = toKey(keyBase) || fallback;
        let suffix = 2;
        while (usedKeys.has(key)) {
            key = `${toKey(keyBase) || fallback}${suffix}`;
            suffix += 1;
        }
        usedKeys.add(key);
        item.key = key;

        item.image = ((item.coverImage || item.originalImage || item.image || '') + '').trim();
        item.thumbImage = ((item.thumbnail || item.thumbImage || item.thumb || item.cardImage || '') + '').trim();
        item.detailBlocks = normalizeDetailBlocks(item.detailBlocks || item.blocks || []);
        const legacyGallery = Array.from(new Set(toStringArray(item.gallery || item.galleryImages)));
        if (!item.detailBlocks.length && legacyGallery.length) {
            let columns = 3;
            if (legacyGallery.length === 1) columns = 1;
            else if (legacyGallery.length === 2) columns = 2;
            item.detailBlocks = [{
                type: 'images',
                columns,
                items: legacyGallery.map((src) => ({ src }))
            }];
        }
        const firstDetail = collectDetailImages(item.detailBlocks)[0] || '';
        if (!item.image) {
            item.image = firstDetail || item.thumbImage;
        }
        if (!item.thumbImage) {
            item.thumbImage = item.image || firstDetail;
        }

        item.date = ((item.date || '') + '').trim();
        item.type = ((item.type || '') + '').trim() || `${item.main} / ${item.sub}`;
        item.concept = ((item.concept || '') + '').trim();
        item.desc = ((item.desc || '') + '').trim();
        item.projectLink = ((item.projectLink || '') + '').trim();
        item.popUrl = item.popUrl || buildPopUrl(item);
        item.url = item.url || item.popUrl;
        return item;
    };
    const normalizeProjectList = (sourceList) => {
        if (!Array.isArray(sourceList) || !sourceList.length) return [];
        const usedKeys = new Set();
        return sourceList.map((item, index) => normalizeProjectItem(item, index, usedKeys));
    };
    let projects = normalizeProjectList(defaultProjects);
    let projectMap = new Map(projects.map((item) => [item.key, item]));
    const setProjectData = (nextProjects) => {
        const normalized = normalizeProjectList(nextProjects);
        projects = normalized;
        projectMap = new Map(projects.map((item) => [item.key, item]));
        return true;
    };
    const loadProjectsFromApi = async () => {
        try {
            const response = await fetch('/api/portfolio.php?action=list', {
                method: 'GET',
                cache: 'no-store',
                credentials: 'same-origin'
            });
            if (!response.ok) return;
            const payload = await response.json();
            if (!payload || payload.success !== true || !Array.isArray(payload.items)) return;
            setProjectData(payload.items);
        } catch (error) {
            console.warn('[portfolio] failed to load external projects', error);
        }
    };
    const projectDataReady = loadProjectsFromApi();
    let popThumbKey = '';

    const syncPopScrollLock = (locked) => {
        const isLocked = Boolean(locked);
        document.documentElement.classList.toggle('popopen', isLocked);
        $('body').toggleClass('popopen', isLocked);

        const engine = window.scrollInstance;
        if (engine) {
            if (isLocked && typeof engine.stop === 'function') {
                engine.stop();
            }
            if (!isLocked && typeof engine.start === 'function') {
                engine.start();
            }
            if (typeof engine.update === 'function') {
                engine.update();
            }
        }

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    };

    const clearPopState = () => {
        state.popKey = '';
        state.popCate = '';
        state.popInner = '';
        popThumbKey = '';
    };

    const setPagerState = ($button, $label, item) => {
        const key = item && item.key ? item.key : '';
        if (!key) {
            const isPrev = $button && $button.hasClass('prev');
            const emptyAria = isPrev
                ? '이전 프로젝트가 없습니다.'
                : '다음 프로젝트가 없습니다.';
            $button
                .addClass('off')
                .attr('aria-disabled', 'true')
                .attr('tabindex', '-1')
                .attr('datakey', '')
                .attr('aria-label', emptyAria);
            $label.text('프로젝트가 없습니다.');
            return;
        }

        $button
            .removeClass('off')
            .attr('aria-disabled', 'false')
            .attr('tabindex', '0')
            .attr('datakey', key)
            .attr('aria-label', `${item.title || item.client || key} 썸네일로 이동`);
        $label.text(item.title || item.client || key);
    };

    const getPopPool = () => {
        const pool = getPool();
        if (pool.length) return pool;
        return projects;
    };

    const resolvePopSource = (item) => {
        let source = getPopPool();
        let index = source.findIndex((entry) => entry.key === item.key);

        if (index < 0) {
            source = projects;
            index = source.findIndex((entry) => entry.key === item.key);
        }

        return { source, index };
    };

    const stepPopIndex = (source, fromIndex, direction, skipIndex) => {
        if (!Array.isArray(source) || source.length < 2 || fromIndex < 0) return -1;
        let nextIndex = fromIndex;
        for (let guard = 0; guard < source.length; guard += 1) {
            nextIndex = (nextIndex + direction + source.length) % source.length;
            if (nextIndex !== skipIndex) return nextIndex;
        }
        return -1;
    };

    const resolvePopThumbState = (item, options = {}) => {
        const keepThumb = options.keepThumb === true;
        const context = resolvePopSource(item);
        const source = Array.isArray(context.source) ? context.source : [];
        const currentIndex = typeof context.index === 'number' ? context.index : -1;
        if (currentIndex < 0 || source.length < 2) return null;

        let heroIndex = -1;
        if (keepThumb && popThumbKey) {
            heroIndex = source.findIndex((entry) => entry.key === popThumbKey);
            if (heroIndex === currentIndex) {
                heroIndex = -1;
            }
        }

        if (heroIndex < 0) {
            heroIndex = stepPopIndex(source, currentIndex, -1, currentIndex);
        }
        if (heroIndex < 0) return null;

        const candidateCount = source.length - 1;
        let prevIndex = -1;
        let nextIndex = -1;
        if (candidateCount > 0) {
            prevIndex = stepPopIndex(source, heroIndex, -1, currentIndex);
            nextIndex = stepPopIndex(source, heroIndex, 1, currentIndex);
        }

        return { source, currentIndex, heroIndex, prevIndex, nextIndex };
    };

    const updatePopPager = (item, options = {}) => {
        if (!item) {
            popThumbKey = '';
            $popHero.attr('src', '').attr('alt', '');
            $popSecMain.attr('data-project-label', '');
            $popHoverMeta.text('');
            $popSecMain
                .attr('datakey', '')
                .attr('tabindex', '-1')
                .attr('aria-disabled', 'true')
                .attr('aria-label', '프로젝트가 없습니다.');
            setPagerState($popPrev, $popPrevName, null);
            setPagerState($popNext, $popNextName, null);
            return;
        }

        const thumbState = resolvePopThumbState(item, options);
        if (!thumbState) {
            const heroImage = ((item.image || '') + '').trim() || fallbackThumbSrc;
            const heroMeta = formatDotMeta(item.main, item.sub);
            const heroLabel = `${heroMeta} ${item.title || item.client || 'Project'}`.trim();
            $popSecMain.attr('data-project-label', heroLabel);
            $popHoverMeta.text(heroLabel);
            $popHero.attr('src', heroImage).attr('alt', `${item.title || item.client || 'Project'} 대표 이미지`);
            $popSecMain
                .attr('datakey', '')
                .attr('tabindex', '-1')
                .attr('aria-disabled', 'true')
                .attr('aria-label', '추가 프로젝트가 없습니다.');
            setPagerState($popPrev, $popPrevName, null);
            setPagerState($popNext, $popNextName, null);
            return;
        }

        const source = thumbState.source;
        const hero = source[thumbState.heroIndex];
        const prev = thumbState.prevIndex >= 0 ? source[thumbState.prevIndex] : null;
        const next = thumbState.nextIndex >= 0 ? source[thumbState.nextIndex] : null;
        const heroImage = ((hero.image || '') + '').trim() || fallbackThumbSrc;
        const heroMeta = formatDotMeta(hero.main, hero.sub);
        const heroLabel = `${heroMeta} ${hero.title || hero.client || 'Project'}`.trim();

        popThumbKey = hero.key || '';
        $popSecMain.attr('data-project-label', heroLabel);
        $popHoverMeta.text(heroLabel);
        $popHero.attr('src', heroImage).attr('alt', `${hero.title || hero.client || 'Project'} 썸네일 이미지`);
        $popSecMain
            .attr('datakey', hero.key || '')
            .attr('tabindex', hero.key ? '0' : '-1')
            .attr('aria-disabled', hero.key ? 'false' : 'true')
            .attr('aria-label', hero.key ? `${hero.title || hero.client || 'Project'} 상세 보기` : '대표 이미지');

        setPagerState($popPrev, $popPrevName, prev);
        setPagerState($popNext, $popNextName, next);
    };

    const setPopThumbByKey = (key) => {
        const safeKey = ((key || '') + '').trim();
        if (!safeKey) return;
        const currentItem = projectMap.get(state.popKey || '');
        if (!currentItem) return;

        const context = resolvePopSource(currentItem);
        const source = Array.isArray(context.source) ? context.source : [];
        const currentIndex = typeof context.index === 'number' ? context.index : -1;
        const targetIndex = source.findIndex((entry) => entry.key === safeKey);
        if (targetIndex < 0 || targetIndex === currentIndex) return;

        popThumbKey = safeKey;
        updatePopPager(currentItem, { keepThumb: true });
    };

    let popContentTween = null;
    const getPopContentTargets = () => {
        const targets = [
            $popSecMain.get(0),
            $pop.find('.panel > .head').get(0),
            $pop.find('.panel > .body').get(0)
        ].filter(Boolean);
        return targets;
    };

    const clearPopContentTween = () => {
        if (!window.gsap) {
            popContentTween = null;
            $pop.removeClass('isswitching');
            return;
        }
        const targets = getPopContentTargets();
        if (popContentTween) {
            popContentTween.kill();
            popContentTween = null;
        }
        if (targets.length) {
            window.gsap.set(targets, { clearProps: 'opacity,transform' });
        }
        $pop.removeClass('isswitching');
    };

    const runPopContentSwitch = (applyUpdate) => {
        if (typeof applyUpdate !== 'function') return;
        const canAnimate = !prefersReduced && window.gsap && $pop.hasClass('on');
        if (!canAnimate) {
            applyUpdate();
            return;
        }

        const targets = getPopContentTargets();
        if (!targets.length) {
            applyUpdate();
            return;
        }

        clearPopContentTween();
        const gsap = window.gsap;
        $pop.addClass('isswitching');

        popContentTween = gsap.timeline({
            onComplete: () => {
                popContentTween = null;
                $pop.removeClass('isswitching');
                gsap.set(targets, { clearProps: 'opacity,transform' });
            }
        });

        popContentTween
            .to(targets, {
                opacity: 0,
                y: 14,
                duration: 0.2,
                ease: 'power1.in',
                stagger: 0.03,
                onComplete: applyUpdate
            })
            .fromTo(
                targets,
                { opacity: 0, y: 16 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.36,
                    ease: 'power2.out',
                    stagger: 0.04
                }
            );
    };

    const clearPopCloseTimer = () => {
        if (!popCloseTimer) return;
        window.clearTimeout(popCloseTimer);
        popCloseTimer = null;
    };

    const renderDetailBlocks = (item) => {
        const blocks = Array.isArray(item.detailBlocks) ? item.detailBlocks : [];
        const fallbackText = ((item.desc || '') + '').trim();
        const fallbackImage = ((item.image || '') + '').trim() || fallbackThumbSrc;
        const html = [];

        blocks.forEach((block) => {
            if (!block || typeof block !== 'object') return;
            if (block.type === 'text') {
                const text = ((block.text || '') + '').trim();
                if (!text) return;
                html.push(`<div class="dtext">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`);
                return;
            }
            if (block.type === 'video') {
                const items = Array.isArray(block.items) ? block.items : [];
                const src = items.length && items[0] && typeof items[0] === 'object'
                    ? ((items[0].src || items[0].video || '') + '').trim()
                    : '';
                if (!src) return;
                const embedUrl = toYoutubeEmbedUrl(src);
                if (embedUrl) {
                    html.push(
                        `<div class="dvideo">`
                        + `<div class="dvideo-embed">`
                        + `<iframe src="${escapeAttr(embedUrl)}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
                        + `</div>`
                        + `</div>`
                    );
                    return;
                }
                html.push(
                    `<div class="dvideo">`
                    + `<video src="${escapeAttr(src)}" controls preload="metadata" playsinline></video>`
                    + `</div>`
                );
                return;
            }
            if (block.type !== 'images') return;
            let columns = parseInt(block.columns, 10);
            if (![1, 2, 3].includes(columns)) columns = 3;
            const items = Array.isArray(block.items) ? block.items : [];
            const images = items
                .map((entry) => {
                    if (typeof entry === 'string') return entry.trim();
                    if (entry && typeof entry === 'object') return ((entry.src || entry.image || '') + '').trim();
                    return '';
                })
                .filter(Boolean);
            if (!images.length) return;
            const shots = images.map((src, index) => (
                `<figure><img src="${escapeAttr(src)}" alt="${escapeAttr(`${item.title || item.client || 'Project'} 디테일 이미지 ${index + 1}`)}" loading="lazy"></figure>`
            )).join('');
            html.push(`<div class="dimgs col${columns}">${shots}</div>`);
        });

        if (!html.length && fallbackImage) {
            html.push(`<div class="dimgs col1"><figure><img src="${escapeAttr(fallbackImage)}" alt="${escapeAttr(`${item.title || item.client || 'Project'} 디테일 이미지`)}" loading="lazy"></figure></div>`);
        }
        if (!html.length && fallbackText) {
            html.push(`<div class="dtext">${escapeHtml(fallbackText).replace(/\n/g, '<br>')}</div>`);
        }
        if (!html.length) {
            html.push('<p class="detailempty">등록된 디테일이 없습니다.</p>');
        }
        return html.join('');
    };

    const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));
    const getPopupBoxLayout = () => {
        const viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
        const boxWidth = Math.min(1584, Math.max(320, viewportW - 48));
        const boxHeight = Math.min(1074, Math.max(320, viewportH - 98));
        const left = (viewportW - boxWidth) / 2;
        const top = viewportH - boxHeight;
        return { viewportW, viewportH, boxWidth, boxHeight, left, top };
    };

    const setPopGridZoomOrigin = () => {
        $pop.css('--grid-from-x', '0px');
        $pop.css('--grid-from-y', 'calc(var(--poptravel) + var(--popbase))');
        $pop.css('--grid-from-scale', '1');
    };

    let popMorphTween = null;
    let popGhostEl = null;
    const clearPopOpenMorph = () => {
        if (popMorphTween) {
            popMorphTween.kill();
            popMorphTween = null;
        }
        if (popGhostEl && popGhostEl.parentNode) {
            popGhostEl.parentNode.removeChild(popGhostEl);
        }
        popGhostEl = null;
        if (window.gsap && $popHero.length) {
            window.gsap.set($popHero.get(0), { clearProps: 'opacity,filter' });
        }
    };

    const playPopOpenMorph = () => {
    };

    let popTriggerEl = null;
    const closePop = (options = {}) => {
        const shouldSyncUrl = options.syncUrl !== false;
        if (!$pop.hasClass('on') && !$pop.hasClass('closing')) {
            if (state.popKey) {
                clearPopState();
                if (shouldSyncUrl) {
                    syncStateToUrl();
                }
            }
            return;
        }
        if ($pop.hasClass('closing')) return;

        clearPopContentTween();
        clearPopOpenMorph();
        if (popTriggerEl && document.contains(popTriggerEl)) {
            setPopGridZoomOrigin(popTriggerEl);
        }
        $pop.removeClass('on').addClass('closing').attr('aria-hidden', 'true');
        clearPopCloseTimer();
        popCloseTimer = window.setTimeout(() => {
            popCloseTimer = null;
            $pop.removeClass('closing');
            if (window.gsap) {
                window.gsap.killTweensOf(rightEl);
            }
            rightEl.scrollTop = 0;
            updatePopPager(null);
            syncPopScrollLock(false);
            clearPopState();
            if (shouldSyncUrl) {
                syncStateToUrl();
            }
            if (popTriggerEl && document.contains(popTriggerEl)) {
                restoreFocusWithoutScrollShift(popTriggerEl);
            }
            popTriggerEl = null;
            $pop.css('--grid-from-x', '0px');
            $pop.css('--grid-from-y', 'calc(var(--poptravel) + var(--popbase))');
            $pop.css('--grid-from-scale', '1');
        }, popCloseDurationMs);
    };

    const openPop = (item, triggerEl, options = {}) => {
        const shouldSyncUrl = options.syncUrl !== false;
        if (!item) return;
        clearPopCloseTimer();
        $pop.removeClass('closing');

        const currentPopKey = ((state.popKey || '') + '').trim();
        const nextPopKey = ((item.key || '') + '').trim();
        const isSwitchingContent = $pop.hasClass('on') && currentPopKey && nextPopKey && currentPopKey !== nextPopKey;

        const applyContent = () => {
            $popMeta.text(`${item.main} · ${item.sub}`);
            $popName.text(item.title || item.client || '');
            const clientText = ((item.client || '') + '').trim();
            const dateText = ((item.date || '') + '').trim();
            const descText = ((item.desc || '') + '').trim();
            const linkText = ((item.projectLink || '') + '').trim();
            const hasInfos = Boolean(clientText || dateText || linkText);
            const hasDesc = Boolean(descText);

            $popClient.text(clientText);
            $popDate.text(dateText);
            $popLink.attr('href', linkText || '#');
            $popLink.attr('aria-label', linkText ? `프로젝트 보기: ${item.title || item.client || 'Project'}` : '프로젝트 보기');
            $popDesc.text(descText);

            $popClientRow.toggle(Boolean(clientText));
            $popDateRow.toggle(Boolean(dateText));
            $popLinkRow.toggle(Boolean(linkText));
            $popInfos.toggle(hasInfos);
            $popDesc.toggle(hasDesc);
            $popTop
                .toggle(hasInfos || hasDesc)
                .toggleClass('only-desc', hasDesc && !hasInfos)
                .toggleClass('only-infos', hasInfos && !hasDesc);

            $popGal.html(renderDetailBlocks(item));
            schedulePopDetailLayout(0);
            watchPopDetailImages();
            updatePopPager(item);

            popTriggerEl = triggerEl || document.activeElement;
            state.popKey = item.key || '';
            state.popCate = item.cate || state.cate;
            state.popInner = item.inner || state.inner;
            $pop.addClass('on').attr('aria-hidden', 'false');
            syncPopScrollLock(true);
            rightEl.scrollTop = 0;
            if (shouldSyncUrl) {
                syncStateToUrl();
            }
            if (!isSwitchingContent) {
                $popClose.trigger('focus');
            }
        };

        if (isSwitchingContent) {
            runPopContentSwitch(applyContent);
            return;
        }

        clearPopContentTween();
        setPopGridZoomOrigin(triggerEl || null);
        applyContent();
        if (triggerEl) {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    playPopOpenMorph(triggerEl);
                });
            });
        }
    };

    const openPopByKey = (key, options = {}) => {
        const safeKey = ((key || '') + '').trim();
        if (!safeKey) return;
        const item = projectMap.get(safeKey);
        if (!item) return;
        openPop(item, null, options);
    };

    const openPopByCard = (cardEl) => {
        if (!cardEl || cardEl.classList.contains('noresult')) return;
        const key = cardEl.getAttribute('datakey') || '';
        const item = projectMap.get(key);
        if (!item) return;
        openPop(item, cardEl);
    };

    const toLabel = (value) => {
        if (!value) return '';
        if (innerLabelMap[value]) return innerLabelMap[value];
        return value.charAt(0).toUpperCase() + value.slice(1);
    };
    const hasKorean = (value) => /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value || '');

    const buildRandomRevealSlots = (count) => {
        const size = Math.max(0, Number(count) || 0);
        if (!size) return [];

        const sourceIndexes = Array.from({ length: size }, (_, index) => index);
        for (let index = sourceIndexes.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const current = sourceIndexes[index];
            sourceIndexes[index] = sourceIndexes[swapIndex];
            sourceIndexes[swapIndex] = current;
        }

        const slots = new Array(size);
        sourceIndexes.forEach((sourceIndex, revealIndex) => {
            slots[sourceIndex] = revealIndex;
        });
        return slots;
    };

    const getCatePool = () => {
        if (state.cate === 'all') return projects;
        return projects.filter((item) => item.cate === state.cate);
    };

    const getPool = () => {
        let pool = getCatePool();
        if (state.cate !== 'all' && state.inner !== 'all') {
            pool = pool.filter((item) => item.inner === state.inner);
        }
        if (!state.query) return pool;

        return pool.filter((item) => {
            const haystack = [
                item.main,
                item.sub,
                item.title,
                item.client,
                item.cate,
                item.inner
            ].join(' ').toLowerCase();
            return haystack.includes(state.query);
        });
    };

    const getInnerOptions = () => {
        if (state.cate === 'all') return [];
        const options = innerOptionsByCate[state.cate] || ['all'];
        return options.slice();
    };

    const renderInnerTabs = () => {
        const options = getInnerOptions();
        if (!options.length) {
            $subtabs.addClass('ishidden');
            $subtablist.empty();
            state.inner = 'all';
            return;
        }

        $subtabs.removeClass('ishidden');
        if (!options.includes(state.inner)) {
            state.inner = 'all';
        }

        const html = options.map((key) => {
            const label = toLabel(key);
            const activeClass = key === state.inner ? 'item on' : 'item';
            const koClass = hasKorean(label) ? ' isko' : '';
            const selected = key === state.inner ? 'true' : 'false';
            return `<button class="${activeClass}${koClass}" type="button" datainner="${key}" aria-selected="${selected}">${label}</button>`;
        }).join('');

        $subtablist.html(html);
    };

    const buildCard = (item) => {
        const label = `${item.main} | ${item.sub} ${item.title || item.client}`;
        const cardImage = ((item.thumbImage || item.image || '') + '').trim() || fallbackThumbSrc;
        const dataKey = item.key ? ` datakey="${escapeAttr(item.key)}"` : '';
        const ariaLabel = escapeAttr(`${label} details`);
        const imageAlt = escapeAttr(`${label} main visual`);

        return $(
            `<article class="card"${dataKey} tabindex="0" role="button" aria-label="${ariaLabel}">`
            + `<figure class="thumb">`
            + `<img src="${cardImage}" alt="${imageAlt}" loading="lazy" decoding="async">`
            + `<span class="thumb-border" aria-hidden="true"></span>`
            + `</figure>`
            + `<div class="info">`
            + `<p class="meta">${item.main} | ${item.sub}</p>`
            + `<h3 class="name">${item.title || item.client}</h3>`
            + `</div>`
            + `</article>`
        );
    };
    const getEmptyMessage = () => {
        const hasQuery = Boolean(state.query);
        if (hasQuery) {
            return '검색 결과가 없습니다.';
        }

        return '등록된 작업이 없습니다.';
    };

    const buildEmptyCard = (message) => $(
        `<article class="card noresult show">`
        + `<div class="info">`
        + `<p class="meta">${escapeHtml(message || '')}</p>`
        + `</div>`
        + `</article>`
    );

    const appendBatch = ({ reset = false } = {}) => {
        if (!state.ready || state.busy) return;
        if (!reset && state.noResult) return;
        const pool = getPool();

        if (reset) {
            state.offset = 0;
            $list.empty();
        }

        if (!pool.length) {
            const emptyMessage = getEmptyMessage();
            if (reset || !state.noResult) {
                $list.empty().append(buildEmptyCard(emptyMessage));
            }
            state.noResult = true;
            setLoading(false);
            scheduleMasonry();
            scheduleGlobalScrollRefresh(120);
            return;
        }
        state.noResult = false;

        const start = Math.max(0, state.offset);
        if (start >= pool.length) {
            setLoading(false);
            return;
        }
        const end = Math.min(pool.length, start + batchSize);
        const revealStep = revealStaggerMs;
        const wait = Math.max(0, minBatchIntervalMs - (Date.now() - state.lastLoadAt));
        const totalCount = Math.max(0, end - start);
        const holdDuration = wait
            + batchVisualDelayMs
            + Math.max(280, (totalCount - 1) * revealStep + 320);
        state.busy = true;
        holdHeaderSync(holdDuration);
        setLoading(true);

        const firstRevealExtraDelayMs = (!state.firstBatchPlayed && reset && start === 0) ? 820 : 0;

        batchTimer = window.setTimeout(() => {
            batchTimer = null;
            const fragment = document.createDocumentFragment();
            const segmentNodes = [];
            const revealSlots = prefersReduced ? [] : buildRandomRevealSlots(totalCount);
            for (let cursor = start; cursor < end; cursor += 1) {
                const node = buildCard(pool[cursor]).get(0);
                const localIndex = cursor - start;
                const revealIndex = prefersReduced
                    ? 0
                    : (Number.isFinite(revealSlots[localIndex]) ? revealSlots[localIndex] : localIndex);
                node.style.setProperty('--reveal-delay', `${revealBaseDelayMs + (revealIndex * revealStep)}ms`);
                fragment.appendChild(node);
                segmentNodes.push(node);
            }

            listEl.appendChild(fragment);
            watchCardImages(segmentNodes);
            scheduleMasonry();

            window.requestAnimationFrame(() => {
                $(segmentNodes).addClass('show');
                if (!state.firstBatchPlayed && reset && start === 0) {
                    state.firstBatchPlayed = true;
                }
                state.offset = end;
                state.busy = false;
                state.lastLoadAt = Date.now();
                setLoading(false);
                scheduleGlobalScrollRefresh(180);
                window.requestAnimationFrame(() => {
                    ensureScrollable();
                });
                if (postBatchEnsureTimer) {
                    window.clearTimeout(postBatchEnsureTimer);
                }
                postBatchEnsureTimer = window.setTimeout(() => {
                    postBatchEnsureTimer = null;
                    ensureScrollable();
                }, Math.max(260, revealStep + 220));
            });
        }, wait + batchVisualDelayMs + firstRevealExtraDelayMs);
    };

    const ensureScrollable = () => {
        if (state.busy) return;
        if (!$guard.is(':visible')) return;
        const isGuardNearViewport = () => {
            const rect = guardEl.getBoundingClientRect();
            return rect.top <= getViewportHeight() + 520;
        };
        const hasMoreItems = () => state.offset < getPool().length;
        let guard = 0;
        while (hasMoreItems() && guard < 6) {
            const needByShortDoc = getDocumentHeight() <= getViewportHeight() + 220;
            const needByGuardProximity = isGuardNearViewport();
            if (!needByShortDoc && !needByGuardProximity) break;
            appendBatch();
            guard += 1;
            if (state.busy) break;
        }
    };

    const setCate = (cate, options = {}) => {
        const next = normalizeCate(cate);
        const shouldSyncUrl = options.syncUrl !== false;
        const shouldScrollTop = options.scrollToTop !== false;
        const requestedInner = Object.prototype.hasOwnProperty.call(options, 'inner')
            ? options.inner
            : 'all';
        const nextInner = normalizeInner(next, requestedInner);
        closePop({ syncUrl: false });
        cancelPendingBatch();
        state.cate = next;
        state.inner = nextInner;
        state.offset = 0;
        state.noResult = false;
        if (state.ready && shouldScrollTop) {
            scrollToPageTop();
        }

        $menuItems.removeClass('on').attr('aria-selected', 'false');
        $menuItems
            .filter(`[datacate="${next}"]`)
            .first()
            .addClass('on')
            .attr('aria-selected', 'true');

        renderInnerTabs();
        if (shouldSyncUrl) {
            syncStateToUrl();
        }
        appendBatch({ reset: true });
        ensureScrollable();
    };

    const setInner = (inner, options = {}) => {
        if (state.cate === 'all') return;
        const next = normalizeInner(state.cate, inner || 'all');
        const shouldSyncUrl = options.syncUrl !== false;
        const shouldScrollTop = options.scrollToTop !== false;
        if (state.inner === next) {
            if (shouldSyncUrl) {
                syncStateToUrl();
            }
            return;
        }
        closePop({ syncUrl: false });
        cancelPendingBatch();
        state.inner = next;
        state.offset = 0;
        state.noResult = false;
        if (state.ready && shouldScrollTop) {
            scrollToPageTop();
        }
        renderInnerTabs();
        if (shouldSyncUrl) {
            syncStateToUrl();
        }
        appendBatch({ reset: true });
        ensureScrollable();
    };
    const setQuery = (value) => {
        const next = normalizeQuery(value);
        if (state.query === next) return;
        cancelPendingBatch();
        state.query = next;
        state.offset = 0;
        state.noResult = false;
        updateSearchUi();
        appendBatch({ reset: true });
        ensureScrollable();
    };
    const commitSearch = (force = false) => {
        const raw = (($searchInput.val() || '') + '').trim();
        const normalized = normalizeQuery(raw);
        if (normalized && normalized.length < minQueryLength && !force) return;
        setQuery(normalized);
    };

    $menuItems.on('click', function () {
        setCate($(this).attr('datacate'));
    });

    $subtablist.on('click', '.item', function () {
        setInner($(this).attr('datainner'));
    });

    $list.on('click', '.card', function () {
        openPopByCard(this);
    });

    $list.on('keydown', '.card', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openPopByCard(this);
    });

    $popClose.on('click', function () {
        closePop();
    });

    $popPrev.on('click', function () {
        if ($(this).hasClass('off')) return;
        const key = ($(this).attr('datakey') || '').trim();
        if (!key) return;
        setPopThumbByKey(key);
    });

    $popNext.on('click', function () {
        if ($(this).hasClass('off')) return;
        const key = ($(this).attr('datakey') || '').trim();
        if (!key) return;
        setPopThumbByKey(key);
    });

    $popSecMain.on('click', function () {
        const key = (($(this).attr('datakey') || '') + '').trim();
        if (!key) return;
        openPopByKey(key);
    });

    $popSecMain.on('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const key = (($(this).attr('datakey') || '') + '').trim();
        if (!key) return;
        event.preventDefault();
        openPopByKey(key);
    });

    $pop.on('click', function (event) {
        if ($(event.target).closest('.box').length) return;
        event.stopPropagation();
    });

    $popBox.on('click', function (event) {
        const $target = $(event.target);
        const clickedInLeft = $target.closest('.left').length > 0;
        const clickedLeftInteractive = $target.closest('.hero, .pager, .prev, .next').length > 0;

        if (clickedInLeft && !clickedLeftInteractive) {
            closePop();
            return;
        }

        if ($target.is('.box')) {
            const boxEl = $popBox.get(0);
            const boxRect = boxEl ? boxEl.getBoundingClientRect() : null;
            const leftWidth = $popLeft.outerWidth() || 0;
            if (boxRect && leftWidth > 0 && event.clientX <= (boxRect.left + leftWidth)) {
                closePop();
                return;
            }
        }

        event.stopPropagation();
    });

    $(document).on('keydown.portfoliopop', function (event) {
        if (event.key !== 'Escape') return;
        closePop();
    });

    $searchInput.on('input', function () {
        updateSearchUi();
        if (searchTimer) {
            window.clearTimeout(searchTimer);
            searchTimer = null;
        }
        searchTimer = window.setTimeout(() => {
            commitSearch(false);
        }, searchDebounceMs);
    });

    $searchInput.on('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (searchTimer) {
            window.clearTimeout(searchTimer);
            searchTimer = null;
        }
        commitSearch(true);
    });

    $searchClear.on('click', function () {
        const current = (($searchInput.val() || '') + '').trim();
        if (!current) return;
        if (searchTimer) {
            window.clearTimeout(searchTimer);
            searchTimer = null;
        }
        $searchInput.val('');
        setQuery('');
        $searchInput.trigger('focus');
    });

    setLoading(false);
    updateSearchUi();
    setupMenuRoll();

    const applyUrlState = ({ scrollToTop = true } = {}) => {
        const linkedState = readStateFromUrl();
        setCate(linkedState.cate, {
            inner: linkedState.inner,
            syncUrl: false,
            scrollToTop
        });
        if (linkedState.pop) {
            openPopByKey(linkedState.pop, { syncUrl: false });
        }
    };

    window.addEventListener('popstate', () => {
        if (!state.ready) return;
        applyUrlState({ scrollToTop: true });
    });

    window.addEventListener('hashchange', () => {
        if (!state.ready) return;
        applyUrlState({ scrollToTop: true });
    });

    window.addEventListener('resize', () => {
        if (masonryState.resizeTimer) {
            window.clearTimeout(masonryState.resizeTimer);
        }
        masonryState.resizeTimer = window.setTimeout(() => {
            masonryState.resizeTimer = 0;
            scheduleMasonry();
            schedulePopDetailLayout(90);
        }, 120);
    }, { passive: true });

    if ('IntersectionObserver' in window) {
        state.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    appendBatch();
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px 520px 0px',
            threshold: 0.01
        });

        state.observer.observe(guardEl);
    } else {
        const onWindowScroll = () => {
            if (!state.ready || state.busy) return;
            const rect = guardEl.getBoundingClientRect();
            if (rect.top <= getViewportHeight() + 360) {
                appendBatch();
            }
        };
        window.addEventListener('scroll', onWindowScroll, { passive: true });
        window.addEventListener('resize', onWindowScroll);
    }

    const finishTyping = () => {
        if (state.ready || state.booting) return;
        state.booting = true;
        projectDataReady.finally(() => {
            window.setTimeout(() => {
                state.ready = true;
                state.booting = false;
                $section.addClass('isready');
                const linkedState = readStateFromUrl();
                setCate(linkedState.cate, {
                    inner: linkedState.inner,
                    syncUrl: false,
                    scrollToTop: false
                });
                if (linkedState.pop) {
                    openPopByKey(linkedState.pop, { syncUrl: false });
                }
            }, revealDelay);
        });
    };

    const targetWord = ($typing.attr('dataword') || 'Portfolio').trim() || 'Portfolio';

    if (prefersReduced) {
        $typing.text(targetWord);
        finishTyping();
        return;
    }

    $typing.text('');
    let index = 0;

    const typeTick = () => {
        index += 1;
        $typing.text(targetWord.slice(0, index));

        if (index >= targetWord.length) {
            finishTyping();
            return;
        }

        window.setTimeout(typeTick, typingSpeed);
    };

    window.setTimeout(typeTick, typingDelay);
});
