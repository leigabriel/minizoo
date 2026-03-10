import * as THREE from 'three';
import { getTerrainHeight } from '../components/Terrain.jsx';

const WALK_SPEED = 20;
const RUN_SPEED = 24;
const ACCELERATION = 12;
const DECELERATION = 8;
const JUMP_FORCE = 12;
const GRAVITY = 32;
const PLAYER_HEIGHT = 4.5;
const HEAD_BOB_SPEED = 14;
const HEAD_BOB_AMOUNT = 0.06;
const CAMERA_SMOOTHING = 0.15;

export function createMovementHandler(camera, state) {
    let velocityX = 0;
    let velocityZ = 0;
    let bobPhase = 0;
    let smoothPitch = 0;
    let smoothYaw = 0;
    let lastTime = performance.now();

    return function handleMovement() {
        // Frame-rate independent delta time
        const currentTime = performance.now();
        const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;

        const isRunning = state.keys["shift"];
        const maxSpeed = isRunning ? RUN_SPEED : WALK_SPEED;

        // Forward direction in world space (negative Z is forward when looking down -Z)
        const forward = new THREE.Vector3(
            -Math.sin(state.yaw),
            0,
            -Math.cos(state.yaw)
        );

        // Right direction
        const right = new THREE.Vector3(
            Math.cos(state.yaw),
            0,
            -Math.sin(state.yaw)
        );

        // Calculate target velocity from input
        let targetVX = 0;
        let targetVZ = 0;

        // WASD input
        if (state.keys["w"]) {
            targetVX += forward.x;
            targetVZ += forward.z;
        }
        if (state.keys["s"]) {
            targetVX -= forward.x;
            targetVZ -= forward.z;
        }
        if (state.keys["a"]) {
            targetVX -= right.x;
            targetVZ -= right.z;
        }
        if (state.keys["d"]) {
            targetVX += right.x;
            targetVZ += right.z;
        }

        // Joystick input
        if (state.mX !== 0 || state.mY !== 0) {
            targetVX += forward.x * (-state.mY) + right.x * state.mX;
            targetVZ += forward.z * (-state.mY) + right.z * state.mX;
        }

        // Normalize diagonal movement
        const inputMag = Math.sqrt(targetVX * targetVX + targetVZ * targetVZ);
        if (inputMag > 1) {
            targetVX /= inputMag;
            targetVZ /= inputMag;
        }

        targetVX *= maxSpeed;
        targetVZ *= maxSpeed;

        // Smooth acceleration/deceleration
        const hasInput = inputMag > 0.1;
        const accelRate = hasInput ? ACCELERATION : DECELERATION;
        const lerpFactor = 1 - Math.exp(-accelRate * dt);

        velocityX += (targetVX - velocityX) * lerpFactor;
        velocityZ += (targetVZ - velocityZ) * lerpFactor;

        // --- NEW: COLLISION DETECTION WITH OBSTACLES ---
        let nextX = camera.position.x + velocityX * dt;
        let nextZ = camera.position.z + velocityZ * dt;

        const PLAYER_RADIUS = 1.5; // Width of the player's body
        if (state.obstacles && state.obstacles.length > 0) {
            for (const obs of state.obstacles) {
                const dx = nextX - obs.x;
                const dz = nextZ - obs.z;
                const distSq = dx * dx + dz * dz;
                const minRadius = PLAYER_RADIUS + obs.radius;

                if (distSq < minRadius * minRadius) {
                    // Collision detected! Push the player back out so they slide smoothly along the object
                    const dist = Math.sqrt(distSq) || 0.1; // Prevent division by zero
                    const overlap = minRadius - dist;
                    nextX += (dx / dist) * overlap;
                    nextZ += (dz / dist) * overlap;
                }
            }
        }

        // Apply corrected positions
        const speed = Math.sqrt(velocityX * velocityX + velocityZ * velocityZ);
        camera.position.x = nextX;
        camera.position.z = nextZ;

        // Jump - physics-based
        if ((state.keys[" "] || state.keys["space"]) && !state.isJumping && state.isGrounded) {
            state.velocityY = JUMP_FORCE;
            state.isJumping = true;
            state.isGrounded = false;
        }

        // Gravity with frame-rate independence
        if (!state.isGrounded) {
            state.velocityY -= GRAVITY * dt;
            camera.position.y += state.velocityY * dt;
        }

        // Terrain following
        const groundLevel = getTerrainHeight(camera.position.x, camera.position.z) + PLAYER_HEIGHT;
        if (state.isGrounded) {
            camera.position.y = groundLevel;
        } else if (camera.position.y <= groundLevel) {
            camera.position.y = groundLevel;
            state.isGrounded = true;
            state.isJumping = false;
            state.velocityY = 0;
        }

        // Head bob
        let bobOffset = 0;
        if (state.isGrounded && speed > 0.5) {
            const bobSpeed = HEAD_BOB_SPEED * (isRunning ? 1.4 : 1);
            bobPhase += speed * dt * bobSpeed;
            bobOffset = Math.sin(bobPhase) * HEAD_BOB_AMOUNT * (isRunning ? 1.3 : 1);
        } else {
            bobPhase *= 0.9;
        }
        camera.position.y += bobOffset;

        // Smooth camera rotation
        const rotLerp = 1 - Math.exp(-CAMERA_SMOOTHING * 60 * dt);
        smoothYaw += (state.yaw - smoothYaw) * rotLerp;
        smoothPitch += (state.pitch - smoothPitch) * rotLerp;
        camera.rotation.set(smoothPitch, smoothYaw, 0, 'YXZ');
    };
}

