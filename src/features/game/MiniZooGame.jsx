import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { createScene, createCamera, createRenderer, createLighting } from './components/Scene.jsx';
import { createTerrain, loadTrees, loadBushes, loadRocks, createGrass, createClouds, getTerrainHeight } from './components/Terrain.jsx';
import { loadGLTFAnimals } from './components/Animals.jsx';
import {
    createMovementHandler,
    setupKeyboardControls,
    setupTouchControls,
    setupMouseControls
} from './controls/Controls.jsx';

import {
    LoadingScreen,
    MainMenu,
    GameHUD,
    SettingsPanel,
    TaskPanel,
    AnimalInfoModal,
    FeedingSuccessNotification,
    QuitModal,
    ResetTasksModal,
    Joystick,
    JumpButton,
    SprintButton,
    BottomHotbar,
    WelcomePopup,
    AllAnimalsCelebration,
    CertificateModal,
    playGameButtonSfx
} from './ui/GameUI.jsx';

import {
    getTasks,
    feedAnimal,
    isAnimalFed,
    getCompletedTasksCount,
    getTotalTasks,
    resetAllFeedingTasks
} from './utils/storage.js';

const PLAYER_HEIGHT = 0.9;
const FIRST_PERSON_EYE_OFFSET = 4.5;
const FIRST_PERSON_FOV = 70;
const THIRD_PERSON_FOV = 65;
const STATUE_CENTER = { x: 0, z: 0 };
const PLAYER_START_OFFSET = { x: 14, z: 10 };
const SETTINGS_CHANGE_EVENT = 'minizoo-settings-changed';
const CHARACTER_OPTIONS = [
    { id: 'female_1', label: 'Female Ranger', file: 'Character_Female_1.gltf', emoji: '🧭' },
    { id: 'female_2', label: 'Female Explorer', file: 'Character_Female_2.gltf', emoji: '🌿' },
    { id: 'male_1', label: 'Male Ranger', file: 'Character_Male_1.gltf', emoji: '🦺' },
    { id: 'male_2', label: 'Male Explorer', file: 'Character_Male_2.gltf', emoji: '🗺️' }
];
const STATUE_MESSAGES = [
    'HI VISITOR, HOWS YOUR EXPLORATION?',
    'WELCOME TO BULUSAN MINI ZOO!',
    'TAKE A MOMENT AND ENJOY THE VIEW!',
    'THE ANIMALS LOOK HAPPY TODAY!',
    'KEEP EXPLORING, ADVENTURER!',
    'DID YOU FEED YOUR FAVORITE ANIMAL YET?'
];
let CONTACT_SHADOW_TEXTURE = null;

function getContactShadowTexture() {
    if (CONTACT_SHADOW_TEXTURE) return CONTACT_SHADOW_TEXTURE;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.5);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    CONTACT_SHADOW_TEXTURE = new THREE.CanvasTexture(canvas);
    CONTACT_SHADOW_TEXTURE.colorSpace = THREE.SRGBColorSpace;
    CONTACT_SHADOW_TEXTURE.needsUpdate = true;
    return CONTACT_SHADOW_TEXTURE;
}

function createContactShadow(size, opacity) {
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({
            map: getContactShadowTexture(),
            transparent: true,
            opacity,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
            toneMapped: false
        })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;
    return mesh;
}

function isMusicEnabled() {
    try {
        const raw = localStorage.getItem('minizoo_settings');
        if (!raw) return true;
        const parsed = JSON.parse(raw);
        return parsed?.musicEnabled !== false;
    } catch {
        return true;
    }
}

function isSoundEnabled() {
    try {
        const raw = localStorage.getItem('minizoo_settings');
        if (!raw) return true;
        const parsed = JSON.parse(raw);
        return parsed?.soundEnabled !== false;
    } catch {
        return true;
    }
}

function addStatueLights(scene) {
    const key = new THREE.SpotLight(0xfff3d9, 1.2, 140, Math.PI / 5, 0.35, 1.2);
    key.position.set(24, 30, 18);
    key.target.position.set(STATUE_CENTER.x, 6, STATUE_CENTER.z);
    key.castShadow = false;

    const fill = new THREE.PointLight(0xd6e9ff, 0.5, 120, 2);
    fill.position.set(-18, 16, -12);

    scene.add(key);
    scene.add(key.target);
    scene.add(fill);
}

