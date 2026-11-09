/**
 * Main Page
 */
/*  Section 1 - Intro */
$(function () {
    const $intro = $('.cont1');
    if (!$intro.length) return;

    const root = document.documentElement;
    const requestHeaderSync = () => {
        if (typeof Event === 'function') {
            document.dispatchEvent(new Event('ubique:header-sync'));
        } else {
            const legacyEvent = document.createEvent('Event');
            legacyEvent.initEvent('ubique:header-sync', true, true);
            document.dispatchEvent(legacyEvent);
        }
    };
    const syncScrollEngineLock = (locked) => {
        const engine = window.scrollInstance;
        if (!engine) {
            if (locked) window.scrollTo(0, 0);
            return;
        }

        if (locked) {
            if (typeof engine.scrollTo === 'function') {
                engine.scrollTo(0, { duration: 0, disableLerp: true });
            }
            if (typeof engine.stop === 'function') {
                engine.stop();
            }
            window.scrollTo(0, 0);
            return;
        }

        if (typeof engine.start === 'function') {
            engine.start();
        }
        if (typeof engine.update === 'function') {
            engine.update();
        }
    };
    const setScrollLock = (locked) => {
        if (!root) return;
        root.classList.toggle('intro-lock', locked);
        if (document.body) {
            document.body.classList.toggle('intro-lock', locked);
        }
        syncScrollEngineLock(locked);
    };
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const autoPlay = true;
    const autoDismissMs = 2000;
    let finished = false;
    let autoTimer = null;

    const finishIntro = () => {
        if (finished) return;
        finished = true;
        $('body').addClass('introout');
        setTimeout(() => {
            $(document).off('scrollengine:ready.main-intro-lock');
            $('body').addClass('introoff');
            setScrollLock(false);
            requestHeaderSync();
            if (typeof CustomEvent === 'function') {
                document.dispatchEvent(new CustomEvent('ubique:introoff'));
            } else {
                const legacyEvent = document.createEvent('Event');
                legacyEvent.initEvent('ubique:introoff', true, true);
                document.dispatchEvent(legacyEvent);
            }
        }, 420);
        if (autoTimer) {
            clearTimeout(autoTimer);
            autoTimer = null;
        }
    };

    $intro.on('click', finishIntro);

    const scheduleFinish = (ms) => {
        if (autoTimer) {
            clearTimeout(autoTimer);
            autoTimer = null;
        }
        autoTimer = setTimeout(finishIntro, ms);
    };

    const kick = () => {
        if (!autoPlay) return;
        if (prefersReduced) {
            finishIntro();
            return;
        }
        scheduleFinish(autoDismissMs);
    };

    if (!$('body').hasClass('introoff')) {
        setScrollLock(true);
    }
    requestHeaderSync();
    $(document).on('scrollengine:ready.main-intro-lock', () => {
        if (!root || !root.classList.contains('intro-lock')) return;
        syncScrollEngineLock(true);
    });

    if (document.readyState === 'complete') {
        kick();
    } else {
        $(window).one('load', kick);
    }
});

