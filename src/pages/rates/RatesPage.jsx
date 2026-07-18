import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { Card, Table, Badge, Btn, Modal, Icon, C, fmtDate, useToast } from '../../components/UI';
import {
  getRates, createRate, updateRate, deleteRate,
  bulkUploadRates, downloadRateTemplate, bulkUploadAirRates,
  createAirRate, updateAirRate, deleteAirRate,
} from '../../services/api';
import api from '../../services/api';

/* ─── Static constants ───────────────────────────────────────── */
const MODES         = ['SEA-FCL', 'SEA-LCL', 'AIR'];
const RATE_TYPES    = ['SPOT RATE', 'CONTRACT', 'LIVE RATE'];
const SERVICE_MODES = ['CY/CY', 'CY/DOOR', 'DOOR/CY', 'DOOR/DOOR'];
const CONTAINERS    = ['20GP', '40GP', '40HC', '45HC', '20RE', '40RE', '20OT', '40OT', '20FR', '40FR', 'LCL'];
const CURRENCIES    = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'SGD', 'JPY', 'CNY'];
const CARGO_TYPES   = ['FAK', 'HAZ', 'REEFER', 'OOG', 'BULK', 'SPECIAL'];

/* ─── Default fallback shipping lines (used if API fails) ─────── */
const DEFAULT_SHIPPING_LINES = [
  { name:'Maersk',      code:'MAEU' }, { name:'Hapag-Lloyd', code:'HLCU' },
  { name:'MSC',         code:'MSCU' }, { name:'CMA CGM',     code:'CMDU' },
  { name:'COSCO',       code:'COSU' }, { name:'Evergreen',   code:'EGLV' },
  { name:'ONE',         code:'ONEY' }, { name:'Yang Ming',   code:'YMLU' },
  { name:'ZIM',         code:'ZIMU' }, { name:'PIL',         code:'PILU' },
  { name:'OOCL',        code:'OOLU' }, { name:'Wan Hai',     code:'WHLC' },
  { name:'HMM',         code:'HDMU' }, { name:'Arkas',       code:'ARKU' },
  { name:'Samudera',    code:'SMDR' }, { name:'SITC',        code:'SITC' },
];

const emptyCharge = () => ({ name:'', code:'', basis:'per equipment', currency:'USD', amount:'', qty:1 });

const EMPTY_FORM = {
  mode:'SEA-FCL', rateType:'SPOT RATE',
  shippingLine:'', shippingLineCode:'',
  originPort:'', originPortName:'', originTerminal:'',
  destinationPort:'', destinationPortName:'', destinationTerminal:'',
  viaPort:'', viaPortNames:'',
  serviceMode:'CY/CY', serviceName:'',
  containerType:'40GP',
  sailingDate:'', transitTimeDays:'', freeDays:4,
  cargoType:'FAK', cargoDescription:'General Cargo', commodity:'',
  validFrom:'', validTo:'',
  freightCharges:[emptyCharge()],
  originCharges:[emptyCharge()],
  destinationCharges:[emptyCharge()],
  inclusions:'', remarks:'', isActive:true,
};

/* ══════════════════════════════════════════════════════════════
   KEY FIX: Use uncontrolled inputs (defaultValue + ref) inside
   RateForm so React does NOT re-render on every keystroke.
   Only selects and checkboxes remain controlled (they need it).
   The form reads values from refs on submit via getFormValues().
══════════════════════════════════════════════════════════════ */

