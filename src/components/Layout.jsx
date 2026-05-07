import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AuthContext';
import { Icon, C } from './UI';

const NAV = [
  { path:'/dashboard',    icon:'dashboard',  label:'Dashboard' },
  { path:'/registrations',icon:'users',      label:'Registrations', badge:'registrations' },
  { path:'/kyc',          icon:'kyc',        label:'KYC Review',    badge:'kyc' },
  { path:'/users',        icon:'users',      label:'Users' },
  { path:'/rates',        icon:'rates',      label:'Rate Management' },
  { path:'/bookings',     icon:'bookings',   label:'Bookings',      badge:'bookings' },
  { path:'/enquiries',    icon:'enquiries',  label:'Enquiries',     badge:'enquiries' },
  { path:'/search-activity',icon:'activity', label:'Search Activity' },
  { path:'/analytics',   icon:'analytics',  label:'Analytics' },
];

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ padding:'22px 28px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, background:C.white }}>
      <div>
        <h1 style={{ fontSize:19, fontWeight:800, color:C.text, margin:0, fontFamily:"'Outfit',sans-serif" }}>{title}</h1>
        {subtitle && <p style={{ fontSize:12.5, color:C.textMuted, margin:'3px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:8, alignItems:'center' }}>{actions}</div>}
    </div>
  );
}

export default function AdminLayout({ children, badges = {} }) {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); };
  const sideW = collapsed ? 64 : 228;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg }}>
      {/* Sidebar */}
      <aside style={{ width:sideW, background:`linear-gradient(180deg,${C.navy} 0%,#162299 100%)`, display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100, transition:'width .2s', boxShadow:'2px 0 16px rgba(13,27,94,.25)' }}>

        {/* Logo */}
        <div style={{ padding: collapsed?'16px 0':'18px 20px', borderBottom:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', gap:10, cursor:'pointer', minHeight:72 }} onClick={()=>setCollapsed(c=>!c)}>
          <img src="/nextgen-logo.jpg" alt="NGR" style={{ width:36, height:36, borderRadius:8, objectFit:'contain', background:'#fff', padding:2, flexShrink:0 }}/>
          {!collapsed && (
            <div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:14, color:'#fff', lineHeight:1 }}>
                NEXT GEN <span style={{ color:'#00C2FF' }}>RATES</span>
              </div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', marginTop:2 }}>Admin Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'10px 0' }}>
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10,
                padding: collapsed?'12px 0':'11px 18px',
                justifyContent: collapsed?'center':'flex-start',
                color: isActive ? '#fff' : 'rgba(255,255,255,.58)',
                textDecoration:'none', fontSize:13, fontWeight: isActive?700:500,
                background: isActive ? 'rgba(255,255,255,.12)' : 'transparent',
                borderLeft: isActive ? '3px solid #00C2FF' : '3px solid transparent',
                transition:'all .15s', margin:'1px 0',
              })}>
              <Icon name={item.icon} size={16} color="currentColor"/>
              {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
              {!collapsed && item.badge && badges[item.badge] > 0 && (
                <span style={{ background:'#E8490A', color:'#fff', fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:99, minWidth:18, textAlign:'center' }}>
                  {badges[item.badge]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div style={{ padding: collapsed?'14px 0':'14px 18px', borderTop:'1px solid rgba(255,255,255,.1)' }}>
          {!collapsed && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.name}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2, textTransform:'capitalize' }}>{admin?.role?.replace('_',' ')}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, color:'rgba(255,255,255,.7)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600, justifyContent: collapsed?'center':'flex-start' }}>
            <Icon name="logout" size={14} color="currentColor"/>
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, marginLeft:sideW, transition:'margin-left .2s', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        {children}
      </main>
    </div>
  );
}