/*  Section 2 - 3D Cube with Three.js */
$(function () {
    const $section = $('.cont2');
    if (!$section.length) return;

    const menuItems = $section.find('.menu .item').toArray();

    const setupMenuRoll = () => {
        menuItems.forEach((item) => {
            if (!item || item.dataset.rollReady === '1') return;
            const raw = ((item.textContent || '') + '').trim();
            if (!raw) return;

            item.dataset.rollReady = '1';
            item.setAttribute('aria-label', raw);

            const fragment = document.createDocumentFragment();
            Array.from(raw).forEach((char, charIndex) => {
                const roll = document.createElement('span');
                roll.className = 'roll';
                roll.style.setProperty('--char-index', charIndex);
                roll.setAttribute('aria-hidden', 'true');
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
                fragment.appendChild(roll);
            });

            item.textContent = '';
            item.appendChild(fragment);
        });
    };

    if (menuItems.length) {
        setupMenuRoll();
    }

    const canvas = document.getElementById('cube');
    if (!canvas) return;

    // Three.js setup
    const scene = new THREE.Scene();
    const baseCameraFov = 35;
    const baseCameraZ = 2920;
    const camera = new THREE.PerspectiveCamera(baseCameraFov, 1, 0.1, 7000);
    camera.position.z = baseCameraZ;

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true 
    });
    renderer.setClearColor(0x000000, 0);
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(1);

    const createGlassEnvMap = () => {
        const size = 128;
        const makeFace = (toneA, toneB, glowX, glowY) => {
            const faceCanvas = document.createElement('canvas');
            faceCanvas.width = size;
            faceCanvas.height = size;
            const ctx = faceCanvas.getContext('2d');
            if (!ctx) return faceCanvas;

            const base = ctx.createLinearGradient(0, 0, size, size);
            base.addColorStop(0, toneA);
            base.addColorStop(1, toneB);
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, size, size);

            const glow = ctx.createRadialGradient(size * glowX, size * glowY, size * 0.03, size * glowX, size * glowY, size * 0.6);
            glow.addColorStop(0, 'rgba(255,255,255,0.72)');
            glow.addColorStop(0.35, 'rgba(216,236,255,0.24)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, size, size);

            return faceCanvas;
        };

        const faces = [
            makeFace('rgba(176, 202, 236, 0.96)', 'rgba(132, 168, 205, 0.96)', 0.24, 0.24),
            makeFace('rgba(165, 194, 228, 0.96)', 'rgba(120, 154, 193, 0.96)', 0.76, 0.28),
            makeFace('rgba(188, 214, 244, 0.96)', 'rgba(146, 182, 218, 0.96)', 0.5, 0.16),
            makeFace('rgba(146, 174, 208, 0.96)', 'rgba(104, 132, 170, 0.96)', 0.52, 0.84),
            makeFace('rgba(170, 198, 232, 0.96)', 'rgba(120, 156, 196, 0.96)', 0.22, 0.68),
            makeFace('rgba(156, 186, 222, 0.96)', 'rgba(112, 146, 186, 0.96)', 0.74, 0.62)
        ];

        const cubeTexture = new THREE.CubeTexture(faces);
        cubeTexture.encoding = THREE.sRGBEncoding;
        cubeTexture.needsUpdate = true;
        return cubeTexture;
    };

    const glassEnvMap = createGlassEnvMap();
    const cubeLightOnlyMode = false;
    const useEnvironmentMap = !cubeLightOnlyMode;
    scene.environment = useEnvironmentMap ? glassEnvMap : null;

    const hdrPath = ((canvas.dataset && canvas.dataset.hdr) || '').trim();
    if (useEnvironmentMap && hdrPath) {
        const isExr = /\.exr(?:\?.*)?$/i.test(hdrPath);
        const canUseExr = isExr && typeof THREE.EXRLoader === 'function';
        const canUseHdr = !isExr && typeof THREE.RGBELoader === 'function';

        if (canUseExr || canUseHdr) {
            const envLoader = canUseExr ? new THREE.EXRLoader() : new THREE.RGBELoader();
            envLoader.load(
                hdrPath,
                (envTexture) => {
                    envTexture.mapping = THREE.EquirectangularReflectionMapping;
                    scene.environment = envTexture;
                },
                undefined,
                () => {
                    scene.environment = useEnvironmentMap ? glassEnvMap : null;
                }
            );
        }
    }

    const cubeReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cubeRevealState = {
        progress: 0,
        played: false,
        tween: null
    };

    let shadowCatcherPlane = null;
    let floorReflectionPlane = null;
    let contactShadowPlane = null;

    // Face rotation angles
    const faceAngles = {
        front: { x: 0.5, y: -0.4, z: -0.12 },
        right: { x: 0.4, y: -1.97, z: -0.12 },
        back: { x: 0.4, y: 2.74, z: -0.12 },
        left: { x: 0.4, y: 1.17, z: -0.12 },
        top: { x: 1.57, y: -0.22, z: -0.12 },
        bottom: { x: -1.57, y: 0, z: -0.12 }
    };

    // Create cube
    const createRoundedFallbackGeometry = (width, height, depth, segments, radius) => {
        const seg = Math.max(2, Number(segments) || 6);
        const safeRadius = Math.max(2, Math.min(Math.min(width, height, depth) * 0.24, Number(radius) || 60));
        const geometry = new THREE.BoxGeometry(width, height, depth, seg, seg, seg);
        const position = geometry.attributes.position;
        const vector = new THREE.Vector3();
        const inner = new THREE.Vector3();
        const halfX = (width * 0.5) - safeRadius;
        const halfY = (height * 0.5) - safeRadius;
        const halfZ = (depth * 0.5) - safeRadius;

        for (let i = 0; i < position.count; i += 1) {
            vector.fromBufferAttribute(position, i);
            inner.set(
                Math.sign(vector.x) * halfX,
                Math.sign(vector.y) * halfY,
                Math.sign(vector.z) * halfZ
            );
            vector.sub(inner).normalize().multiplyScalar(safeRadius).add(inner);
            position.setXYZ(i, vector.x, vector.y, vector.z);
        }

        position.needsUpdate = true;
        geometry.computeVertexNormals();
        return geometry;
    };
    const geometry = (THREE.RoundedBoxGeometry)
        ? new THREE.RoundedBoxGeometry(860, 860, 860, 8, 68)
        : createRoundedFallbackGeometry(860, 860, 860, 8, 68);
    const textureLoader = new THREE.TextureLoader();
    const managedFaceVideos = [];
    const faceAssets = [
        './assets/img/main/card01',
        './assets/img/main/card02',
        './assets/img/main/card03',
        './assets/img/main/card04',
        './assets/img/main/card05',
        './assets/img/main/card06',
    ];
    const buildFaceCandidates = (value) => {
        const src = `${value || ''}`.trim();
        if (!src) return [];
        const match = src.match(/^([^?#]*)([?#].*)?$/);
        const path = (match && match[1]) || '';
        const suffix = (match && match[2]) || '';
        if (!path) return [];

        const hasMp4 = /\.mp4$/i.test(path);
        const hasPng = /\.png$/i.test(path);
        const stem = (hasMp4 || hasPng) ? path.replace(/\.(mp4|png)$/i, '') : path;

        if (hasMp4) {
            return [
                { kind: 'video', src: `${stem}.mp4${suffix}` },
                { kind: 'image', src: `${stem}.png${suffix}` }
            ];
        }
        if (hasPng) {
            return [
                { kind: 'image', src: `${stem}.png${suffix}` },
                { kind: 'video', src: `${stem}.mp4${suffix}` }
            ];
        }
        return [
            { kind: 'video', src: `${stem}.mp4${suffix}` },
            { kind: 'image', src: `${stem}.png${suffix}` }
        ];
    };
    const faceAssetCandidates = faceAssets.map(buildFaceCandidates);
    const faceGlassOpacity = 1;
    const faceImageOpacity = 1;
    const materials = faceAssets.map(() => {
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0.01,
            transmission: 0.82,
            thickness: 72,
            ior: 1.35,
            transparent: true,
            opacity: faceGlassOpacity,
            clearcoat: 0.8,
            clearcoatRoughness: 0,
            side: THREE.FrontSide,
            depthWrite: false,
            blending: THREE.NormalBlending,
            envMapIntensity: 1.35
        });

        material.map = null;

        return material;
    });

    const imageMaterials = faceAssets.map(() => new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: faceImageOpacity,
        side: THREE.FrontSide,
        depthWrite: false,
        toneMapped: false
    }));

    const loadFaceAsset = (faceIndex, candidateIndex = 0) => {
        const imageMaterial = imageMaterials[faceIndex];
        if (!imageMaterial) return;
        const candidates = faceAssetCandidates[faceIndex] || [];
        const candidate = candidates[candidateIndex];
        if (!candidate || !candidate.src) {
            imageMaterial.map = null;
            imageMaterial.needsUpdate = true;
            return;
        }

        if (candidate.kind === 'video') {
            const video = document.createElement('video');
            video.src = candidate.src;
            video.muted = true;
            video.loop = true;
            video.autoplay = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.setAttribute('webkit-playsinline', '');

            let settled = false;
            const cleanup = () => {
                video.removeEventListener('loadeddata', onVideoReady);
                video.removeEventListener('canplay', onVideoReady);
                video.removeEventListener('error', onVideoError);
            };
            const onVideoReady = () => {
                if (settled) return;
                settled = true;
                cleanup();
                const tryPlay = () => {
                    const promise = video.play();
                    if (promise && typeof promise.catch === 'function') {
                        promise.catch(() => {
                            // Autoplay can be blocked until user interaction.
                        });
                    }
                };
                const videoTexture = new THREE.VideoTexture(video);
                videoTexture.encoding = THREE.sRGBEncoding;
                videoTexture.minFilter = THREE.LinearFilter;
                videoTexture.magFilter = THREE.LinearFilter;
                videoTexture.generateMipmaps = false;
                managedFaceVideos.push({ faceIndex, video, texture: videoTexture, tryPlay });
                imageMaterial.map = videoTexture;
                imageMaterial.needsUpdate = true;
                tryPlay();
            };
            const onVideoError = () => {
                if (settled) return;
                settled = true;
                cleanup();
                video.pause();
                loadFaceAsset(faceIndex, candidateIndex + 1);
            };

            video.addEventListener('loadeddata', onVideoReady, { once: true });
            video.addEventListener('canplay', onVideoReady, { once: true });
            video.addEventListener('error', onVideoError, { once: true });
            video.load();
            return;
        }

        textureLoader.load(
            candidate.src,
            (texture) => {
                texture.encoding = THREE.sRGBEncoding;
                texture.generateMipmaps = true;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                imageMaterial.map = texture;
                imageMaterial.needsUpdate = true;
            },
            undefined,
            () => {
                loadFaceAsset(faceIndex, candidateIndex + 1);
            }
        );
    };

    faceAssets.forEach((_, index) => {
        loadFaceAsset(index, 0);
    });

    const cube = new THREE.Mesh(geometry, materials);
    const imageShell = new THREE.Mesh(geometry.clone(), imageMaterials);
    imageShell.scale.setScalar(1.002);
    cube.add(imageShell);

    const innerGlass = new THREE.Mesh(
        geometry,
        materials.map((sourceMaterial) => {
            const innerMaterial = sourceMaterial.clone();
            innerMaterial.color = new THREE.Color(0xd7e9ff);
            innerMaterial.side = THREE.BackSide;
            innerMaterial.opacity = Math.max(0.08, sourceMaterial.opacity * 0.16);
            innerMaterial.roughness = 0.08;
            innerMaterial.transmission = 0.22;
            innerMaterial.clearcoat = 0.5;
            innerMaterial.clearcoatRoughness = 0.08;
            innerMaterial.emissive = new THREE.Color(0x86b9ea);
            innerMaterial.emissiveIntensity = 0.07;
            innerMaterial.envMapIntensity = 0.42;
            innerMaterial.depthWrite = false;
            innerMaterial.blending = THREE.NormalBlending;
            return innerMaterial;
        })
    );
    innerGlass.scale.setScalar(0.986);
    cube.add(innerGlass);

    const innerCellZones = [
        { x: -200, y: 200, z: -200, color: 0x7fb8ff, base: 0.18, pulse: 0.07, phase: 0.1 },
        { x: 200, y: 200, z: -200, color: 0x9ec9ff, base: 0.16, pulse: 0.06, phase: 0.9 },
        { x: -200, y: 200, z: 200, color: 0x8fc3ff, base: 0.17, pulse: 0.06, phase: 1.7 },
        { x: 200, y: 200, z: 200, color: 0xb2d8ff, base: 0.14, pulse: 0.05, phase: 2.4 },
        { x: -200, y: -200, z: -200, color: 0x76b1f4, base: 0.15, pulse: 0.05, phase: 3.1 },
        { x: 200, y: -200, z: -200, color: 0x8abcf2, base: 0.13, pulse: 0.05, phase: 3.9 },
        { x: -200, y: -200, z: 200, color: 0x7db5ea, base: 0.15, pulse: 0.05, phase: 4.5 },
        { x: 200, y: -200, z: 200, color: 0x95c7f9, base: 0.13, pulse: 0.04, phase: 5.3 }
    ];
    const innerCellLights = innerCellZones.map((zone) => {
        const light = new THREE.PointLight(zone.color, zone.base, 1180, 2);
        light.position.set(zone.x, zone.y, zone.z);
        cube.add(light);
        return { light, base: zone.base, pulse: zone.pulse, phase: zone.phase };
    });

    const edgeCoat = new THREE.Mesh(
        geometry.clone(),
        new THREE.MeshPhysicalMaterial({
            color: 0xe7f4ff,
            metalness: 0,
            roughness: 0.02,
            transmission: 0,
            transparent: true,
            opacity: 0.032,
            clearcoat: 1,
            clearcoatRoughness: 0,
            side: THREE.FrontSide,
            depthWrite: false,
            envMapIntensity: 1.2
        })
    );
    edgeCoat.scale.setScalar(1.004);

    const edgeLineGeometry = new THREE.EdgesGeometry(geometry.clone(), 16);
    const edgeGlowLineMaterial = new THREE.LineBasicMaterial({
        color: 0xe9f6ff,
        transparent: true,
        opacity: 0.045,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
    });
    const edgeGlowLines = new THREE.LineSegments(edgeLineGeometry, edgeGlowLineMaterial);
    edgeGlowLines.scale.setScalar(1.01);

    const edgeWarmLineMaterial = new THREE.LineBasicMaterial({
        color: 0xffba93,
        transparent: true,
        opacity: 0.03,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
    });
    const edgeWarmLines = new THREE.LineSegments(edgeLineGeometry.clone(), edgeWarmLineMaterial);
    edgeWarmLines.scale.setScalar(1.015);

    const createBeamTexture = () => {
        const size = 256;
        const beamCanvas = document.createElement('canvas');
        beamCanvas.width = size;
        beamCanvas.height = size;
        const ctx = beamCanvas.getContext('2d');
        if (!ctx) return null;

        ctx.clearRect(0, 0, size, size);

        const cross = ctx.createLinearGradient(0, size * 0.5, size, size * 0.5);
        cross.addColorStop(0, 'rgba(255,255,255,0)');
        cross.addColorStop(0.18, 'rgba(255,255,255,0.12)');
        cross.addColorStop(0.5, 'rgba(255,255,255,0.58)');
        cross.addColorStop(0.82, 'rgba(236,246,255,0.2)');
        cross.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = cross;
        ctx.fillRect(0, 0, size, size);

        const cyberTint = ctx.createLinearGradient(0, 0, size, size);
        cyberTint.addColorStop(0, 'rgba(255,255,255,0.08)');
        cyberTint.addColorStop(0.5, 'rgba(220,236,255,0.04)');
        cyberTint.addColorStop(1, 'rgba(255,255,255,0.08)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = cyberTint;
        ctx.fillRect(0, 0, size, size);

        const core = ctx.createRadialGradient(
            size * 0.5,
            size * 0.5,
            size * 0.02,
            size * 0.5,
            size * 0.5,
            size * 0.48
        );
        core.addColorStop(0, 'rgba(255,255,255,0.74)');
        core.addColorStop(0.34, 'rgba(226,240,255,0.34)');
        core.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = core;
        ctx.fillRect(0, 0, size, size);

        const mask = ctx.createRadialGradient(
            size * 0.5,
            size * 0.5,
            size * 0.06,
            size * 0.5,
            size * 0.5,
            size * 0.5
        );
        mask.addColorStop(0, 'rgba(0,0,0,0.86)');
        mask.addColorStop(0.52, 'rgba(0,0,0,0.28)');
        mask.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = mask;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(beamCanvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    };

    const beamTexture = createBeamTexture();

    const coreGlowSprites = [];
    const addCoreGlowSprite = (size, color, opacity, pulse, speed, phase) => {
        if (!beamTexture) return;
        const spriteMaterial = new THREE.SpriteMaterial({
            map: beamTexture,
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(size, size, 1);
        cube.add(sprite);
        coreGlowSprites.push({ sprite, baseOpacity: opacity, pulse, speed, phase });
    };

    const centerCoreLight = new THREE.PointLight(0xffb48e, 1.06, 1780, 1.34);
    centerCoreLight.position.set(0, 0, 0);
    cube.add(centerCoreLight);

    const centerCoreBlueLight = new THREE.PointLight(0xffd8bf, 0.74, 1620, 1.4);
    centerCoreBlueLight.position.set(0, 0, 0);
    cube.add(centerCoreBlueLight);

    addCoreGlowSprite(860, 0xffa97d, 0.15, 0.015, 1.12, 0.2);
    addCoreGlowSprite(520, 0xffd6be, 0.08, 0.025, 0.92, 1.3);

    const createDividerBeamTexture = () => {
        const width = 768;
        const height = 768;
        const dividerCanvas = document.createElement('canvas');
        dividerCanvas.width = width;
        dividerCanvas.height = height;
        const ctx = dividerCanvas.getContext('2d');
        if (!ctx) return null;

        ctx.clearRect(0, 0, width, height);

        const panel = ctx.createLinearGradient(0, 0, width, height);
        panel.addColorStop(0, 'rgba(255,188,228,0.18)');
        panel.addColorStop(0.5, 'rgba(228,240,255,0.12)');
        panel.addColorStop(1, 'rgba(255,176,218,0.2)');
        ctx.fillStyle = panel;
        ctx.fillRect(0, 0, width, height);

        const centerBar = ctx.createLinearGradient(0, 0, width, 0);
        centerBar.addColorStop(0, 'rgba(255,255,255,0)');
        centerBar.addColorStop(0.4, 'rgba(255,218,240,0.2)');
        centerBar.addColorStop(0.5, 'rgba(255,244,252,0.6)');
        centerBar.addColorStop(0.6, 'rgba(206,230,255,0.22)');
        centerBar.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = centerBar;
        ctx.fillRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.08, width * 0.5, height * 0.5, width * 0.72);
        glow.addColorStop(0, 'rgba(255,200,235,0.56)');
        glow.addColorStop(0.5, 'rgba(214,230,255,0.14)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        const fade = ctx.createLinearGradient(0, 0, 0, height);
        fade.addColorStop(0, 'rgba(0,0,0,0)');
        fade.addColorStop(0.18, 'rgba(0,0,0,0.9)');
        fade.addColorStop(0.82, 'rgba(0,0,0,0.9)');
        fade.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(dividerCanvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    };

    const dividerBeamTexture = createDividerBeamTexture();
    const dividerBillboardGroup = new THREE.Group();
    dividerBillboardGroup.renderOrder = 7;
    const innerBeamLayers = [];
    const createInnerBeam = (options) => {
        if (!beamTexture) return null;
        const material = new THREE.MeshBasicMaterial({
            map: beamTexture,
            color: options.color,
            transparent: true,
            opacity: options.opacity,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        const beam = new THREE.Mesh(new THREE.PlaneGeometry(options.width, options.height), material);
        beam.position.set(options.x, options.y, options.z);
        beam.rotation.set(options.rx, options.ry, options.rz);
        cube.add(beam);
        innerBeamLayers.push({
            mesh: beam,
            baseOpacity: options.opacity,
            pulse: options.pulse,
            speed: options.speed,
            phase: options.phase
        });
        return beam;
    };

    const dividerBeams = [];

    const baseCubeX = 176;
    const baseCubeY = 124;
    const baseFloorReflectionY = -522;
    const baseFloorReflectionZ = 174;
    const baseContactShadowY = -536;
    const baseContactShadowZ = 168;
    const baseShadowCatcherY = -540;
    const baseShadowCatcherZ = 168;
    let cubeViewportBaseScale = 1;
    let cubeViewportBaseX = baseCubeX;
    let cubeViewportBaseY = baseCubeY;

    const applyCubeFramingForRotation = () => {
        const rotationX = Number(cube.rotation.x) || 0;
        const rotationY = Number(cube.rotation.y) || 0;
        const topViewFactor = clamp((Math.abs(rotationX) - 0.88) / 0.66, 0, 1);
        const yaw = Math.atan2(Math.sin(rotationY), Math.cos(rotationY));
        const yawFactor = clamp((Math.abs(yaw) - 0.62) / 1.16, 0, 1);
        const topOffset = ((116 * topViewFactor) + (20 * yawFactor)) * cubeViewportBaseScale;

        cube.scale.setScalar(cubeViewportBaseScale);
        cube.position.x = cubeViewportBaseX;
        cube.position.y = cubeViewportBaseY - topOffset;
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const getCubeViewportScale = () => 0.9;
    const getCameraViewportSettings = () => ({
        z: baseCameraZ,
        fov: baseCameraFov
    });
    const applyCubeRevealVisual = () => {
        const reveal = clamp(cubeRevealState.progress, 0, 1);
        const opacity = clamp((reveal - 0.04) / 0.74, 0, 1);
        canvas.style.opacity = `${opacity}`;
        canvas.style.pointerEvents = reveal > 0.42 ? 'auto' : 'none';
    };
    const applyCubeViewportScale = () => {
        const cubeScale = getCubeViewportScale();
        const viewportWidth = Math.max(lastCanvasWidth || 0, window.innerWidth || 0, 1);
        const viewportHeight = Math.max(lastCanvasHeight || 0, window.innerHeight || 0, 1);
        const tallViewportProgress = clamp((viewportHeight - 956) / 520, 0, 1);
        const wideViewportProgress = clamp((viewportWidth - 1480) / 620, 0, 1);
        const narrowViewportProgress = clamp((1320 - viewportWidth) / 520, 0, 1);
        const mobileViewportProgress1024 = clamp((1024 - viewportWidth) / 560, 0, 1);
        const mobileViewportProgress786 = clamp((786 - viewportWidth) / 338, 0, 1);
        const mobileViewportProgress768 = clamp((768 - viewportWidth) / 320, 0, 1);
        const mobileViewportProgress480 = clamp((480 - viewportWidth) / 220, 0, 1);
        const mobileViewportProgress408 = clamp((408 - viewportWidth) / 120, 0, 1);
        const tabletTallViewportProgress1024 = viewportWidth <= 1024
            ? clamp((viewportHeight - 700) / 260, 0, 1)
            : 0;
        const heightScaleMultiplier = 1 - (0.18 * tallViewportProgress);
        const widthScaleMultiplier = 1 - (0.12 * wideViewportProgress) + (0.08 * narrowViewportProgress);
        const mobileScaleMultiplier1024 = 1 - (0.26 * mobileViewportProgress1024);
        const mobileScaleMultiplier786 = 1 - (0.18 * mobileViewportProgress786);
        const mobileBoostMultiplier786 = 1 + (1.0 * mobileViewportProgress786);
        const mobileScaleMultiplier768 = viewportWidth <= 768 ? 1.25 : 1;
        const mobileScaleMultiplier480 = viewportWidth <= 480 ? (1 / 1.5) : 1;
        const mobileBoostMultiplier408 = viewportWidth <= 408 ? 1 + (0.08 * mobileViewportProgress408) : 1;
        const tabletTallScaleMultiplier1024 = viewportWidth <= 1024 && viewportHeight >= 700
            ? 1 - (0.05 + (0.07 * tabletTallViewportProgress1024))
            : 1;
        const xBiasMultiplier = 1 - (0.36 * tallViewportProgress);
        const revealScale = clamp(cubeRevealState.progress, 0.001, 1.2);
        const scaled = cubeScale
            * heightScaleMultiplier
            * widthScaleMultiplier
            * mobileScaleMultiplier1024
            * mobileScaleMultiplier786
            * mobileBoostMultiplier786
            * mobileScaleMultiplier768
            * mobileScaleMultiplier480
            * mobileBoostMultiplier408
            * tabletTallScaleMultiplier1024
            * revealScale;
        const mobileLeftShift768 = viewportWidth <= 768 && viewportWidth > 480 ? 142 : 0;
        const mobileRightShift480 = viewportWidth <= 480 ? 18 : 0;
        const mobileRightShift408 = viewportWidth <= 408 ? 10 * mobileViewportProgress408 : 0;
        const mobileLeftOffset = ((28 * mobileViewportProgress1024 + 36 * mobileViewportProgress786 + 104 * mobileViewportProgress768) * scaled) + mobileLeftShift768;
        const mobileDownOffset786 = 82 * mobileViewportProgress786;
        const mobileDownOffset768 = 30 * mobileViewportProgress768;
        const mobileUpOffset768 = viewportWidth <= 768 ? 18 : 0;
        const mobileUpOffset480Boost = viewportWidth <= 480 ? 8 : 0;
        const mobileUpOffset480 = viewportWidth <= 480 ? 26 : 0;
        const mobileUpOffset408 = viewportWidth <= 408 ? 34 * mobileViewportProgress408 : 0;
        cubeViewportBaseScale = scaled;
        cubeViewportBaseX = (baseCubeX * scaled * xBiasMultiplier) - mobileLeftOffset + mobileRightShift480 + mobileRightShift408;
        cubeViewportBaseY = (baseCubeY * scaled) + mobileDownOffset786 + mobileDownOffset768 - mobileUpOffset768 - mobileUpOffset480Boost - mobileUpOffset480 - mobileUpOffset408;
        applyCubeFramingForRotation();
        if (floorReflectionPlane) {
            floorReflectionPlane.scale.setScalar(scaled * 1.46);
            floorReflectionPlane.position.y = baseFloorReflectionY * scaled;
            floorReflectionPlane.position.z = baseFloorReflectionZ * scaled;
        }
        if (contactShadowPlane) {
            contactShadowPlane.scale.setScalar(scaled * 1.34);
            contactShadowPlane.position.y = baseContactShadowY * scaled;
            contactShadowPlane.position.z = baseContactShadowZ * scaled;
        }
        if (shadowCatcherPlane) {
            shadowCatcherPlane.scale.setScalar(scaled * 1.6);
            shadowCatcherPlane.position.y = baseShadowCatcherY * scaled;
            shadowCatcherPlane.position.z = baseShadowCatcherZ * scaled;
        }
        applyCubeRevealVisual();
    };
    cube.rotation.x = 0.5;
    cube.rotation.y = 0.3;
    cube.rotation.z = -0.12;
    cube.position.x = baseCubeX;
    cube.position.y = baseCubeY;

    const glassAmbient = new THREE.AmbientLight(0xffffff, 0.34);
    scene.add(glassAmbient);

    const glassKeyLight = new THREE.DirectionalLight(0xffffff, 1.36);
    glassKeyLight.position.set(920, 980, 780);
    glassKeyLight.castShadow = true;
    glassKeyLight.shadow.mapSize.set(1024, 1024);
    glassKeyLight.shadow.camera.near = 120;
    glassKeyLight.shadow.camera.far = 3800;
    glassKeyLight.shadow.bias = -0.0003;
    scene.add(glassKeyLight);

    const glassFillLight = new THREE.DirectionalLight(0xa9cfff, 0.78);
    glassFillLight.position.set(-760, 260, -540);
    scene.add(glassFillLight);

    const innerGlowLight = new THREE.PointLight(0xffffff, 0.84, 1400, 2);
    innerGlowLight.position.set(0, 20, 0);
    cube.add(innerGlowLight);

    const innerBlueGlowLight = new THREE.PointLight(0x88ccff, 0.74, 1200, 2);
    innerBlueGlowLight.position.set(0, -140, 80);
    cube.add(innerBlueGlowLight);

    cube.castShadow = true;
    cube.receiveShadow = true;
    innerGlass.castShadow = false;
    innerGlass.receiveShadow = true;
    cube.add(edgeCoat);
    cube.add(edgeGlowLines);
    cube.add(edgeWarmLines);

    scene.add(cube);

    shadowCatcherPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2200, 2200),
        new THREE.ShadowMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0
        })
    );
    shadowCatcherPlane.rotation.x = -Math.PI / 2;
    shadowCatcherPlane.position.y = baseShadowCatcherY;
    shadowCatcherPlane.position.z = baseShadowCatcherZ;
    shadowCatcherPlane.receiveShadow = true;
    scene.add(shadowCatcherPlane);

    const createContactShadowTexture = () => {
        const size = 512;
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = size;
        shadowCanvas.height = size;
        const ctx = shadowCanvas.getContext('2d');
        if (!ctx) return null;

        ctx.clearRect(0, 0, size, size);
        const spectral = ctx.createLinearGradient(size * 0.06, size * 0.18, size * 0.94, size * 0.82);
        spectral.addColorStop(0, 'rgba(176, 76, 108, 0.56)');
        spectral.addColorStop(0.22, 'rgba(136, 90, 184, 0.5)');
        spectral.addColorStop(0.46, 'rgba(88, 118, 202, 0.58)');
        spectral.addColorStop(0.7, 'rgba(96, 148, 188, 0.4)');
        spectral.addColorStop(1, 'rgba(156, 92, 136, 0.38)');
        ctx.fillStyle = spectral;
        ctx.fillRect(0, 0, size, size);

        const sheen = ctx.createLinearGradient(size * 0.2, 0, size * 0.8, size);
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0)');
        sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = sheen;
        ctx.fillRect(0, 0, size, size);

        const dropletBand = ctx.createRadialGradient(
            size * 0.48,
            size * 0.56,
            size * 0.14,
            size * 0.5,
            size * 0.55,
            size * 0.42
        );
        dropletBand.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
        dropletBand.addColorStop(0.36, 'rgba(196, 225, 255, 0.12)');
        dropletBand.addColorStop(0.7, 'rgba(148, 182, 232, 0.06)');
        dropletBand.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = dropletBand;
        ctx.fillRect(0, 0, size, size);

        const dropletSpecA = ctx.createRadialGradient(
            size * 0.38,
            size * 0.47,
            size * 0.01,
            size * 0.38,
            size * 0.47,
            size * 0.14
        );
        dropletSpecA.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
        dropletSpecA.addColorStop(0.38, 'rgba(220, 238, 255, 0.1)');
        dropletSpecA.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = dropletSpecA;
        ctx.fillRect(0, 0, size, size);

        const dropletSpecB = ctx.createRadialGradient(
            size * 0.66,
            size * 0.6,
            size * 0.008,
            size * 0.66,
            size * 0.6,
            size * 0.12
        );
        dropletSpecB.addColorStop(0, 'rgba(255, 248, 255, 0.2)');
        dropletSpecB.addColorStop(0.35, 'rgba(216, 228, 255, 0.08)');
        dropletSpecB.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = dropletSpecB;
        ctx.fillRect(0, 0, size, size);

        const mask = ctx.createRadialGradient(
            size * 0.5,
            size * 0.52,
            size * 0.02,
            size * 0.5,
            size * 0.52,
            size * 0.7
        );
        mask.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
        mask.addColorStop(0.2, 'rgba(0, 0, 0, 0.46)');
        mask.addColorStop(0.48, 'rgba(0, 0, 0, 0.24)');
        mask.addColorStop(0.72, 'rgba(0, 0, 0, 0.1)');
        mask.addColorStop(0.86, 'rgba(0, 0, 0, 0.03)');
        mask.addColorStop(0.95, 'rgba(0, 0, 0, 0.01)');
        mask.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = mask;
        ctx.fillRect(0, 0, size, size);

        const softShadow = ctx.createRadialGradient(
            size * 0.5,
            size * 0.55,
            size * 0.04,
            size * 0.5,
            size * 0.55,
            size * 0.5
        );
        softShadow.addColorStop(0, 'rgba(0, 0, 0, 0.36)');
        softShadow.addColorStop(0.42, 'rgba(0, 0, 0, 0.16)');
        softShadow.addColorStop(0.78, 'rgba(0, 0, 0, 0.025)');
        softShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = softShadow;
        ctx.fillRect(0, 0, size, size);

        const inkBleed = ctx.createRadialGradient(
            size * 0.56,
            size * 0.6,
            size * 0.08,
            size * 0.56,
            size * 0.6,
            size * 0.54
        );
        inkBleed.addColorStop(0, 'rgba(22, 26, 36, 0.26)');
        inkBleed.addColorStop(0.52, 'rgba(16, 20, 30, 0.13)');
        inkBleed.addColorStop(0.9, 'rgba(8, 10, 14, 0.02)');
        inkBleed.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = inkBleed;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(shadowCanvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    };
    const contactShadowTexture = createContactShadowTexture();
    const createFloorReflectionTexture = () => {
        const size = 512;
        const reflectionCanvas = document.createElement('canvas');
        reflectionCanvas.width = size;
        reflectionCanvas.height = size;
        const ctx = reflectionCanvas.getContext('2d');
        if (!ctx) return null;

        ctx.clearRect(0, 0, size, size);

        const verticalSpread = ctx.createLinearGradient(0, size * 0.18, 0, size * 0.92);
        verticalSpread.addColorStop(0, 'rgba(255, 255, 255, 0)');
        verticalSpread.addColorStop(0.38, 'rgba(246, 249, 255, 0.2)');
        verticalSpread.addColorStop(0.6, 'rgba(214, 226, 245, 0.26)');
        verticalSpread.addColorStop(0.82, 'rgba(180, 198, 223, 0.14)');
        verticalSpread.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = verticalSpread;
        ctx.fillRect(0, 0, size, size);

        const spectralVeil = ctx.createLinearGradient(size * 0.16, size * 0.2, size * 0.84, size * 0.84);
        spectralVeil.addColorStop(0, 'rgba(178, 104, 156, 0.14)');
        spectralVeil.addColorStop(0.36, 'rgba(120, 138, 218, 0.18)');
        spectralVeil.addColorStop(0.72, 'rgba(112, 180, 208, 0.12)');
        spectralVeil.addColorStop(1, 'rgba(168, 102, 142, 0.1)');
        ctx.fillStyle = spectralVeil;
        ctx.fillRect(0, 0, size, size);

        const softGlint = ctx.createRadialGradient(
            size * 0.52,
            size * 0.44,
            size * 0.02,
            size * 0.52,
            size * 0.44,
            size * 0.24
        );
        softGlint.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        softGlint.addColorStop(0.56, 'rgba(230, 238, 252, 0.12)');
        softGlint.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = softGlint;
        ctx.fillRect(0, 0, size, size);

        const reflectionMask = ctx.createRadialGradient(
            size * 0.5,
            size * 0.58,
            size * 0.06,
            size * 0.5,
            size * 0.58,
            size * 0.66
        );
        reflectionMask.addColorStop(0, 'rgba(0, 0, 0, 0.66)');
        reflectionMask.addColorStop(0.35, 'rgba(0, 0, 0, 0.4)');
        reflectionMask.addColorStop(0.7, 'rgba(0, 0, 0, 0.16)');
        reflectionMask.addColorStop(0.92, 'rgba(0, 0, 0, 0.03)');
        reflectionMask.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = reflectionMask;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(reflectionCanvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    };
    const floorReflectionTexture = createFloorReflectionTexture();
    const floorReflectionGeometry = new THREE.CircleGeometry(360, 64);
    const floorReflectionMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: floorReflectionTexture,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        depthWrite: false
    });
    floorReflectionPlane = new THREE.Mesh(floorReflectionGeometry, floorReflectionMaterial);
    floorReflectionPlane.rotation.x = -Math.PI / 2;
    floorReflectionPlane.position.y = baseFloorReflectionY;
    floorReflectionPlane.position.z = baseFloorReflectionZ;
    scene.add(floorReflectionPlane);

    const contactShadowGeometry = new THREE.CircleGeometry(340, 64);
    const contactShadowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: contactShadowTexture,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        depthWrite: false
    });
    contactShadowPlane = new THREE.Mesh(contactShadowGeometry, contactShadowMaterial);
    contactShadowPlane.rotation.x = -Math.PI / 2;
    contactShadowPlane.position.y = baseContactShadowY;
    contactShadowPlane.position.z = baseContactShadowZ;
    scene.add(contactShadowPlane);

    const cursorOrb = document.createElement('span');
    cursorOrb.className = 'cursor-orb';
    cursorOrb.setAttribute('aria-hidden', 'true');
    cursorOrb.innerHTML = '<span class="core"><span class="label">VIEW</span><span class="arrow" aria-hidden="true"></span></span>';
    $section.append(cursorOrb);
    const cursorOrbCore = cursorOrb.querySelector('.core');

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const cubeFaceIndexMap = {
        0: 'right',
        1: 'left',
        2: 'top',
        3: 'bottom',
        4: 'front',
        5: 'back'
    };
    const cubeFaceLinkDefaults = {
        front: '/aisolution/',
        right: '/portfolio/space/',
        back: '/aisolution/',
        left: 'https://www.ubique.kr/',
        top: '/about/',
        bottom: '/portfolio/'
    };
    const getFaceHrefDatasetKey = (face) => {
        const safeFace = ((face || '') + '').trim();
        if (!safeFace) return '';
        return `face${safeFace.charAt(0).toUpperCase()}${safeFace.slice(1)}Href`;
    };
    const cubeFaceLinks = Object.keys(cubeFaceLinkDefaults).reduce((acc, face) => {
        const key = getFaceHrefDatasetKey(face);
        const fromDataset = (canvas.dataset && key && (canvas.dataset[key] || '') + '') || '';
        const href = fromDataset.trim() || cubeFaceLinkDefaults[face];
        acc[face] = href;
        return acc;
    }, {});

    // Cube interaction (drag + click)
    let targetRotationX = 0.5;
    let targetRotationY = 0.3;
    let targetRotationZ = -0.12;
    let currentFace = 'front';
    const autoFaceOrder = ['front', 'right', 'back', 'left', 'top', 'bottom'];
    let faceIndex = 0;
    let lastAutoRotateTime = Date.now();
    const autoHoldMs = 700;
    const autoTransitionMs = 2600;
    const idleAfterInteractionMs = 2000;
    const dragFaceThresholdPx = 128;
    const dragFaceStepCooldownMs = 1400;
    const clickTolerancePx = 10;
    const faceHitUvMargin = 0.22;
    const maxTiltX = 1.18;
    let isDragging = false;
    let dragPointerId = null;
    let dragPrevX = 0;
    let dragPrevY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragAccumDX = 0;
    let dragAccumDY = 0;
    let dragTravelPx = 0;
    let dragNextStepAt = 0;
    let dragAxisLock = null;
    let dragLastMoveTime = 0;
    let dragMoved = false;
    let orbVisible = false;
    let orbMorphTimer = null;
    let orbHiddenByFaceMotion = false;
    let pointerInsideCube = false;
    let lastPointerClientX = 0;
    let lastPointerClientY = 0;

    const setCursorOrbVisible = (visible) => {
        const nextVisible = !!visible;
        if (orbVisible === nextVisible) return;
        orbVisible = nextVisible;
        $section.toggleClass('cursor-orb-active', orbVisible);
    };

    const cursorOrbHalfSize = (() => {
        const cssValue = ((window.getComputedStyle(cursorOrb).getPropertyValue('--orb-size') || '') + '').trim();
        const parsed = Number.parseFloat(cssValue);
        return Number.isFinite(parsed) && parsed > 0 ? parsed * 0.5 : 38;
    })();

    const moveCursorOrb = (clientX, clientY) => {
        if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
        const sectionNode = $section.get(0);
        const sectionRect = sectionNode && typeof sectionNode.getBoundingClientRect === 'function'
            ? sectionNode.getBoundingClientRect()
            : null;
        const canvasRect = canvas.getBoundingClientRect();
        if (!canvasRect.width || !canvasRect.height) return;

        const minX = canvasRect.left + cursorOrbHalfSize;
        const maxX = canvasRect.right - cursorOrbHalfSize;
        const minY = canvasRect.top + cursorOrbHalfSize;
        const maxY = canvasRect.bottom - cursorOrbHalfSize;
        const boundedClientX = maxX >= minX ? clamp(clientX, minX, maxX) : (canvasRect.left + (canvasRect.width * 0.5));
        const boundedClientY = maxY >= minY ? clamp(clientY, minY, maxY) : (canvasRect.top + (canvasRect.height * 0.5));
        const localX = sectionRect ? (boundedClientX - sectionRect.left) : boundedClientX;
        const localY = sectionRect ? (boundedClientY - sectionRect.top) : boundedClientY;
        cursorOrb.style.transform = `translate3d(${localX}px, ${localY}px, 0) translate(-50%, -50%)`;
    };

    const hideCursorOrbForFaceMotion = () => {
        orbHiddenByFaceMotion = true;
        setCursorOrbVisible(false);
    };

    const revealCursorOrbAfterFaceMotion = () => {
        orbHiddenByFaceMotion = false;
        if (isDragging) return;
        const hoverFace = getFaceFromClientPoint(lastPointerClientX, lastPointerClientY);
        pointerInsideCube = !!hoverFace;
        if (!pointerInsideCube) {
            setCursorOrbVisible(false);
            canvas.style.cursor = 'grab';
            return;
        }
        moveCursorOrb(lastPointerClientX, lastPointerClientY);
        setCursorOrbVisible(true);
        updateHoverCursor(hoverFace);
        playCursorOrbFaceMorph();
    };

    const playCursorOrbFaceMorph = () => {
        if (!orbVisible || !cursorOrbCore) return;
        cursorOrbCore.classList.remove('is-morph');
        void cursorOrbCore.offsetWidth;
        cursorOrbCore.classList.add('is-morph');
        if (orbMorphTimer) {
            window.clearTimeout(orbMorphTimer);
        }
        orbMorphTimer = window.setTimeout(() => {
            cursorOrbCore.classList.remove('is-morph');
            orbMorphTimer = null;
        }, 420);
    };

    const normalizeAngle = (angle) => {
        const value = Number(angle);
        if (!Number.isFinite(value)) return 0;
        return Math.atan2(Math.sin(value), Math.cos(value));
    };

    const clampXRotation = (value) => clamp(value, -maxTiltX, maxTiltX);
    const autoTransitionState = {
        active: false,
        startedAt: 0,
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 0, z: 0 },
        face: 'front'
    };
    const dragTransitionState = {
        active: false,
        startedAt: 0,
        durationMs: 1800,
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 0, z: 0 },
        face: 'front'
    };

    const lerp = (from, to, t) => from + ((to - from) * t);
    const lerpAngleShortest = (from, to, t) => from + (normalizeAngle(to - from) * t);
    const smoothstep = (t) => {
        const v = clamp(t, 0, 1);
        return v * v * (3 - (2 * v));
    };

    const faceHorizontalTransitions = {
        front: { left: 'left', right: 'right' },
        right: { left: 'front', right: 'back' },
        back: { left: 'right', right: 'left' },
        left: { left: 'back', right: 'front' },
        top: { left: 'left', right: 'right' },
        bottom: { left: 'left', right: 'right' }
    };

    const faceVerticalTransitions = {
        front: { down: 'top', up: 'bottom' },
        top: { down: 'back', up: 'front' },
        back: { down: 'bottom', up: 'top' },
        bottom: { down: 'front', up: 'back' },
        right: { down: 'top', up: 'bottom' },
        left: { down: 'top', up: 'bottom' }
    };

    const getDragDirection = (dx, dy, axis) => {
        if (axis === 'horizontal') {
            return dx >= 0 ? 'left' : 'right';
        }
        if (axis === 'vertical') {
            return dy >= 0 ? 'down' : 'up';
        }
        if (Math.abs(dx) >= Math.abs(dy)) {
            return dx >= 0 ? 'right' : 'left';
        }
        return dy >= 0 ? 'down' : 'up';
    };

    const getAdjacentFace = (face, direction) => {
        if (direction === 'down' || direction === 'up') {
            const fromFaceVertical = faceVerticalTransitions[face] || faceVerticalTransitions.front;
            return fromFaceVertical[direction] || face;
        }

        const fromFace = faceHorizontalTransitions[face] || faceHorizontalTransitions.front;
        return fromFace[direction] || face;
    };

    const markInteraction = () => {
        autoTransitionState.active = false;
        dragTransitionState.active = false;
        lastAutoRotateTime = Date.now() - (autoHoldMs - idleAfterInteractionMs);
    };

    const startAutoTransition = (face) => {
        const angle = faceAngles[face];
        if (!angle) return;

        hideCursorOrbForFaceMotion();

        autoTransitionState.active = true;
        autoTransitionState.startedAt = performance.now();
        autoTransitionState.from.x = cube.rotation.x;
        autoTransitionState.from.y = cube.rotation.y;
        autoTransitionState.from.z = cube.rotation.z;
        autoTransitionState.to.x = angle.x;
        autoTransitionState.to.y = angle.y;
        autoTransitionState.to.z = angle.z;
        autoTransitionState.face = face;
    };

    const startDragTransition = (face) => {
        const angle = faceAngles[face];
        if (!angle) return;

        hideCursorOrbForFaceMotion();

        dragTransitionState.active = true;
        dragTransitionState.startedAt = performance.now();
        dragTransitionState.from.x = cube.rotation.x;
        dragTransitionState.from.y = cube.rotation.y;
        dragTransitionState.from.z = cube.rotation.z;
        dragTransitionState.to.x = angle.x;
        dragTransitionState.to.y = angle.y;
        dragTransitionState.to.z = angle.z;
        dragTransitionState.face = face;

        currentFace = face;
        targetRotationX = angle.x;
        targetRotationY = angle.y;
        targetRotationZ = angle.z;

        const stepFaceIndex = autoFaceOrder.indexOf(face);
        if (stepFaceIndex !== -1) {
            faceIndex = stepFaceIndex;
        }
    };

    const syncFaceIndexFromRotation = () => {
        let nearestFace = currentFace;
        let nearestScore = Number.POSITIVE_INFINITY;

        autoFaceOrder.forEach((faceName, index) => {
            const angle = faceAngles[faceName];
            if (!angle) return;
            const yDiff = Math.abs(normalizeAngle(cube.rotation.y - angle.y));
            const xDiff = Math.abs(cube.rotation.x - angle.x) * 0.35;
            const score = yDiff + xDiff;

            if (score < nearestScore) {
                nearestScore = score;
                nearestFace = faceName;
                faceIndex = index;
            }
        });

        currentFace = nearestFace;
    };

    const setTargetFace = (face, options = {}) => {
        if (!faceAngles[face]) return;

        currentFace = face;
        targetRotationX = faceAngles[face].x;
        targetRotationY = faceAngles[face].y;
        targetRotationZ = faceAngles[face].z;

        if (options.fromInteraction) {
            const clickedFaceIndex = autoFaceOrder.indexOf(face);
            if (clickedFaceIndex !== -1) {
                faceIndex = clickedFaceIndex;
            }
            markInteraction();
            return;
        }

        const autoFaceIndex = autoFaceOrder.indexOf(face);
        if (autoFaceIndex !== -1) {
            faceIndex = autoFaceIndex;
        }
    };

    const detectHoverFace = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const nx = (clientX - (rect.left + rect.width * 0.5)) / (rect.width * 0.5);
        const ny = (clientY - (rect.top + rect.height * 0.5)) / (rect.height * 0.5);
        const ax = Math.abs(nx);
        const ay = Math.abs(ny);
        const deadband = 0.26;
        const axisGap = 0.16;
        const minAxis = 0.32;

        if (ax < deadband && ay < deadband) {
            return 'front';
        } else if (Math.abs(ax - ay) >= axisGap) {
            if (ay > ax && ay >= minAxis) {
                return ny > 0 ? 'bottom' : 'top';
            } else if (ax >= ay && ax >= minAxis) {
                return nx > 0 ? 'right' : 'left';
            }
        }
        return currentFace;
    };

    const getFaceFromClientPoint = (clientX, clientY) => {
        if (!isPointerOnCanvas(clientX, clientY)) return null;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
        raycaster.setFromCamera(pointerNdc, camera);
        const intersections = raycaster.intersectObject(cube, false);
        if (!intersections || !intersections.length) return null;
        const hit = intersections[0] || null;
        if (!hit || !hit.face) return null;
        const uv = hit.uv || null;
        if (!uv) return null;
        if (
            uv.x <= faceHitUvMargin
            || uv.x >= (1 - faceHitUvMargin)
            || uv.y <= faceHitUvMargin
            || uv.y >= (1 - faceHitUvMargin)
        ) {
            return null;
        }
        const materialIndex = hit.face.materialIndex;
        return cubeFaceIndexMap[materialIndex] || null;
    };

    const getFaceLink = (face) => {
        const href = ((cubeFaceLinks[face] || '') + '').trim();
        if (!href || href === '#') return '';
        return href;
    };

    const navigateFaceLink = (face) => {
        const href = getFaceLink(face);
        if (!href) return;
        const isExternal = /^https?:\/\//i.test(href);
        if (isExternal) {
            window.open(href, '_blank', 'noopener,noreferrer');
            return;
        }
        window.location.assign(href);
    };

    const updateHoverCursor = (face) => {
        if (isDragging) return;
        const href = getFaceLink(face);
        canvas.style.cursor = href ? 'pointer' : 'grab';
    };

    const isPointerOnCanvas = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    };

    const bindDragWindowEvents = () => {
        window.addEventListener('pointermove', handleCubeDragMove, { passive: true });
        window.addEventListener('pointerup', handleCubeDragEnd, { passive: true });
        window.addEventListener('pointercancel', handleCubeDragEnd, { passive: true });
    };

    const unbindDragWindowEvents = () => {
        window.removeEventListener('pointermove', handleCubeDragMove);
        window.removeEventListener('pointerup', handleCubeDragEnd);
        window.removeEventListener('pointercancel', handleCubeDragEnd);
    };

    const handleCubeDragStart = (e) => {
        if (isDragging) return;
        if (!isPointerOnCanvas(e.clientX, e.clientY)) return;

        syncFaceIndexFromRotation();
        isDragging = true;
        dragPointerId = e.pointerId;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragPrevX = e.clientX;
        dragPrevY = e.clientY;
        dragAccumDX = 0;
        dragAccumDY = 0;
        dragTravelPx = 0;
        dragNextStepAt = performance.now();
        dragAxisLock = null;
        dragLastMoveTime = performance.now();
        dragMoved = false;
        setCursorOrbVisible(false);
        canvas.classList.add('is-dragging');
        bindDragWindowEvents();

        markInteraction();
    };

    const handleCubeDragMove = (e) => {
        if (!isDragging || e.pointerId !== dragPointerId) return;
        debugPerf.dragMoveCount += 1;

        const now = performance.now();
        const dx = e.clientX - dragPrevX;
        const dy = e.clientY - dragPrevY;
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
            dragPrevX = e.clientX;
            dragPrevY = e.clientY;
            dragLastMoveTime = now;
            return;
        }

        if (!dragMoved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
            dragMoved = true;
        }

        dragAccumDX += dx;
        dragAccumDY += dy;
        dragTravelPx = Math.max(dragTravelPx, Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY));

        const accumAbsX = Math.abs(dragAccumDX);
        const accumAbsY = Math.abs(dragAccumDY);
        const accumMax = Math.max(accumAbsX, accumAbsY);

        if (!dragAxisLock && accumMax >= 18) {
            dragAxisLock = accumAbsY >= accumAbsX ? 'vertical' : 'horizontal';
        }

        if (accumMax >= dragFaceThresholdPx && now >= dragNextStepAt) {
            const direction = getDragDirection(dragAccumDX, dragAccumDY, dragAxisLock);
            const nextFace = getAdjacentFace(currentFace, direction);
            if (nextFace && nextFace !== currentFace) {
                startDragTransition(nextFace);
                markInteraction();
                dragMoved = true;
            }
            dragAccumDX = 0;
            dragAccumDY = 0;
            dragNextStepAt = now + dragFaceStepCooldownMs;
        }

        dragPrevX = e.clientX;
        dragPrevY = e.clientY;
        dragLastMoveTime = now;

        markInteraction();
    };

    const handleCubeDragEnd = (e) => {
        if (!isDragging) return;
        if (e && typeof e.pointerId === 'number' && e.pointerId !== dragPointerId) return;

        isDragging = false;
        dragPointerId = null;
        canvas.classList.remove('is-dragging');
        unbindDragWindowEvents();

        if (dragMoved) {
            setTargetFace(currentFace, { fromInteraction: true });
            if (orbHiddenByFaceMotion) {
                revealCursorOrbAfterFaceMotion();
            }
        } else if (dragTravelPx <= clickTolerancePx && e && typeof e.clientX === 'number' && typeof e.clientY === 'number' && isPointerOnCanvas(e.clientX, e.clientY)) {
            const clickedFace = getFaceFromClientPoint(e.clientX, e.clientY);
            if (clickedFace) {
                const clickedFaceIndex = autoFaceOrder.indexOf(clickedFace);
                if (clickedFaceIndex !== -1) {
                    faceIndex = clickedFaceIndex;
                }
                currentFace = clickedFace;
                setTargetFace(clickedFace, { fromInteraction: true });
                navigateFaceLink(clickedFace);
            }
        }
        markInteraction();
    };

    const handleCubeDragWindowBlur = () => {
        if (!isDragging) return;
        handleCubeDragEnd();
    };

    const handleCubePointerMove = (e) => {
        if (isDragging) return;
        if (e && e.pointerType === 'touch') return;
        if (!isPointerOnCanvas(e.clientX, e.clientY)) return;

        const hoverFace = getFaceFromClientPoint(e.clientX, e.clientY);
        pointerInsideCube = !!hoverFace;
        if (!hoverFace) {
            setCursorOrbVisible(false);
            canvas.style.cursor = 'grab';
            return;
        }

        lastPointerClientX = e.clientX;
        lastPointerClientY = e.clientY;
        moveCursorOrb(e.clientX, e.clientY);

        if (orbHiddenByFaceMotion) {
            return;
        }

        setCursorOrbVisible(true);
        updateHoverCursor(hoverFace);
    };

    const handleCubePointerLeave = () => {
        if (isDragging) return;
        pointerInsideCube = false;
        setCursorOrbVisible(false);
        canvas.style.cursor = 'grab';
    };

    canvas.style.touchAction = 'manipulation';
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', handleCubeDragStart);
    canvas.addEventListener('pointermove', handleCubePointerMove, { passive: true });
    canvas.addEventListener('pointerleave', handleCubePointerLeave, { passive: true });
    window.addEventListener('blur', handleCubeDragWindowBlur);
    const sectionEl = $section.get(0);

    const playCubeRevealOnce = () => {
        if (cubeRevealState.played) return;
        cubeRevealState.played = true;

        if (cubeReducedMotion || typeof window.gsap === 'undefined') {
            cubeRevealState.progress = 1;
            resizeCanvas();
            return;
        }

        if (cubeRevealState.tween) {
            cubeRevealState.tween.kill();
        }

        cubeRevealState.progress = 0;
        cubeRevealState.tween = window.gsap.to(cubeRevealState, {
            progress: 1,
            duration: 0.92,
            ease: 'back.out(1.85)',
            onUpdate: () => {
                resizeCanvas();
            },
            onComplete: () => {
                cubeRevealState.progress = 1;
                cubeRevealState.tween = null;
                resizeCanvas();
            }
        });
    };

    const cubeViewportEl = canvas.closest('.cubezone') || canvas.parentElement || sectionEl || canvas;
    let lastCanvasWidth = 0;
    let lastCanvasHeight = 0;
    let resizeQueued = false;

    const getCubeViewportContentSize = () => {
        const rect = cubeViewportEl && typeof cubeViewportEl.getBoundingClientRect === 'function'
            ? cubeViewportEl.getBoundingClientRect()
            : { width: 0, height: 0 };
        let measuredWidth = (cubeViewportEl && cubeViewportEl.clientWidth) || rect.width || 0;
        let measuredHeight = (cubeViewportEl && cubeViewportEl.clientHeight) || rect.height || 0;

        if (cubeViewportEl && typeof window.getComputedStyle === 'function') {
            const styles = window.getComputedStyle(cubeViewportEl);
            const paddingX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
            const paddingY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
            measuredWidth -= paddingX;
            measuredHeight -= paddingY;
        }

        return {
            width: Math.max(1, Math.round(measuredWidth)),
            height: Math.max(1, Math.round(measuredHeight))
        };
    };

    // Resize handler
    const resizeCanvas = () => {
        const { width, height } = getCubeViewportContentSize();
        const sizeChanged = width !== lastCanvasWidth || height !== lastCanvasHeight;
        if (sizeChanged) {
            lastCanvasWidth = width;
            lastCanvasHeight = height;
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            renderer.setSize(width, height, false);
            renderer.setPixelRatio(1);
        }
        applyCubeViewportScale();
        const cameraSettings = getCameraViewportSettings();
        camera.position.z = cameraSettings.z;
        camera.fov = cameraSettings.fov;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };

    const queueResizeCanvas = () => {
        if (resizeQueued) return;
        resizeQueued = true;
        requestAnimationFrame(() => {
            resizeQueued = false;
            resizeCanvas();
        });
    };

    let cubeRaf = null;
    let cubeInView = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let cubeObserver = null;
    let lastRenderTime = 0;
    const debugPerf = {
        frameCount: 0,
        dragMoveCount: 0,
        lastReportAt: performance.now(),
        longTaskCount: 0
    };

    const reportPerf = (now) => {
        if (now - debugPerf.lastReportAt < 4000) return;
        const elapsedSec = Math.max((now - debugPerf.lastReportAt) / 1000, 0.001);
        const fps = debugPerf.frameCount / elapsedSec;
        const dragHz = debugPerf.dragMoveCount / elapsedSec;

        if (fps < 18 || debugPerf.longTaskCount > 0) {
            console.warn('[main][perf]', {
                fps: Number(fps.toFixed(1)),
                dragHz: Number(dragHz.toFixed(1)),
                longTasks: debugPerf.longTaskCount,
                cubeInView,
                pageVisible,
                isDragging
            });
        }

        debugPerf.frameCount = 0;
        debugPerf.dragMoveCount = 0;
        debugPerf.longTaskCount = 0;
        debugPerf.lastReportAt = now;
    };

    if (typeof PerformanceObserver === 'function') {
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                if (!entries || !entries.length) return;
                debugPerf.longTaskCount += entries.length;
            });
            longTaskObserver.observe({ type: 'longtask', buffered: true });
        } catch {
            // Ignore if longtask entry type is unavailable.
        }
    }

    // Animation
    const animate = () => {
        cubeRaf = null;
        const frameNow = performance.now();
        debugPerf.frameCount += 1;
        reportPerf(frameNow);
        const minFrameDelta = isDragging ? 16 : 28;
        if (frameNow - lastRenderTime < minFrameDelta) {
            if (cubeInView && pageVisible) {
                cubeRaf = requestAnimationFrame(animate);
            }
            return;
        }
        lastRenderTime = frameNow;

        if (isDragging && (performance.now() - dragLastMoveTime > 260)) {
            handleCubeDragEnd();
        }

        if (!Number.isFinite(cube.rotation.x) || !Number.isFinite(cube.rotation.y) || !Number.isFinite(cube.rotation.z)) {
            cube.rotation.x = faceAngles.front.x;
            cube.rotation.y = faceAngles.front.y;
            cube.rotation.z = faceAngles.front.z;
        }

        if (!Number.isFinite(targetRotationX) || !Number.isFinite(targetRotationY) || !Number.isFinite(targetRotationZ)) {
            targetRotationX = cube.rotation.x;
            targetRotationY = cube.rotation.y;
            targetRotationZ = cube.rotation.z;
        }

        const now = Date.now();
        if (!isDragging && !autoTransitionState.active && now - lastAutoRotateTime > autoHoldMs) {
            faceIndex = (faceIndex + 1) % autoFaceOrder.length;
            const nextFace = autoFaceOrder[faceIndex];
            startAutoTransition(nextFace);
        }

        if (!isDragging && autoTransitionState.active) {
            const elapsed = performance.now() - autoTransitionState.startedAt;
            const t = clamp(elapsed / autoTransitionMs, 0, 1);
            const easedT = smoothstep(t);

            cube.rotation.x = lerp(autoTransitionState.from.x, autoTransitionState.to.x, easedT);
            cube.rotation.y = lerpAngleShortest(autoTransitionState.from.y, autoTransitionState.to.y, easedT);
            cube.rotation.z = lerpAngleShortest(autoTransitionState.from.z, autoTransitionState.to.z, easedT);

            targetRotationX = cube.rotation.x;
            targetRotationY = cube.rotation.y;
            targetRotationZ = cube.rotation.z;

            if (t >= 1) {
                autoTransitionState.active = false;
                setTargetFace(autoTransitionState.face);
                revealCursorOrbAfterFaceMotion();
                lastAutoRotateTime = now;
            }
        }

        if (dragTransitionState.active) {
            const elapsed = performance.now() - dragTransitionState.startedAt;
            const t = clamp(elapsed / dragTransitionState.durationMs, 0, 1);
            const easedT = smoothstep(t);

            cube.rotation.x = lerp(dragTransitionState.from.x, dragTransitionState.to.x, easedT);
            cube.rotation.y = lerpAngleShortest(dragTransitionState.from.y, dragTransitionState.to.y, easedT);
            cube.rotation.z = lerpAngleShortest(dragTransitionState.from.z, dragTransitionState.to.z, easedT);

            targetRotationX = cube.rotation.x;
            targetRotationY = cube.rotation.y;
            targetRotationZ = cube.rotation.z;

            if (t >= 1) {
                dragTransitionState.active = false;
                setTargetFace(dragTransitionState.face);
                revealCursorOrbAfterFaceMotion();
            }
        }

        // Smooth rotation transition
        const ease = isDragging ? 0.12 : 0.092;
        targetRotationX = clampXRotation(targetRotationX);
        let deltaX = targetRotationX - cube.rotation.x;
        let deltaY = normalizeAngle(targetRotationY - cube.rotation.y);
        let deltaZ = normalizeAngle(targetRotationZ - cube.rotation.z);

        if ((!autoTransitionState.active && !dragTransitionState.active) || isDragging) {
            cube.rotation.x += deltaX * ease;
            cube.rotation.y += deltaY * ease;
            cube.rotation.z += deltaZ * ease;
        }

        applyCubeFramingForRotation();

        if (innerCellLights && innerCellLights.length) {
            const t = frameNow * 0.001;
            innerCellLights.forEach((zone) => {
                zone.light.intensity = zone.base + (Math.sin((t * 1.36) + zone.phase) * zone.pulse);
            });
        }

        if (innerBeamLayers && innerBeamLayers.length) {
            const t = frameNow * 0.001;
            innerBeamLayers.forEach((beamLayer) => {
                if (!beamLayer || !beamLayer.mesh || !beamLayer.mesh.material) return;
                beamLayer.mesh.material.opacity = beamLayer.baseOpacity + (Math.sin((t * beamLayer.speed) + beamLayer.phase) * beamLayer.pulse);
            });
        }

        if (coreGlowSprites && coreGlowSprites.length) {
            const t = frameNow * 0.001;
            coreGlowSprites.forEach((item) => {
                if (!item || !item.sprite || !item.sprite.material) return;
                item.sprite.material.opacity = item.baseOpacity + (Math.sin((t * item.speed) + item.phase) * item.pulse);
            });
            centerCoreLight.intensity = 0.98 + (Math.sin((t * 1.2) + 0.4) * 0.11);
            centerCoreBlueLight.intensity = 0.66 + (Math.sin((t * 0.96) + 1.1) * 0.08);
        }

        if (dividerBeams && dividerBeams.length) {
            const t = frameNow * 0.001;
            dividerBeams.forEach((beamLayer) => {
                if (!beamLayer || !beamLayer.mesh || !beamLayer.mesh.material) return;
                beamLayer.mesh.material.opacity = beamLayer.baseOpacity + (Math.sin((t * beamLayer.speed) + beamLayer.phase) * beamLayer.pulse);
            });

            dividerBillboardGroup.position.copy(cube.position);
            dividerBillboardGroup.quaternion.copy(camera.quaternion);
            dividerBillboardGroup.scale.setScalar(cube.scale.x);
        }

        edgeGlowLines.material.opacity = 0.03 + (Math.sin(frameNow * 0.0014) * 0.01);
        edgeWarmLines.material.opacity = 0.026 + (Math.sin((frameNow * 0.0011) + 1.2) * 0.012);

        renderer.render(scene, camera);
        if (cubeInView && pageVisible) {
            cubeRaf = requestAnimationFrame(animate);
        }
    };

    const startCubeLoop = () => {
        if (cubeRaf || !cubeInView || !pageVisible) return;
        cubeRaf = requestAnimationFrame(animate);
    };

    const stopCubeLoop = () => {
        if (!cubeRaf) return;
        cancelAnimationFrame(cubeRaf);
        cubeRaf = null;
    };

    const syncCubeLoop = () => {
        if (cubeInView && pageVisible) {
            startCubeLoop();
            return;
        }
        stopCubeLoop();
    };

    const refreshCubeInViewState = () => {
        if (!sectionEl) {
            cubeInView = true;
            return;
        }
        const rect = sectionEl.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
        if (!viewportH || !rect.height) {
            cubeInView = true;
            return;
        }
        const visibleTop = Math.max(rect.top, 0);
        const visibleBottom = Math.min(rect.bottom, viewportH);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const ratio = visibleHeight / rect.height;
        cubeInView = ratio > 0.05;
    };

    const handlePageVisibilityChange = () => {
        pageVisible = document.visibilityState !== 'hidden';
        managedFaceVideos.forEach(({ video, tryPlay }) => {
            if (!video) return;
            if (pageVisible) {
                if (typeof tryPlay === 'function') {
                    tryPlay();
                }
                return;
            }
            video.pause();
        });
        if (pageVisible) {
            resizeCanvas();
            refreshCubeInViewState();
        }
        syncCubeLoop();
    };

    const handlePageShow = () => {
        pageVisible = true;
        if (isDragging) {
            handleCubeDragEnd();
        }
        resizeCanvas();
        refreshCubeInViewState();
        syncCubeLoop();
    };

    const handleWindowFocus = () => {
        pageVisible = true;
        if (isDragging) {
            handleCubeDragEnd();
        }
        resizeCanvas();
        refreshCubeInViewState();
        syncCubeLoop();
    };

    // Headline typing reveal
    const $headline = $section.find('.headline').first();
    const $headlineTyping = $headline.find('.typing');
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const typingSpeed = 90;
    const typingDelay = 240;
    let headlineStarted = false;
    const headlineTimers = [];

    const pushHeadlineTimer = (callback, delay) => {
        const timerId = window.setTimeout(callback, delay);
        headlineTimers.push(timerId);
        return timerId;
    };

    const clearHeadlineTimers = () => {
        while (headlineTimers.length) {
            window.clearTimeout(headlineTimers.pop());
        }
    };

    const escapeHeadlineChar = (char) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return map[char] || char;
    };

    const getHeadlineSolidIndexes = ($node) => {
        const rawIndexes = (($node.attr('data-solid-indexes') || '') + '').trim();
        if (!rawIndexes) return new Set();
        const parsed = rawIndexes
            .split(',')
            .map((value) => Number.parseInt(value.trim(), 10))
            .filter((value) => Number.isInteger(value) && value >= 0);
        return new Set(parsed);
    };

    const renderHeadlineTypedText = ($node, sourceText, visibleCount) => {
        const safeText = (sourceText || '') + '';
        const maxChars = Math.max(0, Math.min(Number(visibleCount) || 0, safeText.length));
        const solidIndexes = getHeadlineSolidIndexes($node);
        let html = '';

        for (let index = 0; index < maxChars; index += 1) {
            const className = solidIndexes.has(index) ? 'char char-solid' : 'char char-outline';
            html += `<span class="${className}">${escapeHeadlineChar(safeText.charAt(index))}</span>`;
        }

        $node.html(html);
    };

    const fillHeadlineImmediately = () => {
        $headlineTyping.each((_, node) => {
            const $node = $(node);
            const rawText = (($node.attr('dataword') || $node.text() || '') + '').replace(/\r/g, '');
            if (!$node.attr('dataword') && rawText) {
                $node.attr('dataword', rawText);
            }
            const fullText = $node.attr('dataword') || '';
            renderHeadlineTypedText($node, fullText, fullText.length);
            $node.closest('.line').removeClass('is-typing');
        });
    };

    const startHeadlineTyping = () => {
        if (headlineStarted) return;
        headlineStarted = true;

        clearHeadlineTimers();
        if (!$headlineTyping.length) return;

        if (reduced) {
            fillHeadlineImmediately();
            return;
        }

        $headlineTyping.each((_, node) => {
            const $node = $(node);
            const rawText = (($node.attr('dataword') || $node.text() || '') + '').replace(/\r/g, '');
            if (!$node.attr('dataword') && rawText) {
                $node.attr('dataword', rawText);
            }
            $node.empty();
            $node.closest('.line').removeClass('is-typing');
        });

        const typeNode = ($node, onDone) => {
            const targetWord = (($node.attr('dataword') || '') + '').replace(/\r/g, '');
            const $line = $node.closest('.line');
            if (!targetWord) {
                $line.removeClass('is-typing');
                if (typeof onDone === 'function') onDone();
                return;
            }

            let index = 0;
            $line.addClass('is-typing');

            const tick = () => {
                index += 1;
                renderHeadlineTypedText($node, targetWord, index);

                if (index >= targetWord.length) {
                    $line.removeClass('is-typing');
                    if (typeof onDone === 'function') onDone();
                    return;
                }

                pushHeadlineTimer(tick, typingSpeed);
            };

            pushHeadlineTimer(tick, typingSpeed);
        };

        pushHeadlineTimer(() => {
            const typingNodes = $headlineTyping.toArray().map((node) => $(node));
            const typeSequentially = (nodeIndex) => {
                if (nodeIndex >= typingNodes.length) return;
                typeNode(typingNodes[nodeIndex], () => {
                    typeSequentially(nodeIndex + 1);
                });
            };
            typeSequentially(0);
        }, typingDelay);
    };

    // Initialize
    resizeCanvas();
    const triggerRevealIfVisible = () => {
        if (!sectionEl || cubeRevealState.played) return;
        const rect = sectionEl.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
        if (!viewportH) return;
        const isVisible = rect.top < viewportH * 0.82 && rect.bottom > viewportH * 0.18;
        if (isVisible) {
            playCubeRevealOnce();
        }
    };

    if (typeof window.ScrollTrigger !== 'undefined' && sectionEl) {
        if (typeof window.gsap !== 'undefined' && typeof window.gsap.registerPlugin === 'function') {
            window.gsap.registerPlugin(window.ScrollTrigger);
        }
        window.ScrollTrigger.create({
            trigger: sectionEl,
            start: 'top 78%',
            once: true,
            onEnter: playCubeRevealOnce
        });
    } else if ('IntersectionObserver' in window && sectionEl && !cubeRevealState.played) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            const entry = entries && entries[0];
            if (!entry || !entry.isIntersecting || entry.intersectionRatio < 0.2) return;
            playCubeRevealOnce();
            observer.disconnect();
        }, {
            threshold: [0.2, 0.45, 0.7]
        });
        revealObserver.observe(sectionEl);
    }
    if ('IntersectionObserver' in window && sectionEl) {
        const inViewThreshold = 0.08;
        cubeObserver = new IntersectionObserver((entries) => {
            const entry = entries && entries[0];
            cubeInView = !!entry && entry.isIntersecting && entry.intersectionRatio > inViewThreshold;
            syncCubeLoop();
        }, {
            threshold: [0, inViewThreshold, 0.3, 0.6, 1]
        });
        cubeObserver.observe(sectionEl);
    }
    requestAnimationFrame(triggerRevealIfVisible);
    window.setTimeout(triggerRevealIfVisible, 140);
    document.addEventListener('visibilitychange', handlePageVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleWindowFocus);
    syncCubeLoop();

    const onIntroOff = () => {
        startHeadlineTyping();
    };

    const hasIntroSection = $('.cont1').length > 0;
    if (!hasIntroSection || $('body').hasClass('introoff')) {
        startHeadlineTyping();
    } else {
        document.addEventListener('ubique:introoff', onIntroOff, { once: true });
    }

    let cubeResizeObserver = null;
    if (typeof ResizeObserver === 'function' && cubeViewportEl) {
        cubeResizeObserver = new ResizeObserver(() => {
            queueResizeCanvas();
        });
        cubeResizeObserver.observe(cubeViewportEl);
        if (sectionEl && sectionEl !== cubeViewportEl) {
            cubeResizeObserver.observe(sectionEl);
        }
    }

    const onWindowResize = () => {
        queueResizeCanvas();
        window.setTimeout(queueResizeCanvas, 90);
        window.setTimeout(queueResizeCanvas, 220);
    };

    const onSectionTransitionEnd = () => {
        queueResizeCanvas();
    };

    window.addEventListener('resize', onWindowResize, { passive: true });
    window.addEventListener('orientationchange', onWindowResize, { passive: true });
    if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
        window.visualViewport.addEventListener('resize', onWindowResize, { passive: true });
    }
    if (sectionEl) {
        sectionEl.addEventListener('transitionend', onSectionTransitionEnd);
    }

    $(window).on('resize.maincont2', queueResizeCanvas);
    $(window).on('beforeunload.maincont2', function () {
        if (isDragging) {
            handleCubeDragEnd();
        }
        if (cubeRevealState.tween) {
            cubeRevealState.tween.kill();
            cubeRevealState.tween = null;
        }
        setCursorOrbVisible(false);
        managedFaceVideos.forEach(({ video }) => {
            if (video) {
                video.pause();
            }
        });
        if (cubeResizeObserver) {
            cubeResizeObserver.disconnect();
            cubeResizeObserver = null;
        }
        window.removeEventListener('resize', onWindowResize);
        window.removeEventListener('orientationchange', onWindowResize);
        if (window.visualViewport && typeof window.visualViewport.removeEventListener === 'function') {
            window.visualViewport.removeEventListener('resize', onWindowResize);
        }
        if (sectionEl) {
            sectionEl.removeEventListener('transitionend', onSectionTransitionEnd);
        }
        stopCubeLoop();
    });
});

