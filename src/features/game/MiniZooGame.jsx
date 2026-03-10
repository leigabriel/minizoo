import React, { useEffect, useRef, useState, useCallback } from 'react';

import { createScene, createCamera, createRenderer, createLighting } from './components/Scene.jsx';
import { createTerrain, loadTrees, loadBushes, loadRocks, createGrass, createClouds } from './components/Terrain.jsx';
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
    InteractionPrompt,
    MobileInteractionButtons,
    AnimalInfoModal,
    FeedingSuccessNotification,
    QuitModal,
    Joystick,
    JumpButton,
    CameraSystem,
    BottomHotbar,
    BULUSAN_ZOO_URL
} from './ui/GameUI.jsx';

import {
    getTasks,
    feedAnimal,
    isAnimalFed,
    getCompletedTasksCount,
    getTotalTasks
} from './utils/storage.js';

function MiniZooGame() {
    const containerRef = useRef(null);
    const stickRef = useRef(null);
    const baseRef = useRef(null);
    const jumpRef = useRef(null);

    const cameraRef = useRef({ capture: null, openGallery: null });

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

    const [nearbyAnimal, setNearbyAnimal] = useState(null);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [tasks, setTasks] = useState(getTasks());

    const [feedingSuccess, setFeedingSuccess] = useState({ visible: false, animalName: '' });

    const [photoCount, setPhotoCount] = useState(() => {
        try { const s = localStorage.getItem('minizoo_photos'); return s ? JSON.parse(s).length : 0; }
        catch { return 0; }
    });

    // Added obstacles array to state to hold tree/rock/bush positions
    const gameStateRef = useRef({
        keys: {}, yaw: 0, pitch: 0,
        mX: 0, mY: 0, sActive: false, lActive: false, lx: 0, ly: 0,
        velocityY: 0, isJumping: false, isGrounded: true,
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
            setLoadProgress(15);

            const { loadPromise: treesP } = loadTrees(scene, isMobile ? 50 : 80);
            const { loadPromise: bushesP } = loadBushes(scene, isMobile ? 40 : 70);
            const { loadPromise: rocksP } = loadRocks(scene, isMobile ? 20 : 40);

            setLoadProgress(30);
            // Wait for all objects to load, and extract the resulting arrays!
            const [loadedTrees, loadedBushes, loadedRocks] = await Promise.all([treesP, bushesP, rocksP]);

            // Create collision obstacles based on the loaded meshes
            state.obstacles = [];
            loadedTrees.forEach(t => state.obstacles.push({ x: t.position.x, z: t.position.z, radius: t.scale.x * 0.8 }));
            loadedRocks.forEach(r => state.obstacles.push({ x: r.position.x, z: r.position.z, radius: r.scale.x * 1.1 }));
            loadedBushes.forEach(b => state.obstacles.push({ x: b.position.x, z: b.position.z, radius: b.scale.x * 0.6 }));

            createGrass(scene, isMobile ? 600 : 2500);
            setLoadProgress(55);

            // Pass the obstacles to the animals so they don't walk through them either!
            state.animals = await loadGLTFAnimals(scene, state.obstacles);
            setLoadProgress(80);

            state.clouds = createClouds(scene, isMobile ? 12 : 18);
            setLoadProgress(95);

            const handleMovement = createMovementHandler(camera, state);

            let lastTime = performance.now();
            let nearbyTimer = 0;
            const nearbyInterval = isMobile ? 0.3 : 0.2;

            const animate = () => {
                state.animationId = requestAnimationFrame(animate);
                const now = performance.now();
                const dt = Math.min((now - lastTime) * 0.001, 0.1);
                lastTime = now;

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
    }, [checkNearbyAnimals]);

    useEffect(() => {
        const onKey = e => {
            const key = e.key.toLowerCase();
            if (key === 'e' && nearbyAnimal && !selectedAnimal && gameStarted) {
                setSelectedAnimal(nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config);
            }
            if (key === 'f' && nearbyAnimal && !selectedAnimal && gameStarted) {
                handleFeedAnimal();
            }
            if (key === 'escape') {
                if (selectedAnimal) setSelectedAnimal(null);
                else if (settingsOpen) setSettingsOpen(false);
                else if (tasksOpen) setTasksOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [nearbyAnimal, selectedAnimal, gameStarted, settingsOpen, tasksOpen]);

    useEffect(() => {
        let mounted = true;
        const t = setTimeout(() => { if (mounted && containerRef.current) initGame(); }, 100);
        return () => {
            mounted = false;
            clearTimeout(t);
            gameStateRef.current.cleanup?.();
        };
    }, [initGame]);

    useEffect(() => {
        if (!gameStarted) return;
        const sync = () => {
            try { const s = localStorage.getItem('minizoo_photos'); setPhotoCount(s ? JSON.parse(s).length : 0); }
            catch { }
        };
        const id = setInterval(sync, 800);
        return () => clearInterval(id);
    }, [gameStarted]);

    const handleStartGame = useCallback(() => { setShowMenu(false); setGameStarted(true); }, []);
    const handleMenuClick = useCallback(() => setSettingsOpen(true), []);
    const handleTasksClick = useCallback(() => setTasksOpen(true), []);
    const handleQuitRequest = useCallback(() => { setSettingsOpen(false); setShowQuitModal(true); }, []);
    const handleConfirmQuit = useCallback(() => { setShowQuitModal(false); window.location.href = BULUSAN_ZOO_URL; }, []);
    const handleCancelQuit = useCallback(() => setShowQuitModal(false), []);

    const handleViewDetails = useCallback(() => {
        if (nearbyAnimal) setSelectedAnimal(nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config);
    }, [nearbyAnimal]);

    const handleFeedAnimal = useCallback(() => {
        if (!nearbyAnimal) return;
        const info = nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config;
        feedAnimal(info.name);
        setTasks(getTasks());
        setFeedingSuccess({ visible: true, animalName: info.name });
        if (selectedAnimal) setSelectedAnimal(null);
    }, [nearbyAnimal, selectedAnimal]);

    const handleFeedFromModal = useCallback(() => {
        if (!selectedAnimal) return;
        feedAnimal(selectedAnimal.name);
        setTasks(getTasks());
        setFeedingSuccess({ visible: true, animalName: selectedAnimal.name });
        setSelectedAnimal(null);
    }, [selectedAnimal]);

    const handleHideFeedSuccess = useCallback(() => setFeedingSuccess({ visible: false, animalName: '' }), []);
    const handleCloseAnimalModal = useCallback(() => setSelectedAnimal(null), []);

    const nearbyAnimalInfo = nearbyAnimal ? (nearbyAnimal.getInfo ? nearbyAnimal.getInfo() : nearbyAnimal.config) : null;
    const isSelectedFed = selectedAnimal ? isAnimalFed(selectedAnimal.name) : false;
    const completedCount = getCompletedTasksCount();
    const totalCount = getTotalTasks();

    return (
        <div className="relative w-full h-screen overflow-hidden"
            style={{ touchAction: 'none', background: 'linear-gradient(to bottom, #7dd3fc, #bae6fd)' }}>
            <div ref={containerRef} className="absolute inset-0" />
            {isLoading && <LoadingScreen progress={loadProgress} />}
            {!isLoading && showMenu && <MainMenu onStart={handleStartGame} isVisible={showMenu} />}
            {gameStarted && (
                <>
                    <GameHUD
                        onMenuClick={handleMenuClick}
                        onTasksClick={handleTasksClick}
                        completedTasks={completedCount}
                        totalTasks={totalCount}
                    />
                    <Joystick baseRef={baseRef} stickRef={stickRef} />
                    <JumpButton jumpRef={jumpRef} />
                    <InteractionPrompt
                        visible={!!nearbyAnimal && !selectedAnimal}
                        onFeed={handleFeedAnimal}
                        onViewDetails={handleViewDetails}
                        animalName={nearbyAnimalInfo?.name || 'Animal'}
                        isTouchDevice={isTouchDevice}
                    />
                    {isTouchDevice && (
                        <MobileInteractionButtons
                            visible={!!nearbyAnimal && !selectedAnimal}
                            onFeed={handleFeedAnimal}
                            onViewDetails={handleViewDetails}
                        />
                    )}
                    <CameraSystem
                        gameStarted={gameStarted}
                        containerRef={containerRef}
                        nearbyAnimalName={nearbyAnimalInfo?.name || null}
                        onRegister={handlers => { cameraRef.current = handlers; }}
                    />
                    <BottomHotbar
                        gameStarted={gameStarted}
                        completedTasks={completedCount}
                        totalTasks={totalCount}
                        photos={photoCount}
                        onCameraClick={() => cameraRef.current?.capture?.()}
                        onGalleryClick={() => cameraRef.current?.openGallery?.()}
                    />
                    <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onQuit={handleQuitRequest} />
                    <TaskPanel isOpen={tasksOpen} onClose={() => setTasksOpen(false)} tasks={tasks} onTaskClick={() => setTasksOpen(false)} />
                    <AnimalInfoModal animal={selectedAnimal} onClose={handleCloseAnimalModal} onFeed={handleFeedFromModal} isFed={isSelectedFed} />
                    <FeedingSuccessNotification visible={feedingSuccess.visible} animalName={feedingSuccess.animalName} onHide={handleHideFeedSuccess} />
                </>
            )}
            <QuitModal isOpen={showQuitModal} onConfirm={handleConfirmQuit} onCancel={handleCancelQuit} />
        </div>
    );
}

export default MiniZooGame;