export function setupKeyboardControls(state) {
    const handleKeyDown = (e) => {
        const key = e.key.toLowerCase();
        state.keys[key] = true;

        if (e.code === 'Space') {
            state.keys[" "] = true;
            state.keys["space"] = true;
            e.preventDefault();
        }
    };

    const handleKeyUp = (e) => {
        const key = e.key.toLowerCase();
        state.keys[key] = false;

        if (e.code === 'Space') {
            state.keys[" "] = false;
            state.keys["space"] = false;
        }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
    };
}

export function setupTouchControls(state, baseRef, stickRef, jumpBtnRef) {
    let joystickTouchId = null;
    let lookTouchId = null;

    const updateJoystick = (touch) => {
        if (!baseRef.current) return;
        const rect = baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        const maxDist = rect.width / 2 - 20;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        state.mX = dx / maxDist;
        state.mY = dy / maxDist;

        if (stickRef.current) {
            stickRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
            stickRef.current.style.transition = 'none';
        }
    };

    const resetJoystick = () => {
        state.mX = 0;
        state.mY = 0;
        state.sActive = false;
        joystickTouchId = null;
        if (stickRef.current) {
            stickRef.current.style.transform = 'translate(0px, 0px)';
            stickRef.current.style.transition = 'transform 0.15s ease-out';
        }
    };

    const isInsideElement = (touch, element) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom;
    };

    const handleTouchStart = (e) => {
        for (const touch of e.changedTouches) {
            if (jumpBtnRef?.current && isInsideElement(touch, jumpBtnRef.current)) {
                if (!state.isJumping && state.isGrounded) {
                    state.velocityY = JUMP_FORCE;
                    state.isJumping = true;
                    state.isGrounded = false;
                }
                e.preventDefault();
                continue;
            }

            if (joystickTouchId === null && baseRef.current && isInsideElement(touch, baseRef.current)) {
                joystickTouchId = touch.identifier;
                state.sActive = true;
                updateJoystick(touch);
                e.preventDefault();
                continue;
            }

            if (lookTouchId === null && joystickTouchId !== touch.identifier) {
                lookTouchId = touch.identifier;
                state.lActive = true;
                state.lx = touch.clientX;
                state.ly = touch.clientY;
            }
        }
    };

    const handleTouchMove = (e) => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId && state.sActive) {
                updateJoystick(touch);
            }

            if (touch.identifier === lookTouchId && state.lActive) {
                const dx = touch.clientX - state.lx;
                const dy = touch.clientY - state.ly;
                state.yaw -= dx * 0.004;
                state.pitch -= dy * 0.004;
                state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
                state.lx = touch.clientX;
                state.ly = touch.clientY;
            }
        }
        e.preventDefault();
    };

    const handleTouchEnd = (e) => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                resetJoystick();
            }
            if (touch.identifier === lookTouchId) {
                state.lActive = false;
                lookTouchId = null;
            }
        }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchEnd);
    };
}

export function setupMouseControls(state) {
    const handleMouseMove = (e) => {
        if (!('ontouchstart' in window) && e.buttons === 1) {
            state.yaw -= e.movementX * 0.003;
            state.pitch -= e.movementY * 0.003;
            state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch));
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("contextmenu", handleContextMenu);
    };
}