/* Section 3 - Card Entrance Motion */
$(function () {
    const $section = $('.cont3');
    if (!$section.length) return;

    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

    window.gsap.registerPlugin(window.ScrollTrigger);

    const $cards = $section.find('.card');
    if (!$cards.length) return;

    const cards = $cards.toArray();
    const $head = $section.find('.head');

    if ($head.length) {
        window.gsap.set($head, { autoAlpha: 0, y: 20 });
    }

    window.gsap.set(cards, { autoAlpha: 0, y: 0, force3D: true });
    cards.forEach((card) => {
        const side = card.getAttribute('data-side');
        window.gsap.set(card, {
            x: side === 'right' ? 240 : -240,
            y: side === 'right' ? -10 : 10,
            skewX: side === 'right' ? -8 : 8,
            rotationZ: side === 'right' ? 4 : -4,
            force3D: true
        });
    });

    const first = cards.slice(0, 2);
    const second = cards.slice(2, 4);

    const timeline = window.gsap.timeline({
        scrollTrigger: {
            trigger: $section.get(0),
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        }
    });

    if ($head.length) {
        timeline.to($head, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0);
    }

    if (first.length) {
        timeline.to(first, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            skewX: 0,
            rotationZ: 0,
            force3D: true,
            duration: 1.6,
            ease: 'power3.out',
            stagger: 0.18
        }, 0.12);
    }

    if (second.length) {
        timeline.to(second, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            skewX: 0,
            rotationZ: 0,
            force3D: true,
            duration: 1.6,
            ease: 'power3.out',
            stagger: 0.18
        }, 0.55);
    }
});

