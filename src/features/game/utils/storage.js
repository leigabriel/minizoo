/**
 * Local Storage Utility for Mini Zoo Game
 * Handles all client-side persistence
 */

const STORAGE_KEYS = {
    SETTINGS: 'minizoo_settings',
    PROGRESS: 'minizoo_progress',
    FEEDING_STATUS: 'minizoo_feeding'
};

// Default values
const DEFAULT_SETTINGS = {
    musicEnabled: true,
    soundEnabled: true
};

const DEFAULT_PROGRESS = {
    animalsDiscovered: [],
    totalAnimalsViewed: 0,
    lastPlayed: null
};

/**
 * Safe JSON parse with fallback
 */
function safeParse(json, fallback) {
    try {
        return json ? JSON.parse(json) : fallback;
    } catch {
        return fallback;
    }
}

/**
 * Settings Management
 */
export function getSettings() {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...safeParse(stored, {}) };
}

export function saveSettings(settings) {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
}

export function toggleMusic() {
    const settings = getSettings();
    return saveSettings({ musicEnabled: !settings.musicEnabled });
}

export function toggleSound() {
    const settings = getSettings();
    return saveSettings({ soundEnabled: !settings.soundEnabled });
}

/**
 * Progress Management
 */
export function getProgress() {
    const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return { ...DEFAULT_PROGRESS, ...safeParse(stored, {}) };
}

export function saveProgress(progress) {
    const current = getProgress();
    const updated = { ...current, ...progress, lastPlayed: Date.now() };
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
    return updated;
}

export function markAnimalDiscovered(animalName) {
    const progress = getProgress();
    if (!progress.animalsDiscovered.includes(animalName)) {
        progress.animalsDiscovered = [...progress.animalsDiscovered, animalName];
        progress.totalAnimalsViewed++;
        saveProgress(progress);
    }
    return progress;
}

/**
 * Feeding Status Management
 */
export function getFeedingStatus() {
    const stored = localStorage.getItem(STORAGE_KEYS.FEEDING_STATUS);
    return safeParse(stored, {});
}

export function saveFeedingStatus(status) {
    localStorage.setItem(STORAGE_KEYS.FEEDING_STATUS, JSON.stringify(status));
    return status;
}

export function feedAnimal(animalName) {
    const status = getFeedingStatus();
    const animalStatus = status[animalName] || { fed: false, lastFed: null, feedCount: 0 };
    
    status[animalName] = {
        fed: true,
        lastFed: Date.now(),
        feedCount: animalStatus.feedCount + 1
    };
    
    saveFeedingStatus(status);
    return status;
}

export function isAnimalFed(animalName) {
    const status = getFeedingStatus();
    return status[animalName]?.fed || false;
}

export function resetDailyFeeding() {
    // Reset all feeding status (could be called daily)
    const status = getFeedingStatus();
    Object.keys(status).forEach(key => {
        status[key].fed = false;
    });
    saveFeedingStatus(status);
    return status;
}

export function resetAllFeedingTasks() {
    localStorage.removeItem(STORAGE_KEYS.FEEDING_STATUS);
    return {};
}

/**
 * Get all tasks with completion status
 */
export function getTasks() {
    const feedingStatus = getFeedingStatus();
    
    // Define all animal feeding tasks
    const animalNames = [
        'Red Fox', 'White-tailed Deer', 'Gray Wolf', 'Domestic Horse',
        'Donkey', 'Domestic Cow', 'Alpaca', 'Siberian Husky',
        'Shiba Inu', 'Red Deer Stag', 'Bull'
    ];
    
    return animalNames.map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name: `Feed the ${name}`,
        animalName: name,
        completed: feedingStatus[name]?.fed || false,
        feedCount: feedingStatus[name]?.feedCount || 0
    }));
}

export function getCompletedTasksCount() {
    const tasks = getTasks();
    return tasks.filter(t => t.completed).length;
}

export function getTotalTasks() {
    return getTasks().length;
}

/**
 * Clear all stored data
 */
export function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}