function loadCenterStatue(scene, isMobile) {
    const loader = new GLTFLoader();
    return new Promise((resolve) => {
        loader.load(
            '/bulusanstatue.glb',
            (gltf) => {
                const statue = gltf.scene;
                const terrainY = getTerrainHeight(STATUE_CENTER.x, STATUE_CENTER.z);
                statue.position.set(STATUE_CENTER.x, terrainY, STATUE_CENTER.z);

                statue.traverse((child) => {
                    if (!child.isMesh) return;
                    child.castShadow = false;
                    child.receiveShadow = false;

                    const toBasic = (mat) => {
                        if (!mat) return mat;
                        const basic = new THREE.MeshBasicMaterial();
                        if (mat.map) {
                            mat.map.colorSpace = THREE.SRGBColorSpace;
                            mat.map.needsUpdate = true;
                            basic.map = mat.map;
                        }
                        basic.side = mat.side;
                        basic.transparent = mat.transparent;
                        basic.alphaTest = mat.alphaTest;
                        mat.dispose();
                        return basic;
                    };

                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(toBasic);
                    } else {
                        child.material = toBasic(child.material);
                    }
                });

                const initialBox = new THREE.Box3().setFromObject(statue);
                const initialSize = new THREE.Vector3();
                initialBox.getSize(initialSize);

                const targetHeight = isMobile ? 8 : 10;
                const currentHeight = Math.max(initialSize.y, 0.001);
                const scale = targetHeight / currentHeight;
                statue.scale.setScalar(scale);

                const fittedBox = new THREE.Box3().setFromObject(statue);
                statue.position.y += terrainY - fittedBox.min.y;

                scene.add(statue);

                const fittedSize = new THREE.Vector3();
                fittedBox.getSize(fittedSize);
                const collisionRadius = Math.max(3.5, Math.max(fittedSize.x, fittedSize.z) * 0.42);
                resolve({ statue, collisionRadius });
            },
            undefined,
            () => resolve(null)
        );
    });
}

