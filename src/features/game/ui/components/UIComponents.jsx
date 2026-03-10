import React from 'react';

// ─── Inject Google Font + keyframes ────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --amber:   #F59E0B;
    --orange:  #F97316;
    --rose:    #F43F5E;
    --emerald: #10B981;
    --sky:     #0EA5E9;
    --ink:     #1C1917;
    --muted:   #78716C;
    --surface: #FAFAF9;
    --border:  #E7E5E4;
    --white:   #FFFFFF;
    --grad-warm: linear-gradient(135deg, #F59E0B, #F97316, #F43F5E);
    --grad-cool: linear-gradient(135deg, #0EA5E9, #6366F1);
    --grad-green: linear-gradient(135deg, #10B981, #059669);
    --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
    --shadow-md: 0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.06);
    --shadow-lg: 0 12px 32px rgba(0,0,0,.12), 0 4px 8px rgba(0,0,0,.06);
    --shadow-xl: 0 24px 64px rgba(0,0,0,.16), 0 8px 16px rgba(0,0,0,.08);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 9999px;
    font-family: 'Nunito', 'Fredoka One', sans-serif;
    color: var(--ink);
  }

  @keyframes fadeIn   { from { opacity:0; transform:scale(.96) translateY(6px) } to { opacity:1; transform:scale(1) translateY(0) } }
  @keyframes slideUp  { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
  @keyframes toastIn  { from { opacity:0; transform:translateX(-50%) translateY(-16px) scale(.9) } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1) } }
  @keyframes barFill  { from { width:0 } to { width:var(--target-width) } }
  @keyframes spin     { to { transform:rotate(360deg) } }

  .animate-fadeIn  { animation: fadeIn  .22s cubic-bezier(.16,1,.3,1) both }
  .animate-slideUp { animation: slideUp .22s cubic-bezier(.16,1,.3,1) both }
  .animate-toastIn { animation: toastIn .28s cubic-bezier(.16,1,.3,1) both }
  .animate-spin    { animation: spin 1s linear infinite }

  /* ── Demo page resets ── */
  body { margin:0; background:#F5F4F2; }
`;

function InjectStyles() {
    React.useEffect(() => {
        if (!document.getElementById('ds-styles')) {
            const el = document.createElement('style');
            el.id = 'ds-styles';
            el.textContent = styles;
            document.head.appendChild(el);
        }
    }, []);
    return null;
}

// ─── BUTTON ────────────────────────────────────────────────────────────────
export function Button({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    style: styleProp = {},
    className = '',
    disabled = false,
    loading = false,
    icon = null,
    ...props
}) {
    const base = {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: '7px', fontFamily: 'inherit', fontWeight: 600, letterSpacing: '-.01em',
        border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        outline: 'none', transition: 'all .18s cubic-bezier(.16,1,.3,1)',
        userSelect: 'none', position: 'relative', overflow: 'hidden',
        opacity: disabled ? .48 : 1,
    };

    const variants = {
        primary: {
            background: 'var(--grad-warm)', color: '#fff',
            boxShadow: '0 4px 14px rgba(249,115,22,.35), 0 1px 3px rgba(0,0,0,.08)',
        },
        secondary: {
            background: 'var(--white)', color: 'var(--ink)',
            border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        },
        success: {
            background: 'var(--grad-green)', color: '#fff',
            boxShadow: '0 4px 14px rgba(16,185,129,.3)',
        },
        danger: {
            background: 'linear-gradient(135deg, #F43F5E, #E11D48)', color: '#fff',
            boxShadow: '0 4px 14px rgba(244,63,94,.3)',
        },
        ghost: {
            background: 'rgba(28,25,23,.06)', color: 'var(--ink)', boxShadow: 'none',
        },
        outline: {
            background: 'transparent', color: 'var(--orange)',
            border: '1.5px solid var(--orange)', boxShadow: 'none',
        },
    };

    const sizes = {
        sm: { padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-sm)' },
        md: { padding: '9px 18px', fontSize: '13.5px', borderRadius: 'var(--radius-md)' },
        lg: { padding: '12px 24px', fontSize: '15px', borderRadius: 'var(--radius-md)' },
        xl: { padding: '15px 32px', fontSize: '16px', borderRadius: 'var(--radius-lg)' },
    };

    const hoverRef = React.useRef(null);
    const handleEnter = () => {
        if (!disabled && !loading && hoverRef.current) {
            hoverRef.current.style.transform = 'translateY(-1px)';
            hoverRef.current.style.filter = 'brightness(1.05)';
        }
    };
    const handleLeave = () => {
        if (hoverRef.current) {
            hoverRef.current.style.transform = '';
            hoverRef.current.style.filter = '';
        }
    };
    const handleDown = () => {
        if (!disabled && !loading && hoverRef.current)
            hoverRef.current.style.transform = 'scale(.97)';
    };

    return (
        <>
            <InjectStyles />
            <button
                ref={hoverRef}
                onClick={!disabled && !loading ? onClick : undefined}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onMouseDown={handleDown}
                onMouseUp={handleLeave}
                style={{ ...base, ...variants[variant], ...sizes[size], ...styleProp }}
                {...props}
            >
                {loading ? (
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" />
                ) : icon ? <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span> : null}
                {children}
            </button>
        </>
    );
}

// ─── ICON BUTTON ───────────────────────────────────────────────────────────
export function IconButton({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    style: styleProp = {},
    tooltip,
    ...props
}) {
    const [hovered, setHovered] = React.useState(false);

    const variants = {
        primary: { background: 'var(--grad-warm)', color: '#fff', boxShadow: '0 4px 14px rgba(249,115,22,.3)' },
        secondary: { background: '#fff', color: 'var(--ink)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
        success: { background: 'var(--grad-green)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,.25)' },
        danger: { background: 'linear-gradient(135deg,#F43F5E,#E11D48)', color: '#fff', boxShadow: '0 4px 12px rgba(244,63,94,.25)' },
        ghost: { background: 'rgba(28,25,23,.08)', color: 'var(--ink)', boxShadow: 'none' },
    };
    const sizes = { sm: 30, md: 38, lg: 46, xl: 56 };
    const sz = sizes[size];

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: sz, height: sz, borderRadius: '50%', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all .18s cubic-bezier(.16,1,.3,1)',
                    transform: hovered ? 'scale(1.08)' : 'scale(1)',
                    ...variants[variant], ...styleProp,
                }}
                {...props}
            >
                {children}
            </button>
            {tooltip && hovered && (
                <div style={{
                    position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--ink)', color: '#fff', fontSize: 11, fontWeight: 600,
                    padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', pointerEvents: 'none',
                    boxShadow: 'var(--shadow-md)',
                }}>
                    {tooltip}
                </div>
            )}
        </div>
    );
}

// ─── PANEL ─────────────────────────────────────────────────────────────────
export function Panel({ children, style: styleProp = {}, variant = 'default', noPadding = false }) {
    const variants = {
        default: {
            background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,.6)',
        },
        bordered: {
            background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
            border: '2px solid var(--amber)',
        },
        gradient: {
            background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,.6)',
            overflow: 'hidden', position: 'relative',
        },
        flat: {
            background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border)',
        },
    };

    return (
        <>
            <InjectStyles />
            <div style={{ ...variants[variant], padding: noPadding ? 0 : '20px 24px', ...styleProp }}>
                {variant === 'gradient' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'var(--grad-warm)',
                    }} />
                )}
                {children}
            </div>
        </>
    );
}

// ─── SIDE PANEL ────────────────────────────────────────────────────────────
export function SidePanel({ isOpen, onClose, side = 'left', title, children }) {
    const translateX = side === 'left'
        ? (isOpen ? 'translateX(0)' : 'translateX(-100%)')
        : (isOpen ? 'translateX(0)' : 'translateX(100%)');

    return (
        <>
            <InjectStyles />
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)',
                    zIndex: 40, opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity .25s ease',
                }}
            />

            {/* Drawer */}
            <div style={{
                position: 'fixed', top: 0, [side]: 0,
                height: '100%', width: 320,
                background: 'rgba(255,255,255,.98)', backdropFilter: 'blur(20px)',
                boxShadow: 'var(--shadow-xl)', zIndex: 50,
                transform: translateX, transition: 'transform .3s cubic-bezier(.16,1,.3,1)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Accent strip */}
                <div style={{ height: 3, background: 'var(--grad-warm)', flexShrink: 0 }} />

                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
                }}>
                    <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-.02em' }}>{title}</span>
                    <button
                        onClick={onClose}
                        style={{
                            width: 30, height: 30, borderRadius: '50%', border: 'none',
                            background: 'var(--surface)', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
                            transition: 'background .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#E7E5E4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {children}
                </div>
            </div>
        </>
    );
}

// ─── MODAL ─────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }) {
    React.useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidths = { sm: 380, md: 480, lg: 580, xl: 700 };

    return (
        <>
            <InjectStyles />
            <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                {/* Backdrop */}
                <div
                    onClick={onClose}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }}
                />

                {/* Dialog */}
                <div
                    className="animate-fadeIn"
                    style={{
                        position: 'relative', background: '#fff', borderRadius: 'var(--radius-xl)',
                        boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: maxWidths[size],
                        padding: '28px 28px 24px', overflow: 'hidden',
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--grad-warm)' }} />

                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: 16, right: 16, width: 30, height: 30,
                                borderRadius: '50%', border: 'none', background: 'var(--surface)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--muted)', transition: 'background .15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#E7E5E4'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}

                    {title && (
                        <h3 style={{
                            margin: '0 0 16px', fontSize: 20, fontWeight: 800, letterSpacing: '-.03em',
                            background: 'var(--grad-warm)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            paddingRight: 32,
                        }}>
                            {title}
                        </h3>
                    )}
                    {children}
                </div>
            </div>
        </>
    );
}

// ─── TOGGLE ────────────────────────────────────────────────────────────────
export function Toggle({ enabled, onChange, label, icon, description }) {
    return (
        <div
            onClick={() => onChange(!enabled)}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: enabled ? 'rgba(16,185,129,.06)' : 'var(--surface)',
                border: `1.5px solid ${enabled ? 'rgba(16,185,129,.25)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all .2s ease', userSelect: 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
                <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{label}</div>
                    {description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{description}</div>}
                </div>
            </div>

            {/* Track */}
            <div style={{
                width: 44, height: 26, borderRadius: 13,
                background: enabled ? 'var(--emerald)' : '#D1D5DB',
                position: 'relative', flexShrink: 0, transition: 'background .2s ease',
                boxShadow: enabled ? '0 0 0 3px rgba(16,185,129,.15)' : 'none',
            }}>
                {/* Thumb */}
                <div style={{
                    position: 'absolute', top: 3, left: enabled ? 21 : 3,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                    transition: 'left .2s cubic-bezier(.16,1,.3,1)',
                }} />
            </div>
        </div>
    );
}

