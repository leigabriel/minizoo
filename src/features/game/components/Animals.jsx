import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getTerrainHeight } from './Terrain.jsx';

const ANIMAL_CONFIGS = [
    {
        file: 'Fox.gltf',
        soundFile: 'fox.mp3',
        scale: 1.2,
        speed: 0.06,
        runSpeed: 0.12,
        count: 1,
        name: 'Red Fox',
        species: 'Vulpes vulpes',
        emoji: '🦊',
        description: 'A clever and adaptable predator known for its beautiful red coat and bushy tail.'
    },
    {
        file: 'Deer.gltf',
        soundFile: 'deer.mp3',
        scale: 1.3,
        speed: 0.05,
        runSpeed: 0.11,
        count: 1,
        name: 'White-tailed Deer',
        species: 'Odocoileus virginianus',
        emoji: '🦌',
        description: 'A graceful herbivore known for the white underside of its tail, often raised as an alarm signal.'
    },
    {
        file: 'Wolf.gltf',
        soundFile: 'wolf.mp3',
        scale: 1.2,
        speed: 0.07,
        runSpeed: 0.14,
        count: 1,
        name: 'Gray Wolf',
        species: 'Canis lupus',
        emoji: '🐺',
        description: 'A social pack animal and apex predator, known for its complex communication through howling.'
    },
    {
        file: 'Horse.gltf',
        soundFile: 'horse.mp3',
        scale: 1.3,
        speed: 0.08,
        runSpeed: 0.16,
        count: 1,
        name: 'Domestic Horse',
        species: 'Equus caballus',
        emoji: '🐴',
        description: 'A majestic animal that has been a companion to humans for thousands of years.'
    },
    {
        file: 'Donkey.gltf',
        soundFile: 'donkey.mp3',
        scale: 1.5,
        speed: 0.05,
        runSpeed: 0.09,
        count: 1,
        name: 'Donkey',
        species: 'Equus asinus',
        emoji: '🫏',
        description: 'A sure-footed and hardy animal, often used as a working companion.'
    },
    {
        file: 'Cow.gltf',
        soundFile: 'cow.mp3',
        scale: 1.1,
        speed: 0.04,
        runSpeed: 0.07,
        count: 1,
        name: 'Domestic Cow',
        species: 'Bos taurus',
        emoji: '🐄',
        description: 'A gentle herbivore raised for milk and companionship in farms worldwide.'
    },
    {
        file: 'Alpaca.gltf',
        soundFile: 'alpaca.mp3',
        scale: 1.1,
        speed: 0.05,
        runSpeed: 0.09,
        count: 1,
        name: 'Alpaca',
        species: 'Vicugna pacos',
        emoji: '🦙',
        description: 'A fluffy South American camelid, prized for its soft and luxurious fleece.'
    },
    {
        file: 'Husky.gltf',
        soundFile: 'husky.mp3',
        scale: 1.6,
        speed: 0.07,
        runSpeed: 0.14,
        count: 1,
        name: 'Siberian Husky',
        species: 'Canis lupus familiaris',
        emoji: '🐕',
        description: 'An energetic sled dog breed known for its striking blue eyes and thick double coat.'
    },
    {
        file: 'ShibaInu.gltf',
        soundFile: 'shibainu.mp3',
        scale: 1.3,
        speed: 0.06,
        runSpeed: 0.11,
        count: 1,
        name: 'Shiba Inu',
        species: 'Canis lupus familiaris',
        emoji: '🐕',
        description: 'A small, agile Japanese breed known for its spirited personality and fox-like appearance.'
    },
    {
        file: 'Stag.gltf',
        soundFile: 'redd.mp3',
        scale: 1.3,
        speed: 0.06,
        runSpeed: 0.13,
        collisionRadius: 2.0,
        count: 1,
        name: 'Red Deer Stag',
        species: 'Cervus elaphus',
        emoji: '🦌',
        description: 'A magnificent male deer with impressive antlers, symbol of wild forests.'
    },
    {
        file: 'Bull.gltf',
        soundFile: 'bull.wav',
        scale: 1.4,
        speed: 0.045,
        runSpeed: 0.085,
        collisionRadius: 1.8,
        count: 1,
        name: 'Bull',
        species: 'Bos taurus',
        emoji: '🐃',
        description: 'A powerful and muscular male bovine, respected for its strength and presence.'
    }
];

