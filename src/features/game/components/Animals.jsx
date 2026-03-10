import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getTerrainHeight } from './Terrain.jsx';

const ANIMAL_CONFIGS = [
    { file: 'Fox.gltf', scale: 1.6, speed: 0.06, runSpeed: 0.12, count: 1, name: 'Red Fox', species: 'Vulpes vulpes', emoji: '🦊', description: 'A clever and adaptable predator known for its beautiful red coat and bushy tail.' },
    { file: 'Deer.gltf', scale: 1.6, speed: 0.05, runSpeed: 0.11, count: 1, name: 'White-tailed Deer', species: 'Odocoileus virginianus', emoji: '🦌', description: 'A graceful herbivore known for the white underside of its tail, often raised as an alarm signal.' },
    { file: 'Wolf.gltf', scale: 2.2, speed: 0.07, runSpeed: 0.14, count: 1, name: 'Gray Wolf', species: 'Canis lupus', emoji: '🐺', description: 'A social pack animal and apex predator, known for its complex communication through howling.' },
    { file: 'Horse.gltf', scale: 2.0, speed: 0.08, runSpeed: 0.16, count: 1, name: 'Domestic Horse', species: 'Equus caballus', emoji: '🐴', description: 'A majestic animal that has been a companion to humans for thousands of years.' },
    { file: 'Donkey.gltf', scale: 2.6, speed: 0.05, runSpeed: 0.09, count: 1, name: 'Donkey', species: 'Equus asinus', emoji: '🫏', description: 'A sure-footed and hardy animal, often used as a working companion.' },
    { file: 'Cow.gltf', scale: 2.2, speed: 0.04, runSpeed: 0.07, count: 1, name: 'Domestic Cow', species: 'Bos taurus', emoji: '🐄', description: 'A gentle herbivore raised for milk and companionship in farms worldwide.' },
    { file: 'Alpaca.gltf', scale: 2.2, speed: 0.05, runSpeed: 0.09, count: 1, name: 'Alpaca', species: 'Vicugna pacos', emoji: '🦙', description: 'A fluffy South American camelid, prized for its soft and luxurious fleece.' },
    { file: 'Husky.gltf', scale: 1.6, speed: 0.07, runSpeed: 0.14, count: 1, name: 'Siberian Husky', species: 'Canis lupus familiaris', emoji: '🐕', description: 'An energetic sled dog breed known for its striking blue eyes and thick double coat.' },
    { file: 'ShibaInu.gltf', scale: 1.3, speed: 0.06, runSpeed: 0.11, count: 1, name: 'Shiba Inu', species: 'Canis lupus familiaris', emoji: '🐕', description: 'A small, agile Japanese breed known for its spirited personality and fox-like appearance.' },
    { file: 'Stag.gltf', scale: 3.2, speed: 0.06, runSpeed: 0.13, count: 1, name: 'Red Deer Stag', species: 'Cervus elaphus', emoji: '🦌', description: 'A magnificent male deer with impressive antlers, symbol of wild forests.' },
    { file: 'Bull.gltf', scale: 2.6, speed: 0.035, runSpeed: 0.08, count: 1, name: 'Bull', species: 'Bos taurus', emoji: '🐃', description: 'A powerful and muscular male bovine, respected for its strength and presence.' },
];

class GLTFAnimal {
    // Added 'obstacles' to the constructor
    constructor(model, animations, config, scene, spawnIndex, obstacles) {
        this.group = model;
        this.config = config;
        this.obstacles = obstacles; // Store obstacles for AI logic
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.transitionTime = 0.4;

        this.group.scale.setScalar(config.scale);
        this.group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
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
        this.currentSpeed = 0;
        this.targetSpeed = 0;

        const h = getTerrainHeight(this.pos.x, this.pos.z);
        this.group.position.set(this.pos.x, h, this.pos.z);
        this.group.rotation.y = this.angle;

        scene.add(this.group);
    }

    getInfo() {
        return { name: this.config.name, species: this.config.species, emoji: this.config.emoji, description: this.config.description };
    }

    playAnimation(name) {
        const actionKeys = Object.keys(this.actions);
        if (actionKeys.length === 0) return;

        let action = this.actions[name];
        if (!action) {
            const walkKeys = actionKeys.filter(k => k.includes('walk') || k.includes('trot'));
            const runKeys = actionKeys.filter(k => k.includes('run') || k.includes('gallop'));
            const idleKeys = actionKeys.filter(k => k.includes('idle') || k.includes('stand') || k.includes('breathing') || k.includes('eating'));

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
                const ANIMAL_RADIUS = this.config.scale * 1.5;
                for (const obs of this.obstacles) {
                    const dx = nextX - obs.x;
                    const dz = nextZ - obs.z;
                    if (dx * dx + dz * dz < Math.pow(ANIMAL_RADIUS + obs.radius, 2)) {
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
        this.group.position.set(this.pos.x, h, this.pos.z);
        this.group.rotation.y = this.angle;
    }

    switchBehavior() {
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
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.group);
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