// ─── TOAST ─────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', isVisible, onHide }) {
    React.useEffect(() => {
        if (isVisible) {
            const t = setTimeout(onHide, 3200);
            return () => clearTimeout(t);
        }
    }, [isVisible, onHide]);

    if (!isVisible) return null;

    const config = {
        success: { bg: 'var(--grad-green)', icon: '✓', glow: 'rgba(16,185,129,.3)' },
        error: { bg: 'linear-gradient(135deg,#F43F5E,#E11D48)', icon: '✕', glow: 'rgba(244,63,94,.3)' },
        info: { bg: 'var(--grad-cool)', icon: 'i', glow: 'rgba(14,165,233,.3)' },
        warning: { bg: 'var(--grad-warm)', icon: '!', glow: 'rgba(249,115,22,.3)' },
    };
    const { bg, icon, glow } = config[type] || config.success;

    return (
        <>
            <InjectStyles />
            <div className="animate-toastIn" style={{
                position: 'fixed', top: 20, left: '50%', zIndex: 9999,
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px 10px 12px',
                background: bg, borderRadius: 'var(--radius-full)',
                boxShadow: `0 8px 32px ${glow}, var(--shadow-md)`,
                color: '#fff', fontWeight: 600, fontSize: 13,
                letterSpacing: '-.01em', whiteSpace: 'nowrap',
            }}>
                <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(255,255,255,.25)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                }}>
                    {icon}
                </span>
                {message}
            </div>
        </>
    );
}