const AMBIENT_SOUND_RADIUS = 55;
const AMBIENT_SOUND_RADIUS_SQ = AMBIENT_SOUND_RADIUS * AMBIENT_SOUND_RADIUS;
const AMBIENT_SOUND_MIN_INTERVAL = 5;
const AMBIENT_SOUND_MAX_INTERVAL = 11;
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

function createAnimalSound(soundFile) {
    if (!soundFile || typeof Audio === 'undefined') return null;
    const normalized = String(soundFile).replace(/^\/+/, '');
    const audio = new Audio(`/audio/${normalized}`);
    audio.preload = 'auto';
    audio.volume = 0.75;
    audio.setAttribute('playsinline', 'true');
    return audio;
}

function isBlockedByObstacle(x, z, radius, obstacles) {
    if (!obstacles || obstacles.length === 0) return false;
    for (const obs of obstacles) {
        const dx = x - obs.x;
        const dz = z - obs.z;
        const minDist = radius + obs.radius;
        if (dx * dx + dz * dz < minDist * minDist) {
            return true;
        }
    }
    return false;
}

function findSpawnPosition(spawnIndex, totalAnimals, bounds, radius, obstacles) {
    for (let i = 0; i < 40; i++) {
        const ring = 30 + (spawnIndex * 14) + Math.random() * 18;
        const angle = (spawnIndex / totalAnimals) * Math.PI * 2 + Math.random() * Math.PI * 0.8;
        const x = Math.cos(angle) * ring;
        const z = Math.sin(angle) * ring;
        if (Math.abs(x) > bounds - radius || Math.abs(z) > bounds - radius) continue;
        if (!isBlockedByObstacle(x, z, radius, obstacles)) {
            return { x, z };
        }
    }

    // Safe fallback if all sampled points are blocked.
    return {
        x: Math.cos(Math.random() * Math.PI * 2) * 50,
        z: Math.sin(Math.random() * Math.PI * 2) * 50,
    };
}

