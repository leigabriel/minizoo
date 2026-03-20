import React, { useState, useEffect, useCallback, useRef } from 'react';

const BULUSAN_ZOO_URL = import.meta.env.VITE_BULUSAN_ZOO_URL || 'https://bulusanzoo.vercel.app';
const HUD_EDGE = 14;
const KF = "'Nunito', 'Fredoka One', system-ui, sans-serif";
const KF_DISPLAY = "'Fredoka One', 'Nunito', system-ui, sans-serif";
const SETTINGS_KEY = 'minizoo_settings';
const SETTINGS_CHANGE_EVENT = 'minizoo-settings-changed';

function readSettings() {
    try {
        const s = localStorage.getItem(SETTINGS_KEY);
        return s ? JSON.parse(s) : { musicEnabled: true, soundEnabled: true };
    } catch {
        return { musicEnabled: true, soundEnabled: true };
    }
}

function persistSettings(updated) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event(SETTINGS_CHANGE_EVENT));
        return true;
    } catch {
        return false;
    }
}

function getDeviceType() {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch || isCoarse) {
        return w < 1024 ? 'mobile' : 'tablet';
    }
    return 'desktop';
}

function useDeviceType() {
    const [device, setDevice] = useState(() => getDeviceType());
    useEffect(() => {
        const check = () => setDevice(getDeviceType());
        window.addEventListener('resize', check);
        window.addEventListener('orientationchange', check);
        return () => {
            window.removeEventListener('resize', check);
            window.removeEventListener('orientationchange', check);
        };
    }, []);
    return device;
}

function useIsTouch() {
    const d = useDeviceType();
    return d === 'mobile' || d === 'tablet';
}

function useViewportInfo() {
    const [viewport, setViewport] = useState(() => ({
        w: typeof window === 'undefined' ? 1280 : window.innerWidth,
        h: typeof window === 'undefined' ? 720 : window.innerHeight,
    }));

    useEffect(() => {
        const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
        };
    }, []);

    const isLandscape = viewport.w > viewport.h;
    const isShort = viewport.h < 560;

    return { ...viewport, isLandscape, isShort };
}

function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    return { isFullscreen, toggleFullscreen };
}

const Icons = {
    Menu: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    Tasks: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
    ),
    Star: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    ),
    User: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Feed: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
        </svg>
    ),
    Eye: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Paw: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="7" cy="4" r="2.2" opacity=".75" /><circle cx="17" cy="4" r="2.2" opacity=".75" />
            <circle cx="4" cy="10" r="2.2" opacity=".75" /><circle cx="20" cy="10" r="2.2" opacity=".75" />
            <path d="M12 17c-3.5 0-6-2-6-4.5 0-1.5 1-2.5 2-3 .8-.4 1.7-.5 2.5-.3.5.1 1 .3 1.5.3s1-.2 1.5-.3c.8-.2 1.7-.1 2.5.3 1 .5 2 1.5 2 3C18 15 15.5 17 12 17z" />
        </svg>
    ),
    Check: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
        </svg>
    ),
    ArrowUp: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
    ),
    Music: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
    ),
    Sound: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
    ),
    Exit: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    Play: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    ),
    Close: () => (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
    ),
    Sparkle: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
        </svg>
    ),
    Camera: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Gallery: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
            <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="8" height="8" rx="1" />
        </svg>
    ),
    Trash: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
    ),
    Download: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Pin: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
    ),
    CameraOff: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    ),
    Trophy: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 21 12 17 16 21" /><line x1="12" y1="17" x2="12" y2="11" />
            <path d="M7 4H4a2 2 0 000 4c0 2.5 2 4.5 5 5" /><path d="M17 4h3a2 2 0 010 4c0 2.5-2 4.5-5 5" />
            <rect x="7" y="2" width="10" height="11" rx="1" />
        </svg>
    ),
    Fullscreen: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
        </svg>
    ),
    Minimize: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
        </svg>
    ),
};

function Btn3D({ children, onClick, color = '#4CAF50', textColor = '#fff', disabled = false, style: extraStyle = {}, size = 'md', icon = null }) {
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);

    const sizes = {
        sm: { padding: '7px 14px', fontSize: 12, borderRadius: 12, depth: 4 },
        md: { padding: '11px 22px', fontSize: 14, borderRadius: 14, depth: 5 },
        lg: { padding: '14px 30px', fontSize: 16, borderRadius: 16, depth: 6 },
        xl: { padding: '16px 38px', fontSize: 18, borderRadius: 18, depth: 7 },
    };
    const s = sizes[size] || sizes.md;

    const darken = (hex, amt) => {
        const n = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (n >> 16) - amt);
        const g = Math.max(0, ((n >> 8) & 0xff) - amt);
        const b = Math.max(0, (n & 0xff) - amt);
        return `rgb(${r},${g},${b})`;
    };
    const baseColor = disabled ? '#9CA3AF' : color;
    const darkColor = disabled ? '#6B7280' : darken(color.startsWith('#') ? color : '#4CAF50', 55);
    const lightColor = disabled ? '#D1D5DB' : darken(color.startsWith('#') ? color : '#4CAF50', -20);

    const depth = pressed ? 1 : hovered ? s.depth + 2 : s.depth;
    const ty = pressed ? s.depth - 1 : hovered ? -2 : 0;

    return (
        <button
            data-ui-button="true"
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={() => !disabled && setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            onMouseDown={() => !disabled && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onTouchStart={(e) => { e.preventDefault(); !disabled && setPressed(true); }}
            onTouchEnd={(e) => { e.preventDefault(); setPressed(false); !disabled && onClick?.(); }}
            style={{
                all: 'unset',
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: s.padding,
                fontSize: s.fontSize,
                borderRadius: s.borderRadius,
                fontFamily: KF,
                fontWeight: 800,
                letterSpacing: '.01em',
                color: disabled ? 'rgba(255,255,255,.5)' : textColor,
                background: disabled
                    ? 'linear-gradient(180deg, #D1D5DB 0%, #9CA3AF 100%)'
                    : `linear-gradient(180deg, ${lightColor} 0%, ${baseColor} 55%, ${darken(color.startsWith('#') ? color : '#4CAF50', 20)} 100%)`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                opacity: disabled ? 0.7 : 1,
                boxShadow: disabled
                    ? `0 2px 0 ${darkColor}`
                    : pressed
                        ? `0 1px 0 ${darkColor}, inset 0 2px 6px rgba(0,0,0,.25)`
                        : `0 ${depth}px 0 ${darkColor}, 0 ${depth + 4}px ${depth * 3}px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.35)`,
                transform: `translateY(${ty}px)`,
                transition: 'box-shadow .1s, transform .1s, background .1s',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                position: 'relative',
                overflow: 'hidden',
                ...extraStyle,
            }}
        >
            {!disabled && (
                <span style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '45%', borderRadius: `${s.borderRadius}px ${s.borderRadius}px 60% 60%`,
                    background: 'linear-gradient(180deg, rgba(255,255,255,.28) 0%, transparent 100%)',
                    pointerEvents: 'none',
                }} />
            )}
            {icon && <span style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>{icon}</span>}
            <span style={{ position: 'relative' }}>{children}</span>
        </button>
    );
}

