/**
 * RYOUSHI SURREAL SCENE
 * Three.js overlay — topographic wireframe terrain, starfield, orbital ring
 * Scroll-reactive: colour, amplitude, density shift per section
 */

(function () {
    'use strict';

    // === SIMPLEX NOISE (minimal implementation) ===
    const SimplexNoise = (function () {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const F3 = 1 / 3;
        const G3 = 1 / 6;
        const grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];

        function SimplexNoise(seed) {
            this.p = new Uint8Array(256);
            this.perm = new Uint8Array(512);
            this.permMod12 = new Uint8Array(512);

            const s = seed || Math.random();
            for (let i = 0; i < 256; i++) {
                this.p[i] = i;
            }
            // Shuffle using seed
            for (let i = 255; i > 0; i--) {
                const r = Math.floor(((s * (i + 1) * 16807) % 2147483647) / 2147483647 * (i + 1));
                const t = this.p[i];
                this.p[i] = this.p[r % 256];
                this.p[r % 256] = t;
            }
            for (let i = 0; i < 512; i++) {
                this.perm[i] = this.p[i & 255];
                this.permMod12[i] = this.perm[i] % 12;
            }
        }

        SimplexNoise.prototype.noise2D = function (xin, yin) {
            let n0, n1, n2;
            const s = (xin + yin) * F2;
            const i = Math.floor(xin + s);
            const j = Math.floor(yin + s);
            const t = (i + j) * G2;
            const x0 = xin - (i - t);
            const y0 = yin - (j - t);
            let i1, j1;
            if (x0 > y0) { i1 = 1; j1 = 0; }
            else { i1 = 0; j1 = 1; }
            const x1 = x0 - i1 + G2;
            const y1 = y0 - j1 + G2;
            const x2 = x0 - 1 + 2 * G2;
            const y2 = y0 - 1 + 2 * G2;
            const ii = i & 255;
            const jj = j & 255;

            let t0 = 0.5 - x0 * x0 - y0 * y0;
            if (t0 < 0) n0 = 0;
            else {
                t0 *= t0;
                const gi0 = this.permMod12[ii + this.perm[jj]];
                n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0);
            }
            let t1 = 0.5 - x1 * x1 - y1 * y1;
            if (t1 < 0) n1 = 0;
            else {
                t1 *= t1;
                const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
                n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1);
            }
            let t2 = 0.5 - x2 * x2 - y2 * y2;
            if (t2 < 0) n2 = 0;
            else {
                t2 *= t2;
                const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
                n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2);
            }
            return 70 * (n0 + n1 + n2);
        };

        return SimplexNoise;
    })();

    // === CONFIGURATION ===
    const CONFIG = {
        terrain: {
            width: 22,
            depth: 16,
            segW: 100,
            segD: 70,
            baseAmplitude: 0.6,
            noiseScale: 0.08,
            speed: 0.0003
        },
        stars: {
            count: 1500,
            spread: 60,
            minSize: 0.3,
            maxSize: 1.2
        },
        ring: {
            radius: 3.5,
            tube: 0.015,
            radialSegs: 64,
            tubularSegs: 128
        }
    };

    // === Section mood configurations ===
    const MOODS = {
        arrival: {
            wireColor: new THREE.Color(0xBB3344),
            amplitude: 0.6,
            starDensity: 0.4,
            starTint: new THREE.Color(0xFFE5E5),
            ringVisible: true,
            ringScale: 1.0,
            fogDensity: 0.0,
            cameraZ: 11
        },
        origin: {
            wireColor: new THREE.Color(0x992233),
            amplitude: 0.3,
            starDensity: 0.5,
            starTint: new THREE.Color(0xFFB3B3),
            ringVisible: false,
            ringScale: 0.5,
            fogDensity: 0.0,
            cameraZ: 10.5
        },
        fracture: {
            wireColor: new THREE.Color(0xCC3344),
            amplitude: 1.4,
            starDensity: 0.7,
            starTint: new THREE.Color(0xFF6666),
            ringVisible: true,
            ringScale: 1.2,
            fogDensity: 0.015,
            cameraZ: 9.5
        },
        constellation: {
            wireColor: new THREE.Color(0xAA3355),
            amplitude: 0.8,
            starDensity: 1.0,
            starTint: new THREE.Color(0xFF99FF),
            ringVisible: true,
            ringScale: 1.8,
            fogDensity: 0.0,
            cameraZ: 10
        },
        lab: {
            wireColor: new THREE.Color(0x8844AA),
            amplitude: 0.4,
            starDensity: 0.5,
            starTint: new THREE.Color(0xCCCCFF),
            ringVisible: true,
            ringScale: 0.8,
            fogDensity: 0.0,
            cameraZ: 11
        },
        architects: {
            wireColor: new THREE.Color(0x6633AA),
            amplitude: 0.7,
            starDensity: 0.8,
            starTint: new THREE.Color(0x9966FF),
            ringVisible: false,
            ringScale: 0.3,
            fogDensity: 0.02,
            cameraZ: 10.5
        },
        horizon: {
            wireColor: new THREE.Color(0xBB3344),
            amplitude: 0.2,
            starDensity: 0.3,
            starTint: new THREE.Color(0xFFE5E5),
            ringVisible: true,
            ringScale: 1.0,
            fogDensity: 0.0,
            cameraZ: 11
        }
    };

    // === STATE ===
    const state = {
        currentMood: MOODS.arrival,
        targetMood: MOODS.arrival,
        lerpFactor: 0.03,
        time: 0,
        scrollProgress: 0,
        mouseX: 0,
        mouseY: 0
    };

    // Lerp helpers
    function lerpVal(a, b, t) { return a + (b - a) * t; }
    function lerpColor(a, b, t) {
        return new THREE.Color(
            lerpVal(a.r, b.r, t),
            lerpVal(a.g, b.g, t),
            lerpVal(a.b, b.b, t)
        );
    }

    // === INIT ===
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 4.5, 11);
    camera.lookAt(0, 0, -3);

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const simplex = new SimplexNoise(42);

    // === TERRAIN ===
    const terrainGeo = new THREE.PlaneGeometry(
        CONFIG.terrain.width, CONFIG.terrain.depth,
        CONFIG.terrain.segW, CONFIG.terrain.segD
    );
    terrainGeo.rotateX(-Math.PI / 2.3);

    const terrainMat = new THREE.MeshBasicMaterial({
        color: 0xC0C0C0,
        wireframe: true,
        transparent: true,
        opacity: 0.06
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = -3.5;
    terrain.position.z = -3;
    scene.add(terrain);

    // Store base positions
    const terrainPositions = terrainGeo.attributes.position;
    const basePositions = new Float32Array(terrainPositions.array.length);
    basePositions.set(terrainPositions.array);

    // === STARFIELD ===
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(CONFIG.stars.count * 3);
    const starSizes = new Float32Array(CONFIG.stars.count);
    const starPhases = new Float32Array(CONFIG.stars.count);

    for (let i = 0; i < CONFIG.stars.count; i++) {
        const i3 = i * 3;
        const radius = CONFIG.stars.spread;
        // Hemisphere distribution — more above
        starPositions[i3] = (Math.random() - 0.5) * radius;
        starPositions[i3 + 1] = Math.random() * radius * 0.6 + 1;
        starPositions[i3 + 2] = (Math.random() - 0.5) * radius;
        starSizes[i] = CONFIG.stars.minSize + Math.random() * (CONFIG.stars.maxSize - CONFIG.stars.minSize);
        starPhases[i] = Math.random() * Math.PI * 2;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    // Generate circular sprite texture
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const starCtx = starCanvas.getContext('2d');
    const gradient = starCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    starCtx.fillStyle = gradient;
    starCtx.fillRect(0, 0, 32, 32);
    const starSprite = new THREE.CanvasTexture(starCanvas);

    const starMat = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.35,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.55,
        map: starSprite,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // === ORBITAL RING ===
    const ringGeo = new THREE.TorusGeometry(
        CONFIG.ring.radius, CONFIG.ring.tube,
        CONFIG.ring.radialSegs, CONFIG.ring.tubularSegs
    );
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xC0C0C0,
        wireframe: true,
        transparent: true,
        opacity: 0.08
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    ring.rotation.z = Math.PI / 6;
    ring.position.set(0, 2, -5);
    scene.add(ring);

    // Second ring (thinner, different axis — logo has crossing orbits)
    const ring2Geo = new THREE.TorusGeometry(
        CONFIG.ring.radius * 0.85, CONFIG.ring.tube * 0.7,
        32, 80
    );
    const ring2Mat = new THREE.MeshBasicMaterial({
        color: 0x8B4513,
        wireframe: true,
        transparent: true,
        opacity: 0.06
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 3;
    ring2.position.set(0, 2, -5);
    scene.add(ring2);

    // === ANIMATE TERRAIN ===
    let rippleX = 0;
    let rippleZ = 0;
    
    function updateTerrain(time, amplitude) {
        const positions = terrainGeo.attributes.position;
        const nScale = CONFIG.terrain.noiseScale;
        
        // Smoothly follow mouse
        rippleX += (state.mouseX * 15 - rippleX) * 0.05;
        rippleZ += (state.mouseY * 10 - rippleZ) * 0.05; // Mouse Y maps roughly to depth (Z)

        for (let i = 0; i < positions.count; i++) {
            const baseX = basePositions[i * 3];
            const baseZ = basePositions[i * 3 + 2];

            const noise1 = simplex.noise2D(baseX * nScale + time, baseZ * nScale + time);
            const noise2 = simplex.noise2D(baseX * nScale * 2 + time * 0.5, baseZ * nScale * 2) * 0.5;

            const distX = baseX - rippleX;
            const distZ = baseZ - rippleZ;
            const dist = Math.sqrt(distX * distX + distZ * distZ);
            
            // Create a ripple based on distance
            const ripple = Math.max(0, Math.exp(-dist * 0.2)) * 1.5 * Math.sin(dist * 1.5 - time * 3);

            positions.array[i * 3 + 1] = basePositions[i * 3 + 1] + (noise1 + noise2) * amplitude + ripple;
        }
        positions.needsUpdate = true;
    }

    // === ANIMATE STARS ===
    function updateStars(time, density, tint) {
        const sizes = starGeo.attributes.size;
        for (let i = 0; i < CONFIG.stars.count; i++) {
            const phase = starPhases[i];
            const twinkle = Math.sin(time * 2 + phase) * 0.5 + 0.5;
            const visible = i / CONFIG.stars.count < density ? 1 : 0;
            sizes.array[i] = starSizes[i] * twinkle * visible;
        }
        sizes.needsUpdate = true;
        starMat.color.copy(tint);
    }

    // === CURRENT VALUES (for smooth lerping) ===
    const current = {
        wireColor: new THREE.Color(0xC0C0C0),
        amplitude: 0.5,
        starDensity: 0.3,
        starTint: new THREE.Color(0xFFFFFF),
        ringVisible: 1.0,
        ringScale: 1.0,
        cameraZ: 11
    };

    // === ANIMATION LOOP ===
    function animate() {
        requestAnimationFrame(animate);

        state.time += CONFIG.terrain.speed;

        const target = state.targetMood;
        const t = state.lerpFactor;

        // Smooth lerp all values
        current.wireColor = lerpColor(current.wireColor, target.wireColor, t);
        current.amplitude = lerpVal(current.amplitude, target.amplitude, t);
        current.starDensity = lerpVal(current.starDensity, target.starDensity, t);
        current.starTint = lerpColor(current.starTint, target.starTint, t);
        current.ringVisible = lerpVal(current.ringVisible, target.ringVisible ? 1 : 0, t);
        current.ringScale = lerpVal(current.ringScale, target.ringScale, t);
        current.cameraZ = lerpVal(current.cameraZ, target.cameraZ, t);

        // Apply
        terrainMat.color.copy(current.wireColor);
        updateTerrain(state.time * 100, current.amplitude);
        updateStars(state.time * 100, current.starDensity, current.starTint);

        // Ring
        const ringOpacity = current.ringVisible * 0.08;
        ring.material.opacity = ringOpacity;
        ring2.material.opacity = ringOpacity * 0.7;
        const scale = current.ringScale;
        ring.scale.set(scale, scale, scale);
        ring2.scale.set(scale * 0.85, scale * 0.85, scale * 0.85);
        ring.rotation.z += 0.001;
        ring2.rotation.z -= 0.0007;

        // Fixed camera perspective (Parallax removed)
        camera.position.x = 0;
        camera.position.y = 4.5;
        camera.position.z = current.cameraZ;
        camera.lookAt(0, 0, -3);

        // Slow rotate stars
        stars.rotation.y += 0.00008;

        renderer.render(scene, camera);
    }

    animate();

    // === RESIZE ===
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // === MOUSE PARALLAX ===
    document.addEventListener('mousemove', (e) => {
        state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // === PUBLIC API — called from main.js ===
    window.SurrealScene = {
        setMood: function (moodName) {
            if (MOODS[moodName]) {
                state.targetMood = MOODS[moodName];
            }
        },
        setProgress: function (progress) {
            state.scrollProgress = progress;
        }
    };

})();
