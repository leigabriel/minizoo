import React, { useState, useEffect, useCallback, useRef } from 'react';

const BULUSAN_ZOO_URL = import.meta.env.VITE_BULUSAN_ZOO_URL || 'http://localhost:5173';
const HUD_EDGE = 14;
const KF = "'Nunito', 'Fredoka One', system-ui, sans-serif";
const KF_DISPLAY = "'Fredoka One', 'Nunito', system-ui, sans-serif";

// Device detection — initialized synchronously so mobile gets the right state on first render
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

// Icons
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
};

// Btn3D — genuine 3D push-down button.
// Uses a top-face gradient + thick bottom shadow to simulate depth.
// All styles are inline so Tailwind base cannot interfere.
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

    // Compute a darker shade for the bottom face (the "wall" of the 3D effect)
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
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={() => !disabled && setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            onMouseDown={() => !disabled && setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onTouchStart={(e) => { e.preventDefault(); !disabled && setPressed(true); }}
            onTouchEnd={() => { setPressed(false); !disabled && onClick?.(); }}
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
                // Top-face gradient: lighter at top, base color in middle, darker at bottom edge
                background: disabled
                    ? 'linear-gradient(180deg, #D1D5DB 0%, #9CA3AF 100%)'
                    : `linear-gradient(180deg, ${lightColor} 0%, ${baseColor} 55%, ${darken(color.startsWith('#') ? color : '#4CAF50', 20)} 100%)`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                opacity: disabled ? 0.7 : 1,
                // Multi-layer shadow: thick bottom = 3D depth wall, ambient glow
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
            {/* Shine layer on top face */}
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

// Cloud wave SVG background used on main menu
function CloudBg() {
    return (
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '45%', opacity: .18, pointerEvents: 'none' }}
            fill="white">
            <path d="M0,160L48,144C96,128,192,96,288,90.7C384,85,480,107,576,138.7C672,171,768,213,864,202.7C960,192,1056,128,1152,112C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
    );
}