/* Section 3 - Card Hover Push Interaction */
$(function () {
    const $section = $('.cont3');
    if (!$section.length) return;

    const $cards = $section.find('.card');
    const $deck = $section.find('.cards');
    const $follow = $section.find('.follow');
    if (!$cards.length || !$deck.length || !$follow.length) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp01 = (value) => Math.min(1, Math.max(0, value));
    const followEl = $follow.get(0);
    const deckEl = $deck.get(0);

    const updateTilt = (card, x, y) => {
        const viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
        const tiltMaxX = viewportW <= 480 ? 7 : (viewportW <= 768 ? 9 : (viewportW <= 1024 ? 11 : 14));
        const tiltMaxY = viewportW <= 480 ? 10 : (viewportW <= 768 ? 12 : (viewportW <= 1024 ? 14 : 18));
        const push = viewportW <= 480 ? 8 : (viewportW <= 768 ? 10 : (viewportW <= 1024 ? 14 : 24));
        const rx = (0.5 - y) * tiltMaxX;
        const ry = (x - 0.5) * tiltMaxY;
        const dx = (x - 0.5) * 2;
        const dy = (y - 0.5) * 2;
        const px = -dx * push;
        const py = -dy * push;

        card.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        card.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        card.style.setProperty('--px', `${px.toFixed(1)}`);
        card.style.setProperty('--py', `${py.toFixed(1)}`);
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    };

    const scheduleTilt = (card, x, y) => {
        card.__tiltX = x;
        card.__tiltY = y;
        if (card.__tiltRaf) return;
        card.__tiltRaf = window.requestAnimationFrame(() => {
            card.__tiltRaf = null;
            updateTilt(card, card.__tiltX, card.__tiltY);
        });
    };

    if (!prefersReduced) {
        $cards.on('pointerenter', function (event) {
            const rect = this.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = clamp01((event.clientX - rect.left) / rect.width);
            const y = clamp01((event.clientY - rect.top) / rect.height);
            this.style.setProperty('--lift', '1.3');
            scheduleTilt(this, x, y);
        });

        $cards.on('pointermove', function (event) {
            const rect = this.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = clamp01((event.clientX - rect.left) / rect.width);
            const y = clamp01((event.clientY - rect.top) / rect.height);
            this.style.setProperty('--lift', '1.3');
            scheduleTilt(this, x, y);
        });

        $cards.on('pointerleave', function () {
            if (this.__tiltRaf) {
                window.cancelAnimationFrame(this.__tiltRaf);
                this.__tiltRaf = null;
            }
            this.style.setProperty('--rx', '0deg');
            this.style.setProperty('--ry', '0deg');
            this.style.setProperty('--mx', '50%');
            this.style.setProperty('--my', '50%');
            this.style.setProperty('--px', '0');
            this.style.setProperty('--py', '0');
            this.style.setProperty('--lift', '0');
        });
    }

    $cards.on('pointerenter', function () {
        $follow.addClass('on');
    });

    $cards.on('pointerleave', function () {
        $follow.removeClass('on');
    });

    let deckRaf = null;
    let deckPointer = null;

    const flushDeckPointer = () => {
        deckRaf = null;
        if (!deckEl || !deckPointer) return;

        const rect = deckEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = deckPointer.x - rect.left;
        const y = deckPointer.y - rect.top;

        if (followEl) {
            followEl.style.left = `${x}px`;
            followEl.style.top = `${y}px`;
        }

        if (!prefersReduced) {
            const nx = clamp01(x / rect.width);
            const ny = clamp01(y / rect.height);
            const dx = (nx - 0.5) * 2;
            const dy = (ny - 0.5) * 2;
            const viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
            const groupPush = viewportW <= 768 ? 8 : (viewportW <= 1024 ? 12 : 18);
            const gx = -dx * groupPush;
            const gy = -dy * (groupPush * 0.6);
            deckEl.style.setProperty('--gx', gx.toFixed(1));
            deckEl.style.setProperty('--gy', gy.toFixed(1));
        }
    };

    $deck.on('pointermove', function (event) {
        deckPointer = { x: event.clientX, y: event.clientY };
        if (deckRaf) return;
        deckRaf = window.requestAnimationFrame(flushDeckPointer);
    });

    $deck.on('pointerleave', function () {
        if (deckRaf) {
            window.cancelAnimationFrame(deckRaf);
            deckRaf = null;
        }
        deckPointer = null;
        $follow.removeClass('on');
        this.style.setProperty('--gx', '0');
        this.style.setProperty('--gy', '0');
    });
});

