import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AuthContext';

const B = {
  navy:'#0D1B5E', navyDark:'#060F3A', blue:'#1A3CC8', blueVib:'#1E50FF',
  accent:'#00C2FF', white:'#FFFFFF', offWhite:'#F0F4FF',
  border:'#D4DCFF', text:'#0D1535', textSub:'#3A4A7A', textMuted:'#7B8EC0',
  red:'#D91A1A', redBg:'#FFF1F0', redBorder:'#FFCCC7',
};

export default function AdminLoginPage() {
  const { login } = useAdmin();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email:'', password:'' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'DM Sans','Outfit',-apple-system,sans-serif", background:B.offWhite }}>
      {/* Left brand */}
      <div style={{ width:380, background:`linear-gradient(165deg,${B.navyDark} 0%,${B.navy} 55%,#162299 100%)`, padding:'40px 36px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:44 }}>
            <img src="/nextgen-logo.jpg" alt="Next Gen Rates" style={{ width:60, height:60, borderRadius:14, objectFit:'contain', background:'#fff', padding:3 }}/>
            <div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:22, color:B.white, lineHeight:1 }}>NEXT GEN <span style={{ color:B.accent }}>RATES</span></div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.45)', marginTop:3 }}>Admin Operations Portal</div>
            </div>
          </div>
          <div style={{ width:28, height:3, background:`linear-gradient(90deg,${B.accent},${B.blueVib})`, borderRadius:2, marginBottom:16 }}/>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.75)', lineHeight:1.8, fontStyle:'italic' }}>
            "Empowering <span style={{ color:B.accent }}>Exporters</span> · Importers · Traders · Manufacturers · Forwarders to build agility in logistics through NextGen engagement."
          </p>
          <div style={{ marginTop:36, display:'flex', flexDirection:'column', gap:10 }}>
            {['Manage company registrations & KYC','Publish real-time freight rates','Handle bookings & enquiries','Analytics & platform oversight'].map((t,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(0,194,255,.18)', border:`1px solid ${B.accent}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.accent} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.28)' }}>© {new Date().getFullYear()} Next Gen Rates. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ background:B.white, borderRadius:20, padding:'40px 36px', boxShadow:'0 12px 48px rgba(13,27,94,.15)', border:`1px solid ${B.border}` }}>
            <h2 style={{ fontSize:22, fontWeight:900, color:B.text, margin:'0 0 4px', fontFamily:"'Outfit',sans-serif" }}>Admin Sign In</h2>
            <p style={{ fontSize:13, color:B.textMuted, margin:'0 0 26px' }}>Access the Next Gen Rates operations portal</p>

            {error && <div style={{ padding:'11px 14px', background:B.redBg, border:`1px solid ${B.redBorder}`, borderRadius:9, marginBottom:18, fontSize:13, color:B.red }}>{error}</div>}

            <form onSubmit={handle}>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:700, color:B.textSub, display:'block', marginBottom:5 }}>Admin Email</label>
                <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} type="email" placeholder="admin@nextgenrates.com" autoComplete="username"
                  style={{ width:'100%', height:48, padding:'0 14px', border:`1.5px solid ${B.border}`, borderRadius:10, fontSize:14, color:B.text, outline:'none', fontFamily:'inherit', background:B.white, boxSizing:'border-box' }}/>
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:12, fontWeight:700, color:B.textSub, display:'block', marginBottom:5 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} type={showPw?'text':'password'} placeholder="••••••••" autoComplete="current-password"
                    style={{ width:'100%', height:48, padding:'0 44px 0 14px', border:`1.5px solid ${B.border}`, borderRadius:10, fontSize:14, color:B.text, outline:'none', fontFamily:'inherit', background:B.white, boxSizing:'border-box' }}/>
                  <button type="button" onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:B.textMuted, display:'flex', padding:0 }}>
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background:loading?'#CBD5E1':`linear-gradient(135deg,${B.blue},${B.blueVib})`, color:loading?B.textMuted:'#fff', border:'none', borderRadius:11, fontSize:15, fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:loading?'none':'0 4px 18px rgba(26,60,200,.36)' }}>
                {loading && <div style={{ width:17, height:17, border:'2.5px solid rgba(255,255,255,.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>}
                {loading ? 'Signing in…' : 'Sign In to Admin Portal'}
              </button>
            </form>
          </div>
          <p style={{ textAlign:'center', marginTop:14, fontSize:12, color:B.textMuted }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight:4, verticalAlign:'middle' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Admin access only · Unauthorized access is prohibited
          </p>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap'); @keyframes spin{to{transform:rotate(360deg);}} *{box-sizing:border-box;} input:focus{border-color:${B.blue}!important;box-shadow:0 0 0 3px rgba(26,60,200,.1)!important;}`}</style>
    </div>
  );
}
