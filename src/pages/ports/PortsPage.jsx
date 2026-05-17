import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { Card, Table, Badge, Btn, Modal, Icon, C, useToast, fmtDate } from '../../components/UI';
import api from '../../services/api';

/* ─── constants ──────────────────────────────────────────────── */
const PORT_TYPES = ['sea', 'air', 'icd'];
const REGIONS    = ['Asia Pacific','Middle East','Europe','North America','South America','Africa','Oceania','Other'];

const EMPTY_FORM = { code:'', name:'', country:'', countryCode:'', type:'sea', region:'', isActive:true };

const inp = { width:'100%', padding:'8px 10px', border:`1.5px solid ${C.border}`, borderRadius:7, fontSize:12.5, outline:'none', fontFamily:'inherit', color:C.text, background:'#fff', transition:'border-color 0.15s' };
const lbl = { fontSize:11, fontWeight:600, color:C.textSub, display:'block', marginBottom:4 };

/* ─── 63 standard global ports (seeded from here without running scripts) ── */
const STANDARD_PORTS = [
  // India — sea
  { code:'INMAA', name:'Chennai (ex Madras)',        country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  { code:'INNSA', name:'Nhava Sheva (JNPT)',         country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  { code:'INMUN', name:'Mundra',                     country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  { code:'INENR', name:'Ennore',                     country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  { code:'INCOK', name:'Cochin (Kochi)',              country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  { code:'INTUT', name:'Tuticorin (Thoothukudi)',    country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  { code:'INPAV', name:'Pipavav',                    country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  { code:'INHAL', name:'Haldia',                     country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  { code:'INVIZ', name:'Visakhapatnam',              country:'India',        countryCode:'IN', type:'sea', region:'Asia Pacific' },
  // USA — sea
  { code:'USNYC', name:'New York',                   country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USEWR', name:'Newark, NJ',                 country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USLAX', name:'Los Angeles',                country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USLGB', name:'Long Beach',                 country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USSAV', name:'Savannah, GA',               country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USHOU', name:'Houston, TX',                country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USJAX', name:'Jacksonville, FL',           country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USORF', name:'Norfolk, VA',                country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USSEA', name:'Seattle, WA',                country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  { code:'USBLT', name:'Baltimore, MD',              country:'USA',          countryCode:'US', type:'sea', region:'North America' },
  // Middle East — sea
  { code:'AEJEA', name:'Jebel Ali (Dubai)',          country:'UAE',          countryCode:'AE', type:'sea', region:'Middle East' },
  { code:'AEDXB', name:'Dubai (Port Rashid)',        country:'UAE',          countryCode:'AE', type:'sea', region:'Middle East' },
  { code:'SADMM', name:'Ad Dammam',                  country:'Saudi Arabia', countryCode:'SA', type:'sea', region:'Middle East' },
  { code:'SAJED', name:'Jeddah',                     country:'Saudi Arabia', countryCode:'SA', type:'sea', region:'Middle East' },
  { code:'OMSLL', name:'Salalah',                    country:'Oman',         countryCode:'OM', type:'sea', region:'Middle East' },
  { code:'QADOH', name:'Doha (Hamad)',                country:'Qatar',        countryCode:'QA', type:'sea', region:'Middle East' },
  // Europe — sea
  { code:'NLRTM', name:'Rotterdam',                  country:'Netherlands',  countryCode:'NL', type:'sea', region:'Europe' },
  { code:'DEHAM', name:'Hamburg',                    country:'Germany',      countryCode:'DE', type:'sea', region:'Europe' },
  { code:'GBFXT', name:'Felixstowe',                 country:'UK',           countryCode:'GB', type:'sea', region:'Europe' },
  { code:'BEANR', name:'Antwerp',                    country:'Belgium',      countryCode:'BE', type:'sea', region:'Europe' },
  { code:'FRLEH', name:'Le Havre',                   country:'France',       countryCode:'FR', type:'sea', region:'Europe' },
  { code:'ITGOA', name:'Genoa',                      country:'Italy',        countryCode:'IT', type:'sea', region:'Europe' },
  { code:'ESBCN', name:'Barcelona',                  country:'Spain',        countryCode:'ES', type:'sea', region:'Europe' },
  { code:'GBSOU', name:'Southampton',                country:'UK',           countryCode:'GB', type:'sea', region:'Europe' },
  // Asia Pacific — sea
  { code:'SGSIN', name:'Singapore',                  country:'Singapore',    countryCode:'SG', type:'sea', region:'Asia Pacific' },
  { code:'CNSHA', name:'Shanghai',                   country:'China',        countryCode:'CN', type:'sea', region:'Asia Pacific' },
  { code:'CNNBO', name:'Ningbo',                     country:'China',        countryCode:'CN', type:'sea', region:'Asia Pacific' },
  { code:'CNSZX', name:'Shenzhen (Yantian)',         country:'China',        countryCode:'CN', type:'sea', region:'Asia Pacific' },
  { code:'HKHKG', name:'Hong Kong',                  country:'Hong Kong',    countryCode:'HK', type:'sea', region:'Asia Pacific' },
  { code:'JPYOK', name:'Yokohama',                   country:'Japan',        countryCode:'JP', type:'sea', region:'Asia Pacific' },
  { code:'JPOSA', name:'Osaka',                      country:'Japan',        countryCode:'JP', type:'sea', region:'Asia Pacific' },
  { code:'KRINC', name:'Incheon',                    country:'South Korea',  countryCode:'KR', type:'sea', region:'Asia Pacific' },
  { code:'KRPUS', name:'Busan',                      country:'South Korea',  countryCode:'KR', type:'sea', region:'Asia Pacific' },
  { code:'LKCMB', name:'Colombo',                    country:'Sri Lanka',    countryCode:'LK', type:'sea', region:'Asia Pacific' },
  { code:'MYPKG', name:'Port Klang',                 country:'Malaysia',     countryCode:'MY', type:'sea', region:'Asia Pacific' },
  { code:'THBKK', name:'Bangkok (Laem Chabang)',     country:'Thailand',     countryCode:'TH', type:'sea', region:'Asia Pacific' },
  { code:'VNSGN', name:'Ho Chi Minh City',           country:'Vietnam',      countryCode:'VN', type:'sea', region:'Asia Pacific' },
  { code:'IDJKT', name:'Jakarta (Tanjung Priok)',    country:'Indonesia',    countryCode:'ID', type:'sea', region:'Asia Pacific' },
  // Africa — sea
  { code:'TZDAR', name:'Dar es Salaam',              country:'Tanzania',     countryCode:'TZ', type:'sea', region:'Africa' },
  { code:'KEMBA', name:'Mombasa',                    country:'Kenya',        countryCode:'KE', type:'sea', region:'Africa' },
  { code:'ZACPT', name:'Cape Town',                  country:'South Africa', countryCode:'ZA', type:'sea', region:'Africa' },
  { code:'ZADUR', name:'Durban',                     country:'South Africa', countryCode:'ZA', type:'sea', region:'Africa' },
  { code:'NGAPP', name:'Apapa (Lagos)',               country:'Nigeria',      countryCode:'NG', type:'sea', region:'Africa' },
  { code:'EGPSD', name:'Port Said',                  country:'Egypt',        countryCode:'EG', type:'sea', region:'Africa' },
  // Oceania / Canada — sea
  { code:'AUSYD', name:'Sydney',                     country:'Australia',    countryCode:'AU', type:'sea', region:'Oceania' },
  { code:'AUMEL', name:'Melbourne',                  country:'Australia',    countryCode:'AU', type:'sea', region:'Oceania' },
  { code:'CAVAN', name:'Vancouver',                  country:'Canada',       countryCode:'CA', type:'sea', region:'North America' },
  // India — air
  { code:'MAA',   name:'Chennai International',      country:'India',        countryCode:'IN', type:'air', region:'Asia Pacific' },
  { code:'BOM',   name:'Chhatrapati Shivaji (Mumbai)',country:'India',       countryCode:'IN', type:'air', region:'Asia Pacific' },
  { code:'DEL',   name:'Indira Gandhi International',country:'India',        countryCode:'IN', type:'air', region:'Asia Pacific' },
  { code:'BLR',   name:'Kempegowda (Bengaluru)',     country:'India',        countryCode:'IN', type:'air', region:'Asia Pacific' },
  { code:'HYD',   name:'Rajiv Gandhi (Hyderabad)',   country:'India',        countryCode:'IN', type:'air', region:'Asia Pacific' },
  { code:'CCU',   name:'Netaji Subhas Chandra (Kolkata)',country:'India',    countryCode:'IN', type:'air', region:'Asia Pacific' },
  // International — air
  { code:'DXB',   name:'Dubai International',        country:'UAE',          countryCode:'AE', type:'air', region:'Middle East' },
  { code:'AUH',   name:'Abu Dhabi International',    country:'UAE',          countryCode:'AE', type:'air', region:'Middle East' },
  { code:'DOH',   name:'Hamad International (Doha)', country:'Qatar',        countryCode:'QA', type:'air', region:'Middle East' },
  { code:'JFK',   name:'John F Kennedy International',country:'USA',         countryCode:'US', type:'air', region:'North America' },
  { code:'LAX',   name:'Los Angeles International',  country:'USA',          countryCode:'US', type:'air', region:'North America' },
  { code:'ORD',   name:"O'Hare International (Chicago)",country:'USA',       countryCode:'US', type:'air', region:'North America' },
  { code:'LHR',   name:'London Heathrow',            country:'UK',           countryCode:'GB', type:'air', region:'Europe' },
  { code:'FRA',   name:'Frankfurt International',    country:'Germany',      countryCode:'DE', type:'air', region:'Europe' },
  { code:'CDG',   name:'Charles de Gaulle (Paris)',  country:'France',       countryCode:'FR', type:'air', region:'Europe' },
  { code:'AMS',   name:'Amsterdam Schiphol',         country:'Netherlands',  countryCode:'NL', type:'air', region:'Europe' },
  { code:'SIN',   name:'Singapore Changi',           country:'Singapore',    countryCode:'SG', type:'air', region:'Asia Pacific' },
  { code:'HKG',   name:'Hong Kong International',    country:'Hong Kong',    countryCode:'HK', type:'air', region:'Asia Pacific' },
  { code:'PVG',   name:'Shanghai Pudong International',country:'China',      countryCode:'CN', type:'air', region:'Asia Pacific' },
  { code:'NRT',   name:'Tokyo Narita',               country:'Japan',        countryCode:'JP', type:'air', region:'Asia Pacific' },
  { code:'ICN',   name:'Seoul Incheon',              country:'South Korea',  countryCode:'KR', type:'air', region:'Asia Pacific' },
  { code:'SYD',   name:'Sydney Kingsford Smith',     country:'Australia',    countryCode:'AU', type:'air', region:'Oceania' },
  { code:'NBO',   name:'Jomo Kenyatta (Nairobi)',    country:'Kenya',        countryCode:'KE', type:'air', region:'Africa' },
];

/* ─── type badge helper ──────────────────────────────────────── */
function TypeBadge({ type }) {
  const map = {
    sea: { bg:'#E6F9FF', color:'#007DAA', label:'SEA' },
    air: { bg:'#F5F3FF', color:'#6D28D9', label:'AIR' },
    icd: { bg:'#FFFBEB', color:'#B45309', label:'ICD' },
  };
  const s = map[type] || map.sea;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:700, background:s.bg, color:s.color }}>
      {type === 'sea' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M2 20l2-8h16l2 8H2z" stroke="currentColor" strokeWidth="1.8"/><path d="M6 12V8l3-3 3 3 3-3 3 3v4" stroke="currentColor" strokeWidth="1.8"/></svg>}
      {type === 'air' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M21 16l-6-6 2-7-2-1-4 6-4-3-1 1 2 4-3 2 1 2 4-1 1 4 2-1V16Z" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>}
      {type === 'icd' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="1" y="7" width="15" height="10" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M16 10h3l3 4v3h-6V10Z" stroke="currentColor" strokeWidth="1.8"/></svg>}
      {s.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function PortsPage() {
  const [ports, setPorts]             = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [typeFilter, setTypeFilter]   = useState('');
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState(null); // 'add' | 'edit' | 'seed'
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editId, setEditId]           = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [seedProgress, setSeedProgress] = useState(null); // { done, total, inserted, skipped, errors[] }
  const { show, ToastEl }             = useToast();
  const LIMIT = 20;

  /* ── fetch ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (typeFilter) params.type   = typeFilter;
      if (search)     params.search = search;
      const res = await api.get('/admin/ports', { params });
      // handle both paginated and flat responses
      const list = res.data?.ports || res.data || [];
      const count = res.data?.pagination?.total ?? list.length;
      setPorts(list);
      setTotal(count);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => { load(); }, [load]);

  /* ── add / edit ── */
  const handleSave = async () => {
    if (!form.code || !form.name || !form.country || !form.type) {
      show('Code, name, country and type are required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, code: form.code.toUpperCase().trim() };
      if (editId) {
        await api.put(`/admin/ports/${editId}`, payload);
        show('Port updated successfully', 'success');
      } else {
        await api.post('/admin/ports', payload);
        show('Port added successfully', 'success');
      }
      setModal(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── seed standard ports one by one (shows live progress) ── */
  const handleSeed = async () => {
    setSubmitting(true);
    setSeedProgress({ done:0, total:STANDARD_PORTS.length, inserted:0, skipped:0, errors:[] });
    let inserted = 0, skipped = 0, errors = [];
    for (let i = 0; i < STANDARD_PORTS.length; i++) {
      const port = STANDARD_PORTS[i];
      try {
        await api.post('/admin/ports', { ...port, isActive: true });
        inserted++;
      } catch (e) {
        // 409 = already exists — not an error, just skip
        if (e.message?.includes('409') || e.message?.toLowerCase().includes('already') || e.message?.includes('duplicate')) {
          skipped++;
        } else {
          errors.push({ code: port.code, error: e.message });
        }
      }
      setSeedProgress({ done: i + 1, total: STANDARD_PORTS.length, inserted, skipped, errors: [...errors] });
    }
    setSubmitting(false);
    if (inserted > 0) { show(`${inserted} ports seeded!`, 'success'); load(); }
    else if (skipped === STANDARD_PORTS.length) show('All standard ports already exist', 'info');
  };

  /* ── toggle active ── */
  const toggleActive = async (port) => {
    try {
      await api.put(`/admin/ports/${port._id}`, { isActive: !port.isActive });
      show(`Port ${port.code} ${!port.isActive ? 'enabled' : 'disabled'}`, 'success');
      load();
    } catch (err) { show(err.message, 'error'); }
  };

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add'); };
  const openEdit = (p) => {
    setForm({ code:p.code, name:p.name, country:p.country, countryCode:p.countryCode||'', type:p.type, region:p.region||'', isActive:p.isActive });
    setEditId(p._id);
    setModal('edit');
  };
  const sf = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const pages = Math.ceil(total / LIMIT);

  const columns = [
    {
      key: 'code', title: 'Code',
      render: v => (
        <span style={{ fontFamily:'monospace', fontSize:12.5, fontWeight:800, color:C.navy, background:'#EEF3FF', padding:'2px 9px', borderRadius:6, letterSpacing:'0.05em' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'name', title: 'Port / Airport Name',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight:600, fontSize:13 }}>{v}</div>
          {r.region && <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>{r.region}</div>}
        </div>
      ),
    },
    {
      key: 'country', title: 'Country',
      render: (v, r) => (
        <span style={{ fontSize:13 }}>
          {v}
          {r.countryCode && <span style={{ marginLeft:6, fontSize:10.5, color:C.textMuted, fontFamily:'monospace', fontWeight:700 }}>({r.countryCode})</span>}
        </span>
      ),
    },
    { key: 'type',     title: 'Type',   render: v => <TypeBadge type={v}/> },
    { key: 'isActive', title: 'Status', render: v => <Badge status={v ? 'active' : 'rejected'} label={v ? 'Active' : 'Inactive'}/> },
    {
      key: '_id', title: '', align: 'right',
      render: (v, row) => (
        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
          <Btn variant="ghost" size="sm" icon={<Icon name="edit" size={12}/>} onClick={() => openEdit(row)}>Edit</Btn>
          <Btn variant={row.isActive ? 'danger' : 'ghost'} size="sm" onClick={() => toggleActive(row)}>
            {row.isActive ? 'Disable' : 'Enable'}
          </Btn>
        </div>
      ),
    },
  ];

  /* ── seed progress bar ── */
  const SeedProgressBar = () => {
    if (!seedProgress) return null;
    const pct = Math.round((seedProgress.done / seedProgress.total) * 100);
    const done = seedProgress.done === seedProgress.total;
    return (
      <div style={{ marginTop:16 }}>
        {/* progress bar */}
        <div style={{ height:8, background:C.border, borderRadius:99, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', width:`${pct}%`, background: done ? C.green : C.navy, borderRadius:99, transition:'width 0.2s' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.textSub, marginBottom:10 }}>
          <span>{pct}% — {seedProgress.done} / {seedProgress.total} processed</span>
          <span style={{ color:C.green }}>+{seedProgress.inserted} new</span>
        </div>
        {/* result summary */}
        {done && (
          <div style={{ background: seedProgress.errors.length > 0 ? '#FEF2F2' : '#ECFDF5', border:`1px solid ${seedProgress.errors.length > 0 ? '#FECACA' : '#BBF7D0'}`, borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontWeight:700, fontSize:13, color: seedProgress.errors.length > 0 ? C.red : C.green, marginBottom:6 }}>
              {seedProgress.inserted > 0 ? `✅ ${seedProgress.inserted} ports added` : ''}
              {seedProgress.skipped > 0 ? `  ·  ${seedProgress.skipped} already existed` : ''}
              {seedProgress.errors.length > 0 ? `  ·  ${seedProgress.errors.length} errors` : ''}
            </div>
            {seedProgress.errors.length > 0 && (
              <div style={{ maxHeight:100, overflowY:'auto' }}>
                {seedProgress.errors.map((e,i) => (
                  <div key={i} style={{ fontSize:11.5, color:C.red, marginBottom:3 }}>
                    <strong>{e.code}</strong>: {e.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader
        title="Ports & Airports"
        subtitle="Manage sea ports and airports — these populate the rate search dropdown for users"
        actions={
          <>
            <Btn variant="ghost" size="sm" icon={<Icon name="refresh" size={13}/>} onClick={load}>Refresh</Btn>
            <Btn variant="ghost" size="sm" icon={<Icon name="upload" size={13}/>}
              onClick={() => { setSeedProgress(null); setModal('seed'); }}>
              Seed {STANDARD_PORTS.length} Standard Ports
            </Btn>
            <Btn variant="orange" size="sm" icon={<Icon name="plus" size={13}/>} onClick={openAdd}>
              + Add Port
            </Btn>
          </>
        }
      />

      <div style={{ padding:'20px 28px' }}>

        {/* ── stats strip ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'Total Ports', value:total, icon:'ports', color:C.navy },
            { label:'Sea Ports',   value:ports.filter(p=>p.type==='sea').length, icon:'ship',  color:'#007DAA' },
            { label:'Airports',    value:ports.filter(p=>p.type==='air').length, icon:'rates', color:'#6D28D9' },
            { label:'Active',      value:ports.filter(p=>p.isActive).length,    icon:'check', color:C.green  },
          ].map((s,i) => (
            <div key={i} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width:38, height:38, borderRadius:9, background:s.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={s.icon} size={17} color={s.color}/>
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:800, color:C.text, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11.5, color:C.textMuted, marginTop:3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── empty banner ── */}
        {!loading && total === 0 && (
          <div style={{ background:'#FFF8E6', border:'1px solid #FDE68A', borderRadius:10, padding:'14px 18px', marginBottom:16, fontSize:13, color:'#78350F', display:'flex', alignItems:'center', gap:12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span>
              <strong>No ports yet.</strong> Click <strong>"Seed {STANDARD_PORTS.length} Standard Ports"</strong> to instantly load all global sea &amp; air ports, or use <strong>"+ Add Port"</strong> to add manually.
            </span>
          </div>
        )}

        {/* ── filters ── */}
        <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
          {/* type tabs */}
          <div style={{ display:'flex', gap:4, background:'#fff', borderRadius:8, padding:4, border:`1px solid ${C.border}` }}>
            {[{v:'',l:'All'},{v:'sea',l:'Sea'},{v:'air',l:'Air'},{v:'icd',l:'ICD'}].map(t => (
              <button key={t.v} onClick={() => { setTypeFilter(t.v); setPage(1); }}
                style={{ padding:'5px 13px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', background:typeFilter===t.v?C.navy:'transparent', color:typeFilter===t.v?'#fff':C.textSub, transition:'all 0.15s' }}>
                {t.l}
              </button>
            ))}
          </div>

          {/* search */}
          <div style={{ position:'relative', flex:1, maxWidth:340 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.textMuted, pointerEvents:'none' }}>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              placeholder="Search code, port name or country…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inp, paddingLeft:30, height:34, fontSize:12.5 }}
              onFocus={e => e.target.style.borderColor = C.navy}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          <div style={{ marginLeft:'auto', fontSize:12, color:C.textMuted }}>
            {total} port{total!==1?'s':''}
          </div>
        </div>

        {/* ── table ── */}
        <Card>
          <Table
            columns={columns}
            data={ports}
            loading={loading}
            emptyMsg="No ports found. Use 'Seed Standard Ports' to load the global port list."
          />
          {/* pagination */}
          {pages > 1 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderTop:`1px solid ${C.border}`, fontSize:12, color:C.textSub }}>
              <span>Page {page} of {pages} · {total} total</span>
              <div style={{ display:'flex', gap:6 }}>
                <Btn variant="ghost" size="sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
                <Btn variant="ghost" size="sm" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modal==='add' || modal==='edit'}
        onClose={() => setModal(null)}
        title={modal==='edit' ? 'Edit Port' : 'Add New Port'}
        width={540}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="orange" loading={submitting} onClick={handleSave}>
              {modal==='edit' ? 'Save Changes' : 'Add Port'}
            </Btn>
          </>
        }
      >
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

          {/* Code */}
          <div>
            <label style={lbl}>Port / Airport Code *</label>
            <input value={form.code} onChange={sf('code')}
              placeholder="INNSA or MAA"
              style={{ ...inp, textTransform:'uppercase', fontFamily:'monospace', fontWeight:700, letterSpacing:'0.06em' }}
              onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor=C.border}/>
            <div style={{ fontSize:10.5, color:C.textMuted, marginTop:3 }}>UN/LOCODE for sea · IATA for air</div>
          </div>

          {/* Type */}
          <div>
            <label style={lbl}>Type *</label>
            <select value={form.type} onChange={sf('type')} style={{ ...inp, cursor:'pointer' }}>
              {PORT_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()} — {t==='sea'?'Sea Port':t==='air'?'Airport':'Inland Container Depot'}</option>)}
            </select>
          </div>

          {/* Name — full width */}
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lbl}>Port / Airport Name *</label>
            <input value={form.name} onChange={sf('name')}
              placeholder="e.g. Nhava Sheva (JNPT) or Chennai International"
              style={inp}
              onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>

          {/* Country */}
          <div>
            <label style={lbl}>Country *</label>
            <input value={form.country} onChange={sf('country')} placeholder="e.g. India" style={inp}
              onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>

          {/* Country code */}
          <div>
            <label style={lbl}>Country Code</label>
            <input value={form.countryCode} onChange={sf('countryCode')} placeholder="IN"
              style={{ ...inp, textTransform:'uppercase', fontFamily:'monospace', letterSpacing:'0.06em' }}
              onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>

          {/* Region */}
          <div>
            <label style={lbl}>Region</label>
            <select value={form.region} onChange={sf('region')} style={{ ...inp, cursor:'pointer' }}>
              <option value="">— Select region —</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Active toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:18 }}>
            <input type="checkbox" id="portActive" checked={form.isActive}
              onChange={e => setForm(f=>({...f,isActive:e.target.checked}))}
              style={{ width:16, height:16, cursor:'pointer', accentColor:C.navy }}/>
            <label htmlFor="portActive" style={{ fontSize:13, fontWeight:600, cursor:'pointer', color:C.text }}>
              Active — visible in rate search
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Seed Modal ── */}
      <Modal
        open={modal==='seed'}
        onClose={() => { if (!submitting) { setModal(null); setSeedProgress(null); } }}
        title={`Seed ${STANDARD_PORTS.length} Standard Global Ports`}
        width={580}
        footer={
          <div style={{ display:'flex', gap:8, width:'100%' }}>
            <div style={{ flex:1 }}/>
            <Btn variant="ghost" disabled={submitting} onClick={() => { setModal(null); setSeedProgress(null); }}>
              {seedProgress?.done === seedProgress?.total ? 'Done' : 'Cancel'}
            </Btn>
            {!seedProgress && (
              <Btn variant="orange" loading={submitting} onClick={handleSeed}>
                Seed All {STANDARD_PORTS.length} Ports
              </Btn>
            )}
          </div>
        }
      >
        {/* Info */}
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'12px 14px', marginBottom:14, fontSize:12.5, color:'#1e40af', lineHeight:1.75 }}>
          <div style={{ fontWeight:700, marginBottom:8, fontSize:13 }}>📦 What will be seeded</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 20px' }}>
            {[
              '9 Indian sea ports (INNSA, INMAA, INMUN…)',
              '10 US sea ports (USNYC, USEWR, USLAX…)',
              '6 Middle East ports (AEJEA, SADMM…)',
              '8 European ports (NLRTM, DEHAM, GBFXT…)',
              '15 Asia Pacific ports (SGSIN, CNSHA, KRPUS…)',
              '6 African ports (TZDAR, KEMBA, ZACPT…)',
              '6 India airports (MAA, BOM, DEL, BLR, HYD, CCU)',
              '17 International airports (DXB, JFK, LHR…)',
            ].map((t,i) => (
              <div key={i} style={{ fontSize:11.5, display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ color:'#1e40af' }}>·</span> {t}
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, fontSize:11.5, color:'#374151', padding:'8px 10px', background:'rgba(255,255,255,0.6)', borderRadius:6 }}>
            ✅ Already-existing ports are <strong>skipped automatically</strong> — safe to run multiple times
          </div>
        </div>

        <SeedProgressBar/>
      </Modal>
    </AdminLayout>
  );
}