export function LoadingScreen({ progress }) {
    return (
        <div className="absolute inset-0 z-50 ls-minimal-loader">
            <div className="ls-minimal-loader__center">
                <span className="ls-minimal-loader__spinner" />
                <p className="ls-minimal-loader__label">Loading world</p>
                <p className="ls-minimal-loader__progress">{Math.round(progress)}%</p>
            </div>
        </div>
    );
}

function KidsToggle({ enabled, onChange, label, icon, color = '#a29bfe' }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            role="switch" aria-checked={enabled} tabIndex={0}
            onClick={() => onChange(!enabled)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onChange(!enabled); }}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 16, cursor: 'pointer',
                background: enabled ? `${color}22` : 'rgba(255,255,255,.88)',
                border: `2.5px solid ${enabled ? color : 'rgba(255,255,255,.7)'}`,
                boxShadow: hov ? `0 4px 16px ${color}44` : '0 2px 8px rgba(0,0,0,.08)',
                transition: 'all .2s', transform: hov ? 'scale(1.03)' : 'scale(1)',
                userSelect: 'none', outline: 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ color: enabled ? color : '#9CA3AF', display: 'flex' }}>{icon}</span>
                <span style={{ fontFamily: KF, fontSize: 13, fontWeight: 800, color: enabled ? '#374151' : '#9CA3AF' }}>{label}</span>
            </div>
            <div style={{ width: 38, height: 22, borderRadius: 11, background: enabled ? color : '#D1D5DB', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                <div style={{
                    position: 'absolute', top: 2, left: enabled ? 17 : 2, width: 18, height: 18,
                    borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                    transition: 'left .2s cubic-bezier(.16,1,.3,1)',
                }} />
            </div>
        </div>
    );
}

export function MainMenu({ onStart, isVisible }) {
    const device = useDeviceType();
    const isMobile = device !== 'desktop';
    const { isFullscreen, toggleFullscreen } = useFullscreen();

    const [settings, setSettings] = useState(() => readSettings());
    const [transitioning, setTransitioning] = useState(false);
    const [menuSettingsOpen, setMenuSettingsOpen] = useState(false);

    const save = useCallback((updates) => {
        const updated = { ...settings, ...updates };
        setSettings(updated);
        persistSettings(updated);
    }, [settings]);

    const handlePlay = useCallback(() => {
        setTransitioning(true);
        setTimeout(onStart, 700);
    }, [onStart]);

    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-40 overflow-hidden bg-linear-to-b from-emerald-400 via-green-400 to-emerald-300">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,.18) 1px, transparent 1px)',
                    backgroundSize: '3px 3px',
                    opacity: 0.45,
                }}
            />

            <div className="absolute inset-0 bg-black pointer-events-none z-50 transition-opacity duration-700" style={{ opacity: transitioning ? 1 : 0 }} />

            <button
                onClick={toggleFullscreen}
                className="absolute z-60 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/70 bg-white/90 text-slate-700 shadow-[0_4px_0_rgba(0,0,0,.14),0_8px_20px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5"
                style={{ top: 'max(16px, env(safe-area-inset-top))', right: 'max(16px, env(safe-area-inset-right))' }}
            >
                {isFullscreen ? <Icons.Minimize /> : <Icons.Fullscreen />}
            </button>

            <div
                className="kids-slide-up absolute inset-0 flex flex-col"
                style={{
                    padding: 'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
                }}
            >
                <div className="pt-3 text-center leading-none text-white">
                    <h1
                        className="font-bold tracking-[0.04em]"
                        style={{
                            fontFamily: KF_DISPLAY,
                            fontSize: isMobile ? 62 : 86,
                            textShadow: '0 4px 0 rgba(18, 92, 45, .35), 0 10px 26px rgba(0,0,0,.12)'
                        }}
                    >
                        BULUSAN ZOO
                    </h1>
                    <h2
                        className="font-bold tracking-[0.03em]"
                        style={{
                            marginTop: isMobile ? 6 : 10,
                            fontFamily: KF_DISPLAY,
                            fontSize: isMobile ? 56 : 74,
                            textShadow: '0 4px 0 rgba(18, 92, 45, .32), 0 10px 26px rgba(0,0,0,.12)'
                        }}
                    >
                        Mini Zoo Game
                    </h2>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="flex w-full max-w-90 flex-col gap-3">
                        <Btn3D
                            onClick={handlePlay}
                            color="#ff6b9d"
                            size="xl"
                            icon={<Icons.Play />}
                            style={{ width: '100%', justifyContent: 'center', fontFamily: KF_DISPLAY, letterSpacing: '.06em' }}
                        >
                            PLAY
                        </Btn3D>
                        <Btn3D
                            onClick={() => setMenuSettingsOpen(v => !v)}
                            color="#74b9ff"
                            size="xl"
                            style={{ width: '100%', justifyContent: 'center', fontFamily: KF_DISPLAY, letterSpacing: '.06em' }}
                        >
                            SETTINGS
                        </Btn3D>
                        <Btn3D
                            onClick={() => { window.location.href = BULUSAN_ZOO_URL; }}
                            color="#95a5a6"
                            size="xl"
                            style={{ width: '100%', justifyContent: 'center', fontFamily: KF_DISPLAY, letterSpacing: '.06em' }}
                        >
                            QUIT
                        </Btn3D>

                        {menuSettingsOpen && (
                            <div className="mt-2 rounded-2xl border-2 border-white/60 bg-white/88 p-3 shadow-[0_8px_24px_rgba(0,0,0,.14)]">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <KidsToggle enabled={settings.musicEnabled} onChange={v => save({ musicEnabled: v })} label="Music" icon={<Icons.Music />} color="#a29bfe" />
                                    <KidsToggle enabled={settings.soundEnabled} onChange={v => save({ soundEnabled: v })} label="Sound" icon={<Icons.Sound />} color="#74b9ff" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-end justify-between px-1 pb-1 text-white/90" style={{ fontFamily: KF_DISPLAY, textShadow: '0 2px 0 rgba(18, 92, 45, .35)' }}>
                    <span style={{ fontSize: isMobile ? 34 : 28 }}>v.1.0</span>
                    <span style={{ fontSize: isMobile ? 46 : 34 }}>{new Date().getFullYear()}</span>
                </div>

                <div className="pt-2 text-center text-white/80" style={{ fontFamily: KF, fontSize: isMobile ? 12 : 13 }}>
                    {device === 'desktop'
                        ? 'WASD move, Space jump, Shift run, E/F interact, C camera'
                        : 'Use joystick and action buttons to explore and interact'}
                </div>
            </div>
        </div>
    );
}