// ─── PROGRESS BAR ──────────────────────────────────────────────────────────
export function ProgressBar({ value, max, showLabel = false, variant = 'warm', style: styleProp = {} }) {
    const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

    const tracks = {
        warm: 'var(--grad-warm)',
        cool: 'var(--grad-cool)',
        green: 'var(--grad-green)',
    };

    return (
        <>
            <InjectStyles />
            <div style={{ width: '100%', ...styleProp }}>
                {showLabel && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                        <span>Progress</span>
                        <span style={{ color: 'var(--ink)' }}>{value} / {max}</span>
                    </div>
                )}
                <div style={{
                    width: '100%', height: 8, background: '#E7E5E4',
                    borderRadius: 'var(--radius-full)', overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${pct}%`, height: '100%',
                        background: tracks[variant] || tracks.warm,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width .6s cubic-bezier(.16,1,.3,1)',
                        boxShadow: pct > 0 ? '0 1px 4px rgba(249,115,22,.4)' : 'none',
                    }} />
                </div>
            </div>
        </>
    );
}

// ─── BADGE ─────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }) {
    const variants = {
        default: { background: 'var(--surface)', color: 'var(--muted)', border: '1.5px solid var(--border)' },
        primary: { background: 'rgba(249,115,22,.12)', color: 'var(--orange)', border: '1.5px solid rgba(249,115,22,.25)' },
        success: { background: 'rgba(16,185,129,.12)', color: '#059669', border: '1.5px solid rgba(16,185,129,.25)' },
        danger: { background: 'rgba(244,63,94,.12)', color: '#E11D48', border: '1.5px solid rgba(244,63,94,.25)' },
        info: { background: 'rgba(14,165,233,.12)', color: '#0284C7', border: '1.5px solid rgba(14,165,233,.25)' },
    };

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            fontSize: 11, fontWeight: 700, letterSpacing: '.02em',
            fontFamily: 'DM Mono, monospace',
            ...variants[variant],
        }}>
            {children}
        </span>
    );
}

// ─── INPUT ─────────────────────────────────────────────────────────────────
export function Input({ label, placeholder, value, onChange, type = 'text', prefix, suffix, error }) {
    const [focused, setFocused] = React.useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label && (
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.01em' }}>
                    {label}
                </label>
            )}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                border: `1.5px solid ${error ? 'var(--rose)' : focused ? 'var(--orange)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)', background: '#fff',
                boxShadow: focused ? `0 0 0 3px rgba(249,115,22,.12)` : 'none',
                transition: 'all .18s ease', overflow: 'hidden',
            }}>
                {prefix && (
                    <span style={{ paddingLeft: 12, color: 'var(--muted)', fontSize: 14, flexShrink: 0 }}>{prefix}</span>
                )}
                <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        flex: 1, border: 'none', outline: 'none', padding: '10px 12px',
                        fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)',
                        background: 'transparent',
                    }}
                />
                {suffix && (
                    <span style={{ paddingRight: 12, color: 'var(--muted)', fontSize: 14, flexShrink: 0 }}>{suffix}</span>
                )}
            </div>
            {error && <span style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 500 }}>{error}</span>}
        </div>
    );
}

