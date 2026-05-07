import React, { useState, useRef, useEffect } from 'react';

// ─── Design tokens ────────────────────────────────────────────
export const C = {
  navy: '#0D1B5E', navyMid: '#1A3CC8', navyLight: '#EEF3FF',
  orange: '#1A3CC8', orangeLight: '#EEF3FF',
  blue: '#2563EB', blueLight: '#DBEAFE',
  green: '#059669', greenLight: '#ECFDF5',
  red: '#DC2626', redLight: '#FEF2F2',
  amber: '#D97706', amberLight: '#FFFBEB',
  purple: '#7C3AED', purpleLight: '#F5F3FF',
  teal: '#0891B2', tealLight: '#CFFAFE',
  gray: '#475569', grayLight: '#F8FAFC',
  border: '#E2E8F0', borderMd: '#CBD5E1',
  text: '#0F172A', textSub: '#475569', textMuted: '#94A3B8',
  bg: '#F1F5F9', white: '#fff',
};

// ─── Icon ─────────────────────────────────────────────────────
export const Icon = ({ name, size = 16, color = 'currentColor', style }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', style, flexShrink: 0 };
  const icons = {
    dashboard: <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    users: <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    kyc: <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    rates: <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    bookings: <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    enquiries: <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    analytics: <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    search: <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    activity: <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    check: <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    edit: <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    upload: <svg {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    download: <svg {...p}><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    plus: <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    chevronDown: <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>,
    chevronRight: <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    logout: <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    eye: <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    mail: <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    filter: <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    refresh: <svg {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    info: <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    calendar: <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    ship: <svg {...p}><path d="M2 20l2-8h16l2 8H2z"/><path d="M6 12V8l3-3 3 3 3-3 3 3v4"/><line x1="12" y1="5" x2="12" y2="3"/></svg>,
    ports: <svg {...p}><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/></svg>,
  };
  return icons[name] || null;
};

// ─── Badge ────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  under_review: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  approved: { bg: '#ECFDF5', color: '#065F46', border: '#BBF7D0' },
  confirmed: { bg: '#ECFDF5', color: '#065F46', border: '#BBF7D0' },
  rejected: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  cancelled: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  responded: { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
  closed: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
  active: { bg: '#ECFDF5', color: '#065F46', border: '#BBF7D0' },
  suspended: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  not_submitted: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
  resubmit_required: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  pending_kyc: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
};

export const Badge = ({ status, label }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const text = label || (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.2px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>{text}</span>
  );
};

// ─── Button ───────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, loading, icon, style: sx }) => {
  const sizes = { sm: { padding: '5px 12px', fontSize: 12 }, md: { padding: '8px 18px', fontSize: 13 }, lg: { padding: '11px 24px', fontSize: 14 } };
  const variants = {
    primary: { background: C.navy, color: '#fff', border: 'none' },
    orange: { background: C.orange, color: '#fff', border: 'none' },
    danger: { background: C.red, color: '#fff', border: 'none' },
    success: { background: C.green, color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: C.text, border: `1.5px solid ${C.border}` },
    outline: { background: '#fff', color: C.navy, border: `1.5px solid ${C.navy}` },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      ...sizes[size], ...variants[variant],
      borderRadius: 8, fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.6 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s', ...sx,
    }}>
      {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : icon}
      {children}
    </button>
  );
};

// ─── Card ─────────────────────────────────────────────────────
export const Card = ({ children, style: sx, title, action }) => (
  <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', ...sx }}>
    {title && (
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{title}</span>
        {action}
      </div>
    )}
    {children}
  </div>
);

// ─── Stat card ────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon, color = C.navy, trend }) => (
  <Card sx={{ padding: 0 }}>
    <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 12, color: C.textSub, marginTop: 5 }}>{sub}</div>}
        {trend !== undefined && (
          <div style={{ fontSize: 11, color: trend >= 0 ? C.green : C.red, fontWeight: 600, marginTop: 4 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
          </div>
        )}
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={color} />
      </div>
    </div>
  </Card>
);

// ─── Table ────────────────────────────────────────────────────
export const Table = ({ columns, data, loading, emptyMsg = 'No records found' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: C.grayLight }}>
          {columns.map(c => (
            <th key={c.key} style={{ padding: '10px 14px', textAlign: c.align || 'left', fontWeight: 700, fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
              {c.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: C.textMuted }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTopColor: C.navy, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Loading...
            </div>
          </td></tr>
        ) : data?.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: C.textMuted }}>{emptyMsg}</td></tr>
        ) : (
          data?.map((row, i) => (
            <tr key={row._id || i} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.grayLight}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: '11px 14px', color: C.text, textAlign: c.align || 'left', whiteSpace: c.wrap ? 'normal' : 'nowrap' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ─── Pagination ───────────────────────────────────────────────
export const Pagination = ({ page, pages, total, limit, onChange }) => {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
      <span>Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[...Array(Math.min(pages, 7))].map((_, i) => {
          const p = i + 1;
          return (
            <button key={p} onClick={() => onChange(p)} style={{
              width: 30, height: 30, borderRadius: 6, border: `1px solid ${p === page ? C.navy : C.border}`,
              background: p === page ? C.navy : '#fff', color: p === page ? '#fff' : C.text,
              fontSize: 12, fontWeight: p === page ? 700 : 400, cursor: 'pointer',
            }}>{p}</button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, width = 560, footer }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ overflow: 'auto', flex: 1, padding: '20px 24px' }}>{children}</div>
        {footer && <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
};

// ─── Input / Select / Textarea ────────────────────────────────
const inputStyle = { width: '100%', padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: 'none', background: '#fff', transition: 'border-color 0.15s' };

export const Input = ({ label, error, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{label}</label>}
    <input style={{ ...inputStyle, borderColor: error ? C.red : C.border }} {...props}
      onFocus={e => !error && (e.target.style.borderColor = C.navy)}
      onBlur={e => !error && (e.target.style.borderColor = C.border)} />
    {error && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>{error}</div>}
  </div>
);

export const Select = ({ label, error, children, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{label}</label>}
    <select style={{ ...inputStyle, cursor: 'pointer' }} {...props}>{children}</select>
    {error && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>{error}</div>}
  </div>
);

export const Textarea = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{label}</label>}
    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} {...props} />
  </div>
);

// ─── Toast ────────────────────────────────────────────────────
export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: C.green, error: C.red, info: C.blue, warning: C.amber };
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#fff', border: `1px solid ${C.border}`, borderLeft: `4px solid ${colors[type]}`,
      borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 260, maxWidth: 400,
      animation: 'slideIn 0.25s ease',
    }}>
      <span style={{ color: colors[type], flexShrink: 0 }}>
        <Icon name={type === 'success' ? 'check' : type === 'error' ? 'x' : 'info'} size={16} color={colors[type]} />
      </span>
      <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 2 }}><Icon name="x" size={14} /></button>
    </div>
  );
};

// ─── useToast hook ────────────────────────────────────────────
export const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => setToast({ message, type, key: Date.now() });
  const hide = () => setToast(null);
  const ToastEl = toast ? <Toast key={toast.key} message={toast.message} type={toast.type} onClose={hide} /> : null;
  return { show, ToastEl };
};

// ─── Date formatter ───────────────────────────────────────────
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ─── Global styles ────────────────────────────────────────────
export const GlobalStyles = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    button { font-family: inherit; }
    input, select, textarea { font-family: inherit; }
    a { text-decoration: none; color: inherit; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
  `}</style>
);
