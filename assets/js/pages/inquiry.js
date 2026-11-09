/**
 * Inquiry Page
 * - Hero title typing and cursor interaction
 * - Form validation and submit interaction
 */
$(function () {
    const prefersReducedMotion = Boolean(
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    const $heroSection = $('.cont1').first();
    const $heroTyping = $heroSection.find('.title .typing').first();
    const typingSpeed = 90;
    const typingDelay = 240;
    const cursorHideDelay = 220;

    if ($heroSection.length && $heroTyping.length) {
        const targetWord = (($heroTyping.attr('dataword') || '') + '').trim() || "Let's Build the Future.";
        const finishHeroTyping = () => {
            window.setTimeout(() => {
                $heroSection.addClass('isready');
            }, cursorHideDelay);
        };

        if (prefersReducedMotion) {
            $heroTyping.text(targetWord);
            finishHeroTyping();
        } else {
            $heroTyping.text('');
            let index = 0;

            const typeTick = () => {
                index += 1;
                $heroTyping.text(targetWord.slice(0, index));

                if (index >= targetWord.length) {
                    finishHeroTyping();
                    return;
                }

                window.setTimeout(typeTick, typingSpeed);
            };

            window.setTimeout(typeTick, typingDelay);
        }
    }

    const initHeroDotBackground = () => {
        const section = $heroSection.get(0);
        if (!section) return;

        const canvas = section.querySelector('#inquiryDotBg');
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: true });
        if (!context) return;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let rafId = 0;
        let isDisposed = false;
        const clicks = [];
        const maxClickLife = 2400;
        const pointerState = {
            lastX: 0,
            lastY: 0,
            lastTime: 0,
            lastEmitTime: 0,
            emitCounter: 0
        };

        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const fract = (value) => value - Math.floor(value);

        const pseudoNoise = (gridX, gridY, time) => {
            const value = Math.sin(gridX * 12.9898 + gridY * 78.233 + time * 0.72) * 43758.5453123;
            return fract(value);
        };

        const resize = () => {
            const rect = section.getBoundingClientRect();
            width = Math.max(1, Math.floor(rect.width));
            height = Math.max(1, Math.floor(rect.height));
            dpr = clamp(window.devicePixelRatio || 1, 1, 2);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.scale(dpr, dpr);
        };

        const draw = (timeMs) => {
            if (isDisposed) return;

            const time = timeMs * 0.001;
            const spacing = width > 1200 ? 10 : 12;
            const radiusBase = width > 1200 ? 1.2 : 1.05;

            context.clearRect(0, 0, width, height);

            for (let y = spacing * 0.5; y < height; y += spacing) {
                for (let x = spacing * 0.5; x < width; x += spacing) {
                    const nx = x / width - 0.5;
                    const ny = y / height - 0.5;
                    const distanceCenter = Math.sqrt(nx * nx + ny * ny);

                    const edgeBand = clamp((distanceCenter - 0.18) / 0.42, 0, 1);
                    const twinkle = pseudoNoise(Math.floor(x / spacing), Math.floor(y / spacing), time);
                    const breathing = 0.18 * (0.5 + 0.5 * Math.sin(time * 1.2 + nx * 7.0 - ny * 5.0));
                    let alpha = 0.08 + edgeBand * 0.32 + twinkle * 0.16 + breathing;

                    let rippleBoost = 0;
                    for (let index = clicks.length - 1; index >= 0; index -= 1) {
                        const click = clicks[index];
                        const dt = timeMs - click.time;

                        if (dt > maxClickLife) {
                            clicks.splice(index, 1);
                            continue;
                        }

                        const dx = x - click.x;
                        const dy = y - click.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const waveRadius = 40 + dt * 0.22;
                        const thickness = 18;
                        const ring = Math.exp(-Math.pow((distance - waveRadius) / thickness, 2));
                        const attenuation = Math.exp(-dt / 1200);
                        rippleBoost = Math.max(rippleBoost, ring * attenuation);
                    }

                    alpha = clamp(alpha + rippleBoost * 0.95, 0, 0.92);
                    if (alpha < 0.12) continue;

                    const radius = radiusBase + edgeBand * 0.45 + rippleBoost * 1.0;
                    context.beginPath();
                    context.fillStyle = `rgba(38,38,38,${alpha.toFixed(3)})`;
                    context.arc(x, y, radius, 0, Math.PI * 2);
                    context.fill();
                }
            }

            if (!prefersReducedMotion) {
                rafId = window.requestAnimationFrame(draw);
            }
        };

        const addClick = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            clicks.push({
                x: clientX - rect.left,
                y: clientY - rect.top,
                time: performance.now()
            });
            if (clicks.length > 56) {
                clicks.shift();
            }
        };

        const handleClick = (event) => {
            if (prefersReducedMotion) return;
            addClick(event.clientX, event.clientY);
        };

        const handlePointerEnter = (event) => {
            if (prefersReducedMotion) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const now = performance.now();

            pointerState.lastX = x;
            pointerState.lastY = y;
            pointerState.lastTime = now;
            pointerState.lastEmitTime = now;
            pointerState.emitCounter = 0;
        };

        const handlePointerMove = (event) => {
            if (prefersReducedMotion) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const now = performance.now();
            const elapsed = Math.max(16, now - pointerState.lastTime || 16);
            const deltaX = x - pointerState.lastX;
            const deltaY = y - pointerState.lastY;
            const distance = Math.hypot(deltaX, deltaY);
            const shouldEmit = distance > 26 || now - pointerState.lastEmitTime > 160;

            if (shouldEmit) {
                pointerState.emitCounter += 1;
                if (pointerState.emitCounter % 6 === 0) {
                    addClick(event.clientX, event.clientY);
                    pointerState.lastEmitTime = now;
                }
            }

            pointerState.lastX = x;
            pointerState.lastY = y;
            pointerState.lastTime = now;
        };

        resize();
        draw(0);

        if (!prefersReducedMotion) {
            rafId = window.requestAnimationFrame(draw);
            section.addEventListener('pointerdown', handleClick, { passive: true });
            section.addEventListener('pointerenter', handlePointerEnter, { passive: true });
            section.addEventListener('pointermove', handlePointerMove, { passive: true });
        }

        let resizeObserver = null;
        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(() => {
                resize();
            });
            resizeObserver.observe(section);
        } else {
            window.addEventListener('resize', resize);
        }

        window.addEventListener('beforeunload', () => {
            isDisposed = true;
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
            section.removeEventListener('pointerdown', handleClick);
            section.removeEventListener('pointerenter', handlePointerEnter);
            section.removeEventListener('pointermove', handlePointerMove);
            if (resizeObserver) {
                resizeObserver.disconnect();
            } else {
                window.removeEventListener('resize', resize);
            }
        }, { once: true });
    };

    initHeroDotBackground();

    const $section = $('.cont2');
    const $form = $('#inquiryForm');

    if (!$section.length || !$form.length) return;

    const $fields = $form.find('.input, .texta');
    const $agree = $form.find('#inqagree');
    const $agreeWrap = $form.find('.agree').first();
    const $agreeMsg = $form.find('#inqagreemsg').first();

    if (!$fields.length || !$agree.length || !$agreeWrap.length || !$agreeMsg.length) return;

    const $submit = $form.find('.send[type="submit"]').first();
    let hasSubmitted = false;
    let isSubmitting = false;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telPattern = /^[0-9+\-().\s]{8,20}$/;

    const messages = {
        nameRequired: '성함을 입력해주세요.',
        orgRequired: '기관·기업명을 입력해주세요.',
        emailRequired: '이메일을 입력해주세요.',
        emailInvalid: '이메일 형식을 확인해주세요.',
        telRequired: '연락처를 입력해주세요.',
        telInvalid: '연락처 형식을 확인해주세요.',
        msgRequired: '문의 내용을 입력해주세요.',
        msgMin: '문의 내용은 10자 이상 입력해주세요.',
        agreeRequired: '개인정보처리방침 동의가 필요합니다.',
        formOk: '문의가 접수되었습니다. 빠르게 연락드리겠습니다.'
    };
    messages.submitFailed = '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

    const getFeedbackNode = ($input) => {
        const raw = ($input.attr('aria-describedby') || '').toString().trim();
        if (!raw) return $();
        const id = raw.split(/\s+/)[0];
        if (!id) return $();
        return $form.find(`#${id}`).first();
    };

    const resetFieldState = ($input) => {
        const $field = $input.closest('.field');
        const $feedback = getFeedbackNode($input);
        $input.attr('aria-invalid', 'false');
        $field.removeClass('error');
        if ($feedback.length) {
            $feedback.text('');
        }
    };

    const setFieldError = ($input, message) => {
        const $field = $input.closest('.field');
        const $feedback = getFeedbackNode($input);
        $input.attr('aria-invalid', 'true');
        $field.addClass('error');
        if ($feedback.length) {
            $feedback.text(message || '');
        }
    };

    const resetAgreeState = () => {
        $agreeWrap.removeClass('error');
        $agreeMsg.text('');
    };

    const setAgreeError = (message) => {
        $agreeWrap.addClass('error');
        $agreeMsg.text(message || '');
    };

    const validateField = ($input) => {
        if (!$input.length) return true;

        const name = ($input.attr('name') || '').toString();
        const value = ($input.val() || '').toString().trim();

        if (name === 'name') {
            if (!value) {
                setFieldError($input, messages.nameRequired);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        if (name === 'org') {
            if (!value) {
                setFieldError($input, messages.orgRequired);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        if (name === 'email') {
            if (!value) {
                setFieldError($input, messages.emailRequired);
                return false;
            }
            if (!emailPattern.test(value)) {
                setFieldError($input, messages.emailInvalid);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        if (name === 'tel') {
            if (!value) {
                setFieldError($input, messages.telRequired);
                return false;
            }
            if (!telPattern.test(value)) {
                setFieldError($input, messages.telInvalid);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        if (name === 'msg') {
            if (!value) {
                setFieldError($input, messages.msgRequired);
                return false;
            }
            if (value.length < 10) {
                setFieldError($input, messages.msgMin);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        resetFieldState($input);
        return true;
    };

    const validateAgree = () => {
        if ($agree.prop('checked')) {
            resetAgreeState();
            return true;
        }
        setAgreeError(messages.agreeRequired);
        return false;
    };

    const setSubmitting = (state) => {
        isSubmitting = !!state;
        if ($submit.length) {
            $submit.prop('disabled', isSubmitting).attr('aria-busy', isSubmitting ? 'true' : 'false');
        }
    };

    const buildRequestBody = () => {
        const name = ($form.find('input[name="name"]').val() || '').toString().trim();
        const org = ($form.find('input[name="org"]').val() || '').toString().trim();
        const email = ($form.find('input[name="email"]').val() || '').toString().trim();
        const phone = ($form.find('input[name="tel"]').val() || '').toString().trim();
        const message = ($form.find('textarea[name="msg"]').val() || '').toString().trim();

        return new URLSearchParams({
            name,
            role: org,
            email,
            phone,
            subject: `${name || '홈페이지'} / ${org || '문의'}`,
            message,
            agree: $agree.prop('checked') ? '1' : ''
        });
    };

    const applyServerFieldErrors = (fields) => {
        if (!fields || typeof fields !== 'object') return;

        if (fields.name) {
            validateField($form.find('input[name="name"]').first());
        }
        if (fields.role || fields.org) {
            validateField($form.find('input[name="org"]').first());
        }
        if (fields.email) {
            validateField($form.find('input[name="email"]').first());
        }
        if (fields.phone || fields.tel) {
            validateField($form.find('input[name="tel"]').first());
        }
        if (fields.message || fields.msg) {
            validateField($form.find('textarea[name="msg"]').first());
        }
        if (fields.agree) {
            setAgreeError(messages.agreeRequired);
        }
    };

    const submitInquiry = async () => {
        const response = await fetch('/api/contact.php', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: buildRequestBody().toString()
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (error) {
            payload = null;
        }

        if (!response.ok || !payload || payload.success !== true) {
            const err = new Error('submit_failed');
            err.response = response;
            err.payload = payload;
            throw err;
        }

        return payload;
    };

    const focusWithScroll = (target) => {
        if (!target) return;

        const focusTarget = target;
        const scrollTarget = (target.closest && (target.closest('.field') || target.closest('.agree'))) || target;

        if (typeof focusTarget.focus === 'function') {
            try {
                focusTarget.focus({ preventScroll: true });
            } catch {
                focusTarget.focus();
            }
        }

        if (scrollTarget && typeof scrollTarget.scrollIntoView === 'function') {
            scrollTarget.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    };

    const validateAll = () => {
        let valid = true;
        let firstInvalid = null;

        $fields.each(function () {
            const $input = $(this);
            const currentValid = validateField($input);
            if (!currentValid) {
                valid = false;
                if (!firstInvalid) {
                    firstInvalid = this;
                }
            }
        });

        const agreeValid = validateAgree();
        if (!agreeValid) {
            valid = false;
            if (!firstInvalid) {
                firstInvalid = $agree.get(0);
            }
        }

        if (firstInvalid) {
            focusWithScroll(firstInvalid);
        }

        return valid;
    };

    const resetAll = () => {
        $fields.each(function () {
            resetFieldState($(this));
        });
        resetAgreeState();
    };

    resetAll();

    $fields.on('blur', function () {
        if (!hasSubmitted) return;
        validateField($(this));
    });

    $fields.on('input', function () {
        if (!hasSubmitted) return;
        const $input = $(this);
        if ($input.attr('aria-invalid') === 'true') {
            validateField($input);
        }
    });

    $agree.on('change', function () {
        if (!hasSubmitted) return;
        validateAgree();
    });

    $form.on('click', '.field', function (event) {
        if ($(event.target).is('input, textarea, label, button, a')) return;
        const $target = $(this).find('.input, .texta').first();
        if ($target.length) {
            $target.trigger('focus');
        }
    });

    $form.on('submit', async function (event) {
        event.preventDefault();
        if (isSubmitting) return;
        hasSubmitted = true;

        const isValid = validateAll();
        if (!isValid) {
            return;
        }

        try {
            setSubmitting(true);
            await submitInquiry();

            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert(messages.formOk);
            }

            this.reset();
            hasSubmitted = false;
            resetAll();
        } catch (error) {
            const serverFields = error && error.payload && error.payload.fields ? error.payload.fields : null;
            applyServerFieldErrors(serverFields);
            const isValidationError = Boolean(error && error.payload && error.payload.error === 'validation');
            if (!isValidationError && typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert(messages.submitFailed);
            }
        } finally {
            setSubmitting(false);
        }
    });
});