/* Section 4 - Interactive Shot Gallery with Stage Motion */
$(function () {
    const $section = $('.cont4');
    if (!$section.length) return;

    const $items = $section.find('.menu .item');
    let $shots = $();
    const $name = $section.find('.name');
    const $stage = $section.find('.stage');
    const $more = $section.find('.more').first();
    if (!$items.length || !$stage.length) return;

    const portfolioHref = '/portfolio/';
    if ($more.length) {
        $more.on('click', function () {
            window.location.href = portfolioHref;
        });
    }

    const stageEl = $stage.get(0);
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const autoDelay = 3400;
    const hoverDelay = 260;
    let rightStageVisible = prefersReduced;
    let autoTimer = null;
    let hoverTimer = null;
    let shotHoverTimer = null;
    let currentGroup = null;

    const stageState = {
        tx: 0.5,
        ty: 0.5,
        cx: 0.5,
        cy: 0.5,
        raf: null
    };
    const groupKeys = $items.map(function () {
        return ($(this).data('key') || '').toString().trim();
    }).get().filter(Boolean);
    const stagePresets = [
        { x: 18, y: 26, r: -8, s: 0.92 },
        { x: 78, y: 22, r: 6, s: 0.9 },
        { x: 86, y: 64, r: -4, s: 0.86 },
        { x: 58, y: 82, r: 8, s: 0.88 },
        { x: 30, y: 70, r: -12, s: 0.9 },
        { x: 12, y: 60, r: 6, s: 0.86 },
        { x: 92, y: 44, r: -8, s: 0.84 }
    ];

    const clamp01 = (value) => Math.max(0, Math.min(1, value));

    const buildPresetStyle = (preset) => {
        return `--x: ${preset.x}%; --y: ${preset.y}%; --r: ${preset.r}deg; --s: ${preset.s};`;
    };
    const normalizeInnerKey = (value) => {
        const key = ((value || '') + '').trim();
        return key || 'all';
    };
    const buildPortfolioCategoryUrl = (cate) => {
        const safeCate = ((cate || '') + '').trim().toLowerCase() || 'all';
        if (safeCate === 'all') return '/portfolio/';
        return `/portfolio/${encodeURIComponent(safeCate)}`;
    };
    const buildPortfolioDetailUrl = (cate, inner, projectKey) => {
        const safeCate = ((cate || '') + '').trim().toLowerCase() || 'all';
        const safeInner = normalizeInnerKey(inner);
        const safeKey = ((projectKey || '') + '').trim();
        if (!safeKey || safeCate === 'all') {
            return buildPortfolioCategoryUrl(safeCate);
        }
        return `/portfolio/${encodeURIComponent(safeCate)}/${encodeURIComponent(safeInner)}/${encodeURIComponent(safeKey)}`;
    };

    const normalizeShotTitle = (item, fallback) => {
        const raw = (item && (item.title || item.client || item.type || item.sub || item.main)) || '';
        return (raw || fallback || '').toString().trim() || '제목 없음';
    };

    const normalizeShotImage = (item) => {
        const src = (item && (item.thumbnail || item.thumbImage || item.image || item.coverImage)) || '';
        const value = (src || '').toString().trim();
        return value;
    };

    const refreshShots = () => {
        $shots = $stage.find('.shot');
        $shots.each(function () {
            const $shot = $(this);
            if ($shot.find('.inner-caption').length) return;
            const title = ($shot.data('name') || '').toString();
            $('<span class="inner-caption" aria-hidden="true"></span>').text(title).appendTo($shot);
        });

        $shots.each(function () {
            const $shot = $(this);
            if ($shot.find('.viewtip').length) return;
            $('<span class="viewtip" aria-hidden="true">VIEW</span>').appendTo($shot);
        });

        $shots.each(function () {
            const $shot = $(this);
            const $tip = $shot.find('.viewtip').first();
            if (!$tip.length) return;
            $tip.css({ left: '50%', top: '50%' });
        });
    };

    const placeShotTip = ($shot, clientX, clientY) => {
        if (!$shot || !$shot.length) return;
        if (typeof clientX !== 'number' || typeof clientY !== 'number') return;
        const node = $shot.get(0);
        if (!node) return;
        const $tip = $shot.find('.viewtip').first();
        if (!$tip.length) return;
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        $tip.css({ left: `${x}px`, top: `${y}px` });
    };

    const buildFallbackItems = () => {
        return groupKeys.reduce((acc, key) => {
            const label = $items.filter(`[data-key="${key}"]`).first().find('.txt').text().trim() || key.toUpperCase();
            acc[key] = [{
                title: label
            }];
            return acc;
        }, {});
    };

    const renderStageShots = (groupedItems) => {
        $stage.empty();

        groupKeys.forEach((key) => {
            const label = $items.filter(`[data-key="${key}"]`).first().find('.txt').text().trim() || key.toUpperCase();
            const source = Array.isArray(groupedItems[key]) ? groupedItems[key] : [];
            const items = source.length ? source.slice(0, stagePresets.length) : [{
                title: label
            }];

            items.forEach((item, index) => {
                const preset = stagePresets[index] || stagePresets[0];
                const title = normalizeShotTitle(item, label);
                const src = normalizeShotImage(item);
                const $shot = $('<div class="shot"></div>');
                $shot.attr('data-group', key);
                $shot.attr('data-name', title);
                $shot.attr('data-project-key', ((item && item.key) || '').toString().trim());
                $shot.attr('data-inner', normalizeInnerKey(item && item.inner));
                if (index === 0) {
                    $shot.attr('data-main', '1');
                }
                $shot.attr('style', buildPresetStyle(preset));

                if (src) {
                    $('<img>')
                        .attr('src', src)
                        .attr('alt', `${title} preview`)
                        .appendTo($shot);
                } else {
                    $shot.addClass('no-image');
                    $('<span class="thumb-text" aria-hidden="true"></span>').text(title).appendTo($shot);
                }

                $stage.append($shot);
            });
        });

        refreshShots();
    };

    const loadStageShots = async () => {
        const fallbackItems = buildFallbackItems();
        try {
            const response = await fetch('/api/portfolio.php?action=list&per_page=200', {
                method: 'GET',
                cache: 'no-store',
                credentials: 'same-origin'
            });
            if (!response.ok) {
                renderStageShots(fallbackItems);
                return;
            }

            const payload = await response.json();
            const list = payload && payload.success === true && Array.isArray(payload.items)
                ? payload.items
                : [];

            if (!list.length) {
                renderStageShots(fallbackItems);
                return;
            }

            const grouped = groupKeys.reduce((acc, key) => {
                acc[key] = [];
                return acc;
            }, {});

            list.forEach((item) => {
                const key = ((item && item.cate) || '').toString().trim().toLowerCase();
                if (!grouped[key]) return;
                grouped[key].push(item);
            });

            groupKeys.forEach((key) => {
                if (!grouped[key].length) {
                    grouped[key] = fallbackItems[key] || [];
                }
            });

            renderStageShots(grouped);
        } catch (error) {
            console.warn('[main] failed to load section4 projects', error);
            renderStageShots(fallbackItems);
        }
    };

    const getGroupShots = (key) => $shots.filter(function () {
        const $shot = $(this);
        const group = $shot.data('group');
        const fallback = $shot.data('key');
        return group === key || fallback === key;
    });

    const updateName = ($shot) => {
        const title = $shot.data('name');
        if (title && $name.length) {
            $name.text(title);
        }
    };

    const syncActiveOpacity = ($collection, $active) => {
        $shots.each(function () {
            this.style.opacity = '0';
            this.style.visibility = 'hidden';
        });

        if (!$collection || !$collection.length) return;
        const activeNode = $active && $active.length ? $active.get(0) : null;
        $collection.each(function () {
            this.style.opacity = this === activeNode ? '1' : '0.22';
            this.style.visibility = 'visible';
        });
    };

    const resetShotOffsets = ($collection) => {
        const $target = $collection && $collection.length ? $collection : $shots;
        $target.each(function () {
            this.style.setProperty('--px', '0px');
            this.style.setProperty('--py', '0px');
        });
    };

    const syncStageMotion = () => {
        if (!stageEl) return;
        const px = (stageState.cx - 0.5) * 2;
        const py = (stageState.cy - 0.5) * 2;

        stageEl.style.setProperty('--mx', `${(stageState.cx * 100).toFixed(2)}%`);
        stageEl.style.setProperty('--my', `${(stageState.cy * 100).toFixed(2)}%`);
        stageEl.style.setProperty('--stage-tilt-x', `${(-py * 2.4).toFixed(2)}deg`);
        stageEl.style.setProperty('--stage-tilt-y', `${(px * 3.2).toFixed(2)}deg`);

        const $visibleShots = $shots.filter('.show');
        $visibleShots.each(function (index) {
            const isMain = this.classList.contains('on');
            const depth = isMain ? 3.2 : 8.4 + (index * 1.1);
            const ox = px * depth;
            const oy = py * depth * 0.78;
            this.style.setProperty('--px', `${ox.toFixed(2)}px`);
            this.style.setProperty('--py', `${oy.toFixed(2)}px`);
        });
    };

    const stepStageMotion = () => {
        stageState.cx += (stageState.tx - stageState.cx) * 0.12;
        stageState.cy += (stageState.ty - stageState.cy) * 0.12;
        syncStageMotion();

        const distance = Math.abs(stageState.tx - stageState.cx) + Math.abs(stageState.ty - stageState.cy);
        if (distance > 0.0015) {
            stageState.raf = window.requestAnimationFrame(stepStageMotion);
            return;
        }

        stageState.cx = stageState.tx;
        stageState.cy = stageState.ty;
        syncStageMotion();
        stageState.raf = null;
    };

    const queueStageMotion = () => {
        if (prefersReduced || !stageEl || stageState.raf) return;
        stageState.raf = window.requestAnimationFrame(stepStageMotion);
    };

    const resetStageMotion = () => {
        stageState.tx = 0.5;
        stageState.ty = 0.5;
        stageState.cx = 0.5;
        stageState.cy = 0.5;

        if (!stageEl) return;
        stageEl.style.setProperty('--mx', '50%');
        stageEl.style.setProperty('--my', '50%');
        stageEl.style.setProperty('--stage-tilt-x', '0deg');
        stageEl.style.setProperty('--stage-tilt-y', '0deg');
        resetShotOffsets();
    };

    const stopAuto = () => {
        if (!autoTimer) return;
        clearInterval(autoTimer);
        autoTimer = null;
    };

    const startAuto = () => {
        if (prefersReduced) return;
        stopAuto();
        autoTimer = setInterval(() => {
            if (!currentGroup) return;
            const $groupShots = getGroupShots(currentGroup);
            if (!$groupShots.length) return;
            const $current = $groupShots.filter('.on');
            let index = $groupShots.index($current);
            if (index < 0) {
                index = 0;
            } else {
                index = (index + 1) % $groupShots.length;
            }
            const $next = $groupShots.eq(index);
            $groupShots.removeClass('on');
            $next.addClass('on');
            updateName($next);
            syncActiveOpacity($groupShots, $next);
        }, autoDelay);
    };

    const revealRightBubble = () => {
        rightStageVisible = true;
        if (prefersReduced || typeof window.gsap === 'undefined') return;
        const $visible = $shots.filter('.show');
        if (!$visible.length) return;

        const nodes = $visible.toArray();
        const activeNode = $visible.filter('.on').get(0) || null;
        window.gsap.killTweensOf(nodes);
        window.gsap.fromTo(nodes,
            {
                autoAlpha: 0,
                x: () => window.gsap.utils.random(-94, 94),
                y: () => window.gsap.utils.random(28, 116),
                scale: () => window.gsap.utils.random(0.68, 0.9),
                rotate: () => window.gsap.utils.random(-12, 12)
            },
            {
                autoAlpha: (index, node) => (node === activeNode ? 1 : 0.22),
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
                duration: 0.68,
                ease: 'back.out(1.54)',
                stagger: {
                    each: 0.11,
                    from: 'random'
                },
                overwrite: 'auto'
            }
        );
    };

    const hideRightBubble = (direction = 'bottom') => {
        rightStageVisible = false;
        if (prefersReduced || typeof window.gsap === 'undefined') return;
        const $visible = $shots.filter('.show');
        if (!$visible.length) return;

        const isBottom = direction !== 'top';
        const nodes = $visible.toArray();
        window.gsap.killTweensOf(nodes);
        window.gsap.to(nodes, {
            autoAlpha: 0,
            y: isBottom ? -20 : 18,
            scale: isBottom ? 0.76 : 0.84,
            rotate: () => window.gsap.utils.random(-6, 6),
            duration: isBottom ? 0.36 : 0.28,
            ease: isBottom ? 'back.in(1.12)' : 'power2.in',
            stagger: {
                each: isBottom ? 0.1 : 0.06,
                from: 'end'
            },
            overwrite: 'auto'
        });
    };

    const setGroup = (key, options = {}) => {
        if (!key) return;
        const { immediate = false } = options;
        const $item = $items.filter(`[data-key="${key}"]`).first();
        const $groupShots = getGroupShots(key);
        if (!$item.length || !$groupShots.length) return;

        if (typeof gsap !== 'undefined' && $shots.length) {
            gsap.killTweensOf($shots.toArray());
        }

        currentGroup = key;
        $items.removeClass('on');
        $item.addClass('on');

        $shots.removeClass('show on');
        resetShotOffsets();
        $groupShots.addClass('show');

        const $main = $groupShots.filter('[data-main="1"]').first();
        const $target = $main.length ? $main : $groupShots.first();
        $target.addClass('on');
        updateName($target);
        syncActiveOpacity($groupShots, $target);

        if (!prefersReduced && !immediate && typeof gsap !== 'undefined' && rightStageVisible) {
            const groupNodes = $groupShots.toArray();
            gsap.killTweensOf(groupNodes);
            const targetNode = $target.get(0);

            gsap.fromTo(groupNodes,
                {
                    autoAlpha: 0,
                    x: () => gsap.utils.random(-120, 120),
                    y: () => gsap.utils.random(48, 132),
                    scale: () => gsap.utils.random(0.64, 0.88),
                    rotate: () => gsap.utils.random(-14, 14)
                },
                {
                    autoAlpha: (index, node) => (node === targetNode ? 1 : 0.22),
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotate: 0,
                    duration: 0.72,
                    ease: 'back.out(1.62)',
                    stagger: {
                        each: 0.12,
                        from: 'random'
                    }
                }
            );
        }

        startAuto();
        queueStageMotion();
    };

    const clearHover = () => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
    };

    const clearShotHover = () => {
        if (shotHoverTimer) {
            clearTimeout(shotHoverTimer);
            shotHoverTimer = null;
        }
    };

    const scheduleGroup = (key) => {
        clearHover();
        hoverTimer = setTimeout(() => {
            setGroup(key);
        }, hoverDelay);
    };

    const activateShot = ($shot) => {
        if (!$shot.length || !$shot.hasClass('show')) return;
        const key = $shot.data('group') || $shot.data('key');
        if (!key) return;

        currentGroup = key;
        $items.removeClass('on');
        $items.filter(`[data-key="${key}"]`).first().addClass('on');
        $shots.filter('.show').removeClass('on');
        $shot.addClass('on');
        updateName($shot);
        syncActiveOpacity($shots.filter('.show'), $shot);
        startAuto();
        queueStageMotion();
    };

    const initializeStage = async () => {
        await loadStageShots();

        const initialKey = $items.filter('.on').data('key') || $items.first().data('key');
        setGroup(initialKey, { immediate: true });

        if (!prefersReduced && typeof window.gsap !== 'undefined') {
            window.gsap.set($shots.toArray(), { autoAlpha: 0 });
        }

        if (!prefersReduced && typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
            window.ScrollTrigger.create({
                trigger: $section.get(0),
                start: 'top 78%',
                end: 'bottom 12%',
                onEnter: revealRightBubble,
                onEnterBack: revealRightBubble,
                onLeave: function () {
                    hideRightBubble('bottom');
                },
                onLeaveBack: function () {
                    hideRightBubble('top');
                }
            });
        } else {
            rightStageVisible = true;
            if (!prefersReduced && typeof window.gsap !== 'undefined') {
                revealRightBubble();
            }
        }

        if (prefersReduced) {
            resetStageMotion();
        } else {
            queueStageMotion();
        }
    };

    $items.on('mouseenter', function () {
        scheduleGroup($(this).data('key'));
    });

    $items.on('mouseleave', function () {
        clearHover();
    });

    $items.on('focus', function () {
        clearHover();
        setGroup($(this).data('key'));
    });

    $items.on('click', function () {
        const cate = ($(this).data('key') || '').toString().trim().toLowerCase();
        if (!cate) return;
        window.location.href = buildPortfolioCategoryUrl(cate);
    });

    $stage.on('mouseenter', '.shot', function (event) {
        const $shot = $(this);
        if (!$shot.hasClass('show')) return;
        const source = event.originalEvent || event;
        if (source && typeof source.clientX === 'number' && typeof source.clientY === 'number') {
            placeShotTip($shot, source.clientX, source.clientY);
        }
        clearShotHover();
        shotHoverTimer = setTimeout(() => {
            activateShot($shot);
        }, hoverDelay);
    });

    $stage.on('mousemove', '.shot', function (event) {
        const $shot = $(this);
        if (!$shot.hasClass('show')) return;
        const source = event.originalEvent || event;
        if (typeof source.clientX !== 'number' || typeof source.clientY !== 'number') return;
        placeShotTip($shot, source.clientX, source.clientY);
    });

    $stage.on('mouseleave', '.shot', function () {
        clearShotHover();
    });

    $stage.on('click', '.shot', function () {
        const $shot = $(this);
        if (!$shot.hasClass('show')) return;
        const wasActive = $shot.hasClass('on');
        clearShotHover();
        activateShot($shot);
        if (!wasActive) return;
        const cate = (($shot.data('group') || $shot.data('key') || '') + '').toString().trim().toLowerCase();
        const inner = (($shot.data('inner') || 'all') + '').toString().trim();
        const projectKey = (($shot.data('projectKey') || '') + '').toString().trim();
        window.location.href = buildPortfolioDetailUrl(cate, inner, projectKey);
    });

    initializeStage();

    $stage.on('pointermove', function (event) {
        if (prefersReduced || !stageEl) return;
        const source = event.originalEvent || event;
        if (typeof source.clientX !== 'number' || typeof source.clientY !== 'number') return;
        const rect = stageEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        stageState.tx = clamp01((source.clientX - rect.left) / rect.width);
        stageState.ty = clamp01((source.clientY - rect.top) / rect.height);
        queueStageMotion();
    });

    $stage.on('pointerleave', function () {
        if (prefersReduced) return;
        stageState.tx = 0.5;
        stageState.ty = 0.5;
        queueStageMotion();
    });

    $(window).on('blur.cont4', function () {
        clearHover();
        clearShotHover();
        if (prefersReduced) return;
        stageState.tx = 0.5;
        stageState.ty = 0.5;
        queueStageMotion();
    });

});