/* ─── ChargeEditor — memo so it only re-renders when charges change ── */
const ChargeEditor = memo(({ title, charges, onChange, maxRows=9, color }) => {
  const add    = () => { if (charges.length < maxRows) onChange([...charges, emptyCharge()]); };
  const remove = (i) => onChange(charges.filter((_,idx) => idx!==i));
  const set    = (i, k, v) => { const n=[...charges]; n[i]={...n[i],[k]:v}; onChange(n); };
  const total  = charges.reduce((s,c) => s+(parseFloat(c.amount)||0), 0);

  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.text, display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:color, flexShrink:0 }}/>{title}
          <span style={{ fontSize:10, color:C.textMuted, fontWeight:400 }}>({charges.length}/{maxRows})</span>
        </div>
        {charges.length<maxRows && <button onClick={add} style={{ fontSize:11, color, background:'none', border:`1px solid ${color}`, borderRadius:5, padding:'2px 9px', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>+ Add</button>}
      </div>
      <div style={{ border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 80px 100px 70px 90px 28px', padding:'5px 8px', background:C.grayLight, fontSize:10, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.3px' }}>
          <span>Charge Name *</span><span>Code</span><span>Basis</span><span>Currency</span><span style={{ textAlign:'right' }}>Amount *</span><span/>
        </div>
        {charges.map((c,i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 80px 100px 70px 90px 28px', background:i%2?'#FAFAFA':'#fff', borderTop:`1px solid ${C.border}` }}>
            {/* Uncontrolled text inputs — no re-render on keystroke */}
            <input defaultValue={c.name} onBlur={e => set(i,'name',e.target.value)}
              placeholder="e.g. Basic Ocean Freight"
              style={{ border:'none', padding:'7px 8px', fontSize:12, outline:'none', width:'100%', background:'transparent', fontFamily:'inherit' }}/>
            <input defaultValue={c.code} onBlur={e => set(i,'code',e.target.value.toUpperCase())}
              placeholder="BOF"
              style={{ border:'none', borderLeft:`1px solid ${C.border}`, padding:'7px 6px', fontSize:11, outline:'none', width:'100%', background:'transparent', fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase' }}/>
            <select value={c.basis} onChange={e => set(i,'basis',e.target.value)}
              style={{ border:'none', borderLeft:`1px solid ${C.border}`, padding:'7px 4px', fontSize:11, outline:'none', width:'100%', background:'transparent', cursor:'pointer' }}>
              <option value="per equipment">Per Eqpt</option>
              <option value="per B/L">Per B/L</option>
              <option value="per shipment">Per Ship</option>
              <option value="per TEU">Per TEU</option>
            </select>
            <select value={c.currency} onChange={e => set(i,'currency',e.target.value)}
              style={{ border:'none', borderLeft:`1px solid ${C.border}`, padding:'7px 3px', fontSize:11, outline:'none', width:'100%', background:'transparent', cursor:'pointer' }}>
              {CURRENCIES.map(cur => <option key={cur}>{cur}</option>)}
            </select>
            <input type="number" defaultValue={c.amount} onBlur={e => set(i,'amount',e.target.value)}
              placeholder="0.00"
              style={{ border:'none', borderLeft:`1px solid ${C.border}`, padding:'7px 6px', fontSize:12, outline:'none', width:'100%', background:'transparent', textAlign:'right', fontFamily:'JetBrains Mono,monospace' }}/>
            <button onClick={() => remove(i)} disabled={charges.length===1}
              style={{ border:'none', borderLeft:`1px solid ${C.border}`, background:'transparent', cursor:charges.length===1?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:charges.length===1?C.border:C.red }}>
              <Icon name="x" size={11}/>
            </button>
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 80px 100px 70px 90px 28px', padding:'6px 8px', background:C.grayLight, borderTop:`1px solid ${C.border}` }}>
          <span style={{ fontSize:11, fontWeight:700, color:C.text, gridColumn:'1/5' }}>Subtotal</span>
          <span style={{ fontSize:12, fontWeight:800, color, textAlign:'right', fontFamily:'JetBrains Mono,monospace' }}>{total.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
        </div>
      </div>
    </div>
  );
});

/* ─── RateForm — text inputs are UNCONTROLLED for performance ──── */
const RateForm = memo(({ initialValues, shippingLines, ports, onChange }) => {
  /* Controlled state — only for fields that drive other UI (selects, checkboxes) */
  const [mode,          setMode]          = useState(initialValues.mode);
  const [rateType,      setRateType]      = useState(initialValues.rateType);
  const [shippingLine,  setShippingLine]  = useState(initialValues.shippingLine);
  const [containerType, setContainerType] = useState(initialValues.containerType);
  const [serviceMode,   setServiceMode]   = useState(initialValues.serviceMode);
  const [cargoType,     setCargoType]     = useState(initialValues.cargoType);
  const [isActive,      setIsActive]      = useState(initialValues.isActive);
  const [freightCharges,   setFrCharges]  = useState(initialValues.freightCharges);
  const [originCharges,    setOrCharges]  = useState(initialValues.originCharges);
  const [destinationCharges,setDsCharges] = useState(initialValues.destinationCharges);

  /* Refs for uncontrolled text inputs */
  const refs = {
    shippingLineCode:    useRef(), originPort:          useRef(),
    originPortName:      useRef(), originTerminal:      useRef(),
    viaPort:             useRef(), viaPortNames:        useRef(),
    destinationPort:     useRef(), destinationPortName: useRef(),
    destinationTerminal: useRef(), serviceName:         useRef(),
    sailingDate:         useRef(), transitTimeDays:     useRef(),
    freeDays:            useRef(), cargoDescription:    useRef(),
    commodity:           useRef(), validFrom:           useRef(),
    validTo:             useRef(), inclusions:          useRef(),
    remarks:             useRef(),
  };

  /* Notify parent of current values whenever a select/checkbox changes */
  const notify = useCallback((patch={}) => {
    const refVals = {};
    Object.entries(refs).forEach(([k,r]) => { if (r.current) refVals[k] = r.current.value; });
    onChange({
      mode, rateType, shippingLine, containerType, serviceMode, cargoType, isActive,
      freightCharges, originCharges, destinationCharges,
      ...refVals, ...patch,
    });
  }, [mode, rateType, shippingLine, containerType, serviceMode, cargoType, isActive, freightCharges, originCharges, destinationCharges]);

  /* Expose values to parent via a stable ref (parent calls getValues()) */
  useEffect(() => { notify(); }, [mode, rateType, shippingLine, containerType, serviceMode, cargoType, isActive, freightCharges, originCharges, destinationCharges]);

  const inp = { width:'100%', padding:'7px 10px', border:`1.5px solid ${C.border}`, borderRadius:7, fontSize:12, outline:'none', fontFamily:'inherit', color:C.text, background:'#fff' };
  const lbl = { fontSize:11, fontWeight:600, color:C.textSub, display:'block', marginBottom:3 };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.textSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10, paddingBottom:6, borderBottom:`2px solid ${C.border}`, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:14, height:2, background:C.navy, borderRadius:1 }}/>{title}
      </div>
      {children}
    </div>
  );

  /* Port autocomplete for POL/POD */
/* Port autocomplete for POL/POD */
const PortInput = ({ label, refKey, placeholder, required }) => {
  const [query, setQuery] = useState(initialValues[refKey] || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef();
  const wrapRef = useRef();

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // FIX: seed the ref on mount. Without this, refs[refKey].current stays
  // undefined until the user types, so editing a rate without touching
  // POL/POD wipes originPort/destinationPort on save.
  useEffect(() => {
    if (refs[refKey]) refs[refKey].current = { value: initialValues[refKey] || '' };
   
  }, []);



    const handleChange = (val) => {
      setQuery(val);
      if (refs[refKey]) refs[refKey].current = { value: val };
      clearTimeout(debounce.current);
      if (val.length < 1) { setSuggestions([]); setOpen(false); return; }
      debounce.current = setTimeout(async () => {
        try {
          // Filter from prefetched ports first (instant)
          const filtered = ports.filter(p =>
            p.code.toLowerCase().includes(val.toLowerCase()) ||
            p.name.toLowerCase().includes(val.toLowerCase())
          ).slice(0, 8);
          setSuggestions(filtered);
          setOpen(filtered.length > 0);
        } catch {}
      }, 120);
    };

    return (
      <div ref={wrapRef} style={{ position:'relative' }}>
        <label style={lbl}>{label}{required?' *':''}</label>
        <input
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inp, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase' }}
        />
        {open && suggestions.length > 0 && (
          <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:`1px solid ${C.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:600, maxHeight:200, overflowY:'auto' }}>
            {suggestions.map(p => (
              <button key={p.code} type="button"
                onClick={() => {
                  setQuery(p.code);
                  if (refs[refKey]) refs[refKey].current = { value: p.code };
                  // Also fill the name field if it's origin/dest
                  const nameKey = refKey === 'originPort' ? 'originPortName' : refKey === 'destinationPort' ? 'destinationPortName' : null;
                  if (nameKey && refs[nameKey]?.current) refs[nameKey].current.value = p.name;
                  setSuggestions([]); setOpen(false);
                }}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 12px', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background='#F0F4FF'}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, background:'#EEF3FF', color:C.navy, padding:'2px 7px', borderRadius:4, minWidth:52, textAlign:'center' }}>{p.code}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{p.name}</div>
                  <div style={{ fontSize:10, color:C.textMuted }}>{p.country}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Section title="Carrier & Type">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
          <div>
            <label style={lbl}>Mode *</label>
            <select value={mode} onChange={e => setMode(e.target.value)} style={inp}>
              {MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Rate Type</label>
            <select value={rateType} onChange={e => setRateType(e.target.value)} style={inp}>
              {RATE_TYPES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Shipping Line *</label>
            <select value={shippingLine}
              onChange={e => {
                const sl = shippingLines.find(l => l.name===e.target.value);
                setShippingLine(e.target.value);
                if (refs.shippingLineCode.current) refs.shippingLineCode.current.value = sl?.code || '';
              }}
              style={inp}>
              <option value="">— Select —</option>
              {shippingLines.map(l => <option key={l.code||l.name} value={l.name}>{l.name}{l.code ? ` (${l.code})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Carrier SCAC Code</label>
            <input ref={refs.shippingLineCode} defaultValue={initialValues.shippingLineCode}
              placeholder="Auto-filled"
              style={{ ...inp, fontFamily:'JetBrains Mono,monospace', background:'#FAFAFA' }}/>
          </div>
          <div>
            <label style={lbl}>Container Type</label>
            <select value={containerType} onChange={e => setContainerType(e.target.value)} style={inp}>
              <option value="">— Any —</option>
              {CONTAINERS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Service Mode</label>
            <select value={serviceMode} onChange={e => setServiceMode(e.target.value)} style={inp}>
              {SERVICE_MODES.map(sv => <option key={sv}>{sv}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'3/-1' }}>
            <label style={lbl}>Service Name</label>
            {/* UNCONTROLLED — no re-render on keystroke */}
            <input ref={refs.serviceName} defaultValue={initialValues.serviceName}
              placeholder="e.g. IME STBY GEMINI SHUTTLI"
              style={inp}/>
          </div>
        </div>
      </Section>

      <Section title="Route (POL → Transshipment → POD)">
        <div style={{ display:'grid', gridTemplateColumns:'140px 1fr 1fr', gap:8, marginBottom:8 }}>
          <PortInput label="POL Code" refKey="originPort" placeholder="INNSA" required/>
          <div>
            <label style={lbl}>POL Name</label>
            <input ref={refs.originPortName} defaultValue={initialValues.originPortName}
              placeholder="Nhava Sheva (JNPT)" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Origin Terminal</label>
            <input ref={refs.originTerminal} defaultValue={initialValues.originTerminal}
              placeholder="Gateway Terminals India" style={inp}/>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <div>
            <label style={lbl}>Via Port Codes (comma-separated)</label>
            <input ref={refs.viaPort} defaultValue={initialValues.viaPort}
              placeholder="OMSLL, SGSIN"
              style={{ ...inp, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase' }}/>
          </div>
          <div>
            <label style={lbl}>Via Port Names (comma-separated)</label>
            <input ref={refs.viaPortNames} defaultValue={initialValues.viaPortNames}
              placeholder="Salalah Terminal, Singapore" style={inp}/>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'140px 1fr 1fr', gap:8 }}>
          <PortInput label="POD Code" refKey="destinationPort" placeholder="USEWR" required/>
          <div>
            <label style={lbl}>POD Name</label>
            <input ref={refs.destinationPortName} defaultValue={initialValues.destinationPortName}
              placeholder="Newark" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Destination Terminal</label>
            <input ref={refs.destinationTerminal} defaultValue={initialValues.destinationTerminal}
              placeholder="Maher Terminals" style={inp}/>
          </div>
        </div>
      </Section>

      <Section title="Sailing & Validity">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          <div>
            <label style={lbl}>Sailing Date *</label>
            <input type="date" ref={refs.sailingDate} defaultValue={initialValues.sailingDate} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Transit (Days) *</label>
            <input type="number" ref={refs.transitTimeDays} defaultValue={initialValues.transitTimeDays}
              placeholder="38" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Free Days</label>
            <input type="number" ref={refs.freeDays} defaultValue={initialValues.freeDays}
              placeholder="4" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Valid From *</label>
            <input type="date" ref={refs.validFrom} defaultValue={initialValues.validFrom} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Valid To</label>
            <input type="date" ref={refs.validTo} defaultValue={initialValues.validTo} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Cargo Type</label>
            <select value={cargoType} onChange={e => setCargoType(e.target.value)} style={inp}>
              {CARGO_TYPES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'2/-1' }}>
            <label style={lbl}>Cargo Description</label>
            <input ref={refs.cargoDescription} defaultValue={initialValues.cargoDescription}
              placeholder="General Cargo" style={inp}/>
          </div>
        </div>
      </Section>

      <ChargeEditor title="Freight Charges — Ocean Leg (max 6)"
        charges={freightCharges} onChange={setFrCharges} maxRows={6} color={C.navy}/>
      <ChargeEditor title="Origin Charges — POL (max 9)"
        charges={originCharges} onChange={setOrCharges} maxRows={9} color={C.orange}/>
      <ChargeEditor title="Destination Charges — POD (max 9)"
        charges={destinationCharges} onChange={setDsCharges} maxRows={9} color={C.green}/>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div>
          <label style={lbl}>Inclusions</label>
          <input ref={refs.inclusions} defaultValue={initialValues.inclusions}
            placeholder="e.g. Vessel Risk Surcharge" style={inp}/>
        </div>
        <div>
          <label style={lbl}>Remarks / T&C notes</label>
          <input ref={refs.remarks} defaultValue={initialValues.remarks}
            placeholder="Additional charges or notes" style={inp}/>
        </div>
      </div>

      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}/>
        Active — visible to users in rate search
      </label>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function RatesPage() {
  const [data, setData]           = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [modeFilter, setModeFilter] = useState('');
  const [modal, setModal]         = useState(null);
  const [editId, setEditId]       = useState(null);
  const [initialValues, setInitialValues] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [bulkFile, setBulkFile]   = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());   // selected rate _ids
const [bulkDeleting, setBulkDeleting] = useState(false);
const [airBulkResult, setAirBulkResult] = useState(null);

  /* Dynamic data */
  const [shippingLines, setShippingLines] = useState(DEFAULT_SHIPPING_LINES);
  const [ports, setPorts]         = useState([]);

  const formValuesRef = useRef(EMPTY_FORM); // RateForm pushes current values here
  const fileRef       = useRef();
  const { show, ToastEl } = useToast();

  /* ── Load shipping lines from admin API ── */
  useEffect(() => {
    api.get('/admin/shipping-lines').then(res => {
      const list = res.data?.data || res.data || [];
      if (list.length > 0) setShippingLines(list);
    }).catch(() => {}); // silently fall back to defaults
  }, []);

  /* ── Load all ports for autocomplete ── */
  useEffect(() => {
    Promise.all([
     api.get('/admin/ports/search', { params: { q: '', type: 'sea', limit: 200 } }),
api.get('/admin/ports/search', { params: { q: '', type: 'air', limit: 100 } }),
    ]).then(([sea, air]) => {
      const seaList = sea.data?.data || [];
      const airList = air.data?.data || [];
      setPorts([...seaList, ...airList]);
    }).catch(() => {});
  }, []);

  /* ── Load rates ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
     const res = await getRates({ mode: modeFilter || undefined, page, limit: 400 });
      setData(res.data.rates);
      setSelected(new Set());
      setPagination(res.data.pagination);
    } catch (err) { show(err.message,'error'); }
    finally { setLoading(false); }
  }, [modeFilter, page]);

  useEffect(() => { load(); }, [load]);

  /* ── Prepare payload for API ── */
  const preparePayload = (f) => ({
    ...f,
    originPort:      (f.originPort||'').toUpperCase(),
    destinationPort: (f.destinationPort||'').toUpperCase(),
    viaPort:     f.viaPort     ? f.viaPort.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean) : [],
    viaPortNames:f.viaPortNames? f.viaPortNames.split(',').map(s=>s.trim()).filter(Boolean)          : [],
    freightCharges:    f.freightCharges.filter(c=>c.name&&c.amount).map(c=>({...c,amount:parseFloat(c.amount)})),
    originCharges:     f.originCharges.filter(c=>c.name&&c.amount).map(c=>({...c,amount:parseFloat(c.amount)})),
    destinationCharges:f.destinationCharges.filter(c=>c.name&&c.amount).map(c=>({...c,amount:parseFloat(c.amount)})),
    freightRateUsd: f.freightCharges.filter(c=>c.name&&c.amount&&c.currency==='USD').reduce((s,c)=>s+(parseFloat(c.amount)||0),0),
    totalUsd: [...f.freightCharges,...f.originCharges,...f.destinationCharges].filter(c=>c.name&&c.amount&&c.currency==='USD').reduce((s,c)=>s+(parseFloat(c.amount)||0),0),
  });

  const openCreate = () => {
    setInitialValues({...EMPTY_FORM});
    formValuesRef.current = {...EMPTY_FORM};
    setEditId(null);
    setModal('form');
  };

  const openEdit = (rate) => {
    const iv = {
      ...EMPTY_FORM, ...rate,
      viaPort:     (rate.viaPort||[]).join(', '),
      viaPortNames:(rate.viaPortNames||[]).join(', '),
      sailingDate: rate.sailingDate ? new Date(rate.sailingDate).toISOString().slice(0,10) : '',
      validFrom:   rate.validFrom   ? new Date(rate.validFrom).toISOString().slice(0,10)   : '',
      validTo:     rate.validTo     ? new Date(rate.validTo).toISOString().slice(0,10)     : '',
      freightCharges:    rate.freightCharges?.length    ? rate.freightCharges    : [emptyCharge()],
      originCharges:     rate.originCharges?.length     ? rate.originCharges     : [emptyCharge()],
      destinationCharges:rate.destinationCharges?.length? rate.destinationCharges: [emptyCharge()],
    };
    setInitialValues(iv);
    formValuesRef.current = iv;
    setEditId(rate._id);
    setModal('form');
  };

const handleSave = async () => {
  const f = formValuesRef.current;
  const isAir = f._airRate || f.mode === 'AIR';
  const carrierField = isAir ? (f.carrier || f.shippingLine) : f.shippingLine;

  if (!f.originPort || !f.destinationPort || !carrierField) {
    show('Origin port, destination port and carrier required', 'warning');
    return;
  }
  if (!isAir && !f.freightCharges?.some(c => c.name && c.amount)) {
    show('Add at least one freight charge', 'warning');
    return;
  }

  setSubmitting(true);
  try {
    const p = preparePayload(f);
    if (isAir) {
      // Air rates → separate endpoint
      if (editId) { await updateAirRate(editId, p); show('Air rate updated', 'success'); }
      else        { await createAirRate(p);          show('Air rate created', 'success'); }
    } else {
      if (editId) { await updateRate(editId, p); show('Rate updated', 'success'); }
      else        { await createRate(p);          show('Rate created', 'success'); }
    }
    setModal(null); load();
  } catch (err) { show(err.message, 'error'); }
  finally { setSubmitting(false); }
};

const handleDelete = async (id, row) => {
  if (!window.confirm('Deactivate this rate?')) return;
  try {
    if (row?._airRate) { await deleteAirRate(id); }
    else               { await deleteRate(id); }
    show('Deactivated', 'success');
    load();
  } catch (err) { show(err.message, 'error'); }
};

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    try { await downloadRateTemplate(); }
    catch (err) { show('Failed to download template: '+err.message,'error'); }
    finally { setTemplateLoading(false); }
  };

const handleAirBulkUpload = async () => {
  if (!bulkFile) { show('Please select an .xlsx file first', 'warning'); return; }
  setSubmitting(true);
  try {
    const fd = new FormData();
    fd.append('file', bulkFile);
    const res = await bulkUploadAirRates(fd);
    setAirBulkResult(res);
    if (res.created > 0) {
      show(`✈ ${res.created} air route(s) uploaded — ${res.total} total groups processed`, 'success');
    } else {
      show(`0 air rates uploaded — check errors below`, 'warning');
    }
  } catch(err) {
    show(`Upload failed: ${err.message}`, 'error');
  } finally {
    setSubmitting(false);
  }
};
  const handleBulkUpload = async () => {
    if (!bulkFile) { show('Select a file','warning'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData(); fd.append('file',bulkFile);
      const res = await bulkUploadRates(fd);
      setBulkResult(res);
      if (res.created>0) { show(`${res.created} of ${res.total} rate(s) imported`,'success'); load(); }
      else show(`0 rates imported — ${res.errors?.length||0} error(s)`,'warning');
    } catch (err) { show(err.message,'error'); }
    finally { setSubmitting(false); }
  };
  const handleBulkDelete = async () => {
  if (selected.size === 0) return;
  if (!window.confirm(`Deactivate ${selected.size} selected rate${selected.size > 1 ? 's' : ''}?`)) return;
  setBulkDeleting(true);
  try {
    await Promise.all([...selected].map(id => deleteRate(id)));
    show(`${selected.size} rate${selected.size > 1 ? 's' : ''} deactivated`, 'success');
    setSelected(new Set());
    load();
  } catch (err) {
    show(err.message, 'error');
  } finally {
    setBulkDeleting(false);
  }
};

 const allIds = data.map(r => r._id);
const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
const someSelected = allIds.some(id => selected.has(id));

const toggleAll = () => {
  if (allSelected) setSelected(new Set());
  else setSelected(new Set(allIds));
};
const toggleOne = (id) => {
  setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};

const columns = [
  {
    key: '__check', title: (
      <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
        onChange={toggleAll}
        style={{ cursor: 'pointer', width: 15, height: 15, accentColor: C.navy }} />
    ), width: 36,
   render: (v, row) => (
  <div style={{ display:'flex', gap:6 }}>
    <Btn variant="ghost" size="sm" icon={<Icon name="edit" size={12}/>} onClick={() => openEdit(row)}>Edit</Btn>
    <Btn variant="danger" size="sm" onClick={() => handleDelete(v, row)}>Del</Btn>
  </div>
),
  },
 { key: 'shippingLine', title: 'Carrier', render: (v, r) => (
  <div>
    <div style={{ fontWeight:700 }}>{v}</div>
    <div style={{ fontSize:10, color:C.textMuted, fontFamily:'JetBrains Mono,monospace' }}>
      {r._airRate ? `✈ ${r.slabs?.length || 0} slabs · VW÷${r.vwDivisor||6000}` : `${r.shippingLineCode} · ${r.rateType}`}
    </div>
  </div>
)},
  { key: 'originPort', title: 'Route', render: (v, r) => <div><span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{v}</span><span style={{ color: C.textMuted, margin: '0 4px' }}>→</span><span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{r.destinationPort}</span>{r.viaPort?.length > 0 && <div style={{ fontSize: 10, color: C.textMuted }}>via {r.viaPort.join(', ')}</div>}</div> },
 { key: 'containerType', title: 'Eqpt/Cargo', render: (v, r) => (
  <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4,
    background: r._airRate ? '#F0F8FF' : '#EFF6FF', color:C.navy }}>
    {v || '—'}
  </span>
)},
  { key: 'freightRateUsd', title: 'Rate from', render: (v, r) => (
  r._airRate
    ? <span style={{ fontWeight:700, fontFamily:'JetBrains Mono,monospace', color:C.navy }}>
        USD {(r.slabs?.[0]?.ratePerKg||0).toFixed(2)}/KG
      </span>
    : <span style={{ fontWeight:700, fontFamily:'JetBrains Mono,monospace', color:C.navy }}>
        USD {(v||0).toLocaleString()}
      </span>
)},
  { key: 'totalUsd', title: 'Min Charge', render: (v, r) => (
  r._airRate
    ? <span style={{ fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:C.orange }}>
        USD {(r.slabs?.[0]?.minCharge||0).toLocaleString()}
      </span>
    : <span style={{ fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:C.orange }}>
        USD {(v||0).toLocaleString()}
      </span>
)},
  { key: 'sailingDate', title: 'Sailing', render: v => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  { key: 'transitTimeDays', title: 'Transit', render: (v, r) =>
  r._airRate ? (r.transitTime || '—') : (v ? `${v}d` : '—')
},
  { key: 'isActive', title: 'Status', render: v => <Badge status={v ? 'active' : 'rejected'} label={v ? 'Active' : 'Off'} /> },
  { key: '_id', title: '', align: 'right', render: (v, row) => <div style={{ display: 'flex', gap: 6 }}><Btn variant="ghost" size="sm" icon={<Icon name="edit" size={12} />} onClick={() => openEdit(row)}>Edit</Btn><Btn variant="danger" size="sm" onClick={() => handleDelete(v)}>Del</Btn></div> },
];

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader
  title="Rate Management"
  subtitle="Full-spec rate entry: freight + origin + destination charges"
  actions={<>
    <Btn variant="ghost" size="sm" icon={<Icon name="upload" size={13}/>}
      onClick={() => { setBulkResult(null); setBulkFile(null); setModal('bulk'); }}>
      Sea Bulk Upload
    </Btn>
    <Btn variant="ghost" size="sm"
      onClick={() => { setBulkFile(null); setModal('air-bulk'); }}>
      ✈ Air Upload
    </Btn>
    <Btn variant="orange" size="sm" icon={<Icon name="plus" size={13}/>} onClick={openCreate}>
      + Add Rate
    </Btn>
  </>}
/>

      <div style={{ padding:'20px 28px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
  <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 8, padding: 4, border: `1px solid ${C.border}` }}>
    {['', ...MODES].map(m => (
      <button key={m} onClick={() => { setModeFilter(m); setPage(1); }}
        style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: modeFilter === m ? C.navy : 'transparent', color: modeFilter === m ? '#fff' : C.textSub }}>
        {m || 'All'}
      </button>
    ))}
  </div>
  <Btn variant="ghost" size="sm" icon={<Icon name="refresh" size={13} />} onClick={load}>Refresh</Btn>

  {/* Bulk action bar — appears only when rows are selected */}
  {selected.size > 0 && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#EFF6FF', border: `1.5px solid ${C.navy}`, borderRadius: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>
        {selected.size} selected
      </span>
      <button onClick={() => setSelected(new Set())}
        style={{ fontSize: 11, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
        ✕ Clear
      </button>
      <div style={{ width: 1, height: 16, background: C.border }} />
      <Btn variant="danger" size="sm" loading={bulkDeleting} onClick={handleBulkDelete}>
        🗑 Delete {selected.size}
      </Btn>
    </div>
  )}

  <div style={{ marginLeft: 'auto', fontSize: 12, color: C.textMuted, alignSelf: 'center' }}>
    {pagination.total || 0} rates
  </div>
</div>

        <Card>
          <Table columns={columns} data={data} loading={loading} emptyMsg="No rates yet. Add via form or bulk upload."/>
          {pagination.pages>1 && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', borderTop:`1px solid ${C.border}`, fontSize:12, color:C.textSub }}>
              <span>Page {page} of {pagination.pages}</span>
              <div style={{ display:'flex', gap:6 }}>
                <Btn variant="ghost" size="sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
                <Btn variant="ghost" size="sm" disabled={page>=pagination.pages} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal open={modal==='form'} onClose={() => setModal(null)}
        title={editId ? 'Edit Rate' : 'Add New Rate'} width={860}
        footer={<>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn variant="orange" loading={submitting} onClick={handleSave}>
            {editId ? 'Save Changes' : 'Create Rate'}
          </Btn>
        </>}>
        {modal==='form' && (
          <RateForm
            key={editId||'new'}                    /* remount on open/close */
            initialValues={initialValues}
            shippingLines={shippingLines}
            ports={ports}
            onChange={vals => { formValuesRef.current = vals; }}
          />
        )}
      </Modal>

      {/* ── Bulk Upload Modal ── */}
    {/* ── Sea Bulk Upload Modal ── */}
<Modal open={modal==='bulk'}
  onClose={() => { setModal(null); setBulkResult(null); setBulkFile(null); }}
  title="Sea/FCL Bulk Rate Upload (.xlsx)" width={580}
  footer={
    <div style={{ display:'flex', gap:8, width:'100%', alignItems:'center' }}>
      <Btn variant="ghost" size="sm" loading={templateLoading} onClick={handleDownloadTemplate}
        icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
        Download Template
      </Btn>
      <div style={{ flex:1 }}/>
      <Btn variant="ghost" onClick={() => { setModal(null); setBulkResult(null); setBulkFile(null); }}>Close</Btn>
      <Btn variant="orange" loading={submitting} onClick={handleBulkUpload} disabled={!bulkFile||submitting}>
        {submitting ? 'Uploading…' : 'Upload Sea Rates'}
      </Btn>
    </div>
  }>
  <div>
    <div style={{ padding:'11px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, marginBottom:14, fontSize:12, color:C.navy, lineHeight:1.75 }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>📋 Template column format (Sea/FCL/LCL)</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 16px' }}>
        {['Mode, Rate Type, Shipping Line, SCAC','Container Type, Service Mode, Service Name','POL Code, POL Name, Origin Terminal','POD Code, POD Name, Destination Terminal','Via Codes, Via Names (comma-separated)','Sailing Date, Transit Days, Free Days','Cargo Type, Cargo Description','Valid From, Valid To','FC1–FC6: Name / Code / Basis / Currency / Amount','OC1–OC9: Name / Code / Basis / Currency / Amount','DC1–DC9: Name / Code / Basis / Currency / Amount','Inclusions, Remarks'].map((t,i) => (
          <div key={i} style={{ color:'#1e40af', fontSize:11 }}>· {t}</div>
        ))}
      </div>
    </div>
    <div onClick={() => fileRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f){setBulkFile(f);setBulkResult(null);} }}
      style={{ border:`2px dashed ${bulkFile?C.green:C.borderMd}`, borderRadius:10, padding:'26px 20px', textAlign:'center', cursor:'pointer', background:bulkFile?'#ECFDF5':C.grayLight, marginBottom:12 }}>
      <Icon name="upload" size={26} color={bulkFile?C.green:C.textMuted}/>
      <div style={{ fontSize:13, color:bulkFile?C.green:C.textSub, marginTop:8, fontWeight:600 }}>
        {bulkFile ? bulkFile.name : 'Drop .xlsx file here or click to browse'}
      </div>
      {bulkFile && (
        <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>
          {(bulkFile.size/1024).toFixed(1)} KB ·&nbsp;
          <span style={{ color:C.red, cursor:'pointer', textDecoration:'underline' }}
            onClick={e => { e.stopPropagation(); setBulkFile(null); setBulkResult(null); }}>Remove</span>
        </div>
      )}
    </div>
    <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }}
      onChange={e => { setBulkFile(e.target.files[0]); setBulkResult(null); }}/>
    {bulkResult && (
      <div style={{ borderRadius:8, overflow:'hidden', border:`1px solid ${bulkResult.created>0?'#BBF7D0':'#FECACA'}` }}>
        <div style={{ padding:'10px 14px', background:bulkResult.created>0?'#ECFDF5':'#FEF2F2', display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:16 }}>{bulkResult.created>0?'✅':'❌'}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:bulkResult.created>0?C.green:C.red }}>
              {bulkResult.created} of {bulkResult.total} rate(s) imported successfully
            </div>
            {bulkResult.errors?.length>0 && <div style={{ fontSize:11, color:C.textMuted }}>{bulkResult.errors.length} row(s) had errors</div>}
          </div>
        </div>
        {bulkResult.errors?.length>0 && (
          <div style={{ maxHeight:160, overflowY:'auto', background:'#fff' }}>
            {bulkResult.errors.map((e,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'7px 14px', borderTop:'1px solid #FEE2E2' }}>
                <span style={{ flexShrink:0, fontSize:11, fontWeight:700, color:'#fff', background:C.red, borderRadius:4, padding:'1px 6px', fontFamily:'monospace' }}>Row {e.row}</span>
                <span style={{ fontSize:12, color:'#7f1d1d' }}>{e.error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
</Modal>

{/* ── Air Rate Bulk Upload Modal — SEPARATE, not nested ── */}
<Modal open={modal==='air-bulk'}
  onClose={() => { setModal(null); setBulkFile(null); }}
  title="✈ Air Freight Rate Upload (.xlsx)" width={540}
  footer={
    <div style={{ display:'flex', gap:8, width:'100%', alignItems:'center' }}>
      <Btn variant="ghost" size="sm"
        onClick={() => window.open('/admin/air-rate-template', '_blank')}
        icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
        Download Air Template
      </Btn>
      <div style={{ flex:1 }}/>
      <Btn variant="ghost" onClick={() => { setModal(null); setBulkFile(null); }}>Close</Btn>
      <Btn variant="orange" loading={submitting} onClick={handleAirBulkUpload} disabled={!bulkFile || submitting}>
        {submitting ? 'Uploading…' : '✈ Upload Air Rates'}
      </Btn>
    </div>
  }>
  <div>
    {/* Info box */}
    <div style={{ padding:'12px 14px', background:'#EEF3FF', border:'1px solid #BFCFFF', borderRadius:8, marginBottom:14, fontSize:12, color:C.navy, lineHeight:1.8 }}>
      <div style={{ fontWeight:700, marginBottom:6 }}>✈ Air Rate Column Format</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 16px' }}>
        {[
          'Origin Airport (IATA e.g. DXB)',
          'Destination Airport (IATA e.g. MAA)',
          'Carrier / Airline',
          'Cargo Type (FAK/HAZ/PHAR/COOL)',
          'Min CW (excl.) KG',
          'Max CW (incl.) KG',
          'Slab Name',
          'VW Divisor (default 6000)',
          'Rate USD/KG',
          'Rate Currency',
          'Transit Time (days)',
          'Min Charge USD',
          'Valid From (YYYY-MM-DD)',
          'Remarks',
        ].map((t,i) => (
          <div key={i} style={{ color:'#1e40af', fontSize:11 }}>· {t}</div>
        ))}
      </div>
      <div style={{ marginTop:8, padding:'8px 10px', background:'#FEF08A', borderRadius:6, fontSize:11, color:'#92400E', fontWeight:600 }}>
        ⚠️ One row = one weight slab. Multiple rows with same Origin + Destination + Carrier are automatically grouped into one rate with multiple slabs.
      </div>
    </div>

    {/* Drop zone */}
    <div onClick={() => fileRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); setBulkFile(e.dataTransfer.files[0]); }}
      style={{ border:`2px dashed ${bulkFile ? C.green : '#0B1D5E'}`, borderRadius:10, padding:'28px 20px',
        textAlign:'center', cursor:'pointer', background: bulkFile ? '#ECFDF5' : '#F7F9FF', marginBottom:12 }}>
      <div style={{ fontSize:32, marginBottom:8 }}>✈</div>
      <div style={{ fontSize:13, color: bulkFile ? C.green : C.navy, fontWeight:700 }}>
        {bulkFile ? `✅ ${bulkFile.name}` : 'Drop NGR_Air_Test_Rates_Upload.xlsx here'}
      </div>
      <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
        {bulkFile
          ? `${(bulkFile.size/1024).toFixed(1)} KB · `
          : 'or click to browse · '}
        {bulkFile
          ? <span style={{ color:C.red, cursor:'pointer', textDecoration:'underline' }}
              onClick={e => { e.stopPropagation(); setBulkFile(null); }}>Remove</span>
          : 'accepts .xlsx files'}
      </div>
    </div>
    <input ref={fileRef} type="file" accept=".xlsx" style={{ display:'none' }}
      onChange={e => setBulkFile(e.target.files[0])}/>

    {/* How it works */}
    <div style={{ padding:'10px 12px', background:'#F7F9FF', border:`1px solid ${C.border}`, borderRadius:8, fontSize:11, color:C.textMid, lineHeight:1.7 }}>
      <strong style={{ color:C.navy }}>How the upload works:</strong><br/>
      1. Parser reads all rows from Sheet 1<br/>
      2. Groups rows by Origin + Destination + Carrier + Cargo Type<br/>
      3. Each group becomes one AirRate document with multiple weight slabs<br/>
      4. The test file has 4 routes (DXB→MAA, DXB→BOM, SIN→MAA, DXB→DEL) × 7 slabs = 28 rows → 4 rate docs
    </div>
  </div>
</Modal>
    </AdminLayout>
  );
}