function MiniZooGame() {
    const containerRef = useRef(null);
    const stickRef = useRef(null);
    const baseRef = useRef(null);
    const jumpRef = useRef(null);
    const sprintRef = useRef(null);

    const welcomeTimerRef = useRef(null);
    const ambienceRef = useRef(null);
    const statueMessageTimerRef = useRef(null);
    const statueMessageHideRef = useRef(null);
    const isNearStatueRef = useRef(false);
    const soundEnabledRef = useRef(isSoundEnabled());
    const cameraModeRef = useRef('first');

    const [isTouchDevice, setIsTouchDevice] = useState(() => {
        if (typeof window === 'undefined') return false;
        return 'ontouchstart' in window
            || navigator.maxTouchPoints > 0
            || window.matchMedia('(pointer: coarse)').matches;
    });

    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [showMenu, setShowMenu] = useState(true);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tasksOpen, setTasksOpen] = useState(false);
    const [showQuitModal, setShowQuitModal] = useState(false);
    const [showResetTasksModal, setShowResetTasksModal] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showCharacterSelect, setShowCharacterSelect] = useState(false);
    const [selectedCharacterId, setSelectedCharacterId] = useState(null);
    const [cameraMode, setCameraMode] = useState('first');
    const [characterReady, setCharacterReady] = useState(false);
    const [showAllFedCelebration, setShowAllFedCelebration] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);
    const [showStatueGreeting, setShowStatueGreeting] = useState(false);
    const [statueGreetingMessage, setStatueGreetingMessage] = useState(STATUE_MESSAGES[0]);

    const [nearbyAnimal, setNearbyAnimal] = useState(null);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [animalModalPlacement, setAnimalModalPlacement] = useState('bottom');
    const [isCompactAnimalPopupDismissed, setIsCompactAnimalPopupDismissed] = useState(false);
    const [tasks, setTasks] = useState(getTasks());

    const [feedingSuccess, setFeedingSuccess] = useState({ visible: false, animalName: '' });
    const allFedCelebratedRef = useRef(false);

    // Added obstacles array to state to hold tree/rock/bush positions
    const gameStateRef = useRef({
        keys: {}, yaw: 0, pitch: 0,
        mX: 0, mY: 0, sActive: false, lActive: false, lx: 0, ly: 0,
        velocityY: 0, isJumping: false, isGrounded: true,
        playerHeight: PLAYER_HEIGHT,
        playerMoveSpeed: 0,
        playerIsMoving: false,
        playerIsRunning: false,
        currentCameraMode: 'first',
        controlsEnabled: false,
        cameraControlLockedUntil: 0,
        animationId: null, scene: null, camera: null, renderer: null,
        animals: [], clouds: [], obstacles: [], animalObstacles: [], cleanup: null, initialized: false,
        playerAnchor: null,
        playerCharacter: null,
        playerCharacterBaseYOffset: 0,
        playerShadow: null,
        playerMixer: null,
        playerActions: {},
        currentPlayerAction: null,
    });

    useEffect(() => {
        const check = () => {
            setIsTouchDevice(
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                window.matchMedia('(pointer: coarse)').matches
            );
        };
        window.addEventListener('resize', check);
        window.addEventListener('orientationchange', check);
        return () => {
            window.removeEventListener('resize', check);
            window.removeEventListener('orientationchange', check);
        };
    }, []);

    const checkNearbyAnimals = useCallback((playerPosition, animals) => {
        if (!playerPosition || !animals.length) return null;
        const pos = playerPosition;
        for (const animal of animals) {
            if (!animal.group) continue;
            const ap = animal.group.position;
            const dx = pos.x - ap.x;
            const dz = pos.z - ap.z;
            if (Math.sqrt(dx * dx + dz * dz) < 15) return animal;
        }
        return null;
    }, []);

    const getAmbience = useCallback(() => {
        if (!ambienceRef.current) {
            const audio = new Audio('/ambience.mp3');
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = 0.42;
            audio.setAttribute('playsinline', 'true');
            ambienceRef.current = audio;
        }
        return ambienceRef.current;
    }, []);

    const playAmbience = useCallback(async () => {
        if (!isMusicEnabled()) return;
        const audio = getAmbience();
        if (!audio.paused) return;
        try {
            await audio.play();
        } catch {
            // Playback can fail before a user interaction; we'll retry on next allowed interaction.
        }
    }, [getAmbience]);

    const stopAmbience = useCallback((keepPosition = true) => {
        const audio = ambienceRef.current;
        if (!audio) return;
        audio.pause();
        if (!keepPosition) {
            audio.currentTime = 0;
        }
    }, []);

    const clearStatueMessageTimers = useCallback(() => {
        if (statueMessageTimerRef.current) {
            clearTimeout(statueMessageTimerRef.current);
            statueMessageTimerRef.current = null;
        }
        if (statueMessageHideRef.current) {
            clearTimeout(statueMessageHideRef.current);
            statueMessageHideRef.current = null;
        }
    }, []);

    const showRandomStatueMessage = useCallback(() => {
        const message = STATUE_MESSAGES[Math.floor(Math.random() * STATUE_MESSAGES.length)];
        setStatueGreetingMessage(message);
        setShowStatueGreeting(true);
        if (statueMessageHideRef.current) {
            clearTimeout(statueMessageHideRef.current);
        }
        statueMessageHideRef.current = setTimeout(() => {
            setShowStatueGreeting(false);
            statueMessageHideRef.current = null;
        }, 2600);
    }, []);

    const scheduleNextStatueMessage = useCallback(() => {
        if (!isNearStatueRef.current) return;
        if (statueMessageTimerRef.current) {
            clearTimeout(statueMessageTimerRef.current);
        }
        const delay = 4500 + Math.random() * 6500;
        statueMessageTimerRef.current = setTimeout(() => {
            if (!isNearStatueRef.current) return;
            showRandomStatueMessage();
            scheduleNextStatueMessage();
        }, delay);
    }, [showRandomStatueMessage]);

    useEffect(() => {
        cameraModeRef.current = cameraMode;
        const state = gameStateRef.current;
        state.currentCameraMode = cameraMode;
        if (state.playerCharacter) {
            state.playerCharacter.visible = cameraMode !== 'first';
        }
    }, [cameraMode]);

    const cycleCameraMode = useCallback(() => {
        setCameraMode((prev) => (prev === 'first' ? 'third' : 'first'));
    }, []);

    const playPlayerAction = useCallback((name) => {
        const state = gameStateRef.current;
        const actions = state.playerActions || {};
        const actionKeys = Object.keys(actions);
        if (actionKeys.length === 0) return;

        let nextAction = actions[name];
        if (!nextAction) {
            const walkKeys = actionKeys.filter(k => k.includes('walk') || k.includes('jog') || k.includes('move') || k.includes('strafe'));
            const runKeys = actionKeys.filter(k => k.includes('run') || k.includes('sprint'));
            const idleKeys = actionKeys.filter(k => k.includes('idle') || k.includes('stand') || k.includes('breath'));

            if (name === 'walk' && walkKeys.length > 0) nextAction = actions[walkKeys[0]];
            else if (name === 'run' && runKeys.length > 0) nextAction = actions[runKeys[0]];
            else if (name === 'run' && walkKeys.length > 0) nextAction = actions[walkKeys[0]];
            else if (name === 'idle' && idleKeys.length > 0) nextAction = actions[idleKeys[0]];
            else nextAction = actions[actionKeys[0]];
        }

        if (!nextAction || nextAction === state.currentPlayerAction) return;

        if (state.currentPlayerAction) {
            state.currentPlayerAction.fadeOut(0.24);
        }
        nextAction.reset();
        nextAction.enabled = true;
        nextAction.setEffectiveWeight(1);
        nextAction.fadeIn(0.24);
        nextAction.play();
        state.currentPlayerAction = nextAction;
    }, []);

    const disposePlayerCharacter = useCallback(() => {
        const state = gameStateRef.current;
        if (state.playerMixer) {
            state.playerMixer.stopAllAction();
            state.playerMixer = null;
        }
        state.playerActions = {};
        state.currentPlayerAction = null;
        if (state.playerShadow) {
            state.playerShadow.parent?.remove(state.playerShadow);
            state.playerShadow.geometry?.dispose();
            state.playerShadow.material?.dispose?.();
            state.playerShadow = null;
        }
        if (!state.playerCharacter) return;

        const model = state.playerCharacter;
        if (state.scene) {
            state.scene.remove(model);
        }
        model.traverse((child) => {
            if (!child.isMesh) return;
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach((m) => m?.dispose?.());
            } else {
                child.material?.dispose?.();
            }
        });
        state.playerCharacter = null;
    }, []);

    const handleSelectCharacter = useCallback(async (characterOption) => {
        const state = gameStateRef.current;
        if (!state.scene || !state.playerAnchor) return;

        state.controlsEnabled = false;
        setCharacterReady(false);

        try {
            disposePlayerCharacter();

            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                loader.load(`/character/${characterOption.file}`, resolve, undefined, reject);
            });

            const model = gltf.scene;
            model.traverse((child) => {
                if (!child.isMesh) return;
                child.castShadow = false;
                child.receiveShadow = false;
                if (child.material) {
                    child.material.side = THREE.FrontSide;
                }
            });

            const baseBox = new THREE.Box3().setFromObject(model);
            const baseSize = new THREE.Vector3();
            baseBox.getSize(baseSize);
            const sourceHeight = Math.max(baseSize.y, 0.001);
            const targetHeight = 2.15;
            const fitScale = THREE.MathUtils.clamp(targetHeight / sourceHeight, 0.02, 5);
            model.scale.multiplyScalar(fitScale);

            const fittedBox = new THREE.Box3().setFromObject(model);
            state.playerCharacterBaseYOffset = -fittedBox.min.y;

            state.scene.add(model);
            state.playerCharacter = model;
            state.playerShadow = createContactShadow(2.2, 0.25);
            state.scene.add(state.playerShadow);

            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                state.playerMixer = mixer;
                state.playerActions = {};

                gltf.animations.forEach((clip) => {
                    const action = mixer.clipAction(clip);
                    action.enabled = true;
                    action.setEffectiveWeight(1);
                    state.playerActions[clip.name.toLowerCase()] = action;
                });

                state.currentPlayerAction = null;
                playPlayerAction('idle');
            }

            model.visible = cameraModeRef.current !== 'first';
            setSelectedCharacterId(characterOption.id);
            setShowCharacterSelect(false);
            setCharacterReady(true);
            state.controlsEnabled = true;

            setShowWelcome(true);
            if (welcomeTimerRef.current) {
                clearTimeout(welcomeTimerRef.current);
            }
            welcomeTimerRef.current = setTimeout(() => {
                setShowWelcome(false);
                welcomeTimerRef.current = null;
            }, 3000);
        } catch (error) {
            console.error('Failed to load selected character:', error);
            state.controlsEnabled = false;
            setCharacterReady(false);
        }
    }, [disposePlayerCharacter, playPlayerAction]);

    const initGame = useCallback(async () => {
        const state = gameStateRef.current;
        if (state.initialized) return;

        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        try {
            const scene = createScene(); state.scene = scene;
            const camera = createCamera(); state.camera = camera;
            const renderer = createRenderer(containerRef.current); state.renderer = renderer;

            createLighting(scene);
            createTerrain(scene);
            addStatueLights(scene);
            setLoadProgress(15);

            const statuePromise = loadCenterStatue(scene, isMobile);

            const { loadPromise: treesP } = loadTrees(scene, isMobile ? 50 : 80);
            const { loadPromise: bushesP } = loadBushes(scene, isMobile ? 40 : 70);
            const { loadPromise: rocksP } = loadRocks(scene, isMobile ? 20 : 40);

            setLoadProgress(30);
            // Wait for all objects to load, and extract the resulting arrays!
            const [loadedTrees, loadedBushes, loadedRocks, statueResult] = await Promise.all([treesP, bushesP, rocksP, statuePromise]);

            // Create collision obstacles based on the loaded meshes
            state.obstacles = [];
            loadedTrees.forEach(t => state.obstacles.push({ x: t.position.x, z: t.position.z, radius: t.scale.x * 0.8 }));
            loadedRocks.forEach(r => state.obstacles.push({ x: r.position.x, z: r.position.z, radius: r.scale.x * 1.1 }));
            loadedBushes.forEach(b => state.obstacles.push({ x: b.position.x, z: b.position.z, radius: b.scale.x * 0.6 }));
            if (statueResult) {
                state.obstacles.push({
                    x: STATUE_CENTER.x,
                    z: STATUE_CENTER.z,
                    radius: statueResult.collisionRadius
                });
            }

            const spawnX = STATUE_CENTER.x + PLAYER_START_OFFSET.x;
            const spawnZ = STATUE_CENTER.z + PLAYER_START_OFFSET.z;
            camera.position.set(spawnX, getTerrainHeight(spawnX, spawnZ) + PLAYER_HEIGHT, spawnZ);
            const yawToCenter = Math.atan2(-(STATUE_CENTER.x - spawnX), -(STATUE_CENTER.z - spawnZ));
            state.yaw = yawToCenter;
            state.pitch = 0;
            camera.rotation.set(0, yawToCenter, 0, 'YXZ');
            state.playerAnchor = new THREE.Object3D();
            state.playerAnchor.position.copy(camera.position);
            state.playerAnchor.rotation.copy(camera.rotation);
            state.currentCameraMode = cameraModeRef.current;
            state.controlsEnabled = false;

            createGrass(scene, isMobile ? 260 : 900);
            setLoadProgress(55);

            // Pass the obstacles to the animals so they don't walk through them either!
            state.animals = await loadGLTFAnimals(scene, state.obstacles);
            setLoadProgress(80);

            state.clouds = createClouds(scene, isMobile ? 8 : 12);
            setLoadProgress(95);

            const handleMovement = createMovementHandler(state.playerAnchor, state);
            const desiredCameraPosition = new THREE.Vector3();
            const lookTarget = new THREE.Vector3();

            let lastTime = performance.now();
            let nearbyTimer = 0;
            let ambientSoundTimer = 0;
            let statueCheckTimer = 0;
            const nearbyInterval = isMobile ? 0.3 : 0.2;

            const animate = () => {
                state.animationId = requestAnimationFrame(animate);
                const now = performance.now();
                const dt = Math.min((now - lastTime) * 0.001, 0.1);
                lastTime = now;

                // Reduce CPU usage while hidden.
                if (document.hidden) {
                    return;
                }

                state.animalObstacles = state.animals
                    .filter(a => a?.group)
                    .map((a) => ({
                        x: a.group.position.x,
                        z: a.group.position.z,
                        radius: Math.max(1.15, a.radius ?? a.config?.collisionRadius ?? ((a.config?.scale ?? 1) * 0.7))
                    }));

                handleMovement();
                const playerPosition = state.playerAnchor ? state.playerAnchor.position : camera.position;

                if (state.playerCharacter) {
                    const characterGround = getTerrainHeight(playerPosition.x, playerPosition.z);
                    const jumpOffset = Math.max(
                        0,
                        playerPosition.y - (characterGround + (state.playerHeight ?? PLAYER_HEIGHT))
                    );
                    state.playerCharacter.position.set(
                        playerPosition.x,
                        characterGround + state.playerCharacterBaseYOffset + jumpOffset,
                        playerPosition.z
                    );
                    const facingOffset = cameraModeRef.current === 'third' ? Math.PI : 0;
                    const desiredCharacterYaw = state.yaw + facingOffset;
                    const currentY = state.playerCharacter.rotation.y;
                    const angleDelta = Math.atan2(Math.sin(desiredCharacterYaw - currentY), Math.cos(desiredCharacterYaw - currentY));
                    state.playerCharacter.rotation.y += angleDelta * Math.min(1, dt * 10);

                    if (state.playerShadow) {
                        state.playerShadow.position.set(playerPosition.x, characterGround + 0.055, playerPosition.z);
                        state.playerShadow.visible = cameraModeRef.current === 'third';
                        const shadowOpacity = THREE.MathUtils.clamp(0.25 - jumpOffset * 0.1, 0.1, 0.25);
                        state.playerShadow.material.opacity = shadowOpacity;
                    }
                }

                if (state.playerMixer) {
                    if (!state.playerIsMoving) {
                        playPlayerAction('idle');
                    } else if (state.playerIsRunning) {
                        playPlayerAction('run');
                    } else {
                        playPlayerAction('walk');
                    }
                    state.playerMixer.update(dt);
                }

                const targetFov = cameraModeRef.current === 'first' ? FIRST_PERSON_FOV : THIRD_PERSON_FOV;
                if (Math.abs(camera.fov - targetFov) > 0.05) {
                    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 10);
                    camera.updateProjectionMatrix();
                }

                if (cameraModeRef.current === 'third' && state.playerAnchor) {
                    const followDistance = isMobile ? 5.6 : 7.0;
                    const followHeight = isMobile ? 3.0 : 3.5;
                    const pitchLift = Math.sin(-state.pitch) * 1.3;

                    desiredCameraPosition.set(
                        playerPosition.x + Math.sin(state.yaw) * followDistance,
                        playerPosition.y + followHeight + pitchLift,
                        playerPosition.z + Math.cos(state.yaw) * followDistance
                    );

                    const minCameraY = getTerrainHeight(desiredCameraPosition.x, desiredCameraPosition.z) + 1.4;
                    desiredCameraPosition.y = Math.max(desiredCameraPosition.y, minCameraY);

                    const cameraLerp = 1 - Math.exp(-8 * dt);
                    camera.position.lerp(desiredCameraPosition, cameraLerp);
                    lookTarget.set(playerPosition.x, playerPosition.y + 2.1, playerPosition.z);
                    camera.lookAt(lookTarget);
                } else if (state.playerAnchor) {
                    const minEyeY = getTerrainHeight(playerPosition.x, playerPosition.z)
                        + (state.playerHeight ?? PLAYER_HEIGHT)
                        + FIRST_PERSON_EYE_OFFSET;
                    camera.position.set(
                        playerPosition.x,
                        Math.max(playerPosition.y + FIRST_PERSON_EYE_OFFSET, minEyeY),
                        playerPosition.z
                    );
                    camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
                }

                state.animals.forEach(a => {
                    if (a.group) {
                        const dist = playerPosition.distanceTo(a.group.position);
                        const updateRange = isMobile ? 130 : 200;
                        if (dist < updateRange) a.update(now * 0.001, dt);
                    }
                });

                state.clouds.forEach(c => {
                    c.position.x += 0.02 * dt * 60;
                    if (c.position.x > 400) c.position.x = -400;
                });

                ambientSoundTimer += dt;
                if (ambientSoundTimer >= 0.35) {
                    ambientSoundTimer = 0;
                    const nowSeconds = now * 0.001;
                    const soundEnabled = soundEnabledRef.current;
                    state.animals.forEach((animal) => {
                        animal.maybePlayAmbientSound?.(nowSeconds, playerPosition, soundEnabled);
                    });
                }

                statueCheckTimer += dt;
                if (statueCheckTimer >= 0.2) {
                    statueCheckTimer = 0;
                    const dx = playerPosition.x - STATUE_CENTER.x;
                    const dz = playerPosition.z - STATUE_CENTER.z;
                    const nearStatue = (dx * dx + dz * dz) <= (26 * 26);

                    if (nearStatue && !isNearStatueRef.current) {
                        isNearStatueRef.current = true;
                        showRandomStatueMessage();
                        scheduleNextStatueMessage();
                    } else if (!nearStatue && isNearStatueRef.current) {
                        isNearStatueRef.current = false;
                        clearStatueMessageTimers();
                        setShowStatueGreeting(false);
                    }
                }

                nearbyTimer += dt;
                if (nearbyTimer > nearbyInterval) {
                    nearbyTimer = 0;
                    setNearbyAnimal(checkNearbyAnimals(playerPosition, state.animals));
                }

                renderer.render(scene, camera);
            };
            animate();

            setLoadProgress(100);

            const handleResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', handleResize);

            const cleanupKeyboard = setupKeyboardControls(state);
            const cleanupTouch = setupTouchControls(state, baseRef, stickRef, jumpRef, sprintRef);
            const cleanupMouse = setupMouseControls(state);

            state.cleanup = () => {
                if (state.animationId) cancelAnimationFrame(state.animationId);
                window.removeEventListener('resize', handleResize);
                cleanupKeyboard();
                cleanupTouch();
                cleanupMouse();
                clearStatueMessageTimers();
                state.animals.forEach(a => a.dispose?.());
                disposePlayerCharacter();
                if (renderer) {
                    renderer.dispose();
                    if (containerRef.current && renderer.domElement) {
                        containerRef.current.removeChild(renderer.domElement);
                    }
                }
            };

            state.initialized = true;
            await new Promise(resolve => setTimeout(resolve, 300));
            setIsLoading(false);
        } catch (err) {
            console.error('Game init failed:', err);
            setIsLoading(false);
        }
    }, [checkNearbyAnimals, clearStatueMessageTimers, disposePlayerCharacter, playPlayerAction, scheduleNextStatueMessage, showRandomStatueMessage]);

    const handleStartGame = useCallback(() => {
        const state = gameStateRef.current;
        setShowMenu(false);
        setGameStarted(true);
        setTasks(getTasks());
        setCameraMode('first');
        setShowCharacterSelect(true);
        setSelectedCharacterId(null);
        setCharacterReady(false);
        state.controlsEnabled = false;
        setShowWelcome(false);
        playAmbience();
    }, [playAmbience]);
    const handleMenuClick = useCallback(() => setSettingsOpen(true), []);
    const handleTasksClick = useCallback(() => setTasksOpen(true), []);
    const handleResetTasks = useCallback(() => {
        setShowResetTasksModal(true);
    }, []);
    const handleConfirmResetTasks = useCallback(() => {
        setShowResetTasksModal(false);
        resetAllFeedingTasks();
        setTasks(getTasks());
        allFedCelebratedRef.current = false;
        setShowAllFedCelebration(false);
        setShowCertificate(false);
        setFeedingSuccess({ visible: false, animalName: '' });
    }, []);
    const handleCancelResetTasks = useCallback(() => setShowResetTasksModal(false), []);
    const handleQuitRequest = useCallback(() => { setSettingsOpen(false); setShowQuitModal(true); }, []);
    const handleConfirmQuit = useCallback(() => {
        setShowQuitModal(false);
        setShowResetTasksModal(false);
        stopAmbience(true);
        setSettingsOpen(false);
        setTasksOpen(false);
        setSelectedAnimal(null);
        setNearbyAnimal(null);
        setIsCompactAnimalPopupDismissed(false);
        setShowWelcome(false);
        setShowCharacterSelect(false);
        setSelectedCharacterId(null);
        setCharacterReady(false);
        setCameraMode('first');
        setShowAllFedCelebration(false);
        setShowCertificate(false);
        setGameStarted(false);
        setShowMenu(true);
    }, [stopAmbience]);
    const handleCancelQuit = useCallback(() => setShowQuitModal(false), []);

    const handleViewDetails = useCallback(() => {
        if (!nearbyAnimal) return;
        const info = nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config;
        setSelectedAnimal(info);
        setIsCompactAnimalPopupDismissed(false);
        setAnimalModalPlacement('center');
    }, [nearbyAnimal]);

    const handleFeedAnimal = useCallback(() => {
        if (!nearbyAnimal) return;
        const info = nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config;
        if (isSoundEnabled()) {
            nearbyAnimal.playSound?.();
        }
        feedAnimal(info.name);
        setTasks(getTasks());
        setFeedingSuccess({ visible: true, animalName: info.name });
    }, [nearbyAnimal]);

    const handleFeedFromModal = useCallback(() => {
        if (!selectedAnimal) return;
        if (isSoundEnabled()) {
            const state = gameStateRef.current;
            const match = state.animals.find(a => {
                const info = a.getInfo ? a.getInfo() : a.config;
                return info?.name === selectedAnimal.name;
            });
            match?.playSound?.();
        }
        feedAnimal(selectedAnimal.name);
        setTasks(getTasks());
        setFeedingSuccess({ visible: true, animalName: selectedAnimal.name });
        if (animalModalPlacement === 'center') {
            setAnimalModalPlacement('bottom');
            setSelectedAnimal(null);
            setIsCompactAnimalPopupDismissed(false);
        }
    }, [selectedAnimal, animalModalPlacement]);

    const handleHideFeedSuccess = useCallback(() => setFeedingSuccess({ visible: false, animalName: '' }), []);
    const handleCloseAnimalModal = useCallback(() => {
        if (animalModalPlacement === 'center') {
            setAnimalModalPlacement('bottom');
            setSelectedAnimal(null);
            return;
        }
        setIsCompactAnimalPopupDismissed(true);
        setSelectedAnimal(null);
    }, [animalModalPlacement]);

    useEffect(() => {
        const info = nearbyAnimal ? (nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config) : null;
        if (!info) {
            setTimeout(() => {
                setIsCompactAnimalPopupDismissed(false);
                setSelectedAnimal(null);
            }, 0);
            return;
        }
        if (animalModalPlacement !== 'center') {
            setTimeout(() => {
                setIsCompactAnimalPopupDismissed(false);
            }, 0);
        }
    }, [nearbyAnimal, animalModalPlacement]);

    useEffect(() => {
        const onKey = e => {
            const key = e.key.toLowerCase();
            if (key === 'e' && nearbyAnimal && gameStarted && characterReady) {
                const info = nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config;
                setSelectedAnimal(info);
                setAnimalModalPlacement('center');
                setIsCompactAnimalPopupDismissed(false);
            }
            if (key === 'f' && nearbyAnimal && !selectedAnimal && gameStarted && characterReady) {
                const info = nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config;
                if (isSoundEnabled()) {
                    nearbyAnimal.playSound?.();
                }
                feedAnimal(info.name);
                setTasks(getTasks());
                setFeedingSuccess({ visible: true, animalName: info.name });
            }
            if (key === 'v' && gameStarted && characterReady) {
                cycleCameraMode();
            }
            if (key === 'escape') {
                if (showCharacterSelect) {
                    return;
                }
                if (animalModalPlacement === 'center' && selectedAnimal) {
                    setAnimalModalPlacement('bottom');
                    setSelectedAnimal(null);
                }
                else if (nearbyAnimal) {
                    setIsCompactAnimalPopupDismissed(true);
                    setSelectedAnimal(null);
                }
                else if (settingsOpen) setSettingsOpen(false);
                else if (tasksOpen) setTasksOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [nearbyAnimal, selectedAnimal, gameStarted, settingsOpen, tasksOpen, animalModalPlacement, characterReady, showCharacterSelect, cycleCameraMode]);

    useEffect(() => {
        const syncSoundEnabled = () => {
            soundEnabledRef.current = isSoundEnabled();
        };

        syncSoundEnabled();

        const onStorage = (e) => {
            if (!e || e.key === 'minizoo_settings' || e.key === null) {
                syncSoundEnabled();
            }
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener(SETTINGS_CHANGE_EVENT, syncSoundEnabled);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(SETTINGS_CHANGE_EVENT, syncSoundEnabled);
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        const state = gameStateRef.current;
        const t = setTimeout(() => { if (mounted && containerRef.current) initGame(); }, 100);
        return () => {
            mounted = false;
            clearTimeout(t);
            clearStatueMessageTimers();
            isNearStatueRef.current = false;
            setShowStatueGreeting(false);
            if (welcomeTimerRef.current) {
                clearTimeout(welcomeTimerRef.current);
                welcomeTimerRef.current = null;
            }
            stopAmbience(false);
            ambienceRef.current = null;
            state.cleanup?.();
        };
    }, [clearStatueMessageTimers, initGame, stopAmbience]);

    useEffect(() => {
        if (!gameStarted) return;

        const applyMusicState = () => {
            if (document.hidden) {
                stopAmbience(true);
                return;
            }
            if (isMusicEnabled()) {
                playAmbience();
            } else {
                stopAmbience(true);
            }
        };

        applyMusicState();

        const onSettingsChanged = () => {
            applyMusicState();
        };

        const onStorage = (e) => {
            if (!e || e.key === 'minizoo_settings' || e.key === null) {
                applyMusicState();
            }
        };

        const onVisibilityChange = () => {
            applyMusicState();
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener(SETTINGS_CHANGE_EVENT, onSettingsChanged);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(SETTINGS_CHANGE_EVENT, onSettingsChanged);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            stopAmbience(true);
        };
    }, [gameStarted, playAmbience, stopAmbience]);

    const completedCount = getCompletedTasksCount();
    const totalCount = getTotalTasks();

    useEffect(() => {
        if (!gameStarted) {
            allFedCelebratedRef.current = false;
            return;
        }

        if (totalCount <= 0) return;

        const allFedNow = completedCount === totalCount;
        if (!allFedNow || allFedCelebratedRef.current) return;

        allFedCelebratedRef.current = true;
        playGameButtonSfx('task-complete');
        setShowAllFedCelebration(true);
    }, [completedCount, gameStarted, totalCount]);

    useEffect(() => {
        const onDocClick = (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            if (!target.closest('button, [data-ui-button="true"]')) return;
            if (target.closest('[data-sfx-self="true"]')) return;
            playGameButtonSfx('tap');
        };

        document.addEventListener('click', onDocClick, true);
        return () => {
            document.removeEventListener('click', onDocClick, true);
        };
    }, []);

    const nearbyAnimalInfo = nearbyAnimal ? (nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config) : null;
    const compactAnimal = (!isCompactAnimalPopupDismissed && animalModalPlacement === 'bottom') ? nearbyAnimalInfo : null;
    const modalAnimal = animalModalPlacement === 'center' ? selectedAnimal : compactAnimal;
    const isModalAnimalFed = modalAnimal ? isAnimalFed(modalAnimal.name) : false;

    return (
        <div className="relative w-full h-dvh overflow-hidden"
            style={{ touchAction: 'manipulation', background: 'linear-gradient(to bottom, #7dd3fc, #bae6fd)' }}>
            <div ref={containerRef} className="absolute inset-0" />
            {isLoading && <LoadingScreen progress={loadProgress} />}
            {!isLoading && showMenu && <MainMenu onStart={handleStartGame} isVisible={showMenu} />}
            {gameStarted && (
                <>
                    <WelcomePopup visible={showWelcome} message="welcome to zoo, enjoy" />
                    <WelcomePopup visible={showStatueGreeting} message={statueGreetingMessage} />
                    {characterReady && (
                        <button
                            data-ui-button="true"
                            type="button"
                            onClick={cycleCameraMode}
                            style={{
                                position: 'absolute',
                                top: isTouchDevice ? 98 : 86,
                                right: 16,
                                zIndex: 70,
                                border: '2px solid rgba(15,23,42,0.35)',
                                background: 'rgba(255,255,255,0.95)',
                                color: '#0f172a',
                                borderRadius: 999,
                                fontWeight: 800,
                                fontSize: 12,
                                padding: '8px 12px',
                                boxShadow: '0 6px 18px rgba(15,23,42,0.16)',
                                cursor: 'pointer'
                            }}
                            title="Toggle camera view (V)"
                        >
                            {cameraMode === 'first' ? 'First Person' : 'Third Person'}
                        </button>
                    )}
                    <GameHUD
                        onMenuClick={handleMenuClick}
                        onTasksClick={handleTasksClick}
                        onResetTasks={handleResetTasks}
                        completedTasks={completedCount}
                        totalTasks={totalCount}
                    />
                    <Joystick baseRef={baseRef} stickRef={stickRef} />
                    <JumpButton jumpRef={jumpRef} />
                    <SprintButton sprintRef={sprintRef} />
                    <BottomHotbar
                        gameStarted={gameStarted}
                        completedTasks={completedCount}
                        totalTasks={totalCount}
                        onMenuClick={handleMenuClick}
                        onTasksClick={handleTasksClick}
                    />
                    <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onQuit={handleQuitRequest} />
                    <TaskPanel isOpen={tasksOpen} onClose={() => setTasksOpen(false)} tasks={tasks} onTaskClick={() => setTasksOpen(false)} />
                    <AnimalInfoModal
                        animal={modalAnimal}
                        onClose={handleCloseAnimalModal}
                        onFeed={animalModalPlacement === 'center' ? handleFeedFromModal : handleFeedAnimal}
                        isFed={isModalAnimalFed}
                        placement={animalModalPlacement}
                        preview={animalModalPlacement === 'bottom'}
                        onView={handleViewDetails}
                        bottomOffset={isTouchDevice ? 'max(132px, env(safe-area-inset-bottom) + 96px)' : 'max(84px, env(safe-area-inset-bottom) + 48px)'}
                    />
                    <FeedingSuccessNotification visible={feedingSuccess.visible} animalName={feedingSuccess.animalName} onHide={handleHideFeedSuccess} />

                    {showCharacterSelect && (
                        <div
                            data-ui-modal="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 120,
                                background: 'rgba(2, 6, 23, 0.48)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 18,
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <div
                                style={{
                                    width: 'min(760px, 96vw)',
                                    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
                                    border: '2px solid rgba(30,41,59,0.12)',
                                    borderRadius: 20,
                                    boxShadow: '0 22px 58px rgba(15,23,42,0.28)',
                                    padding: isTouchDevice ? 16 : 20
                                }}
                            >
                                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: isTouchDevice ? 20 : 24, fontWeight: 900 }}>Choose Your Character</h3>
                                    <p style={{ margin: '6px 0 0', color: '#334155', fontSize: 13, fontWeight: 700 }}>Pick one to start exploring the zoo.</p>
                                </div>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: isTouchDevice ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))',
                                        gap: 10
                                    }}
                                >
                                    {CHARACTER_OPTIONS.map((character) => {
                                        const isSelected = selectedCharacterId === character.id;
                                        return (
                                            <button
                                                key={character.id}
                                                data-ui-button="true"
                                                type="button"
                                                onClick={() => handleSelectCharacter(character)}
                                                style={{
                                                    all: 'unset',
                                                    cursor: 'pointer',
                                                    background: isSelected ? 'linear-gradient(180deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                                                    border: `2px solid ${isSelected ? '#059669' : 'rgba(148,163,184,0.45)'}`,
                                                    borderRadius: 16,
                                                    padding: '14px 10px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minHeight: isTouchDevice ? 98 : 114,
                                                    boxShadow: isSelected ? '0 12px 24px rgba(5,150,105,0.26)' : '0 6px 14px rgba(15,23,42,0.1)'
                                                }}
                                            >
                                                <span style={{ fontSize: 30, lineHeight: 1 }}>{character.emoji}</span>
                                                <span style={{ marginTop: 8, textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{character.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            <QuitModal isOpen={showQuitModal} onConfirm={handleConfirmQuit} onCancel={handleCancelQuit} />
            <AllAnimalsCelebration
                visible={showAllFedCelebration}
                onClose={() => setShowAllFedCelebration(false)}
                onViewCertificate={() => {
                    setShowAllFedCelebration(false);
                    setShowCertificate(true);
                }}
            />
            <ResetTasksModal
                isOpen={showResetTasksModal}
                onConfirm={handleConfirmResetTasks}
                onCancel={handleCancelResetTasks}
            />
            <CertificateModal
                isOpen={showCertificate}
                onClose={() => setShowCertificate(false)}
                playerName="Explorer"
                totalAnimals={totalCount}
            />
        </div>
    );
}

export default MiniZooGame;