class GLTFAnimal {
    // Added 'obstacles' to the constructor
    constructor(model, animations, config, scene, spawnIndex, obstacles) {
        this.group = model;
        this.config = config;
        this.obstacles = obstacles; // Store obstacles for AI logic
        this.dynamicBox = new THREE.Box3();
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.transitionTime = 0.4;

        this.group.scale.setScalar(config.scale);

        if (typeof config.targetHeight === 'number' && config.targetHeight > 0) {
            // Some third-party assets come with wildly different unit scales.
            // Fit to a target world height so they appear at expected size.
            const fitBox = new THREE.Box3().setFromObject(this.group);
            const fitSize = new THREE.Vector3();
            fitBox.getSize(fitSize);
            const sourceHeight = Math.max(fitSize.y, 0.001);
            const rawFitScale = config.targetHeight / sourceHeight;
            // Guard against bad bounds from malformed/skinned assets.
            const fitScale = Number.isFinite(rawFitScale)
                ? THREE.MathUtils.clamp(rawFitScale, 0.01, 25)
                : 1;
            this.group.scale.multiplyScalar(fitScale);
        }

        const alignedBox = new THREE.Box3().setFromObject(this.group);
        this.baseYOffset = THREE.MathUtils.clamp(-alignedBox.min.y, -2, 12);

        this.group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
                if (child.material) {
                    child.material.side = THREE.FrontSide;
                }
            }
        });

        if (animations && animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.group);
            animations.forEach(clip => {
                const action = this.mixer.clipAction(clip);
                action.setEffectiveTimeScale(1);
                action.setEffectiveWeight(1);
                action.enabled = true;
                this.actions[clip.name.toLowerCase()] = action;
            });

            const actionKeys = Object.keys(this.actions);
            if (actionKeys.length > 0) {
                const idleKey = actionKeys.find(k => k.includes('idle') || k.includes('stand') || k.includes('breathing')) || actionKeys[0];
                const firstAction = this.actions[idleKey];
                if (firstAction) {
                    firstAction.reset();
                    firstAction.play();
                    this.currentAction = firstAction;
                }
            }
        }

        const spawnRadius = 30 + (spawnIndex * 14) + Math.random() * 18;
        const spawnAngle = (spawnIndex / ANIMAL_CONFIGS.length) * Math.PI * 2 + Math.random() * 0.5;

        this.pos = new THREE.Vector3(Math.cos(spawnAngle) * spawnRadius, 0, Math.sin(spawnAngle) * spawnRadius);
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.timer = 4 + Math.random() * 5;
        this.state = 'idle';
        this.turnSpeed = 0.04;
        this.bounds = 170;
        this.radius = config.collisionRadius ?? Math.max(1.1, config.scale * 0.65);
        this.movementStyle = config.movementStyle ?? 'default';
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.sound = createAnimalSound(config.soundFile);
        this.nextAmbientSoundAt = Math.random() * 3;
        this.motionOffset = Math.random() * Math.PI * 2;
        this.shadow = createContactShadow(this.radius * 2.35, 0.23);

        const spawn = findSpawnPosition(spawnIndex, ANIMAL_CONFIGS.length, this.bounds, this.radius, this.obstacles);
        this.pos.x = spawn.x;
        this.pos.z = spawn.z;

        const h = getTerrainHeight(this.pos.x, this.pos.z);
        this.group.position.set(this.pos.x, h + this.baseYOffset, this.pos.z);
        this.group.rotation.y = this.angle;
        this.dynamicBox.setFromObject(this.group);
        this.groundOffsetFromMin = this.group.position.y - this.dynamicBox.min.y;

        this.shadow.position.set(this.pos.x, h + 0.055, this.pos.z);
        scene.add(this.group);
        scene.add(this.shadow);
    }

    getInfo() {
        return { name: this.config.name, species: this.config.species, emoji: this.config.emoji, description: this.config.description };
    }

    async playSound() {
        if (!this.sound) return;
        if (!this.sound.paused) return;
        try {
            this.sound.currentTime = 0;
            await this.sound.play();
        } catch {
            // Audio can fail if blocked or asset is missing; ignore to avoid gameplay interruption.
        }
    }

    scheduleNextAmbientSound(nowSeconds) {
        const delay = AMBIENT_SOUND_MIN_INTERVAL + Math.random() * (AMBIENT_SOUND_MAX_INTERVAL - AMBIENT_SOUND_MIN_INTERVAL);
        this.nextAmbientSoundAt = nowSeconds + delay;
    }

    maybePlayAmbientSound(nowSeconds, listenerPosition, soundEnabled) {
        if (!soundEnabled || !listenerPosition || !this.group || !this.sound) return;

        const dx = listenerPosition.x - this.group.position.x;
        const dz = listenerPosition.z - this.group.position.z;
        if ((dx * dx) + (dz * dz) > AMBIENT_SOUND_RADIUS_SQ) return;

        if (nowSeconds < this.nextAmbientSoundAt) return;

        this.playSound();
        this.scheduleNextAmbientSound(nowSeconds);
    }

    playAnimation(name) {
        const actionKeys = Object.keys(this.actions);
        if (actionKeys.length === 0) return;

        let action = this.actions[name];
        if (!action) {
            const walkKeys = actionKeys.filter(k => k.includes('walk') || k.includes('trot') || k.includes('prowl') || k.includes('stalk'));
            const runKeys = actionKeys.filter(k => k.includes('run') || k.includes('gallop') || k.includes('sprint') || k.includes('leap'));
            const idleKeys = actionKeys.filter(k => k.includes('idle') || k.includes('stand') || k.includes('breathing') || k.includes('eating') || k.includes('rest') || k.includes('sit'));

            if (name === 'walk' && walkKeys.length > 0) action = this.actions[walkKeys[0]];
            else if (name === 'run' && runKeys.length > 0) action = this.actions[runKeys[0]];
            else if (name === 'run' && walkKeys.length > 0) action = this.actions[walkKeys[0]];
            else if (name === 'idle' && idleKeys.length > 0) action = this.actions[idleKeys[0]];
            else action = this.actions[actionKeys[0]];
        }

        if (action && action !== this.currentAction) {
            if (this.currentAction) this.currentAction.fadeOut(this.transitionTime);
            action.enabled = true;
            action.setEffectiveTimeScale(1);
            action.setEffectiveWeight(1);
            action.reset();
            action.fadeIn(this.transitionTime);
            action.play();
            this.currentAction = action;
        }
    }

    update(t, dt) {
        if (this.mixer) this.mixer.update(dt);

        this.timer -= dt;
        if (this.timer < 0) this.switchBehavior();

        const angleDiff = ((this.targetAngle - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        this.angle += angleDiff * this.turnSpeed;

        const speedLerp = 1 - Math.exp(-3 * dt);
        this.currentSpeed += (this.targetSpeed - this.currentSpeed) * speedLerp;

        if (this.state === 'walk' || this.state === 'run') {
            let nextX = this.pos.x + Math.sin(this.angle) * this.currentSpeed;
            let nextZ = this.pos.z + Math.cos(this.angle) * this.currentSpeed;
            let hitObstacle = false;

            // --- NEW: ANIMAL COLLISION DETECTION ---
            if (this.obstacles && this.obstacles.length > 0) {
                for (const obs of this.obstacles) {
                    const dx = nextX - obs.x;
                    const dz = nextZ - obs.z;
                    if (dx * dx + dz * dz < Math.pow(this.radius + obs.radius, 2)) {
                        hitObstacle = true;
                        break;
                    }
                }
            }

            // If they hit an object or hit the world boundary, turn around!
            if (hitObstacle || Math.abs(nextX) > this.bounds || Math.abs(nextZ) > this.bounds) {
                this.targetAngle += Math.PI * 0.8 + Math.random() * Math.PI * 0.4;
                this.currentSpeed *= 0.8; // Slow down to turn
            } else {
                this.pos.x = nextX;
                this.pos.z = nextZ;
            }
        }

        const h = getTerrainHeight(this.pos.x, this.pos.z);
        this.group.position.set(this.pos.x, h + this.baseYOffset, this.pos.z);
        this.group.rotation.y = this.angle;

        if (this.movementStyle === 'bigCat') {
            const motionT = t + this.motionOffset;
            if (this.state === 'idle') {
                // Slow breathing and tiny body sway for natural resting posture.
                this.group.position.y += Math.sin(motionT * 1.6) * 0.045;
                this.group.rotation.z = Math.sin(motionT * 0.7) * 0.018;
            } else if (this.state === 'walk') {
                // Subtle shoulder bob while prowling.
                this.group.position.y += Math.sin(motionT * 5.2) * 0.06;
                this.group.rotation.z = Math.sin(motionT * 2.6) * 0.012;
            } else {
                this.group.position.y += Math.sin(motionT * 7.6) * 0.085;
                this.group.rotation.z = 0;
            }
        } else {
            this.group.rotation.z = 0;
        }

        // Ground using a stable offset captured at spawn so malformed animated bounds don't sink models.
        const groundClearance = this.config.groundClearance ?? 0.01;
        const desiredGroundY = h + groundClearance + (this.groundOffsetFromMin ?? this.baseYOffset);
        const groundingDelta = THREE.MathUtils.clamp(desiredGroundY - this.group.position.y, -0.045, 0.09);
        this.group.position.y += groundingDelta;

        if (this.shadow) {
            const airHeight = Math.max(0, this.group.position.y - desiredGroundY);
            this.shadow.position.set(this.pos.x, h + 0.055, this.pos.z);
            this.shadow.material.opacity = THREE.MathUtils.clamp(0.23 - airHeight * 0.1, 0.09, 0.23);
        }
    }

    switchBehavior() {
        if (this.movementStyle === 'bigCat') {
            const rand = Math.random();
            if (rand < 0.56) {
                this.state = 'idle';
                this.timer = 6 + Math.random() * 8;
                this.targetSpeed = 0;
                this.targetAngle = this.angle + (Math.random() - 0.5) * 0.8;
                this.playAnimation('idle');
            } else if (rand < 0.92) {
                this.state = 'walk';
                this.timer = 7 + Math.random() * 10;
                this.targetAngle = this.angle + (Math.random() - 0.5) * 1.6;
                this.targetSpeed = this.config.speed * (0.9 + Math.random() * 0.25);
                this.playAnimation('walk');
            } else {
                this.state = 'run';
                this.timer = 2.3 + Math.random() * 2.2;
                this.targetAngle = this.angle + (Math.random() - 0.5) * 1.15;
                this.targetSpeed = this.config.runSpeed * (0.95 + Math.random() * 0.22);
                this.playAnimation('run');
            }
            return;
        }

        const rand = Math.random();
        if (rand < 0.45) {
            this.state = 'idle';
            this.timer = 5 + Math.random() * 7;
            this.targetSpeed = 0;
            this.playAnimation('idle');
        } else if (rand < 0.85) {
            this.state = 'walk';
            this.timer = 6 + Math.random() * 9;
            this.targetAngle = this.angle + (Math.random() - 0.5) * 2.2;
            this.targetSpeed = this.config.speed;
            this.playAnimation('walk');
        } else {
            this.state = 'run';
            this.timer = 3 + Math.random() * 4;
            this.targetAngle = this.angle + (Math.random() - 0.5) * 1.5;
            this.targetSpeed = this.config.runSpeed;
            this.playAnimation('run');
        }
    }

    dispose() {
        if (this.sound) {
            this.sound.pause();
            this.sound.src = '';
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.group);
        }
        if (this.shadow) {
            this.shadow.parent?.remove(this.shadow);
            this.shadow.geometry?.dispose();
            this.shadow.material?.dispose?.();
            this.shadow = null;
        }
        this.group.traverse(child => {
            if (child.isMesh) {
                child.geometry?.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
    }
}

const modelCache = new Map();

// Pass obstacles parameter here
export async function loadGLTFAnimals(scene, obstacles) {
    const loader = new GLTFLoader();
    const animals = [];

    const loadModel = (file) => {
        if (modelCache.has(file)) return Promise.resolve(modelCache.get(file));
        return new Promise((resolve) => {
            loader.load(
                `/models/animals/${file}`,
                (gltf) => { modelCache.set(file, gltf); resolve(gltf); },
                undefined,
                (error) => { console.warn(`Failed to load ${file}:`, error); resolve(null); }
            );
        });
    };

    let spawnIndex = 0;
    for (const config of ANIMAL_CONFIGS) {
        const gltf = await loadModel(config.file);
        if (!gltf) continue;

        for (let i = 0; i < config.count; i++) {
            const model = cloneWithSkeleton(gltf.scene);
            const clonedAnimations = gltf.animations.map(clip => clip.clone());
            // Hand the obstacles to the animal instances
            const animal = new GLTFAnimal(model, clonedAnimations, config, scene, spawnIndex, obstacles);
            animals.push(animal);
            spawnIndex++;
        }
    }

    return animals;
}