/* Section 5 - Office Location Cards */
$(function () {
    const section = document.querySelector('.cont5');
    if (!section) return;

    const cards = Array.from(section.querySelectorAll('.list .card'));
    const leftWing = section.querySelector('.wing.left img');
    const rightWing = section.querySelector('.wing.right img');
    const stage = section.querySelector('.stage');
    const list = section.querySelector('.list');
    const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!cards.length) return;

    if (list) {
        list.classList.toggle('is-three', cards.length === 3);
    }

    const defaultIndex = 0;
    const initialIndex = cards.findIndex((card) => card.classList.contains('on'));
    const activeIndex = initialIndex < 0 ? defaultIndex : initialIndex;

    const setActive = (nextIndex) => {
        const index = Math.max(0, Math.min(cards.length - 1, nextIndex));

        cards.forEach((card, cardIndex) => {
            card.classList.toggle('on', cardIndex === index);
        });
    };

    setActive(activeIndex);
    if (leftWing) leftWing.classList.add('is-on');
    if (rightWing) rightWing.classList.add('is-on');

    if (!prefersReducedMotion && cards.length && typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
        if (typeof window.gsap.registerPlugin === 'function') {
            window.gsap.registerPlugin(window.ScrollTrigger);
        }

        const revealCardsBubble = () => {
            window.gsap.fromTo(cards,
                {
                    autoAlpha: 0,
                    scale: 0.86,
                    y: 18
                },
                {
                    autoAlpha: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.62,
                    ease: 'back.out(1.5)',
                    stagger: {
                        each: 0.14,
                        from: 'random'
                    },
                    transformOrigin: '50% 50%',
                    overwrite: 'auto',
                    onComplete: function () {
                        window.gsap.set(cards, { clearProps: 'transform,opacity,visibility' });
                    }
                }
            );
        };

        const hideCardsTop = () => {
            window.gsap.to(cards, {
                autoAlpha: 0,
                scale: 0.88,
                y: 16,
                duration: 0.28,
                ease: 'power2.in',
                stagger: {
                    each: 0.06,
                    from: 'end'
                },
                transformOrigin: '50% 50%',
                overwrite: 'auto'
            });
        };

        const hideCardsBottomBubble = () => {
            window.gsap.to(cards, {
                autoAlpha: 0,
                scale: 0.76,
                y: -18,
                duration: 0.36,
                ease: 'back.in(1.15)',
                stagger: {
                    each: 0.1,
                    from: 'end'
                },
                transformOrigin: '50% 50%',
                overwrite: 'auto'
            });
        };

        window.gsap.set(cards, {
            autoAlpha: 0,
            scale: 0.86,
            y: 18,
            transformOrigin: '50% 50%'
        });

        window.ScrollTrigger.create({
            trigger: section,
            start: 'top 78%',
            end: 'bottom 12%',
            onEnter: revealCardsBubble,
            onEnterBack: revealCardsBubble,
            onLeave: hideCardsBottomBubble,
            onLeaveBack: hideCardsTop
        });
    }

    let wingTicking = false;
    let smoothScrollBound = false;
    let useGsapWingShift = false;

    const applyWingShift = (progress) => {
        const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
        const shift = (clamped * 260) - 130;
        section.style.setProperty('--wing-scroll', `${shift.toFixed(2)}px`);
    };

    const updateWingShift = () => {
        if (!leftWing && !rightWing) return;
        if (prefersReducedMotion) {
            section.style.setProperty('--wing-scroll', '0px');
            return;
        }

        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
        const travel = rect.height + viewportHeight;
        const progress = travel > 0 ? (viewportHeight - rect.top) / travel : 0;
        applyWingShift(progress);
    };

    const queueWingShift = () => {
        if (wingTicking) return;
        wingTicking = true;
        window.requestAnimationFrame(() => {
            wingTicking = false;
            updateWingShift();
        });
    };

    const bindSmoothScrollShift = () => {
        if (smoothScrollBound || useGsapWingShift) return;
        const engine = window.scrollInstance;
        if (!engine || typeof engine.on !== 'function') return;
        engine.on('scroll', queueWingShift);
        smoothScrollBound = true;
    };

    if (!prefersReducedMotion && typeof window.ScrollTrigger !== 'undefined' && typeof window.gsap !== 'undefined') {
        if (typeof window.gsap.registerPlugin === 'function') {
            window.gsap.registerPlugin(window.ScrollTrigger);
        }
        const wingProxy = { p: 0 };
        window.gsap.to(wingProxy, {
            p: 1,
            ease: 'none',
            onUpdate: function () {
                applyWingShift(wingProxy.p);
            },
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8
            }
        });
        useGsapWingShift = true;
    }

    if (!useGsapWingShift) {
        bindSmoothScrollShift();
        $(document).on('scrollengine:ready.cont5-wing-shift', bindSmoothScrollShift);
        window.addEventListener('scroll', queueWingShift, { passive: true });
        window.addEventListener('resize', queueWingShift);
        queueWingShift();
    } else {
        applyWingShift(0);
    }

    let mapTip = null;
    if (canHover && stage) {
        mapTip = document.createElement('span');
        mapTip.className = 'maptip';
        mapTip.textContent = 'VIEW';
        stage.appendChild(mapTip);
    }

    const placeTip = (clientX, clientY) => {
        if (!mapTip || !stage) return;
        const rect = stage.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        mapTip.style.setProperty('--mx', `${x}px`);
        mapTip.style.setProperty('--my', `${y}px`);
    };

    const showTipAtCard = (card) => {
        if (!mapTip || !stage) return;
        const rect = card.getBoundingClientRect();
        placeTip(rect.left + (rect.width * 0.5), rect.top + (rect.height * 0.5));
        mapTip.classList.add('on');
    };

    const hideTip = () => {
        if (!mapTip) return;
        mapTip.classList.remove('on');
    };

    cards.forEach((card, index) => {
        const activate = () => setActive(index);

        card.addEventListener('mouseenter', (event) => {
            activate();
            if (!canHover) return;
            placeTip(event.clientX, event.clientY);
            if (mapTip) mapTip.classList.add('on');
        });

        card.addEventListener('mousemove', (event) => {
            if (!canHover) return;
            placeTip(event.clientX, event.clientY);
        });

        card.addEventListener('focus', () => {
            activate();
            showTipAtCard(card);
        });

        card.addEventListener('blur', hideTip);
        card.addEventListener('mouseleave', hideTip);

        const openMap = () => {
            const mapUrl = card.dataset.map;
            if (!mapUrl) return;
            window.open(mapUrl, '_blank', 'noopener');
        };

        card.addEventListener('click', () => {
            activate();
            openMap();
        });

        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            activate();
            openMap();
        });
    });

    if (list) {
        list.addEventListener('mouseleave', () => {
            hideTip();
        });
    }

    section.addEventListener('focusout', (event) => {
        const nextTarget = event.relatedTarget;
        if (nextTarget && section.contains(nextTarget)) return;
        hideTip();
    });
});
/* Section 6 - Contact Form with Validation and Submission */
$(function () {
    const $section = $('.cont6');
    if (!$section.length) return;

    const $title = $section.find('.title').first();
    const $topTyping = $title.find('.line.top .typing').first();
    const $bottomTyping = $title.find('.line.bottom .typing').first();
    const prefersReducedTitle = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const playSectionReveal = () => {
        if ($section.data('revealed') === 1) return;
        $section.addClass('is-reveal').data('revealed', 1);
    };

    const playTitleTyping = () => {
        if (!$title.length || !$topTyping.length || !$bottomTyping.length) return;
        if ($title.data('typed') === 1) return;

        const topWord = (($topTyping.attr('dataword') || 'Let’s Build') + '').trim() || 'Let’s Build';
        const bottomWord = (($bottomTyping.attr('dataword') || 'the Future') + '').trim() || 'the Future';

        if (prefersReducedTitle) {
            $topTyping.text(topWord);
            $bottomTyping.text(bottomWord);
            $title.addClass('is-ready').data('typed', 1);
            return;
        }

        $topTyping.text('');
        $bottomTyping.text('');
        $title.removeClass('is-ready');
        $title.data('typed', 1);

        let topIndex = 0;
        let bottomIndex = 0;
        const typingSpeed = 88;
        const secondLineDelay = 140;

        const typeBottom = () => {
            bottomIndex += 1;
            $bottomTyping.text(bottomWord.slice(0, bottomIndex));
            if (bottomIndex >= bottomWord.length) {
                $title.addClass('is-ready');
                return;
            }
            window.setTimeout(typeBottom, typingSpeed);
        };

        const typeTop = () => {
            topIndex += 1;
            $topTyping.text(topWord.slice(0, topIndex));
            if (topIndex >= topWord.length) {
                window.setTimeout(typeBottom, secondLineDelay);
                return;
            }
            window.setTimeout(typeTop, typingSpeed);
        };

        window.setTimeout(typeTop, 120);
    };

    if (typeof window.IntersectionObserver === 'function') {
        const titleObserver = new window.IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                playSectionReveal();
                playTitleTyping();
                observer.disconnect();
            });
        }, {
            root: null,
            threshold: 0.25
        });
        titleObserver.observe($section.get(0));
    } else {
        playSectionReveal();
        playTitleTyping();
    }

    const $form = $section.find('#contactForm');
    const $status = $section.find('.status').first();
    if (!$form.length || !$status.length) return;

    const $fields = $form.find('.input, .textarea');
    const $agree = $form.find('#contactagree');
    const $agreeWrap = $form.find('.agree').first();
    const $agreeFeedback = $form.find('#contactagree-feedback').first();
    const $submitButton = $section.find('.submit[form="contactForm"]').first();

    if (!$fields.length) return;
    let hasSubmitted = false;
    let isSubmitting = false;
    const hasAgreeField = $agree.length && $agreeWrap.length && $agreeFeedback.length;

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
        formOk: '문의가 접수되었습니다. 빠르게 연락드리겠습니다.'
    };
    messages.agreeRequired = '개인정보처리방침 동의가 필요합니다.';
    messages.submitFailed = '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

    const setStatus = (message, type) => {
        $status.removeClass('ok error');
        if (type) {
            $status.addClass(type);
        }
        $status.text(message || '');
    };

    const getFeedbackNode = ($input) => {
        const raw = ($input.attr('aria-describedby') || '').toString().trim();
        if (!raw) return $();
        const id = raw.split(/\s+/)[0];
        if (!id) return $();
        return $section.find(`#${id}`).first();
    };

    const resetFieldState = ($input) => {
        const $field = $input.closest('.field');
        const $feedback = getFeedbackNode($input);
        $input.attr('aria-invalid', 'false');
        $field.removeClass('is-error');
        if ($feedback.length) {
            $feedback.text('');
        }
    };

    const setError = ($input, message) => {
        const $field = $input.closest('.field');
        const $feedback = getFeedbackNode($input);
        $input.attr('aria-invalid', 'true');
        $field.addClass('is-error');
        if ($feedback.length) {
            $feedback.text(message || '');
        }
    };

    const resetAgreeState = () => {
        if (!hasAgreeField) return;
        $agreeWrap.removeClass('error');
        $agreeFeedback.text('');
    };

    const setAgreeError = (message) => {
        if (!hasAgreeField) return;
        $agreeWrap.addClass('error');
        $agreeFeedback.text(message || '');
    };

    const validateAgree = () => {
        if (!hasAgreeField) return true;
        if ($agree.prop('checked')) {
            resetAgreeState();
            return true;
        }
        setAgreeError(messages.agreeRequired);
        return false;
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
            agree: hasAgreeField ? ($agree.prop('checked') ? '1' : '') : '1'
        });
    };

    const setSubmitting = (state) => {
        isSubmitting = !!state;
        if ($submitButton.length) {
            $submitButton.prop('disabled', isSubmitting).attr('aria-busy', isSubmitting ? 'true' : 'false');
        }
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

    const submitContact = async () => {
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

    const validateField = ($input) => {
        if (!$input.length) return true;

        const name = ($input.attr('name') || '').toString();
        const value = ($input.val() || '').toString().trim();

        if (name === 'name') {
            if (!value) {
                setError($input, messages.nameRequired);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        if (name === 'email') {
            if (!value) {
                setError($input, messages.emailRequired);
                return false;
            }
            if (!emailPattern.test(value)) {
                setError($input, messages.emailInvalid);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        if (name === 'org') {
            if (!value) {
                setError($input, messages.orgRequired);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        if (name === 'tel') {
            if (!value) {
                setError($input, messages.telRequired);
                return false;
            }
            if (!telPattern.test(value)) {
                setError($input, messages.telInvalid);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        if (name === 'msg') {
            if (!value) {
                setError($input, messages.msgRequired);
                return false;
            }
            if (value.length < 10) {
                setError($input, messages.msgMin);
                return false;
            }
            resetFieldState($input);
            return true;
        }

        resetFieldState($input);
        return true;
    };

    const validateAll = () => {
        let isValid = true;
        let firstInvalid = null;

        $fields.each(function () {
            const $input = $(this);
            const valid = validateField($input);
            if (!valid) {
                isValid = false;
                if (!firstInvalid) {
                    firstInvalid = this;
                }
            }
        });

        const agreeValid = validateAgree();
        if (!agreeValid) {
            isValid = false;
            if (!firstInvalid && hasAgreeField) {
                firstInvalid = $agree.get(0);
            }
        }

        if (firstInvalid) {
            firstInvalid.focus();
        }

        return isValid;
    };

    $fields.each(function () {
        resetFieldState($(this));
    });
    resetAgreeState();

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
        if ($status.hasClass('error')) {
            setStatus('', '');
        }
    });

    $agree.on('change', function () {
        if (!hasSubmitted) return;
        validateAgree();
        if ($status.hasClass('error')) {
            setStatus('', '');
        }
    });

    $form.on('click', '.field', function (event) {
        if ($(event.target).is('input, textarea, label, button, a')) return;
        const $target = $(this).find('.input, .textarea').first();
        if ($target.length) {
            $target.trigger('focus');
        }
    });

    $form.on('submit', async function (event) {
        event.preventDefault();
        if (isSubmitting) return;
        setStatus('', '');
        hasSubmitted = true;

        const valid = validateAll();
        if (!valid) {
            setStatus('', '');
            return;
        }

        try {
            setSubmitting(true);
            await submitContact();
            setStatus(messages.formOk, 'ok');

            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert(messages.formOk);
            }

            this.reset();
            hasSubmitted = false;
            $fields.each(function () {
                resetFieldState($(this));
            });
            resetAgreeState();
        } catch (error) {
            const serverFields = error && error.payload && error.payload.fields ? error.payload.fields : null;
            applyServerFieldErrors(serverFields);
            const isValidationError = Boolean(error && error.payload && error.payload.error === 'validation');
            if (isValidationError) {
                setStatus('', '');
            } else {
                setStatus(messages.submitFailed, 'error');
            }
        } finally {
            setSubmitting(false);
        }
    });
});