// Loading screen tree
function LoadingTree({ left, size = 1, color = '#3aad5a', swayClass = 'ls-sway-a', delay = 0 }) {
    const h = Math.round(70 * size);
    const w = Math.round(52 * size);
    const th = Math.round(16 * size);
    const tw = Math.round(10 * size);
    return (
        <div className={`ls-tree ${swayClass}`} style={{ left, animationDelay: `${delay}s` }}>
            <div className="ls-tree-canopy" style={{ width: w, height: h, background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)` }} />
            <div className="ls-tree-trunk" style={{ width: tw, height: th }} />
        </div>
    );
}

function SunRays({ count = 8 }) {
    return (
        <div className="ls-sun-rays">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="ls-sun-ray" style={{ transform: `rotate(${(360 / count) * i}deg) translateX(-50%)` }} />
            ))}
        </div>
    );
}

function Sparkles({ count = 6 }) {
    const items = [
        { x: -44, y: -18, c: '#ff6b9d', s: 12, d: 0 },
        { x: 52, y: -24, c: '#ffd32a', s: 10, d: .4 },
        { x: -28, y: 30, c: '#4ecdc4', s: 8, d: .8 },
        { x: 40, y: 28, c: '#ff9f43', s: 11, d: 1.2 },
        { x: -60, y: 4, c: '#a29bfe', s: 9, d: 1.6 },
        { x: 66, y: 2, c: '#55efc4', s: 8, d: 2.0 },
    ].slice(0, count);
    return (
        <>
            {items.map((it, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    left: `calc(50% + ${it.x}px)`, top: `calc(50% + ${it.y}px)`,
                    color: it.c, width: it.s, height: it.s,
                    animation: 'kids-sparkle 2s ease-in-out infinite',
                    animationDelay: `${it.d}s`, pointerEvents: 'none',
                }}>
                    <Icons.Sparkle />
                </div>
            ))}
        </>
    );
}

// Loading screen
export function LoadingScreen({ progress }) {
    const [wiggle, setWiggle] = useState(false);
    const phase =
        progress < 20 ? 'Planting trees...' :
            progress < 45 ? 'Growing the forest...' :
                progress < 65 ? 'Waking the animals...' :
                    progress < 85 ? 'Painting the sky...' : 'Almost ready!';

    useEffect(() => {
        setWiggle(true);
        const t = setTimeout(() => setWiggle(false), 1200);
        return () => clearTimeout(t);
    }, [phase]);

    const grassBlades = Array.from({ length: 28 }, (_, i) => ({
        left: `${(i / 28) * 100 + (Math.random() * 2 - 1)}%`,
        height: 14 + Math.round(Math.random() * 14),
        delay: (i * 0.12).toFixed(2),
        dir: i % 2 === 0 ? 1 : -1,
    }));

    const trees = [
        { left: '2vw', size: .9, color: '#2d9148', sway: 'ls-sway-b', delay: 0 },
        { left: '9vw', size: 1.1, color: '#3aad5a', sway: 'ls-sway-a', delay: -.5 },
        { left: '16vw', size: .8, color: '#52c278', sway: 'ls-sway-c', delay: -.3 },
        { left: '23vw', size: 1.2, color: '#2d9148', sway: 'ls-sway-d', delay: -.7 },
        { left: '31vw', size: .95, color: '#3aad5a', sway: 'ls-sway-a', delay: -.2 },
        { left: '39vw', size: 1.0, color: '#52c278', sway: 'ls-sway-e', delay: -.9 },
        { left: '47vw', size: 1.15, color: '#2d9148', sway: 'ls-sway-b', delay: -.15 },
        { left: '55vw', size: .85, color: '#3aad5a', sway: 'ls-sway-c', delay: -.6 },
        { left: '63vw', size: 1.05, color: '#52c278', sway: 'ls-sway-d', delay: -.4 },
        { left: '70vw', size: .9, color: '#2d9148', sway: 'ls-sway-a', delay: -.8 },
        { left: '78vw', size: 1.1, color: '#3aad5a', sway: 'ls-sway-e', delay: -.25 },
        { left: '86vw', size: .8, color: '#52c278', sway: 'ls-sway-b', delay: -.55 },
        { left: '93vw', size: 1.0, color: '#2d9148', sway: 'ls-sway-c', delay: -.1 },
    ];

    return (
        <div className="absolute inset-0 z-50 overflow-hidden ls-bg">
            <div className="ls-sun"><SunRays count={10} /></div>
            <div className="ls-cloud ls-cloud--1"><div className="ls-cloud-shape" /></div>
            <div className="ls-cloud ls-cloud--2"><div className="ls-cloud-shape" /></div>
            <div className="ls-cloud ls-cloud--3"><div className="ls-cloud-shape" /></div>
            <div className="ls-butterfly ls-butterfly--1">
                <div className="ls-wing ls-wing--l" style={{ background: '#ff9ff3' }} />
                <div className="ls-wing ls-wing--r" style={{ background: '#ff9ff3' }} />
            </div>
            <div className="ls-butterfly ls-butterfly--2">
                <div className="ls-wing ls-wing--l" style={{ background: '#74b9ff' }} />
                <div className="ls-wing ls-wing--r" style={{ background: '#74b9ff' }} />
            </div>
            <div className="ls-hill ls-hill--back" />
            <div className="ls-hill ls-hill--mid" />
            <div className="ls-grass-strip">
                {grassBlades.map((b, i) => (
                    <div key={i} className="ls-grass-blade" style={{
                        left: b.left, height: b.height,
                        animation: `ls-grass-sway ${1.6 + parseFloat(b.delay) * .4}s ease-in-out ${b.delay}s infinite alternate`,
                        transformOrigin: b.dir > 0 ? 'bottom left' : 'bottom right',
                    }} />
                ))}
            </div>
            <div className="ls-trees">
                {trees.map((t, i) => (
                    <LoadingTree key={i} left={t.left} size={t.size} color={t.color} swayClass={t.sway} delay={t.delay} />
                ))}
            </div>
            <div className="ls-hill ls-hill--front" />

            <div className="ls-ui" style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                paddingBottom: '22vh',
            }}>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                    <div className={wiggle ? 'kids-wiggle' : 'kids-bounce'} style={{
                        width: 80, height: 80, background: 'rgba(255,255,255,.95)', borderRadius: 28,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,.14)',
                        border: '3px solid rgba(255,255,255,.9)',
                    }}>
                        <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                            <defs>
                                <radialGradient id="face-grad" cx="50%" cy="40%" r="60%">
                                    <stop offset="0%" stopColor="#7de09a" /><stop offset="100%" stopColor="#3aad5a" />
                                </radialGradient>
                            </defs>
                            <ellipse cx="18" cy="16" rx="8" ry="11" fill="#5ec97c" />
                            <ellipse cx="46" cy="16" rx="8" ry="11" fill="#5ec97c" />
                            <ellipse cx="18" cy="15" rx="4" ry="6" fill="#2d9148" />
                            <ellipse cx="46" cy="15" rx="4" ry="6" fill="#2d9148" />
                            <ellipse cx="32" cy="38" rx="22" ry="18" fill="url(#face-grad)" />
                            <circle cx="24" cy="34" r="4.5" fill="#fff" /><circle cx="40" cy="34" r="4.5" fill="#fff" />
                            <circle cx="25" cy="35" r="2.5" fill="#1a1a2e" /><circle cx="41" cy="35" r="2.5" fill="#1a1a2e" />
                            <circle cx="26" cy="34" r="1" fill="#fff" /><circle cx="42" cy="34" r="1" fill="#fff" />
                            <path d="M27 41 Q32 46 37 41" stroke="#1a5c2e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                            <circle cx="24" cy="44" r="4" fill="#ff9ff3" opacity=".45" />
                            <circle cx="40" cy="44" r="4" fill="#ff9ff3" opacity=".45" />
                        </svg>
                    </div>
                    <Sparkles count={6} />
                </div>

                <h1 style={{
                    fontFamily: KF_DISPLAY, fontSize: 'clamp(26px, 6vw, 44px)', fontWeight: 400,
                    color: '#fff', textShadow: '0 3px 0 rgba(0,0,0,.15)', marginBottom: 6,
                    textAlign: 'center', letterSpacing: '.02em', lineHeight: 1.1,
                }}>
                    Mini Zoo Explorer
                </h1>
                <p style={{
                    fontFamily: KF, fontSize: 'clamp(12px, 2.5vw, 15px)', fontWeight: 700,
                    color: 'rgba(255,255,255,.85)', marginBottom: 22, textAlign: 'center',
                    textShadow: '0 1px 4px rgba(0,0,0,.2)',
                }}>
                    {phase}
                </p>

                <div style={{ width: 'min(280px, 74vw)', position: 'relative' }}>
                    <div className="ls-bar-track" style={{ height: 16 }}>
                        <div className="ls-bar-fill" style={{ width: `${Math.max(4, progress)}%` }}>
                            <div className="ls-walker">
                                <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
                                    <ellipse cx="32" cy="38" rx="16" ry="12" fill="#ff9f43" />
                                    <circle cx="32" cy="24" r="10" fill="#ff9f43" />
                                    <circle cx="27" cy="22" r="3" fill="#fff" /><circle cx="37" cy="22" r="3" fill="#fff" />
                                    <circle cx="28" cy="23" r="1.5" fill="#1a1a2e" /><circle cx="38" cy="23" r="1.5" fill="#1a1a2e" />
                                    <path d="M28 29 Q32 33 36 29" stroke="#c0392b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <p style={{ marginTop: 10, fontFamily: KF, fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.8)', letterSpacing: '.04em', textShadow: '0 1px 4px rgba(0,0,0,.2)' }}>
                    {Math.round(progress)}%
                </p>
            </div>
        </div>
    );
}

// Toggle switch
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

// Main menu
export function MainMenu({ onStart, isVisible }) {
    const device = useDeviceType();
    const isMobile = device !== 'desktop';
    const [settings, setSettings] = useState(() => {
        try {
            const s = localStorage.getItem('minizoo_settings');
            return s ? JSON.parse(s) : { musicEnabled: true, soundEnabled: true };
        } catch { return { musicEnabled: true, soundEnabled: true }; }
    });
    const [transitioning, setTransitioning] = useState(false);
    const [logoWiggle, setLogoWiggle] = useState(false);

    const save = useCallback((updates) => {
        const updated = { ...settings, ...updates };
        setSettings(updated);
        try { localStorage.setItem('minizoo_settings', JSON.stringify(updated)); } catch { }
    }, [settings]);

    const handlePlay = useCallback(() => {
        setTransitioning(true);
        setTimeout(onStart, 700);
    }, [onStart]);

    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-40 overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #87CEEB 0%, #56CCF2 30%, #43e97b 70%, #38f9d7 100%)' }}>

            {/* Background blobs */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {[
                    { w: 260, h: 260, top: '-8%', left: '-6%', c: 'rgba(255,255,255,.12)', dur: 14 },
                    { w: 180, h: 180, top: '10%', right: '-4%', c: 'rgba(255,200,100,.14)', dur: 18 },
                    { w: 220, h: 220, bottom: '5%', left: '8%', c: 'rgba(100,255,180,.12)', dur: 16 },
                    { w: 140, h: 140, bottom: '12%', right: '6%', c: 'rgba(255,100,180,.1)', dur: 20 },
                ].map((b, i) => (
                    <div key={i} style={{
                        position: 'absolute', width: b.w, height: b.h, borderRadius: '50%',
                        background: b.c, top: b.top, left: b.left, right: b.right, bottom: b.bottom,
                        animation: `kids-float ${b.dur}s ease-in-out infinite`,
                        animationDelay: `${i * -3.5}s`, filter: 'blur(2px)',
                    }} />
                ))}
            </div>

            <CloudBg />

            {/* Transition overlay */}
            <div className="absolute inset-0 bg-black pointer-events-none z-50 transition-opacity duration-700"
                style={{ opacity: transitioning ? 1 : 0 }} />

            {/* Content */}
            <div className="kids-slide-up" style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px' : '24px',
                overflowY: 'auto',
            }}>
                <div style={{ width: '100%', maxWidth: isMobile ? 340 : 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 12 : 16 }}>

                    {/* Logo */}
                    <div onClick={() => { setLogoWiggle(true); setTimeout(() => setLogoWiggle(false), 1200); }}
                        style={{ cursor: 'pointer', position: 'relative' }}>
                        <div className={logoWiggle ? 'kids-wiggle' : 'kids-float'} style={{
                            width: isMobile ? 88 : 108, height: isMobile ? 88 : 108,
                            background: 'rgba(255,255,255,.95)', borderRadius: 32,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 12px 40px rgba(0,0,0,.15)',
                            border: '4px solid rgba(255,255,255,.8)',
                        }}>
                            <svg width={isMobile ? 56 : 68} height={isMobile ? 56 : 68} viewBox="0 0 64 64" fill="none">
                                <defs>
                                    <radialGradient id="menu-face" cx="50%" cy="40%" r="60%">
                                        <stop offset="0%" stopColor="#7de09a" /><stop offset="100%" stopColor="#3aad5a" />
                                    </radialGradient>
                                </defs>
                                <ellipse cx="18" cy="16" rx="8" ry="11" fill="#5ec97c" />
                                <ellipse cx="46" cy="16" rx="8" ry="11" fill="#5ec97c" />
                                <ellipse cx="18" cy="15" rx="4" ry="6" fill="#2d9148" />
                                <ellipse cx="46" cy="15" rx="4" ry="6" fill="#2d9148" />
                                <ellipse cx="32" cy="38" rx="22" ry="18" fill="url(#menu-face)" />
                                <circle cx="24" cy="34" r="4.5" fill="#fff" /><circle cx="40" cy="34" r="4.5" fill="#fff" />
                                <circle cx="25" cy="35" r="2.5" fill="#1a1a2e" /><circle cx="41" cy="35" r="2.5" fill="#1a1a2e" />
                                <circle cx="26" cy="34" r="1" fill="#fff" /><circle cx="42" cy="34" r="1" fill="#fff" />
                                <path d="M27 41 Q32 46 37 41" stroke="#1a5c2e" strokeWidth="2" fill="none" strokeLinecap="round" />
                                <circle cx="24" cy="44" r="4" fill="#ff9ff3" opacity=".5" />
                                <circle cx="40" cy="44" r="4" fill="#ff9ff3" opacity=".5" />
                            </svg>
                        </div>
                        <div style={{
                            position: 'absolute', inset: -8, borderRadius: 40,
                            border: '3px solid rgba(255,255,255,.5)',
                            animation: 'kids-pulse-ring 2s ease-out infinite',
                        }} />
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center', lineHeight: 1 }}>
                        <h1 style={{ fontFamily: KF_DISPLAY, fontSize: isMobile ? 32 : 42, fontWeight: 400, color: '#fff', textShadow: '0 4px 0 rgba(0,100,50,.25)', margin: 0 }}>Mini Zoo</h1>
                        <h2 style={{ fontFamily: KF_DISPLAY, fontSize: isMobile ? 22 : 28, fontWeight: 400, color: 'rgba(255,255,255,.9)', textShadow: '0 3px 0 rgba(0,100,50,.2)', margin: 0 }}>Explorer</h2>
                    </div>

                    {/* Info card */}
                    <div style={{
                        width: '100%', background: 'rgba(255,255,255,.88)', borderRadius: 24,
                        padding: isMobile ? '14px 16px' : '18px 22px',
                        boxShadow: '0 8px 32px rgba(0,0,0,.1)', border: '3px solid rgba(255,255,255,.9)',
                    }}>
                        <p style={{ fontSize: isMobile ? 13 : 14, color: '#374151', lineHeight: 1.65, fontFamily: KF, fontWeight: 600 }}>
                            Welcome to Bulusan Mini Zoo! Explore the grounds, discover amazing animals, feed them, and complete all tasks to become a Zoo Master!
                        </p>
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px dashed #E5E7EB' }}>
                            <p style={{ fontSize: 11.5, color: '#9CA3AF', fontFamily: KF, fontWeight: 700 }}>
                                {device === 'desktop'
                                    ? 'WASD to move  ·  Space to jump  ·  Shift to run  ·  E / F to interact  ·  C for photo'
                                    : 'Joystick to move  ·  Tap buttons to interact  ·  Camera to take photos'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Play button */}
                    <Btn3D onClick={handlePlay} color="#ff6b9d" size="xl" icon={<Icons.Play />}
                        style={{ width: '100%', fontFamily: KF_DISPLAY, fontSize: isMobile ? 20 : 24, letterSpacing: '.04em', animation: 'glow-pulse 2.4s ease-in-out infinite', justifyContent: 'center' }}>
                        Play Game
                    </Btn3D>

                    {/* Audio */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
                        <KidsToggle enabled={settings.musicEnabled} onChange={v => save({ musicEnabled: v })} label="Music" icon={<Icons.Music />} color="#a29bfe" />
                        <KidsToggle enabled={settings.soundEnabled} onChange={v => save({ soundEnabled: v })} label="Sound" icon={<Icons.Sound />} color="#74b9ff" />
                    </div>

                    {/* Quit */}
                    <button onClick={() => { window.location.href = BULUSAN_ZOO_URL; }} style={{
                        all: 'unset', boxSizing: 'border-box', width: '100%', padding: '11px 24px',
                        borderRadius: 9999, border: '2.5px solid rgba(255,255,255,.6)',
                        background: 'rgba(255,255,255,.25)', color: 'rgba(255,255,255,.9)',
                        fontFamily: KF, fontSize: isMobile ? 14 : 15, fontWeight: 800,
                        cursor: 'pointer', transition: 'background .18s', backdropFilter: 'blur(4px)',
                        textAlign: 'center',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.38)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.25)'; }}
                    >
                        Quit
                    </button>

                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontFamily: KF, fontWeight: 700, textAlign: 'center' }}>
                        An educational game by Bulusan Zoo
                    </p>
                </div>
            </div>
        </div>
    );
}

// Game HUD — top left menu+badge, top right tasks
export function GameHUD({ onMenuClick, onTasksClick, completedTasks, totalTasks }) {
    const device = useDeviceType();
    const allDone = completedTasks === totalTasks && totalTasks > 0;
    const [taskBounce, setTaskBounce] = useState(false);
    const prevCompleted = useRef(completedTasks);

    useEffect(() => {
        if (completedTasks > prevCompleted.current) {
            setTaskBounce(true);
            setTimeout(() => setTaskBounce(false), 800);
        }
        prevCompleted.current = completedTasks;
    }, [completedTasks]);

    const hudBtn = {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)',
        border: '2px solid rgba(255,255,255,.7)',
        boxShadow: '0 4px 0 rgba(0,0,0,.14), 0 6px 16px rgba(0,0,0,.12)',
        cursor: 'pointer', transition: 'all .15s', color: '#374151',
    };

    return (
        <>
            {/* Top left */}
            <div style={{ position: 'absolute', top: HUD_EDGE, left: HUD_EDGE, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={onMenuClick} style={{ ...hudBtn, width: 44, height: 44, borderRadius: 16 }}
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

            {/* Top right */}
            <div style={{ position: 'absolute', top: HUD_EDGE, right: HUD_EDGE, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={onTasksClick} className={taskBounce ? 'kids-bounce' : ''} style={{
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

// Settings panel
export function SettingsPanel({ isOpen, onClose, onQuit }) {
    const [settings, setSettings] = useState(() => {
        try { const s = localStorage.getItem('minizoo_settings'); return s ? JSON.parse(s) : { musicEnabled: true, soundEnabled: true }; }
        catch { return { musicEnabled: true, soundEnabled: true }; }
    });

    const save = useCallback((updates) => {
        const updated = { ...settings, ...updates };
        setSettings(updated);
        try { localStorage.setItem('minizoo_settings', JSON.stringify(updated)); } catch { }
    }, [settings]);

    const KB = [
        { action: 'Move', key: 'WASD' }, { action: 'Jump', key: 'Space' },
        { action: 'Run', key: 'Shift' }, { action: 'Interact', key: 'E' },
        { action: 'Feed', key: 'F' }, { action: 'Photo', key: 'C' }, { action: 'Close', key: 'Esc' },
    ];

    return (
        <SidePanel isOpen={isOpen} onClose={onClose} side="left" title="Settings" accent="#a29bfe">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Section label="Audio">
                    <KidsToggle enabled={settings.musicEnabled} onChange={v => save({ musicEnabled: v })} label="Music" icon={<Icons.Music />} color="#a29bfe" />
                    <div style={{ height: 8 }} />
                    <KidsToggle enabled={settings.soundEnabled} onChange={v => save({ soundEnabled: v })} label="Sound Effects" icon={<Icons.Sound />} color="#74b9ff" />
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

// Task panel
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

// Interaction prompt shown when player is near an animal
export function InteractionPrompt({ visible, onFeed, onViewDetails, animalName, isTouchDevice }) {
    if (!visible) return null;
    // On touch: sit above the feed/view buttons (which are at bottom ~160px)
    // On desktop: sit just above the hotbar (bottom ~80px)
    const bottomOffset = isTouchDevice ? 240 : 82;
    return (
        <div style={{
            position: 'fixed', bottom: bottomOffset, left: '50%',
            transform: 'translateX(-50%)', zIndex: 100,
            animation: 'kids-slide-up .28s cubic-bezier(.16,1,.3,1) both',
            whiteSpace: 'nowrap',
        }}>
            <div style={{
                background: 'rgba(255,255,255,.97)', borderRadius: 9999,
                padding: '9px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.16)',
                border: '3px solid #ffd32a',
                display: 'flex', alignItems: 'center', gap: 10,
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
                    <span style={{ fontFamily: KF, fontSize: 11, fontWeight: 700, color: '#9CA3AF' }}>
                        Use buttons below
                    </span>
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

// Touch feed/view buttons — shown when near an animal on mobile/tablet
export function MobileInteractionButtons({ visible, onFeed, onViewDetails }) {
    if (!visible) return null;
    return (
        <div style={{
            position: 'fixed', bottom: 160, left: '50%',
            transform: 'translateX(-50%)', zIndex: 100,
            display: 'flex', gap: 12,
            animation: 'kids-slide-up .28s cubic-bezier(.16,1,.3,1) both',
        }}>
            {[
                { label: 'Feed', color: '#ff9f43', shadow: 'rgba(255,159,67,.45)', icon: <Icons.Feed />, onClick: onFeed },
                { label: 'View', color: '#74b9ff', shadow: 'rgba(116,185,255,.45)', icon: <Icons.Eye />, onClick: onViewDetails },
            ].map(b => <TouchBtn key={b.label} {...b} />)}
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

// Animal info modal
export function AnimalInfoModal({ animal, onClose, onFeed, isFed }) {
    if (!animal) return null;
    const fedText = isFed ? `The ${animal.name} has been fed.` : `The ${animal.name} is hungry.`;
    return (
        <Modal isOpen={!!animal} onClose={onClose} title={animal.name}>
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

// Success toast for feeding
export function FeedingSuccessNotification({ visible, animalName, onHide }) {
    useEffect(() => {
        if (visible) { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }
    }, [visible, onHide]);
    if (!visible) return null;
    return (
        <div className="kids-pop" style={{
            position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, background: 'linear-gradient(135deg, #00b894, #55efc4)',
            borderRadius: 9999, padding: '10px 22px', color: '#fff',
            fontFamily: KF, fontSize: 14, fontWeight: 800,
            boxShadow: '0 6px 0 rgba(0,120,90,.3)', whiteSpace: 'nowrap',
            border: '3px solid rgba(255,255,255,.5)',
            display: 'flex', alignItems: 'center', gap: 8,
        }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            You fed the {animalName}!
        </div>
    );
}

// Quit confirmation modal
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

// Touch joystick — visible only on touch devices (mobile + tablet), both portrait and landscape
export function Joystick({ baseRef, stickRef }) {
    const isTouch = useIsTouch();
    if (!isTouch) return null;
    return (
        <div ref={baseRef} style={{
            position: 'fixed',
            bottom: 'max(24px, env(safe-area-inset-bottom))',
            left: 'max(16px, env(safe-area-inset-left))',
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(116,185,255,.3) 0%, rgba(162,155,254,.25) 100%)',
            border: '3px solid rgba(255,255,255,.65)',
            boxShadow: '0 8px 32px rgba(0,0,0,.18), inset 0 2px 8px rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 110, touchAction: 'none',
        }}>
            <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px dashed rgba(255,255,255,.22)' }} />
            <div ref={stickRef} style={{
                width: 52, height: 52, borderRadius: '50%',
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

// Touch jump button — visible only on touch devices
export function JumpButton({ jumpRef }) {
    const isTouch = useIsTouch();
    if (!isTouch) return null;
    const [pressed, setPressed] = useState(false);
    return (
        <button ref={jumpRef}
            onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
            onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
            style={{
                all: 'unset', boxSizing: 'border-box',
                position: 'fixed',
                bottom: 'max(24px, env(safe-area-inset-bottom))',
                right: 'max(16px, env(safe-area-inset-right))',
                width: 74, height: 74, borderRadius: '50%',
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
            <span style={{ fontFamily: KF, fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,.9)', letterSpacing: '.1em' }}>JUMP</span>
        </button>
    );
}

// Camera system — photo capture + gallery. Uses preserveDrawingBuffer (set in Scene.jsx)
// and double rAF to read the current WebGL frame. onRegister wires desktop hotbar.
export function CameraSystem({ gameStarted, containerRef, nearbyAnimalName, onRegister }) {
    const [photos, setPhotos] = useState(() => {
        try { const s = localStorage.getItem('minizoo_photos'); return s ? JSON.parse(s) : []; }
        catch { return []; }
    });
    const [showGallery, setShowGallery] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [flash, setFlash] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const isTouch = useIsTouch();

    const savePhotos = useCallback((list) => {
        try {
            const trimmed = list.slice(-20);
            localStorage.setItem('minizoo_photos', JSON.stringify(trimmed));
            return trimmed;
        } catch { return list; }
    }, []);

    const capturePhoto = useCallback(() => {
        if (capturing || !containerRef?.current) return;
        setCapturing(true);
        setFlash(true);

        // Wait one animation frame so Three.js has rendered the current scene
        // into the buffer before we read it (preserveDrawingBuffer must be true)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                try {
                    const canvas = containerRef.current?.querySelector('canvas');
                    if (!canvas) { setCapturing(false); setFlash(false); return; }

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
                } catch (err) {
                    console.warn('Capture failed:', err);
                }
                setCapturing(false);
                setTimeout(() => setFlash(false), 250);
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

    // Keyboard shortcut C for capture
    useEffect(() => {
        if (!gameStarted) return;
        const onKey = e => { if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) capturePhoto(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [gameStarted, capturePhoto]);

    // Register handlers so parent (desktop hotbar) can trigger capture/gallery
    useEffect(() => {
        onRegister?.({ capture: capturePhoto, openGallery: () => setShowGallery(true) });
    }, [capturePhoto, onRegister]);

    if (!gameStarted) return null;

    // Touch: floating buttons bottom-right. Desktop: rendered by BottomHotbar.
    return (
        <>
            {flash && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(255,255,255,.85)', pointerEvents: 'none', animation: 'kids-pop .3s ease-out both' }} />
            )}

            {isTouch && (
                <>
                    {/* Camera button — above jump button on right side */}
                    <button onClick={capturePhoto} title="Take Photo" style={{
                        all: 'unset', boxSizing: 'border-box',
                        position: 'fixed', bottom: 110, right: 16, zIndex: 110,
                        width: 52, height: 52, borderRadius: '50%',
                        background: capturing ? 'linear-gradient(145deg,#636e72,#2d3436)' : 'linear-gradient(145deg,#fff,#f1f2f6)',
                        border: '3px solid rgba(255,255,255,.9)',
                        boxShadow: capturing ? '0 1px 0 rgba(0,0,0,.2)' : '0 5px 0 rgba(0,0,0,.2), 0 8px 20px rgba(0,0,0,.18)',
                        cursor: capturing ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: capturing ? '#fff' : '#2d3436',
                        transform: capturing ? 'translateY(4px) scale(0.95)' : 'scale(1)',
                        transition: 'all .15s', touchAction: 'none',
                    }}>
                        {capturing ? <Icons.CameraOff /> : <Icons.Camera />}
                    </button>

                    {/* Gallery button — above camera button */}
                    <button onClick={() => setShowGallery(true)} title={`Gallery (${photos.length})`} style={{
                        all: 'unset', boxSizing: 'border-box',
                        position: 'fixed', bottom: 172, right: 16, zIndex: 110,
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
                </>
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

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, maxHeight: selectedPhoto ? 180 : 340, overflowY: 'auto' }}>
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

// Bottom hotbar — desktop only (hidden on touch devices)
export function BottomHotbar({ gameStarted, completedTasks, totalTasks, photos, onCameraClick, onGalleryClick }) {
    const isTouch = useIsTouch();
    if (!gameStarted || isTouch) return null;

    const allDone = completedTasks === totalTasks && totalTasks > 0;

    const slots = [
        { id: 'camera', icon: <Icons.Camera />, label: 'C', desc: 'Camera', onClick: onCameraClick, badge: null, bg: null, active: false },
        { id: 'gallery', icon: <Icons.Gallery />, label: `${photos}`, desc: 'Gallery', onClick: onGalleryClick, badge: photos > 0 ? photos : null, bg: 'linear-gradient(145deg,#a29bfe,#6c5ce7)', active: false },
        { id: 'tasks', icon: allDone ? <Icons.Trophy /> : <Icons.Tasks />, label: `${completedTasks}/${totalTasks}`, desc: 'Tasks', onClick: null, badge: null, bg: allDone ? 'linear-gradient(145deg,#ffd32a,#f9ca24)' : null, active: allDone },
    ];

    return (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 22, display: 'flex', gap: 6, background: 'rgba(14,14,22,.78)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '8px 10px', border: '2px solid rgba(255,255,255,.12)', boxShadow: '0 8px 32px rgba(0,0,0,.35)' }}>
            {slots.map(slot => <HotbarSlot key={slot.id} slot={slot} />)}
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

// Slide-in side drawer
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
            <div style={{
                position: 'fixed', top: 0, [side]: 0, bottom: 0,
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
                <div style={{ flex: 1, overflowY: 'auto', padding: 18, WebkitOverflowScrolling: 'touch' }}>{children}</div>
            </div>
        </>
    );
}

// Modal overlay — centered dialog, above all game UI (z-index 200)
function Modal({ isOpen, onClose, title, children, showClose = true }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            // Safe padding accounts for mobile browser chrome and notches
            padding: 'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
        }}>
            <div onClick={onClose} style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)',
            }} />
            <div className="kids-pop" style={{
                position: 'relative', background: '#fff', borderRadius: 28,
                boxShadow: '0 24px 80px rgba(0,0,0,.25), 0 8px 24px rgba(0,0,0,.15)',
                width: '100%', maxWidth: 460,
                maxHeight: 'calc(100dvh - 32px)',
                overflowY: 'auto',
                padding: '26px 22px 22px',
                WebkitOverflowScrolling: 'touch',
            }}>
                {/* Color stripe top */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                    background: 'linear-gradient(90deg, #ff9f43, #ff6b9d, #a29bfe)',
                    borderRadius: '28px 28px 0 0',
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

// Section heading inside panels
function Section({ label, children }) {
    return (
        <div>
            <p style={{ fontFamily: KF, fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>{label}</p>
            {children}
        </div>
    );
}

// Legacy stubs kept for any external imports
export function GameUI() { return null; }
export function BackButton() { return null; }
export function BackModal({ onConfirm, onCancel }) { return <QuitModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />; }
export function PreGameScreen({ onStart }) { return <MainMenu onStart={onStart} isVisible={true} />; }
export function AnimalInfoPanel({ animal, onClose }) { if (!animal) return null; return <AnimalInfoModal animal={animal} onClose={onClose} onFeed={() => { }} isFed={false} />; }
export function InteractPrompt({ visible }) {
    if (!visible) return null;
    return (
        <div style={{ position: 'fixed', bottom: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            <div style={{ background: 'rgba(255,255,255,.95)', borderRadius: 9999, padding: '8px 18px', boxShadow: '0 4px 16px rgba(0,0,0,.1)', border: '2.5px solid #ffd32a' }}>
                <span style={{ fontFamily: KF, fontSize: 12, fontWeight: 800, color: '#374151' }}>Press E to interact</span>
            </div>
        </div>
    );
}

export { BULUSAN_ZOO_URL };