export function GameHUD({ onMenuClick, onTasksClick, completedTasks, totalTasks }) {
    const device = useDeviceType();
    const allDone = completedTasks === totalTasks && totalTasks > 0;

    const hudBtn = {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)',
        border: '2px solid rgba(255,255,255,.7)',
        boxShadow: '0 4px 0 rgba(0,0,0,.14), 0 6px 16px rgba(0,0,0,.12)',
        cursor: 'pointer', transition: 'all .15s', color: '#374151',
    };

    return (
        <>
            <div style={{ position: 'absolute', top: `max(${HUD_EDGE}px, env(safe-area-inset-top) + 6px)`, left: `max(${HUD_EDGE}px, env(safe-area-inset-left) + 2px)`, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button data-ui-button="true" onClick={onMenuClick} style={{ ...hudBtn, width: 44, height: 44, borderRadius: 16 }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,.14), 0 8px 20px rgba(0,0,0,.18)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 0 rgba(0,0,0,.14), 0 6px 16px rgba(0,0,0,.12)'; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(0,0,0,.14)'; }}
                >
                    <Icons.Menu />
                </button>

                <div style={{ ...hudBtn, cursor: 'default', borderRadius: 9999, padding: '5px 14px 5px 7px', gap: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e17055', border: '2px solid rgba(255,255,255,.8)' }}>
                        <Icons.User />
                    </div>
                    <span style={{ fontFamily: KF, fontSize: 13, fontWeight: 800, color: '#374151', whiteSpace: 'nowrap' }}>Explorer</span>
                </div>
            </div>

            <div style={{ position: 'absolute', top: `max(${HUD_EDGE}px, env(safe-area-inset-top) + 6px)`, right: `max(${HUD_EDGE}px, env(safe-area-inset-right) + 2px)`, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button data-ui-button="true" onClick={onTasksClick} style={{
                    ...hudBtn,
                    background: allDone ? 'rgba(255,215,0,.92)' : 'rgba(255,255,255,.92)',
                    border: `2px solid ${allDone ? '#f9ca24' : 'rgba(255,255,255,.7)'}`,
                    boxShadow: allDone ? '0 4px 0 rgba(200,160,0,.3), 0 6px 20px rgba(249,202,36,.45)' : '0 4px 0 rgba(0,0,0,.12), 0 6px 16px rgba(0,0,0,.1)',
                    borderRadius: 9999, padding: '7px 14px', gap: 7,
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
                    <span style={{ color: allDone ? '#e17055' : '#6B7280', display: 'flex' }}>
                        {allDone ? <Icons.Star /> : <Icons.Tasks />}
                    </span>
                    <span style={{ fontFamily: KF, fontSize: 13, fontWeight: 800, color: allDone ? '#c0392b' : '#374151' }}>{completedTasks}/{totalTasks}</span>
                </button>

                {device === 'desktop' && (
                    <div style={{ ...hudBtn, cursor: 'default', borderRadius: 16, padding: '7px 16px' }}>
                        <span style={{ fontFamily: KF_DISPLAY, fontSize: 14, background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Zoo Explorer
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}

export function SettingsPanel({ isOpen, onClose, onQuit }) {
    const { isFullscreen, toggleFullscreen } = useFullscreen();
    const [settings, setSettings] = useState(() => readSettings());

    const save = useCallback((updates) => {
        const updated = { ...settings, ...updates };
        setSettings(updated);
        persistSettings(updated);
    }, [settings]);

    const KB = [
        { action: 'Move', key: 'WASD' }, { action: 'Jump', key: 'Space' },
        { action: 'Run', key: 'Shift' }, { action: 'Interact', key: 'E' },
        { action: 'Feed', key: 'F' }, { action: 'Close', key: 'Esc' },
    ];

    return (
        <SidePanel isOpen={isOpen} onClose={onClose} side="left" title="Settings" accent="#a29bfe">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Section label="Audio">
                    <KidsToggle enabled={settings.musicEnabled} onChange={v => save({ musicEnabled: v })} label="Music" icon={<Icons.Music />} color="#a29bfe" />
                    <div style={{ height: 8 }} />
                    <KidsToggle enabled={settings.soundEnabled} onChange={v => save({ soundEnabled: v })} label="Sound Effects" icon={<Icons.Sound />} color="#74b9ff" />
                </Section>

                <Section label="Display">
                    <KidsToggle enabled={isFullscreen} onChange={toggleFullscreen} label="Fullscreen" icon={isFullscreen ? <Icons.Minimize /> : <Icons.Fullscreen />} color="#00b894" />
                </Section>

                <Section label="Controls">
                    <div style={{ background: '#FAFAF9', borderRadius: 16, border: '2px solid #E7E5E4', overflow: 'hidden' }}>
                        {KB.map(({ action, key }, i) => (
                            <div key={action} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px', borderBottom: i < KB.length - 1 ? '1.5px solid #F3F4F6' : 'none',
                            }}>
                                <span style={{ fontFamily: KF, fontSize: 13, fontWeight: 700, color: '#4B5563' }}>{action}</span>
                                <span style={{ fontFamily: KF, fontSize: 11, fontWeight: 800, color: '#374151', background: 'linear-gradient(135deg, #f5f6fa, #dfe6e9)', borderRadius: 8, padding: '3px 10px', border: '1.5px solid #D1D5DB', boxShadow: '0 2px 0 #b2bec3' }}>
                                    {key}
                                </span>
                            </div>
                        ))}
                    </div>
                </Section>

                <Btn3D onClick={onQuit} color="#e74c3c" icon={<Icons.Exit />} style={{ width: '100%', justifyContent: 'center' }}>
                    Exit Zoo
                </Btn3D>
            </div>
        </SidePanel>
    );
}

export function TaskPanel({ isOpen, onClose, tasks, onTaskClick }) {
    const completedCount = tasks.filter(t => t.completed).length;
    const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <SidePanel isOpen={isOpen} onClose={onClose} side="right" title="My Tasks" accent="#55efc4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'linear-gradient(135deg, #d4efdf, #a9dfbf)', borderRadius: 20, padding: '14px 16px', border: '2.5px solid rgba(16,185,129,.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontFamily: KF, fontWeight: 800, fontSize: 14, color: '#1a5c2e' }}>Progress</span>
                        <span style={{ fontFamily: KF, fontWeight: 900, fontSize: 16, color: '#059669' }}>
                            {completedCount}/{tasks.length}
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7', marginLeft: 4 }}>({pct}%)</span>
                        </span>
                    </div>
                    <div style={{ height: 14, background: 'rgba(255,255,255,.5)', borderRadius: 9999, overflow: 'hidden', border: '2px solid rgba(255,255,255,.7)' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 9999, background: 'linear-gradient(90deg, #00b894, #55efc4)', transition: 'width .5s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                    {completedCount === tasks.length && tasks.length > 0 && (
                        <p className="kids-pop" style={{ fontFamily: KF_DISPLAY, fontSize: 14, color: '#059669', marginTop: 10, textAlign: 'center' }}>
                            You are a Zoo Master!
                        </p>
                    )}
                </div>

                <Section label="Feeding Tasks">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {tasks.map(task => <TaskItem key={task.id} task={task} onClick={() => onTaskClick?.(task)} />)}
                    </div>
                </Section>
            </div>
        </SidePanel>
    );
}

function TaskItem({ task, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 13px', borderRadius: 14, cursor: 'pointer',
            background: task.completed ? 'rgba(0,184,148,.1)' : hov ? '#F0FDF4' : '#FAFAF9',
            border: `2.5px solid ${task.completed ? 'rgba(0,184,148,.3)' : hov ? '#86efac' : '#E7E5E4'}`,
            transition: 'all .15s', transform: hov ? 'scale(1.02)' : 'scale(1)',
        }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: task.completed ? 'linear-gradient(135deg, #00b894, #00cec9)' : '#E5E7EB', boxShadow: task.completed ? '0 2px 8px rgba(0,184,148,.4)' : 'none', transition: 'all .2s' }}>
                {task.completed && <Icons.Check />}
            </div>
            <span style={{ flex: 1, fontFamily: KF, fontSize: 13, fontWeight: 700, color: task.completed ? '#059669' : '#374151', textDecoration: task.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.name}
            </span>
            {task.feedCount > 0 && (
                <span style={{ fontFamily: KF, fontSize: 11, fontWeight: 800, color: '#78716C', background: '#F5F4F2', borderRadius: 9999, padding: '2px 8px', flexShrink: 0, border: '1.5px solid #E7E5E4' }}>
                    x{task.feedCount}
                </span>
            )}
        </div>
    );
}

export function InteractionPrompt({ visible, onFeed, onViewDetails, animalName, isTouchDevice }) {
    if (!visible) return null;
    const bottomOffset = isTouchDevice ? 'max(190px, env(safe-area-inset-bottom) + 142px)' : 82;
    return (
        <div style={{
            position: 'fixed', bottom: bottomOffset, left: 0, right: 0,
            zIndex: 100, display: 'flex', justifyContent: 'center', pointerEvents: 'none'
        }}>
            <div style={{
                pointerEvents: 'auto',
                animation: 'kids-slide-up .28s cubic-bezier(.16,1,.3,1) both',
                background: 'rgba(255,255,255,.97)', borderRadius: 9999,
                padding: '9px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.16)',
                border: '3px solid #ffd32a',
                display: 'flex', alignItems: 'center', gap: 10,
                whiteSpace: 'nowrap',
                maxWidth: 'calc(100vw - 28px)',
            }}>
                <span style={{ color: '#e17055', display: 'flex' }}><Icons.Paw /></span>
                <span style={{ fontFamily: KF, fontSize: 13, fontWeight: 800, color: '#374151' }}>{animalName}</span>
                {!isTouchDevice && (
                    <div style={{ display: 'flex', gap: 7 }}>
                        <KeyBtn label="F" text="Feed" color="#ff9f43" onClick={onFeed} />
                        <KeyBtn label="E" text="View" color="#74b9ff" onClick={onViewDetails} />
                    </div>
                )}
                {isTouchDevice && (
                    <div style={{ display: 'flex', gap: 7 }}>
                        <KeyBtn label="Tap" text="Feed" color="#ff9f43" onClick={onFeed} />
                        <KeyBtn label="Tap" text="View" color="#74b9ff" onClick={onViewDetails} />
                    </div>
                )}
            </div>
        </div>
    );
}

function KeyBtn({ label, text, color, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
            all: 'unset', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 9999, background: color, color: '#fff',
            fontFamily: KF, fontSize: 12, fontWeight: 800, cursor: 'pointer',
            boxShadow: hov ? `0 4px 0 ${color}88` : `0 3px 0 ${color}88`,
            transform: hov ? 'scale(1.06) translateY(-1px)' : 'scale(1)', transition: 'all .15s',
        }}>
            <span style={{ background: 'rgba(255,255,255,.3)', borderRadius: 5, padding: '1px 5px', fontSize: 10, fontWeight: 900 }}>{label}</span>
            {text}
        </button>
    );
}

export function MobileInteractionButtons({ visible, onFeed, onViewDetails }) {
    if (!visible) return null;
    return (
        <div style={{
            position: 'fixed', bottom: 'max(98px, env(safe-area-inset-bottom) + 56px)', left: 0, right: 0,
            zIndex: 100, display: 'flex', justifyContent: 'center', pointerEvents: 'none'
        }}>
            <div style={{
                display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
                animation: 'kids-slide-up .28s cubic-bezier(.16,1,.3,1) both',
            }}>
                {[
                    { label: 'Feed', color: '#ff9f43', shadow: 'rgba(255,159,67,.45)', icon: <Icons.Feed />, onClick: onFeed },
                    { label: 'View', color: '#74b9ff', shadow: 'rgba(116,185,255,.45)', icon: <Icons.Eye />, onClick: onViewDetails },
                ].map(b => (
                    <div key={b.label} style={{ pointerEvents: 'auto' }}>
                        <TouchBtn {...b} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function TouchBtn({ label, color, shadow, icon, onClick }) {
    const [pressed, setPressed] = useState(false);
    return (
        <button onClick={onClick}
            onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
            onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
            style={{
                pointerEvents: 'auto',
                all: 'unset', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 22px', borderRadius: 20,
                border: '3px solid rgba(255,255,255,.6)',
                background: color, color: '#fff', fontFamily: KF, fontSize: 14, fontWeight: 800, cursor: 'pointer',
                boxShadow: pressed ? 'none' : `0 5px 0 ${shadow}, 0 8px 20px ${shadow}`,
                transform: pressed ? 'scale(.92) translateY(4px)' : 'scale(1)', transition: 'all .12s', minWidth: 90,
            }}>
            {icon}{label}
        </button>
    );
}

export function AnimalInfoModal({ animal, onClose, onFeed, isFed, placement = 'center', preview = false, onView, bottomOffset }) {
    if (!animal) return null;
    const fedText = isFed ? `The ${animal.name} has been fed.` : `The ${animal.name} is hungry.`;

    if (preview) {
        return (
            <Modal
                isOpen={!!animal}
                onClose={onClose}
                title={animal.name}
                placement={placement}
                showClose={true}
                showBackdrop={false}
                bottomOffset={bottomOffset}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <Btn3D onClick={onFeed} color={isFed ? '#95a5a6' : '#00b894'} disabled={isFed} icon={<Icons.Feed />} style={{ justifyContent: 'center', width: '100%' }}>
                            {isFed ? 'Fed' : 'Feed'}
                        </Btn3D>
                        <Btn3D onClick={onView} color="#74b9ff" icon={<Icons.Eye />} style={{ justifyContent: 'center', width: '100%' }}>
                            View
                        </Btn3D>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={!!animal} onClose={onClose} title={animal.name} placement={placement}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 22, background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(253,203,110,.4)', border: '3px solid rgba(255,255,255,.8)' }}>
                        <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                            <ellipse cx="18" cy="16" rx="8" ry="11" fill="#fdcb6e" />
                            <ellipse cx="46" cy="16" rx="8" ry="11" fill="#fdcb6e" />
                            <ellipse cx="32" cy="38" rx="22" ry="18" fill="#e17055" opacity=".85" />
                            <circle cx="24" cy="34" r="4" fill="#fff" /><circle cx="40" cy="34" r="4" fill="#fff" />
                            <circle cx="25" cy="35" r="2" fill="#1a1a2e" /><circle cx="41" cy="35" r="2" fill="#1a1a2e" />
                            <path d="M27 41 Q32 46 37 41" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: KF, fontSize: 13, fontWeight: 800, fontStyle: 'italic', color: '#10B981', marginBottom: 6 }}>{animal.species}</p>
                        <p style={{ fontFamily: KF, fontSize: 13, fontWeight: 600, color: '#4B5563', lineHeight: 1.6 }}>{animal.description}</p>
                    </div>
                </div>

                <div style={{ background: isFed ? 'rgba(0,184,148,.08)' : 'rgba(255,159,67,.1)', borderRadius: 16, padding: '13px 16px', border: `2.5px solid ${isFed ? 'rgba(0,184,148,.3)' : 'rgba(255,159,67,.4)'}` }}>
                    <p style={{ fontFamily: KF, fontSize: 12, fontWeight: 900, color: isFed ? '#059669' : '#e17055', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Feeding Status</p>
                    <p style={{ fontFamily: KF, fontSize: 13, fontWeight: 600, color: isFed ? '#065F46' : '#92400E', lineHeight: 1.5 }}>{fedText}</p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <Btn3D onClick={onFeed} color={isFed ? '#95a5a6' : '#00b894'} disabled={isFed} icon={<Icons.Feed />} style={{ flex: 1, justifyContent: 'center' }}>
                        {isFed ? 'Already Fed' : 'Feed!'}
                    </Btn3D>
                    <Btn3D onClick={onClose} color="#74b9ff" icon={<Icons.Close />} style={{ flex: 1, justifyContent: 'center' }}>
                        Close
                    </Btn3D>
                </div>
            </div>
        </Modal>
    );
}

export function FeedingSuccessNotification({ visible, animalName, onHide }) {
    useEffect(() => {
        if (visible) { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }
    }, [visible, onHide]);
    if (!visible) return null;
    return (
        <div style={{
            position: 'fixed', top: 'max(18px, env(safe-area-inset-top) + 8px)', left: 0, right: 0,
            zIndex: 9999, display: 'flex', justifyContent: 'center', pointerEvents: 'none'
        }}>
            <div className="kids-pop" style={{
                background: 'linear-gradient(135deg, #00b894, #55efc4)',
                borderRadius: 9999, padding: '10px 22px', color: '#fff',
                fontFamily: KF, fontSize: 14, fontWeight: 800,
                boxShadow: '0 6px 0 rgba(0,120,90,.3)', whiteSpace: 'nowrap',
                border: '3px solid rgba(255,255,255,.5)',
                display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto'
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                You fed the {animalName}!
            </div>
        </div>
    );
}

export function QuitModal({ isOpen, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onCancel} showClose={false}>
            <div style={{ textAlign: 'center' }}>
                <div className="kids-bounce" style={{ width: 80, height: 80, margin: '0 auto 16px', background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(253,203,110,.4)' }}>
                    <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                        <ellipse cx="32" cy="36" rx="22" ry="18" fill="#e17055" opacity=".85" />
                        <circle cx="24" cy="30" r="4" fill="#fff" /><circle cx="40" cy="30" r="4" fill="#fff" />
                        <circle cx="25" cy="31" r="2" fill="#1a1a2e" /><circle cx="41" cy="31" r="2" fill="#1a1a2e" />
                        <path d="M27 40 Q32 36 37 40" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                </div>
                <h3 style={{ fontFamily: KF_DISPLAY, fontSize: 26, fontWeight: 400, margin: '0 0 8px', color: '#e17055' }}>Leaving So Soon?</h3>
                <p style={{ fontFamily: KF, fontSize: 14, fontWeight: 700, color: '#6B7280', marginBottom: 22, lineHeight: 1.65 }}>
                    The animals will miss you! Are you sure you want to leave?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Btn3D onClick={onCancel} color="#00b894" icon={<Icons.Play />} style={{ width: '100%', justifyContent: 'center' }}>Keep Playing!</Btn3D>
                    <Btn3D onClick={onConfirm} color="#95a5a6" icon={<Icons.Exit />} style={{ width: '100%', justifyContent: 'center' }}>Yes, Exit</Btn3D>
                </div>
            </div>
        </Modal>
    );
}

export function WelcomePopup({ visible, message }) {
    if (!visible) return null;
    return (
        <div style={{
            position: 'fixed',
            top: 'max(72px, env(safe-area-inset-top) + 56px)',
            left: 0,
            right: 0,
            zIndex: 130,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none'
        }}>
            <div className="welcome-fade" style={{
                background: 'rgba(20, 28, 36, 0.84)',
                color: '#f8fafc',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,.25)',
                padding: '10px 18px',
                fontFamily: KF,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.03em',
                boxShadow: '0 10px 26px rgba(0,0,0,.22)'
            }}>
                {message}
            </div>
        </div>
    );
}

export function Joystick({ baseRef, stickRef }) {
    const isTouch = useIsTouch();
    const { isLandscape, isShort } = useViewportInfo();
    if (!isTouch) return null;

    const size = isLandscape || isShort ? 96 : 120;
    const bottom = isLandscape || isShort
        ? 'max(10px, env(safe-area-inset-bottom))'
        : 'max(24px, env(safe-area-inset-bottom))';

    return (
        <div ref={baseRef} style={{
            position: 'fixed',
            bottom,
            left: 'max(16px, env(safe-area-inset-left))',
            width: size, height: size, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(116,185,255,.3) 0%, rgba(162,155,254,.25) 100%)',
            border: '3px solid rgba(255,255,255,.65)',
            boxShadow: '0 8px 32px rgba(0,0,0,.18), inset 0 2px 8px rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 110, touchAction: 'none',
        }}>
            <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px dashed rgba(255,255,255,.22)' }} />
            <div ref={stickRef} style={{
                width: isLandscape || isShort ? 44 : 52,
                height: isLandscape || isShort ? 44 : 52,
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #74b9ff, #a29bfe)',
                border: '3px solid rgba(255,255,255,.85)',
                boxShadow: '0 6px 20px rgba(116,185,255,.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,.85)">
                    <path d="M12 2l3 4h-2v4h4v-2l4 3-4 3v-2h-4v4h2l-3 4-3-4h2v-4H7v2l-4-3 4-3v2h4V6H9l3-4z" />
                </svg>
            </div>
        </div>
    );
}

export function JumpButton({ jumpRef }) {
    const [pressed, setPressed] = useState(false);
    const isTouch = useIsTouch();
    const { isLandscape, isShort } = useViewportInfo();
    if (!isTouch) return null;

    const size = isLandscape || isShort ? 62 : 74;
    const bottom = isLandscape || isShort
        ? 'max(10px, env(safe-area-inset-bottom))'
        : 'max(24px, env(safe-area-inset-bottom))';

    return (
        <button ref={jumpRef}
            onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
            onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
            style={{
                all: 'unset', boxSizing: 'border-box',
                position: 'fixed',
                bottom,
                right: 'max(16px, env(safe-area-inset-right))',
                width: size, height: size, borderRadius: '50%',
                background: 'linear-gradient(145deg, #55efc4, #00b894)',
                border: '3px solid rgba(255,255,255,.8)',
                boxShadow: pressed
                    ? '0 1px 0 rgba(0,100,70,.3)'
                    : '0 6px 0 rgba(0,120,80,.35), 0 10px 24px rgba(0,184,148,.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transform: pressed ? 'scale(.88) translateY(5px)' : 'scale(1)',
                transition: 'all .1s', zIndex: 110, touchAction: 'none', gap: 2,
            }}>
            <Icons.ArrowUp />
            <span style={{ fontFamily: KF, fontSize: isLandscape || isShort ? 7 : 8, fontWeight: 900, color: 'rgba(255,255,255,.9)', letterSpacing: '.1em' }}>JUMP</span>
        </button>
    );
}

export function CameraSystem({ gameStarted, containerRef, nearbyAnimalName, onRegister, onPhotoCountChange, onBeforeCapture }) {
    const [photos, setPhotos] = useState(() => {
        try { const s = localStorage.getItem('minizoo_photos'); return s ? JSON.parse(s) : []; }
        catch { return []; }
    });
    const [showGallery, setShowGallery] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [sequenceActive, setSequenceActive] = useState(false);
    const [cameraMode, setCameraMode] = useState(false);
    const [flash, setFlash] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const sequenceRef = useRef(false);
    const captureRef = useRef(false);
    const isTouch = useIsTouch();
    const { isLandscape, isShort } = useViewportInfo();

    const savePhotos = useCallback((list) => {
        try {
            const trimmed = list.slice(-20);
            localStorage.setItem('minizoo_photos', JSON.stringify(trimmed));
            return trimmed;
        } catch { return list; }
    }, []);

    const capturePhoto = useCallback(() => {
        if (capturing || captureRef.current || !containerRef?.current) return Promise.resolve(false);
        captureRef.current = true;
        setCapturing(true);
        setFlash(true);

        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    try {
                        const canvas = containerRef.current?.querySelector('canvas');
                        if (!canvas) {
                            setCapturing(false);
                            captureRef.current = false;
                            setFlash(false);
                            resolve(false);
                            return;
                        }

                        const tmp = document.createElement('canvas');
                        tmp.width = canvas.width;
                        tmp.height = canvas.height;
                        tmp.getContext('2d').drawImage(canvas, 0, 0);

                        const dataUrl = tmp.toDataURL('image/jpeg', 0.78);
                        const photo = {
                            id: Date.now(), dataUrl,
                            animalName: nearbyAnimalName || null,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            date: new Date().toLocaleDateString(),
                        };
                        setPhotos(prev => savePhotos([...prev, photo]));
                        resolve(true);
                    } catch (err) {
                        console.warn('Capture failed:', err);
                        resolve(false);
                    }
                    setCapturing(false);
                    captureRef.current = false;
                    setTimeout(() => setFlash(false), 250);
                });
            });
        });
    }, [capturing, containerRef, nearbyAnimalName, savePhotos]);

    const deletePhoto = useCallback((id) => {
        setPhotos(prev => { const u = prev.filter(p => p.id !== id); savePhotos(u); return u; });
        setSelectedPhoto(p => (p?.id === id ? null : p));
    }, [savePhotos]);

    const downloadPhoto = useCallback((photo) => {
        const a = document.createElement('a');
        a.download = `zoo-photo-${photo.id}.jpg`;
        a.href = photo.dataUrl; a.click();
    }, []);

    const openCamera = useCallback(() => {
        setCameraMode(true);
    }, []);

    const closeCamera = useCallback(() => {
        setCameraMode(false);
    }, []);

    const startCaptureSequence = useCallback(async () => {
        if (sequenceRef.current || captureRef.current) return;
        sequenceRef.current = true;
        setSequenceActive(true);
        setCameraMode(true);
        try {
            await onBeforeCapture?.();
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await capturePhoto();
        } finally {
            await new Promise(resolve => setTimeout(resolve, 90));
            sequenceRef.current = false;
            setSequenceActive(false);
            setCameraMode(false);
        }
    }, [onBeforeCapture, capturePhoto]);

    useEffect(() => {
        if (!gameStarted) return;
        const onKey = e => {
            if (e.key.toLowerCase() !== 'c' || e.ctrlKey || e.metaKey || e.repeat) return;
            startCaptureSequence();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [gameStarted, startCaptureSequence]);

    const isBusy = capturing || sequenceActive;

    useEffect(() => {
        onRegister?.({ capture: capturePhoto, openCamera, closeCamera, startCaptureSequence, openGallery: () => setShowGallery(true) });
    }, [capturePhoto, openCamera, closeCamera, startCaptureSequence, onRegister]);

    useEffect(() => {
        onPhotoCountChange?.(photos.length);
    }, [photos.length, onPhotoCountChange]);

    if (!gameStarted) return null;

    return (
        <>
            {flash && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(255,255,255,.85)', pointerEvents: 'none', animation: 'kids-pop .3s ease-out both' }} />
            )}

            {isTouch && (
                <div style={{
                    position: 'fixed', top: isLandscape || isShort ? 'max(66px, env(safe-area-inset-top) + 46px)' : 'max(80px, env(safe-area-inset-top) + 60px)', right: 'max(16px, env(safe-area-inset-right))',
                    zIndex: 110, display: 'flex', flexDirection: 'column', gap: 12
                }}>
                    <button onClick={() => setShowGallery(true)} title={`Gallery (${photos.length})`} style={{
                        all: 'unset', boxSizing: 'border-box',
                        width: 44, height: 44, borderRadius: 13,
                        background: 'linear-gradient(145deg,#6c5ce7,#a29bfe)',
                        border: '2.5px solid rgba(255,255,255,.8)',
                        boxShadow: '0 4px 0 rgba(80,60,180,.4)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', touchAction: 'none', position: 'relative',
                    }}>
                        <Icons.Gallery />
                        {photos.length > 0 && (
                            <div style={{
                                position: 'absolute', top: -5, right: -5,
                                width: 18, height: 18, borderRadius: '50%',
                                background: '#ff6b9d', border: '2px solid rgba(20,20,30,.9)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: KF, fontSize: 9, fontWeight: 900, color: '#fff',
                            }}>
                                {photos.length > 9 ? '9+' : photos.length}
                            </div>
                        )}
                    </button>
                    <button onClick={startCaptureSequence} title={isBusy ? 'Camera Busy' : 'Capture Photo'} style={{
                        all: 'unset', boxSizing: 'border-box',
                        width: 52, height: 52, borderRadius: '50%',
                        background: isBusy
                            ? 'linear-gradient(145deg,#636e72,#2d3436)'
                            : cameraMode
                                ? 'linear-gradient(145deg,#fff,#f1f2f6)'
                                : 'linear-gradient(145deg,#74b9ff,#a29bfe)',
                        border: '3px solid rgba(255,255,255,.9)',
                        boxShadow: isBusy ? '0 1px 0 rgba(0,0,0,.2)' : '0 5px 0 rgba(0,0,0,.2), 0 8px 20px rgba(0,0,0,.18)',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isBusy ? '#fff' : (cameraMode ? '#2d3436' : '#fff'),
                        transform: isBusy ? 'translateY(4px) scale(0.95)' : 'scale(1)',
                        transition: 'all .15s', touchAction: 'none',
                    }}>
                        {capturing ? <Icons.CameraOff /> : <Icons.Camera />}
                    </button>
                </div>
            )}

            {cameraMode && (
                <div style={{
                    position: 'fixed',
                    top: 'max(18px, env(safe-area-inset-top) + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 125,
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 999,
                        background: 'rgba(14, 20, 30, .82)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,.25)',
                        padding: '7px 12px',
                        boxShadow: '0 10px 24px rgba(0,0,0,.2)',
                        fontFamily: KF,
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: '.03em'
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: capturing ? '#ff6b9d' : '#55efc4', boxShadow: capturing ? '0 0 0 5px rgba(255,107,157,.18)' : '0 0 0 5px rgba(85,239,196,.18)' }} />
                        {capturing ? 'CAPTURING' : 'CAMERA ACTIVE'}
                    </div>
                </div>
            )}

            {!isTouch && cameraMode && (
                <div style={{
                    position: 'fixed',
                    bottom: 'max(18px, env(safe-area-inset-bottom) + 8px)',
                    left: 0,
                    right: 0,
                    zIndex: 120,
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 16,
                        background: 'rgba(12, 18, 28, .72)',
                        border: '1.5px solid rgba(255,255,255,.2)',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <Btn3D onClick={startCaptureSequence} color="#74b9ff" icon={<Icons.Camera />} disabled={isBusy}>
                            Capture
                        </Btn3D>
                        <Btn3D onClick={closeCamera} color="#95a5a6" icon={<Icons.Close />} disabled={isBusy}>
                            Close
                        </Btn3D>
                    </div>
                </div>
            )}

            {showGallery && (
                <PhotoGallery
                    photos={photos}
                    onClose={() => { setShowGallery(false); setSelectedPhoto(null); }}
                    onDelete={deletePhoto}
                    onDownload={downloadPhoto}
                    selectedPhoto={selectedPhoto}
                    onSelectPhoto={setSelectedPhoto}
                />
            )}
        </>
    );
}

function PhotoGallery({ photos, onClose, onDelete, onDownload, selectedPhoto, onSelectPhoto }) {
    return (
        <Modal isOpen={true} onClose={onClose} title="My Zoo Photos">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {photos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </div>
                        <p style={{ fontFamily: KF, fontSize: 14, fontWeight: 700, color: '#9CA3AF' }}>No photos yet</p>
                        <p style={{ fontFamily: KF, fontSize: 12, fontWeight: 600, color: '#D1D5DB', marginTop: 4 }}>Press C or tap the camera button to take a photo</p>
                    </div>
                ) : (
                    <>
                        {selectedPhoto && (
                            <div style={{ borderRadius: 16, overflow: 'hidden', border: '3px solid #ffd32a', boxShadow: '0 8px 24px rgba(0,0,0,.15)', position: 'relative' }}>
                                <img src={selectedPhoto.dataUrl} alt="Zoo photo" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.7))', padding: '24px 12px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        {selectedPhoto.animalName && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: KF, fontSize: 12, fontWeight: 800, color: '#ffd32a' }}>
                                                <Icons.Pin />
                                                Near {selectedPhoto.animalName}
                                            </div>
                                        )}
                                        <p style={{ fontFamily: KF, fontSize: 11, color: 'rgba(255,255,255,.7)', margin: '2px 0 0' }}>
                                            {selectedPhoto.date} · {selectedPhoto.timestamp}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => onDownload(selectedPhoto)} style={{ all: 'unset', boxSizing: 'border-box', width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                            <Icons.Download />
                                        </button>
                                        <button onClick={() => onDelete(selectedPhoto.id)} style={{ all: 'unset', boxSizing: 'border-box', width: 30, height: 30, borderRadius: 9, background: 'rgba(255,50,50,.4)', border: '1.5px solid rgba(255,100,100,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                            <Icons.Trash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, maxHeight: selectedPhoto ? 180 : 340, overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }} data-ui-scrollable="true">
                            {[...photos].reverse().map(photo => (
                                <div key={photo.id} onClick={() => onSelectPhoto(selectedPhoto?.id === photo.id ? null : photo)} style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: selectedPhoto?.id === photo.id ? '3px solid #ffd32a' : '2.5px solid #E5E7EB', transition: 'all .15s', transform: selectedPhoto?.id === photo.id ? 'scale(0.96)' : 'scale(1)', position: 'relative' }}>
                                    <img src={photo.dataUrl} alt="Zoo photo" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                                    {photo.animalName && (
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.6))', padding: '12px 4px 3px', fontFamily: KF, fontSize: 8, fontWeight: 800, color: '#fff', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {photo.animalName}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <p style={{ fontFamily: KF, fontSize: 11, color: '#9CA3AF', textAlign: 'center', fontWeight: 700 }}>
                            {photos.length} photo{photos.length !== 1 ? 's' : ''} · Tap to select · Tap again to deselect
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
}

export function BottomHotbar({ gameStarted, completedTasks, totalTasks }) {
    const isTouch = useIsTouch();
    if (!gameStarted || isTouch) return null;

    const allDone = completedTasks === totalTasks && totalTasks > 0;

    const slots = [
        { id: 'tasks', icon: allDone ? <Icons.Trophy /> : <Icons.Tasks />, label: `${completedTasks}/${totalTasks}`, desc: 'Tasks', onClick: null, badge: null, bg: allDone ? 'linear-gradient(145deg,#ffd32a,#f9ca24)' : null, active: allDone },
    ];

    return (
        <div style={{ position: 'fixed', bottom: 16, left: 0, right: 0, zIndex: 22, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', gap: 6, background: 'rgba(14,14,22,.78)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '8px 10px', border: '2px solid rgba(255,255,255,.12)', boxShadow: '0 8px 32px rgba(0,0,0,.35)', pointerEvents: 'auto' }}>
                {slots.map(slot => <HotbarSlot key={slot.id} slot={slot} />)}
            </div>
        </div>
    );
}

function HotbarSlot({ slot }) {
    const [hov, setHov] = useState(false);
    const [pressed, setPressed] = useState(false);
    const active = hov && slot.onClick;
    return (
        <div onClick={slot.onClick}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setPressed(false); }}
            onMouseDown={() => slot.onClick && setPressed(true)} onMouseUp={() => setPressed(false)}
            title={slot.desc}
            style={{ width: 52, height: 56, borderRadius: 14, background: active ? (slot.bg || 'rgba(255,255,255,.15)') : slot.active ? (slot.bg || 'rgba(255,255,255,.1)') : 'rgba(255,255,255,.06)', border: `2px solid rgba(255,255,255,${active ? '.4' : '.1'})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: slot.onClick ? 'pointer' : 'default', transition: 'all .15s', transform: pressed ? 'translateY(2px) scale(0.95)' : active ? 'translateY(-3px)' : 'translateY(0)', boxShadow: active ? '0 6px 16px rgba(0,0,0,.3)' : 'none', position: 'relative' }}>
            <span style={{ color: active || slot.active ? '#fff' : 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .15s' }}>{slot.icon}</span>
            <span style={{ fontFamily: KF, fontSize: 8, fontWeight: 800, color: active || slot.active ? '#fff' : 'rgba(255,255,255,.35)', letterSpacing: '.04em', transition: 'color .15s' }}>{slot.label}</span>
            {slot.badge !== null && slot.badge !== undefined && (
                <div style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#ff6b9d', border: '2px solid rgba(14,14,22,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: KF, fontSize: 9, fontWeight: 900, color: '#fff' }}>
                    {slot.badge > 9 ? '9+' : slot.badge}
                </div>
            )}
        </div>
    );
}

function SidePanel({ isOpen, onClose, side, title, children, accent = '#ff9f43' }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const tx = side === 'left'
        ? (isOpen ? 'translateX(0)' : 'translateX(-105%)')
        : (isOpen ? 'translateX(0)' : 'translateX(105%)');

    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)',
                zIndex: 190, opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none', transition: 'opacity .25s',
            }} />
            <div data-ui-panel="true" style={{
                position: 'fixed', top: 0, [side]: 0, height: '100dvh',
                width: 'min(300px, 90vw)',
                background: '#fff', zIndex: 195,
                transform: tx, transition: 'transform .32s cubic-bezier(.16,1,.3,1)',
                display: 'flex', flexDirection: 'column',
                borderRadius: side === 'left' ? '0 28px 28px 0' : '28px 0 0 28px',
                overflow: 'hidden',
                boxShadow: side === 'left' ? '6px 0 48px rgba(0,0,0,.14)' : '-6px 0 48px rgba(0,0,0,.14)',
            }}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${accent}, ${accent}88)`, flexShrink: 0 }} />
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 18px', borderBottom: '2px dashed #F3F4F6', flexShrink: 0,
                }}>
                    <span style={{ fontFamily: KF_DISPLAY, fontSize: 20, color: '#374151' }}>{title}</span>
                    <button onClick={onClose} style={{
                        all: 'unset', boxSizing: 'border-box',
                        width: 34, height: 34, borderRadius: 12, background: '#F3F4F6',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6B7280', boxShadow: '0 2px 0 #d1d5db', transition: 'background .15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}>
                        <Icons.Close />
                    </button>
                </div>
                <div data-ui-scrollable="true" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 18, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>{children}</div>
            </div>
        </>
    );
}

function Modal({ isOpen, onClose, title, children, showClose = true, placement = 'center', showBackdrop = true, bottomOffset = null }) {
    useEffect(() => {
        if (!isOpen || !showBackdrop) return undefined;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, showBackdrop]);

    if (!isOpen) return null;

    const isBottom = placement === 'bottom';
    const bottomBase = bottomOffset || 'max(16px, env(safe-area-inset-bottom))';
    const topValue = isBottom
        ? `calc(100% - ${bottomBase})`
        : '50%';
    const translateValue = isBottom ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)';

    return (
        <div data-ui-modal="true" style={{
            position: 'fixed', inset: 0, width: '100vw', height: '100dvh',
            zIndex: 200,
            pointerEvents: showBackdrop ? 'auto' : 'none',
            padding: 'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
            boxSizing: 'border-box'
        }}>
            <div onClick={showBackdrop ? onClose : undefined} style={{
                position: 'absolute', inset: 0,
                background: showBackdrop ? 'rgba(0,0,0,.55)' : 'transparent',
                backdropFilter: showBackdrop ? 'blur(8px)' : 'none',
                pointerEvents: showBackdrop ? 'auto' : 'none',
            }} />
            <div style={{
                position: 'absolute', left: '50%', top: topValue, transform: translateValue,
                transition: 'top .28s cubic-bezier(.16,1,.3,1), transform .28s cubic-bezier(.16,1,.3,1), border-radius .28s cubic-bezier(.16,1,.3,1), max-height .28s cubic-bezier(.16,1,.3,1)',
                background: '#fff', borderRadius: isBottom ? 24 : 28,
                boxShadow: '0 24px 80px rgba(0,0,0,.25), 0 8px 24px rgba(0,0,0,.15)',
                width: 'min(100%, 520px)', maxWidth: isBottom ? 560 : 460,
                maxHeight: isBottom
                    ? 'min(68dvh, 560px)'
                    : 'calc(100dvh - max(32px, env(safe-area-inset-top) + env(safe-area-inset-bottom)))',
                display: 'flex', flexDirection: 'column', overflowY: 'auto',
                padding: isBottom ? '22px 18px 18px' : '26px 22px 22px',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                overscrollBehavior: 'contain',
                pointerEvents: 'auto'
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                    background: 'linear-gradient(90deg, #ff9f43, #ff6b9d, #a29bfe)',
                    borderRadius: isBottom ? '24px 24px 0 0' : '28px 28px 0 0',
                }} />
                {showClose && (
                    <button onClick={onClose} style={{
                        all: 'unset', boxSizing: 'border-box',
                        position: 'absolute', top: 14, right: 14,
                        width: 32, height: 32, borderRadius: 12,
                        background: '#F3F4F6', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6B7280', boxShadow: '0 2px 0 #d1d5db', transition: 'background .15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}>
                        <Icons.Close />
                    </button>
                )}
                {title && (
                    <h3 style={{
                        fontFamily: KF_DISPLAY, fontSize: 22, margin: '0 0 16px',
                        background: 'linear-gradient(135deg, #ff9f43, #ff6b9d)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        paddingRight: showClose ? 36 : 0,
                    }}>
                        {title}
                    </h3>
                )}
                {children}
            </div>
        </div>
    );
}

function Section({ label, children }) {
    return (
        <div>
            <p style={{ fontFamily: KF, fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>{label}</p>
            {children}
        </div>
    );
}

export function GameUI() { return null; }
export function BackButton() { return null; }
export function BackModal({ onConfirm, onCancel }) { return <QuitModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />; }
export function PreGameScreen({ onStart }) { return <MainMenu onStart={onStart} isVisible={true} />; }
export function AnimalInfoPanel({ animal, onClose }) { if (!animal) return null; return <AnimalInfoModal animal={animal} onClose={onClose} onFeed={() => { }} isFed={false} />; }
export function InteractPrompt({ visible }) {
    if (!visible) return null;
    return (
        <div style={{ position: 'fixed', bottom: 44, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,.95)', borderRadius: 9999, padding: '8px 18px', boxShadow: '0 4px 16px rgba(0,0,0,.1)', border: '2.5px solid #ffd32a' }}>
                <span style={{ fontFamily: KF, fontSize: 12, fontWeight: 800, color: '#374151' }}>Press E to interact</span>
            </div>
        </div>
    );
}

export { BULUSAN_ZOO_URL };