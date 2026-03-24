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
    Joystick,
    JumpButton,
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

const PLAYER_HEIGHT = 4.5;
const STATUE_CENTER = { x: 0, z: 0 };
const PLAYER_START_OFFSET = { x: 14, z: 10 };
const SETTINGS_CHANGE_EVENT = 'minizoo-settings-changed';
const STATUE_MESSAGES = [
    'HI VISITOR, HOWS YOUR EXPLORATION?',
    'WELCOME TO BULUSAN MINI ZOO!',
    'TAKE A MOMENT AND ENJOY THE VIEW!',
    'THE ANIMALS LOOK HAPPY TODAY!',
    'KEEP EXPLORING, ADVENTURER!',
    'DID YOU FEED YOUR FAVORITE ANIMAL YET?'
];

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

    const welcomeTimerRef = useRef(null);
    const ambienceRef = useRef(null);
    const statueMessageTimerRef = useRef(null);
    const statueMessageHideRef = useRef(null);
    const isNearStatueRef = useRef(false);
    const soundEnabledRef = useRef(isSoundEnabled());

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
    const [showWelcome, setShowWelcome] = useState(false);
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
        cameraControlLockedUntil: 0,
        animationId: null, scene: null, camera: null, renderer: null,
        animals: [], clouds: [], obstacles: [], cleanup: null, initialized: false
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

    const checkNearbyAnimals = useCallback((camera, animals) => {
        if (!camera || !animals.length) return null;
        const pos = camera.position;
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

            createGrass(scene, isMobile ? 260 : 900);
            setLoadProgress(55);

            // Pass the obstacles to the animals so they don't walk through them either!
            state.animals = await loadGLTFAnimals(scene, state.obstacles);
            setLoadProgress(80);

            state.clouds = createClouds(scene, isMobile ? 8 : 12);
            setLoadProgress(95);

            const handleMovement = createMovementHandler(camera, state);

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

                handleMovement();

                state.animals.forEach(a => {
                    if (a.group) {
                        const dist = camera.position.distanceTo(a.group.position);
                        if (dist < 150 || !isMobile) a.update(now * 0.001, dt);
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
                        animal.maybePlayAmbientSound?.(nowSeconds, camera.position, soundEnabled);
                    });
                }

                statueCheckTimer += dt;
                if (statueCheckTimer >= 0.2) {
                    statueCheckTimer = 0;
                    const dx = camera.position.x - STATUE_CENTER.x;
                    const dz = camera.position.z - STATUE_CENTER.z;
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
                    setNearbyAnimal(checkNearbyAnimals(camera, state.animals));
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
            const cleanupTouch = setupTouchControls(state, baseRef, stickRef, jumpRef);
            const cleanupMouse = setupMouseControls(state);

            state.cleanup = () => {
                if (state.animationId) cancelAnimationFrame(state.animationId);
                window.removeEventListener('resize', handleResize);
                cleanupKeyboard();
                cleanupTouch();
                cleanupMouse();
                clearStatueMessageTimers();
                state.animals.forEach(a => a.dispose?.());
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
    }, [checkNearbyAnimals, clearStatueMessageTimers, scheduleNextStatueMessage, showRandomStatueMessage]);

    const handleStartGame = useCallback(() => {
        setShowMenu(false);
        setGameStarted(true);
        setShowWelcome(true);
        playAmbience();
        if (welcomeTimerRef.current) {
            clearTimeout(welcomeTimerRef.current);
        }
        welcomeTimerRef.current = setTimeout(() => {
            setShowWelcome(false);
            welcomeTimerRef.current = null;
        }, 3000);
    }, [playAmbience]);
    const handleMenuClick = useCallback(() => setSettingsOpen(true), []);
    const handleTasksClick = useCallback(() => setTasksOpen(true), []);
    const handleResetTasks = useCallback(() => {
        const confirmed = window.confirm('Restart all feeding tasks? This will clear current task progress.');
        if (!confirmed) return;
        resetAllFeedingTasks();
        setTasks(getTasks());
        allFedCelebratedRef.current = false;
        setShowAllFedCelebration(false);
        setShowCertificate(false);
        setFeedingSuccess({ visible: false, animalName: '' });
    }, []);
    const handleQuitRequest = useCallback(() => { setSettingsOpen(false); setShowQuitModal(true); }, []);
    const handleConfirmQuit = useCallback(() => {
        setShowQuitModal(false);
        stopAmbience(true);
        setSettingsOpen(false);
        setTasksOpen(false);
        setSelectedAnimal(null);
        setNearbyAnimal(null);
        setIsCompactAnimalPopupDismissed(false);
        setShowWelcome(false);
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
            if (key === 'e' && nearbyAnimal && gameStarted) {
                const info = nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config;
                setSelectedAnimal(info);
                setAnimalModalPlacement('center');
                setIsCompactAnimalPopupDismissed(false);
            }
            if (key === 'f' && nearbyAnimal && !selectedAnimal && gameStarted) {
                const info = nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config;
                if (isSoundEnabled()) {
                    nearbyAnimal.playSound?.();
                }
                feedAnimal(info.name);
                setTasks(getTasks());
                setFeedingSuccess({ visible: true, animalName: info.name });
            }
            if (key === 'escape') {
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
    }, [nearbyAnimal, selectedAnimal, gameStarted, settingsOpen, tasksOpen, animalModalPlacement]);

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
                    <GameHUD
                        onMenuClick={handleMenuClick}
                        onTasksClick={handleTasksClick}
                        onResetTasks={handleResetTasks}
                        completedTasks={completedCount}
                        totalTasks={totalCount}
                    />
                    <Joystick baseRef={baseRef} stickRef={stickRef} />
                    <JumpButton jumpRef={jumpRef} />
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