// ─── DIVIDER ───────────────────────────────────────────────────────────────
export function Divider({ label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            {label && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</span>}
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
    );
}

// ─── DEMO PAGE ─────────────────────────────────────────────────────────────
export default function Demo() {
    const [sidePanelOpen, setSidePanelOpen] = React.useState(false);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [t1, setT1] = React.useState(true);
    const [t2, setT2] = React.useState(false);
    const [t3, setT3] = React.useState(true);
    const [toast, setToast] = React.useState({ visible: false, msg: '', type: 'success' });
    const [loading, setLoading] = React.useState(false);
    const [inputVal, setInputVal] = React.useState('');

    const showToast = (msg, type) => setToast({ visible: true, msg, type });
    const handleLoad = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2200);
    };

    const section = (title) => (
        <div style={{ marginBottom: 8, marginTop: 24 }}>
            <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
                textTransform: 'uppercase', color: 'var(--muted)',
                fontFamily: 'DM Mono, monospace',
            }}>
                {title}
            </span>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#F0EEEb', fontFamily: 'DM Sans, sans-serif' }}>
            <InjectStyles />

            {/* Header */}
            <div style={{
                background: 'rgba(255,255,255,.8)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--border)', padding: '14px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--grad-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" />
                            <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" opacity=".7" />
                            <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" opacity=".7" />
                            <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" opacity=".4" />
                        </svg>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.03em' }}>Design System</span>
                    <Badge variant="primary">v2.0</Badge>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="ghost" size="sm" onClick={() => setSidePanelOpen(true)}>☰ Menu</Button>
                    <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>Open Modal</Button>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 64px' }}>

                {/* Buttons */}
                {section('Buttons')}
                <Panel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                        <Button variant="primary">Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="success">Success</Button>
                        <Button variant="danger">Danger</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="outline">Outline</Button>
                    </div>
                    <Divider label="Sizes" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
                        <Button size="sm">Small</Button>
                        <Button size="md">Medium</Button>
                        <Button size="lg">Large</Button>
                        <Button size="xl">X-Large</Button>
                    </div>
                    <Divider label="States" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
                        <Button disabled>Disabled</Button>
                        <Button loading={loading} onClick={handleLoad}>
                            {loading ? 'Loading…' : 'Click to Load'}
                        </Button>
                        <Button icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}>
                            With Icon
                        </Button>
                    </div>
                </Panel>

                {/* Icon Buttons */}
                {section('Icon Buttons')}
                <Panel>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {['primary', 'secondary', 'success', 'danger', 'ghost'].map(v => (
                            <IconButton key={v} variant={v} tooltip={v}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1l1.8 3.8L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.8z"
                                        fill={v === 'secondary' || v === 'ghost' ? '#888' : 'white'} />
                                </svg>
                            </IconButton>
                        ))}
                    </div>
                </Panel>

                {/* Badges */}
                {section('Badges')}
                <Panel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <Badge>Default</Badge>
                        <Badge variant="primary">Primary</Badge>
                        <Badge variant="success">Success</Badge>
                        <Badge variant="danger">Danger</Badge>
                        <Badge variant="info">Info</Badge>
                    </div>
                </Panel>

                {/* Panels */}
                {section('Panels')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Panel variant="default"><p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}><strong style={{ color: 'var(--ink)' }}>Default</strong><br />Glass surface with shadow</p></Panel>
                    <Panel variant="bordered"><p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}><strong style={{ color: 'var(--ink)' }}>Bordered</strong><br />Amber accent border</p></Panel>
                    <Panel variant="gradient" style={{ position: 'relative' }}><p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', paddingTop: 4 }}><strong style={{ color: 'var(--ink)' }}>Gradient</strong><br />Top accent strip</p></Panel>
                    <Panel variant="flat"><p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}><strong style={{ color: 'var(--ink)' }}>Flat</strong><br />Subtle surface</p></Panel>
                </div>

                {/* Progress */}
                {section('Progress Bars')}
                <Panel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <ProgressBar value={72} max={100} showLabel variant="warm" />
                        <ProgressBar value={45} max={100} showLabel variant="cool" />
                        <ProgressBar value={88} max={100} showLabel variant="green" />
                    </div>
                </Panel>

                {/* Toggles */}
                {section('Toggles')}
                <Panel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Toggle enabled={t1} onChange={setT1} icon="🔔" label="Notifications" description="Receive push alerts" />
                        <Toggle enabled={t2} onChange={setT2} icon="🌙" label="Dark Mode" description="Switch to dark theme" />
                        <Toggle enabled={t3} onChange={setT3} icon="⚡" label="Performance Mode" />
                    </div>
                </Panel>

                {/* Inputs */}
                {section('Inputs')}
                <Panel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <Input label="Email address" placeholder="you@example.com" type="email" prefix="✉" value={inputVal} onChange={e => setInputVal(e.target.value)} />
                        <Input label="Amount" placeholder="0.00" prefix="$" suffix="USD" />
                        <Input label="With error" placeholder="Enter value" error="This field is required" />
                    </div>
                </Panel>

                {/* Toast triggers */}
                {section('Toasts')}
                <Panel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {['success', 'error', 'info', 'warning'].map(t => (
                            <Button key={t} variant={t === 'success' ? 'success' : t === 'error' ? 'danger' : 'secondary'} size="sm" onClick={() => showToast(`${t.charAt(0).toUpperCase() + t.slice(1)} notification!`, t)}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Button>
                        ))}
                    </div>
                </Panel>

            </div>

            {/* Side Panel */}
            <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} side="left" title="Navigation">
                {['Dashboard', 'Analytics', 'Projects', 'Team', 'Settings'].map((item, i) => (
                    <div key={i} style={{
                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', color: 'var(--ink)', fontSize: 14, fontWeight: 500,
                        transition: 'background .15s', marginBottom: 4,
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        {item}
                    </div>
                ))}
            </SidePanel>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Component Library" size="md">
                <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
                    A refined collection of UI primitives built for production. Every component ships with consistent tokens, smooth transitions, and accessible defaults.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={() => { setModalOpen(false); showToast('Changes saved!', 'success'); }}>Save Changes</Button>
                </div>
            </Modal>

            {/* Toast */}
            <Toast message={toast.msg} type={toast.type} isVisible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
        </div>
    );
}