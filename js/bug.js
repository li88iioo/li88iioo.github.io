(function () {
    // ============ CONFIGURATION ============
    const BUG_CONFIG = {
        beetle: {
            size: 10,
            maxSpeed: 2,
            runSpeed: 6,
            fearDistance: 150,
            turnRate: 0.2,
            legSpeed: 1.5,
            colors: {
                dark: {
                    main: [150, 150, 180],
                    highlight: [200, 200, 255],
                    shadow: [100, 100, 130],
                    accent: [180, 180, 220]
                },
                light: {
                    main: [20, 20, 30],
                    highlight: [60, 60, 80],
                    shadow: [0, 0, 10],
                    accent: [40, 40, 60]
                }
            }
        },
        ladybug: {
            size: 11,
            maxSpeed: 1.5,
            runSpeed: 4,
            fearDistance: 120,
            turnRate: 0.1,
            legSpeed: 0.8,
            colors: {
                dark: {
                    body: [10, 10, 10],
                    shell: [255, 100, 100],
                    shellDark: [200, 20, 20],
                    shellHighlight: [255, 150, 150],
                    spots: [0, 0, 0]
                },
                light: {
                    body: [10, 10, 10],
                    shell: [255, 100, 100],
                    shellDark: [200, 20, 20],
                    shellHighlight: [255, 150, 150],
                    spots: [0, 0, 0]
                }
            }
        },
        cockroach: {
            size: 12,
            maxSpeed: 3,
            runSpeed: 12,
            fearDistance: 250,
            turnRate: 0.25,
            legSpeed: 2.0,
            playDead: true,
            colors: {
                dark: {
                    main: [188, 170, 164],
                    highlight: [215, 204, 200],
                    shadow: [140, 125, 120],
                    accent: [200, 185, 180]
                },
                light: {
                    main: [85, 55, 30],
                    highlight: [120, 80, 50],
                    shadow: [50, 30, 15],
                    accent: [100, 65, 40]
                }
            }
        }
    };

    // ============ CANVAS SETUP ============
    const canvas = document.createElement('canvas');
    canvas.id = 'bug-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '99';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    const dpr = window.devicePixelRatio || 1;
    let width, height;

    const TYPES = ['beetle', 'cockroach', 'ladybug'];

    // ============ BUG STATE ============
    const bug = {
        x: -100,
        y: -100,
        angle: 0,
        speed: 0,
        maxSpeed: 2,
        runSpeed: 6,
        state: 'waiting',
        restTimer: 0,
        legPhase: 0,
        targetSpeed: 0,
        type: 'beetle',
        size: 10,
        tilt: 0,
        targetTilt: 0,
        clickedRecently: false,
        playDeadTimer: 0,
        escapeAttempts: 0
    };

    const mouse = {
        x: null,
        y: null,
        lastX: null,
        lastY: null,
        lastMoveTime: 0
    };

    // Performance detection
    let frameCount = 0;
    let lastFpsCheck = Date.now();
    let lowPerformanceMode = false;

    // ============ THEME MANAGEMENT ============
    function updateTheme() { }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'color-mode') {
                updateTheme();
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });

    // ============ INITIALIZATION ============
    function init() {
        resize();
        requestAnimationFrame(animate);
        setTimeout(spawnBug, 5000);
    }

    function spawnBug() {
        bug.type = TYPES[Math.floor(Math.random() * TYPES.length)];
        const config = BUG_CONFIG[bug.type];

        bug.size = config.size + Math.random() * 4;
        bug.maxSpeed = config.maxSpeed;
        bug.runSpeed = config.runSpeed;
        bug.state = 'entering';
        bug.speed = bug.maxSpeed * 0.7;  // Slower initial speed for visible crawl-in
        bug.escapeAttempts = 0;
        bug.clickedRecently = false;
        bug.playDeadTimer = 0;

        const side = Math.floor(Math.random() * 4);
        const border = 200;  // Further off-screen for smoother entrance
        switch (side) {
            case 0: bug.x = Math.random() * width; bug.y = -border; bug.angle = Math.PI / 2 + (Math.random() - 0.5) * 0.3; break;
            case 1: bug.x = width + border; bug.y = Math.random() * height; bug.angle = Math.PI + (Math.random() - 0.5) * 0.3; break;
            case 2: bug.x = Math.random() * width; bug.y = height + border; bug.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3; break;
            case 3: bug.x = -border; bug.y = Math.random() * height; bug.angle = 0 + (Math.random() - 0.5) * 0.3; break;
        }
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }

    // ============ UTILITY FUNCTIONS ============
    function rgba(colorArray, alpha = 1) {
        return `rgba(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]}, ${alpha})`;
    }

    function getColors(type) {
        const isDark = document.documentElement.getAttribute('color-mode') === 'dark';
        return BUG_CONFIG[type].colors[isDark ? 'dark' : 'light'];
    }

    // ============ ENHANCED DRAWING FUNCTIONS ============
    function drawSoftShadow(ctx, offsetX = 2, offsetY = 3, blur = 4) {
        if (lowPerformanceMode) return;

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.filter = `blur(${blur}px)`;
        ctx.translate(offsetX, offsetY);
    }

    function drawJointedLeg(ctx, startX, startY, endX, endY, phase, color, speed) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        const bendAmount = Math.sin(phase) * 5 * (speed > 0.1 ? 1 : 0.3);
        const perpX = -(endY - startY) / 8;
        const perpY = (endX - startX) / 8;

        // Leg segments with gradient for depth
        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, color.replace(/[\d.]+\)$/g, '0.7)'));
        grad.addColorStop(1, color.replace(/[\d.]+\)$/g, '0.5)'));

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Upper segment
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX + perpX + bendAmount, midY + perpY, midX + perpX / 2, midY + perpY / 2);
        ctx.stroke();

        // Lower segment
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(midX + perpX / 2, midY + perpY / 2);
        ctx.quadraticCurveTo(midX + perpX + bendAmount, midY + perpY, endX, endY);
        ctx.stroke();

        // Joint sphere
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(midX + perpX / 2, midY + perpY / 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Joint highlight
        if (!lowPerformanceMode) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(midX + perpX / 2 - 0.3, midY + perpY / 2 - 0.3, 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBeetle(ctx, isDark) {
        const colors = getColors('beetle');
        const config = BUG_CONFIG.beetle;

        // Shadow
        drawSoftShadow(ctx, 2, 3, 3);
        if (!lowPerformanceMode) {
            ctx.beginPath();
            ctx.ellipse(-5, 0, bug.size * 1.3, bug.size * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Legs with enhanced joints
        const legColor = rgba(colors.main, 0.9);
        for (let i = 0; i < 3; i++) {
            const sideOffset = (i - 1) * 7;
            const phase = bug.legPhase + i * Math.PI;

            drawJointedLeg(ctx, sideOffset, -bug.size / 2,
                          sideOffset - 18, -bug.size - 10 + Math.sin(phase) * 15,
                          phase, legColor, bug.speed);
            drawJointedLeg(ctx, sideOffset, bug.size / 2,
                          sideOffset - 18, bug.size + 10 - Math.sin(phase) * 15,
                          phase + Math.PI, legColor, bug.speed);
        }

        // Antennae with enhanced detail
        const antWave = Math.sin(Date.now() / 200) * 2;
        const antGrad = ctx.createLinearGradient(bug.size + 5, 0, bug.size + 20, 0);
        antGrad.addColorStop(0, rgba(colors.main, 1));
        antGrad.addColorStop(1, rgba(colors.main, 0.4));

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = antGrad;
        ctx.beginPath();
        ctx.moveTo(bug.size + 5, -2);
        ctx.bezierCurveTo(bug.size + 10, -5, bug.size + 15, -10 + antWave, bug.size + 20, -12 + antWave);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bug.size + 5, 2);
        ctx.bezierCurveTo(bug.size + 10, 5, bug.size + 15, 10 - antWave, bug.size + 20, 12 - antWave);
        ctx.stroke();

        // Abdomen with enhanced 6-color gradient
        const abGrad = ctx.createRadialGradient(-5, -3, 1, -5, 3, bug.size * 1.4);
        abGrad.addColorStop(0, rgba(colors.highlight, 1));
        abGrad.addColorStop(0.15, rgba(colors.accent, 1));
        abGrad.addColorStop(0.4, rgba(colors.main, 1));
        abGrad.addColorStop(0.65, rgba(colors.shadow, 0.95));
        abGrad.addColorStop(0.85, rgba(colors.shadow, 0.85));
        abGrad.addColorStop(1, rgba(colors.shadow, 0.6));
        ctx.fillStyle = abGrad;
        ctx.beginPath();
        ctx.ellipse(-5, 0, bug.size * 1.3, bug.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle texture stripes
        ctx.strokeStyle = rgba(colors.shadow, 0.3);
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) {
            const xPos = -bug.size * 1.5 + i * (bug.size * 0.7);
            ctx.beginPath();
            ctx.moveTo(xPos, -bug.size * 0.6);
            ctx.lineTo(xPos, bug.size * 0.6);
            ctx.stroke();
        }

        // Center line with gradient
        const centerGrad = ctx.createLinearGradient(-bug.size * 1.5, 0, bug.size * 0.5, 0);
        centerGrad.addColorStop(0, rgba(colors.shadow, 0.8));
        centerGrad.addColorStop(0.5, rgba(colors.shadow, 0.4));
        centerGrad.addColorStop(1, rgba(colors.shadow, 0.2));
        ctx.strokeStyle = centerGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-bug.size * 1.5, 0);
        ctx.lineTo(bug.size * 0.5, 0);
        ctx.stroke();

        // Micro highlights on abdomen
        if (!lowPerformanceMode) {
            const highlights = [
                [-bug.size * 0.8, -bug.size * 0.3],
                [-bug.size * 0.3, -bug.size * 0.4],
                [-bug.size * 0.9, bug.size * 0.2],
                [-bug.size * 0.4, bug.size * 0.3]
            ];
            highlights.forEach(pos => {
                const hGrad = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], 2);
                hGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                hGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = hGrad;
                ctx.beginPath();
                ctx.arc(pos[0], pos[1], 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Thorax with enhanced gradient
        const thGrad = ctx.createRadialGradient(bug.size * 0.8, -4, 1, bug.size * 0.8, 2, bug.size * 0.6);
        thGrad.addColorStop(0, rgba(colors.highlight, 1));
        thGrad.addColorStop(0.3, rgba(colors.accent, 1));
        thGrad.addColorStop(0.7, rgba(colors.main, 1));
        thGrad.addColorStop(1, rgba(colors.shadow, 0.9));
        ctx.fillStyle = thGrad;
        ctx.beginPath();
        ctx.arc(bug.size * 0.8, 0, bug.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Enhanced compound eyes
        const eyePositions = [[bug.size * 1.3, -2.5], [bug.size * 1.3, 2.5]];
        eyePositions.forEach(pos => {
            // Eye base
            const eyeGrad = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], 2.5);
            eyeGrad.addColorStop(0, 'rgba(50, 20, 10, 1)');
            eyeGrad.addColorStop(0.6, 'rgba(20, 10, 5, 1)');
            eyeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            ctx.fillStyle = eyeGrad;
            ctx.beginPath();
            ctx.arc(pos[0], pos[1], 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Compound eye facets
            if (!lowPerformanceMode) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const fx = pos[0] + Math.cos(angle) * 0.8;
                    const fy = pos[1] + Math.sin(angle) * 0.8;
                    ctx.beginPath();
                    ctx.arc(fx, fy, 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Primary eye shine
            const shineGrad = ctx.createRadialGradient(pos[0] - 0.6, pos[1] - 0.8, 0, pos[0] - 0.6, pos[1] - 0.8, 1.2);
            shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shineGrad;
            ctx.beginPath();
            ctx.arc(pos[0] - 0.6, pos[1] - 0.8, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Secondary shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(pos[0] + 0.5, pos[1] + 0.6, 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawLadybug(ctx, isDark) {
        const colors = getColors('ladybug');

        // Shadow
        drawSoftShadow(ctx, 1.5, 2.5, 2.5);
        if (!lowPerformanceMode) {
            ctx.beginPath();
            ctx.arc(0, 0, bug.size * 1.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Legs with enhanced joints
        const legColor = rgba(colors.body, 1);
        for (let i = 0; i < 3; i++) {
            const offset = (i - 1) * 6;
            const phase = bug.legPhase + i * Math.PI;

            drawJointedLeg(ctx, offset, -6, offset, -16 + Math.sin(phase) * 5,
                          phase, legColor, bug.speed);
            drawJointedLeg(ctx, offset, 6, offset, 16 - Math.sin(phase) * 5,
                          phase + Math.PI, legColor, bug.speed);
        }

        // Head with gradient
        const headGrad = ctx.createRadialGradient(bug.size, -1, 1, bug.size, 1, bug.size * 0.6);
        headGrad.addColorStop(0, rgba(colors.body, 1));
        headGrad.addColorStop(0.7, rgba(colors.body, 0.95));
        headGrad.addColorStop(1, rgba(colors.body, 0.85));
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(bug.size, 0, bug.size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Antennae with gradient fade
        const antGrad = ctx.createLinearGradient(bug.size + 4, 0, bug.size + 10, 0);
        antGrad.addColorStop(0, rgba(colors.body, 1));
        antGrad.addColorStop(1, rgba(colors.body, 0.3));
        ctx.strokeStyle = antGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(bug.size + 4, -3);
        ctx.lineTo(bug.size + 10, -6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bug.size + 4, 3);
        ctx.lineTo(bug.size + 10, 6);
        ctx.stroke();

        // Shell with metallic 5-color gradient
        const grad = ctx.createRadialGradient(-3, -4, 1, 0, 2, bug.size * 1.3);
        grad.addColorStop(0, rgba(colors.shellHighlight, 1));
        grad.addColorStop(0.2, rgba(colors.shell, 1));
        grad.addColorStop(0.5, rgba(colors.shell, 0.95));
        grad.addColorStop(0.75, rgba(colors.shellDark, 1));
        grad.addColorStop(1, rgba(colors.shellDark, 0.85));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, bug.size * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Metallic shine overlay
        if (!lowPerformanceMode) {
            const shineGrad = ctx.createRadialGradient(-4, -5, 0, -4, -5, bug.size * 0.8);
            shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            shineGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
            shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shineGrad;
            ctx.beginPath();
            ctx.arc(-2, -3, bug.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center line with shadow effect
        const centerGrad = ctx.createLinearGradient(0, -bug.size, 0, bug.size);
        centerGrad.addColorStop(0, rgba(colors.spots, 0.2));
        centerGrad.addColorStop(0.5, rgba(colors.spots, 0.5));
        centerGrad.addColorStop(1, rgba(colors.spots, 0.2));
        ctx.strokeStyle = centerGrad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-bug.size, 0);
        ctx.lineTo(bug.size, 0);
        ctx.stroke();

        // Enhanced spots with depth
        const spotPositions = [
            [-6, -6.5], [1, -5.5], [6.5, -3.5],
            [-6, 6.5], [1, 5.5], [6.5, 3.5]
        ];
        spotPositions.forEach(pos => {
            // Spot shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(pos[0] + 0.3, pos[1] + 0.3, 2.8, 0, Math.PI * 2);
            ctx.fill();

            // Main spot with gradient
            const spotGrad = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], 3);
            spotGrad.addColorStop(0, rgba(colors.spots, 1));
            spotGrad.addColorStop(0.7, rgba(colors.spots, 0.95));
            spotGrad.addColorStop(1, rgba(colors.spots, 0.75));
            ctx.fillStyle = spotGrad;
            ctx.beginPath();
            ctx.arc(pos[0], pos[1], 2.7, 0, Math.PI * 2);
            ctx.fill();

            // Spot highlight
            if (!lowPerformanceMode) {
                const hlGrad = ctx.createRadialGradient(pos[0] - 0.8, pos[1] - 0.8, 0, pos[0] - 0.8, pos[1] - 0.8, 1.2);
                hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
                hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = hlGrad;
                ctx.beginPath();
                ctx.arc(pos[0] - 0.6, pos[1] - 0.6, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Edge highlights for 3D effect
        if (!lowPerformanceMode) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, bug.size * 1.05, Math.PI * 1.2, Math.PI * 1.8);
            ctx.stroke();
        }
    }

    function drawCockroach(ctx, isDark) {
        const colors = getColors('cockroach');
        const config = BUG_CONFIG.cockroach;

        // Shadow
        drawSoftShadow(ctx, 2.5, 4, 4);
        if (!lowPerformanceMode) {
            ctx.beginPath();
            ctx.ellipse(-5, 0, bug.size * 2.3, bug.size * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Legs with enhanced joints
        const legColor = rgba(colors.main, 0.9);
        for (let i = 0; i < 3; i++) {
            const sideOffset = (i - 1) * 8 - 2;
            const phase = bug.legPhase + i * Math.PI;
            const reach = 18 + i * 2;
            const legMove = Math.sin(phase) * (bug.speed > 0.1 ? 1 : 0);

            drawJointedLeg(ctx, sideOffset, -bug.size / 2,
                          sideOffset - 10 + legMove * 8, -bug.size - reach,
                          phase, legColor, bug.speed);
            drawJointedLeg(ctx, sideOffset, bug.size / 2,
                          sideOffset - 10 - legMove * 8, bug.size + reach,
                          phase + Math.PI, legColor, bug.speed);
        }

        // Cerci (tail appendages) with gradient
        const cerciGrad = ctx.createLinearGradient(-bug.size * 2.2, 0, -bug.size * 3.0, 0);
        cerciGrad.addColorStop(0, rgba(colors.main, 1));
        cerciGrad.addColorStop(1, rgba(colors.main, 0.4));
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = cerciGrad;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-bug.size * 2.2, -3);
        ctx.lineTo(-bug.size * 3.0, -8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-bug.size * 2.2, 3);
        ctx.lineTo(-bug.size * 3.0, 8);
        ctx.stroke();

        // Long antennae with enhanced wave
        const t = Date.now() / 150;
        const feelerWiggle1 = Math.sin(t) * 5;
        const feelerWiggle2 = Math.cos(t * 0.9) * 5;

        const feelerGrad = ctx.createLinearGradient(bug.size * 1.5, 0, bug.size * 9, 0);
        feelerGrad.addColorStop(0, rgba(colors.main, 1));
        feelerGrad.addColorStop(0.5, rgba(colors.main, 0.6));
        feelerGrad.addColorStop(1, rgba(colors.main, 0.2));

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = feelerGrad;
        ctx.beginPath();
        ctx.moveTo(bug.size * 1.5, -2);
        ctx.bezierCurveTo(bug.size * 3, -5, bug.size * 6, -20 + feelerWiggle1, bug.size * 9, -15 + feelerWiggle1 * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bug.size * 1.5, 2);
        ctx.bezierCurveTo(bug.size * 3, 5, bug.size * 6, 20 + feelerWiggle2, bug.size * 9, 15 + feelerWiggle2 * 2);
        ctx.stroke();

        // Wings with enhanced multi-layer gradient
        const wingGrad = ctx.createLinearGradient(-bug.size * 2, -bug.size, bug.size * 0.5, bug.size);
        wingGrad.addColorStop(0, rgba(colors.shadow, 0.95));
        wingGrad.addColorStop(0.15, rgba(colors.main, 0.95));
        wingGrad.addColorStop(0.3, rgba(colors.accent, 0.95));
        wingGrad.addColorStop(0.5, rgba(colors.highlight, 0.95));
        wingGrad.addColorStop(0.7, rgba(colors.accent, 0.95));
        wingGrad.addColorStop(0.85, rgba(colors.main, 0.95));
        wingGrad.addColorStop(1, rgba(colors.shadow, 0.90));
        ctx.fillStyle = wingGrad;
        ctx.beginPath();
        ctx.ellipse(-5, 0, bug.size * 2.3, bug.size * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing edge highlight
        if (!lowPerformanceMode) {
            ctx.strokeStyle = rgba(colors.highlight, 0.3);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(-5, 0, bug.size * 2.3, bug.size * 0.85, 0, Math.PI * 0.3, Math.PI * 0.7);
            ctx.stroke();
        }

        // Enhanced wing texture lines
        if (!lowPerformanceMode) {
            const textureGrad = ctx.createLinearGradient(0, -bug.size, 0, bug.size);
            textureGrad.addColorStop(0, rgba(colors.shadow, 0.2));
            textureGrad.addColorStop(0.5, rgba(colors.shadow, 0.4));
            textureGrad.addColorStop(1, rgba(colors.shadow, 0.2));
            ctx.strokeStyle = textureGrad;
            ctx.lineWidth = 0.6;

            for (let i = 0; i < 7; i++) {
                const xPos = -bug.size * 2.4 + i * (bug.size * 0.7);
                const curve = Math.sin((i / 6) * Math.PI) * 2;
                ctx.beginPath();
                ctx.moveTo(xPos, -bug.size * 0.7);
                ctx.quadraticCurveTo(xPos + curve, 0, xPos + bug.size * 0.5, bug.size * 0.7);
                ctx.stroke();
            }

            // Cross veins
            ctx.lineWidth = 0.4;
            for (let i = 0; i < 3; i++) {
                const yPos = -bug.size * 0.6 + i * (bug.size * 0.6);
                ctx.beginPath();
                ctx.moveTo(-bug.size * 2.2, yPos);
                ctx.lineTo(bug.size * 0.3, yPos);
                ctx.stroke();
            }
        }

        // Glossy spots on wings
        if (!lowPerformanceMode) {
            const glossPositions = [
                [-bug.size * 1.5, -bug.size * 0.3],
                [-bug.size * 0.8, bug.size * 0.2],
                [-bug.size * 1.2, bug.size * 0.4]
            ];
            glossPositions.forEach(pos => {
                const glossGrad = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], 3);
                glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = glossGrad;
                ctx.beginPath();
                ctx.arc(pos[0], pos[1], 3, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Pronotum (shield) with enhanced gradient and edge
        const pronotumGrad = ctx.createRadialGradient(10, -2, 0.5, 12, 2, bug.size * 0.8);
        pronotumGrad.addColorStop(0, rgba(colors.highlight, 1));
        pronotumGrad.addColorStop(0.3, rgba(colors.accent, 1));
        pronotumGrad.addColorStop(0.7, rgba(colors.main, 1));
        pronotumGrad.addColorStop(1, rgba(colors.shadow, 0.95));
        ctx.fillStyle = pronotumGrad;
        ctx.beginPath();
        ctx.arc(10, 0, bug.size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Pronotum edge highlight
        if (!lowPerformanceMode) {
            ctx.strokeStyle = rgba(colors.highlight, 0.4);
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(10, 0, bug.size * 0.68, Math.PI * 0.8, Math.PI * 1.2);
            ctx.stroke();
        }

        // Head with gradient
        const headGrad = ctx.createRadialGradient(16, -1, 1, 16, 1, bug.size * 0.4);
        headGrad.addColorStop(0, rgba(colors.accent, 1));
        headGrad.addColorStop(0.6, rgba(colors.main, 1));
        headGrad.addColorStop(1, rgba(colors.shadow, 0.9));
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(16, 0, bug.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBug() {
        if (bug.state === 'waiting') return;

        ctx.save();
        ctx.translate(bug.x, bug.y);
        ctx.rotate(bug.angle + bug.tilt);

        const isDark = document.documentElement.getAttribute('color-mode') === 'dark';

        if (bug.type === 'cockroach') drawCockroach(ctx, isDark);
        else if (bug.type === 'ladybug') drawLadybug(ctx, isDark);
        else drawBeetle(ctx, isDark);

        ctx.restore();
    }

    // ============ ENHANCED BEHAVIOR LOGIC ============
    function updateBug() {
        if (bug.state === 'waiting') return;

        let dx = 0, dy = 0;
        let dist = 1000;
        if (mouse.x != null) {
            dx = mouse.x - bug.x;
            dy = mouse.y - bug.y;
            dist = Math.sqrt(dx * dx + dy * dy);
        }

        const mouseIsStationary = (Date.now() - mouse.lastMoveTime) > 2000;
        const config = BUG_CONFIG[bug.type];
        const fearDist = config.fearDistance;

        // Play dead timer countdown
        if (bug.playDeadTimer > 0) {
            bug.playDeadTimer--;
            if (bug.playDeadTimer <= 0) {
                bug.state = 'wandering';
            }
        }

        // State Transitions
        if (bug.state === 'entering') {
            const margin = 150;  // Increased margin for smoother transition
            if (bug.x > margin && bug.x < width - margin && bug.y > margin && bug.y < height - margin) {
                bug.state = 'wandering';
                bug.speed = bug.maxSpeed;  // Speed up after entering
            }
        } else if (bug.state === 'play_dead') {
            // Stay still, wait for timer
            if (dist > fearDist * 2) {
                bug.playDeadTimer = Math.max(bug.playDeadTimer, 30);
            }
        } else if (bug.state === 'scared') {
            if (dist > fearDist * 2.5) {
                bug.state = 'wandering';
                bug.escapeAttempts++;
            }
            // Leave screen after multiple scares (check at screen edges)
            if (bug.escapeAttempts > 4) {
                const exitZone = 50;
                if (bug.x < -exitZone || bug.x > width + exitZone || bug.y < -exitZone || bug.y > height + exitZone) {
                    bug.state = 'waiting';
                    setTimeout(spawnBug, 10000 + Math.random() * 20000);
                }
            }
        } else if (bug.state === 'investigating') {
            if (!mouseIsStationary || mouse.x === null) {
                bug.state = 'scared';
            } else if (dist < 40) {
                bug.state = 'scared';
            } else if (dist < 80) {
                bug.state = 'watch_mouse';
            }
        } else if (bug.state === 'watch_mouse') {
            if (!mouseIsStationary || mouse.x === null) {
                bug.state = 'scared';
            } else if (dist > 100) {
                bug.state = 'investigating';
            }
        } else {
            // Wandering or Resting
            if (mouseIsStationary && dist < 400 && dist > 100 && Math.random() < 0.01) {
                bug.state = 'investigating';
            } else if (dist < fearDist && !mouseIsStationary) {
                bug.state = 'scared';
            }
        }

        // Behavior Logic
        if (bug.state === 'scared') {
            let runAngle = Math.atan2(-dy, -dx);
            runAngle += (Math.random() - 0.5) * 1.5;
            const turnRate = config.turnRate;
            let angleDiff = runAngle - bug.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            bug.angle += angleDiff * turnRate;
            bug.speed = bug.runSpeed;

            // Tilt when turning
            bug.targetTilt = angleDiff * 0.3;

        } else if (bug.state === 'investigating') {
            let targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - bug.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            bug.angle += angleDiff * 0.05;
            bug.speed = bug.maxSpeed * 0.5;
            bug.targetTilt = 0;

        } else if (bug.state === 'watch_mouse') {
            bug.speed = 0;
            let targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - bug.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            bug.angle += angleDiff * 0.1;
            bug.targetTilt = 0;

        } else if (bug.state === 'play_dead') {
            bug.speed = 0;
            bug.targetTilt = 0;

        } else if (bug.state === 'wandering') {
            if (Math.random() < 0.005) {
                bug.state = 'resting';
                bug.restTimer = Math.random() * 100 + 50;
            }
            const wanderRate = bug.type === 'ladybug' ? 0.05 : 0.15;
            bug.angle += (Math.random() - 0.5) * wanderRate;
            if (Math.random() < 0.05) bug.targetSpeed = Math.random() * (bug.maxSpeed * 0.5) + bug.maxSpeed * 0.5;
            bug.speed += ((bug.targetSpeed || bug.maxSpeed) - bug.speed) * 0.1;
            bug.targetTilt = 0;

        } else if (bug.state === 'resting') {
            bug.speed = 0;
            bug.restTimer--;
            if (bug.restTimer <= 0) bug.state = 'wandering';
            bug.targetTilt = 0;
        }

        // Smooth tilt interpolation
        bug.tilt += (bug.targetTilt - bug.tilt) * 0.15;

        bug.x += Math.cos(bug.angle) * bug.speed;
        bug.y += Math.sin(bug.angle) * bug.speed;

        const legSpeedMultiplier = config.legSpeed;
        if (bug.speed > 0.1) bug.legPhase += bug.speed * legSpeedMultiplier;

        // Edge handling with smooth steering
        if (bug.state !== 'entering' && bug.state !== 'scared') {
            const border = 80;
            const turnForce = 0.08; // Gentle steering force

            // Left edge
            if (bug.x < border) {
                const distToEdge = border - bug.x;
                const pushAngle = 0; // Push right
                let angleDiff = pushAngle - bug.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                bug.angle += angleDiff * turnForce * (distToEdge / border);
            }

            // Right edge
            if (bug.x > width - border) {
                const distToEdge = bug.x - (width - border);
                const pushAngle = Math.PI; // Push left
                let angleDiff = pushAngle - bug.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                bug.angle += angleDiff * turnForce * (distToEdge / border);
            }

            // Top edge
            if (bug.y < border) {
                const distToEdge = border - bug.y;
                const pushAngle = Math.PI / 2; // Push down
                let angleDiff = pushAngle - bug.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                bug.angle += angleDiff * turnForce * (distToEdge / border);
            }

            // Bottom edge
            if (bug.y > height - border) {
                const distToEdge = bug.y - (height - border);
                const pushAngle = -Math.PI / 2; // Push up
                let angleDiff = pushAngle - bug.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                bug.angle += angleDiff * turnForce * (distToEdge / border);
            }

            // Hard limit to prevent escaping
            const hardLimit = 10;
            if (bug.x < hardLimit) bug.x = hardLimit;
            if (bug.x > width - hardLimit) bug.x = width - hardLimit;
            if (bug.y < hardLimit) bug.y = hardLimit;
            if (bug.y > height - hardLimit) bug.y = height - hardLimit;
        }
    }

    // ============ ANIMATION LOOP ============
    function animate() {
        ctx.clearRect(0, 0, width, height);
        updateBug();
        drawBug();

        // Performance check
        frameCount++;
        if (frameCount % 120 === 0) {
            const now = Date.now();
            const fps = 120000 / (now - lastFpsCheck);
            if (fps < 25 && !lowPerformanceMode) {
                lowPerformanceMode = true;
                console.log('Bug animation: Switched to low-performance mode');
            }
            lastFpsCheck = now;
        }

        requestAnimationFrame(animate);
    }

    // ============ EVENT LISTENERS ============
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.lastMoveTime = Date.now();
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener('click', (e) => {
        if (bug.state === 'waiting') return;

        const clickX = e.clientX;
        const clickY = e.clientY;

        const dx = clickX - bug.x;
        const dy = clickY - bug.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bug.size * 3) {
            // Play dead for cockroach
            if (bug.type === 'cockroach' && BUG_CONFIG.cockroach.playDead && Math.random() < 0.3) {
                bug.state = 'play_dead';
                bug.playDeadTimer = 60 + Math.random() * 120;
            } else {
                // Jump and run away
                bug.state = 'scared';
                bug.angle = Math.atan2(bug.y - clickY, bug.x - clickX) + (Math.random() - 0.5) * 2;
                bug.speed = bug.runSpeed * 1.5;
                bug.clickedRecently = true;
                setTimeout(() => { bug.clickedRecently = false; }, 2000);
            }
        }
    });

    init();
})();
