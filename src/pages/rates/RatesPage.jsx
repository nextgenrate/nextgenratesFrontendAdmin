import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { Card, Table, Badge, Btn, Modal, Icon, C, fmtDate, useToast } from '../../components/UI';
import { getRates, createRate, updateRate, deleteRate, bulkUploadRates, downloadRateTemplate } from '../../services/api';

const MODES = ['SEA-FCL', 'SEA-LCL', 'AIR'];
const RATE_TYPES = ['SPOT RATE', 'CONTRACT', 'LIVE RATE'];
const SERVICE_MODES = ['CY/CY', 'CY/DOOR', 'DOOR/CY', 'DOOR/DOOR'];
const CONTAINERS = ['20GP', '40GP', '40HC', '45HC', '20RE', '40RE', '20OT', '40OT', '20FR', '40FR', 'LCL'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'SGD', 'JPY', 'CNY'];
const CARGO_TYPES = ['FAK', 'HAZ', 'REEFER', 'OOG', 'BULK', 'SPECIAL'];
const SHIPPING_LINES = [
  { name: 'Maersk', code: 'MAEU' }, { name: 'Hapag-Lloyd', code: 'HLCU' },
  { name: 'MSC', code: 'MSCU' }, { name: 'CMA CGM', code: 'CMDU' },
  { name: 'COSCO', code: 'COSU' }, { name: 'Evergreen', code: 'EGLV' },
  { name: 'ONE', code: 'ONEY' }, { name: 'Yang Ming', code: 'YMLU' },
  { name: 'ZIM', code: 'ZIMU' }, { name: 'PIL', code: 'PILU' },
  { name: 'OOCL', code: 'OOLU' }, { name: 'Wan Hai', code: 'WHLC' },
];

const emptyCharge = () => ({ name: '', code: '', basis: 'per equipment', currency: 'USD', amount: '', qty: 1 });

const EMPTY_FORM = {
  mode: 'SEA-FCL', rateType: 'SPOT RATE',
  shippingLine: '', shippingLineCode: '',
  originPort: '', originPortName: '', originTerminal: '',
  destinationPort: '', destinationPortName: '', destinationTerminal: '',
  viaPort: '', viaPortNames: '',
  serviceMode: 'CY/CY', serviceName: '',
  containerType: '40GP',
  sailingDate: '', transitTimeDays: '', freeDays: 4,
  cargoType: 'FAK', cargoDescription: 'General Cargo', commodity: '',
  validFrom: '', validTo: '',
  freightCharges: [emptyCharge()],
  originCharges: [emptyCharge()],
  destinationCharges: [emptyCharge()],
  inclusions: '', remarks: '', isActive: true,
};

function ChargeEditor({ title, charges, onChange, maxRows = 9, color }) {
  const add = () => { if (charges.length < maxRows) onChange([...charges, emptyCharge()]); };
  const remove = (i) => onChange(charges.filter((_, idx) => idx !== i));
  const set = (i, k, v) => { const n = [...charges]; n[i] = { ...n[i], [k]: v }; onChange(n); };
  const total = charges.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />{title}
          <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 400 }}>({charges.length}/{maxRows})</span>
        </div>
        {charges.length < maxRows && <button onClick={add} style={{ fontSize: 11, color, background: 'none', border: `1px solid ${color}`, borderRadius: 5, padding: '2px 9px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>+ Add</button>}
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 70px 90px 28px', gap: 0, padding: '5px 8px', background: C.grayLight, fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          <span>Charge Name *</span><span>Code</span><span>Basis</span><span>Currency</span><span style={{ textAlign: 'right' }}>Amount *</span><span/>
        </div>
        {charges.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 70px 90px 28px', gap: 0, background: i % 2 ? '#FAFAFA' : '#fff', borderTop: `1px solid ${C.border}` }}>
            <input value={c.name} onChange={e => set(i, 'name', e.target.value)} placeholder="e.g. Basic Ocean Freight" style={{ border: 'none', padding: '7px 8px', fontSize: 12, outline: 'none', width: '100%', background: 'transparent', fontFamily: 'inherit' }} />
            <input value={c.code} onChange={e => set(i, 'code', e.target.value.toUpperCase())} placeholder="BOF" style={{ border: 'none', borderLeft: `1px solid ${C.border}`, padding: '7px 6px', fontSize: 11, outline: 'none', width: '100%', background: 'transparent', fontFamily: 'JetBrains Mono, monospace' }} />
            <select value={c.basis} onChange={e => set(i, 'basis', e.target.value)} style={{ border: 'none', borderLeft: `1px solid ${C.border}`, padding: '7px 4px', fontSize: 11, outline: 'none', width: '100%', background: 'transparent', cursor: 'pointer' }}>
              <option value="per equipment">Per Eqpt</option>
              <option value="per B/L">Per B/L</option>
              <option value="per shipment">Per Ship</option>
              <option value="per TEU">Per TEU</option>
            </select>
            <select value={c.currency} onChange={e => set(i, 'currency', e.target.value)} style={{ border: 'none', borderLeft: `1px solid ${C.border}`, padding: '7px 3px', fontSize: 11, outline: 'none', width: '100%', background: 'transparent', cursor: 'pointer' }}>
              {CURRENCIES.map(cur => <option key={cur}>{cur}</option>)}
            </select>
            <input type="number" value={c.amount} onChange={e => set(i, 'amount', e.target.value)} placeholder="0.00" style={{ border: 'none', borderLeft: `1px solid ${C.border}`, padding: '7px 6px', fontSize: 12, outline: 'none', width: '100%', background: 'transparent', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }} />
            <button onClick={() => remove(i)} disabled={charges.length === 1} style={{ border: 'none', borderLeft: `1px solid ${C.border}`, background: 'transparent', cursor: charges.length === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: charges.length === 1 ? C.border : C.red }}>
              <Icon name="x" size={11} />
            </button>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 70px 90px 28px', padding: '6px 8px', background: C.grayLight, borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text, gridColumn: '1/5' }}>Subtotal</span>
          <span style={{ fontSize: 12, fontWeight: 800, color, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

function RateForm({ form, setForm }) {
  const s = (k) => (e) => setForm(f => ({ ...f, [k]: e && e.target !== undefined ? e.target.value : e }));
  const inp = { width: '100%', padding: '7px 10px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', color: C.text, background: '#fff' };
  const lbl = { fontSize: 11, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 3 };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 2, background: C.navy, borderRadius: 1 }} />{title}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <Section title="Carrier & Type">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          <div><label style={lbl}>Mode *</label>
            <select value={form.mode} onChange={s('mode')} style={inp}>{MODES.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label style={lbl}>Rate Type</label>
            <select value={form.rateType} onChange={s('rateType')} style={inp}>{RATE_TYPES.map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label style={lbl}>Shipping Line *</label>
            <select value={form.shippingLine} onChange={e => { const sl = SHIPPING_LINES.find(l => l.name === e.target.value); setForm(f => ({ ...f, shippingLine: e.target.value, shippingLineCode: sl?.code || '' })); }} style={inp}>
              <option value="">— Select —</option>
              {SHIPPING_LINES.map(l => <option key={l.code} value={l.name}>{l.name} ({l.code})</option>)}
            </select></div>
          <div><label style={lbl}>Container Type</label>
            <select value={form.containerType} onChange={s('containerType')} style={inp}><option value="">— Any —</option>{CONTAINERS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label style={lbl}>Service Mode</label>
            <select value={form.serviceMode} onChange={s('serviceMode')} style={inp}>{SERVICE_MODES.map(sv => <option key={sv}>{sv}</option>)}</select></div>
          <div style={{ gridColumn: '2/-1' }}><label style={lbl}>Service Name</label>
            <input value={form.serviceName} onChange={s('serviceName')} placeholder="e.g. IME STBY GEMINI SHUTTLI" style={inp} /></div>
        </div>
      </Section>

      <Section title="Route (POL → Transshipment → POD)">
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div><label style={lbl}>POL Code *</label><input value={form.originPort} onChange={e => setForm(f => ({...f, originPort: e.target.value.toUpperCase()}))} placeholder="INNSA" style={{ ...inp, fontFamily: 'JetBrains Mono, monospace' }} /></div>
          <div><label style={lbl}>POL Name</label><input value={form.originPortName} onChange={s('originPortName')} placeholder="Nhava Sheva (JNPT)" style={inp} /></div>
          <div><label style={lbl}>Origin Terminal</label><input value={form.originTerminal} onChange={s('originTerminal')} placeholder="Gateway Terminals I..." style={inp} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div><label style={lbl}>Via Port Codes (comma-separated)</label><input value={form.viaPort} onChange={s('viaPort')} placeholder="OMSLL, SGSIN" style={{ ...inp, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }} /></div>
          <div><label style={lbl}>Via Port Names (comma-separated)</label><input value={form.viaPortNames} onChange={s('viaPortNames')} placeholder="Salalah Terminal, Singapore" style={inp} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 8 }}>
          <div><label style={lbl}>POD Code *</label><input value={form.destinationPort} onChange={e => setForm(f => ({...f, destinationPort: e.target.value.toUpperCase()}))} placeholder="USEWR" style={{ ...inp, fontFamily: 'JetBrains Mono, monospace' }} /></div>
          <div><label style={lbl}>POD Name</label><input value={form.destinationPortName} onChange={s('destinationPortName')} placeholder="Newark" style={inp} /></div>
          <div><label style={lbl}>Destination Terminal</label><input value={form.destinationTerminal} onChange={s('destinationTerminal')} placeholder="Newark - Maher Ter..." style={inp} /></div>
        </div>
      </Section>

      <Section title="Sailing & Validity">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <div><label style={lbl}>Sailing Date *</label><input type="date" value={form.sailingDate} onChange={s('sailingDate')} style={inp} /></div>
          <div><label style={lbl}>Transit (Days) *</label><input type="number" value={form.transitTimeDays} onChange={s('transitTimeDays')} placeholder="38" style={inp} /></div>
          <div><label style={lbl}>Free Days</label><input type="number" value={form.freeDays} onChange={s('freeDays')} placeholder="4" style={inp} /></div>
          <div><label style={lbl}>Valid From *</label><input type="date" value={form.validFrom} onChange={s('validFrom')} style={inp} /></div>
          <div><label style={lbl}>Valid To</label><input type="date" value={form.validTo} onChange={s('validTo')} style={inp} /></div>
          <div><label style={lbl}>Cargo Type</label>
            <select value={form.cargoType} onChange={s('cargoType')} style={inp}>{CARGO_TYPES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div style={{ gridColumn: '2/-1' }}><label style={lbl}>Cargo Description</label><input value={form.cargoDescription} onChange={s('cargoDescription')} placeholder="General Cargo" style={inp} /></div>
        </div>
      </Section>

      <ChargeEditor title="Freight Charges — Ocean Leg (max 6)" charges={form.freightCharges} onChange={v => setForm(f => ({...f, freightCharges: v}))} maxRows={6} color={C.navy} />
      <ChargeEditor title="Origin Charges — POL (max 9)" charges={form.originCharges} onChange={v => setForm(f => ({...f, originCharges: v}))} maxRows={9} color={C.orange} />
      <ChargeEditor title="Destination Charges — POD (max 9)" charges={form.destinationCharges} onChange={v => setForm(f => ({...f, destinationCharges: v}))} maxRows={9} color={C.green} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div><label style={lbl}>Inclusions</label><input value={form.inclusions} onChange={s('inclusions')} placeholder="e.g. Vessel Risk Surcharge" style={inp} /></div>
        <div><label style={lbl}>Remarks / T&C notes</label><input value={form.remarks} onChange={s('remarks')} placeholder="Additional charges or notes" style={inp} /></div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} />
        Active — visible to users in rate search
      </label>
    </div>
  );
}

export default function RatesPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modeFilter, setModeFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const fileRef = useRef();
  const { show, ToastEl } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await getRates({ mode: modeFilter || undefined, page, limit: 20 }); setData(res.data.rates); setPagination(res.data.pagination); }
    catch (err) { show(err.message, 'error'); }
    finally { setLoading(false); }
  }, [modeFilter, page]);

  useEffect(() => { load(); }, [load]);

  const preparePayload = (f) => ({
    ...f,
    originPort: f.originPort?.toUpperCase(),
    destinationPort: f.destinationPort?.toUpperCase(),
    viaPort: f.viaPort ? f.viaPort.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [],
    viaPortNames: f.viaPortNames ? f.viaPortNames.split(',').map(s => s.trim()).filter(Boolean) : [],
    freightCharges: f.freightCharges.filter(c => c.name && c.amount).map(c => ({...c, amount: parseFloat(c.amount)})),
    originCharges: f.originCharges.filter(c => c.name && c.amount).map(c => ({...c, amount: parseFloat(c.amount)})),
    destinationCharges: f.destinationCharges.filter(c => c.name && c.amount).map(c => ({...c, amount: parseFloat(c.amount)})),
    freightRateUsd: f.freightCharges.filter(c => c.name && c.amount && c.currency === 'USD').reduce((s, c) => s + (parseFloat(c.amount) || 0), 0),
    totalUsd: [...f.freightCharges, ...f.originCharges, ...f.destinationCharges].filter(c => c.name && c.amount && c.currency === 'USD').reduce((s, c) => s + (parseFloat(c.amount) || 0), 0),
  });

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal('form'); };
  const openEdit = (rate) => {
    setForm({
      ...EMPTY_FORM, ...rate,
      viaPort: (rate.viaPort||[]).join(', '), viaPortNames: (rate.viaPortNames||[]).join(', '),
      sailingDate: rate.sailingDate ? new Date(rate.sailingDate).toISOString().slice(0,10) : '',
      validFrom: rate.validFrom ? new Date(rate.validFrom).toISOString().slice(0,10) : '',
      validTo: rate.validTo ? new Date(rate.validTo).toISOString().slice(0,10) : '',
      freightCharges: rate.freightCharges?.length ? rate.freightCharges : [emptyCharge()],
      originCharges: rate.originCharges?.length ? rate.originCharges : [emptyCharge()],
      destinationCharges: rate.destinationCharges?.length ? rate.destinationCharges : [emptyCharge()],
    });
    setEditId(rate._id); setModal('form');
  };

  const handleSave = async () => {
    if (!form.originPort || !form.destinationPort || !form.shippingLine) { show('Origin port, destination port and shipping line required', 'warning'); return; }
    if (!form.freightCharges.some(c => c.name && c.amount)) { show('Add at least one freight charge', 'warning'); return; }
    setSubmitting(true);
    try {
      const p = preparePayload(form);
      if (editId) { await updateRate(editId, p); show('Rate updated', 'success'); } else { await createRate(p); show('Rate created', 'success'); }
      setModal(null); load();
    } catch (err) { show(err.message, 'error'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate?')) return;
    try { await deleteRate(id); show('Deactivated', 'success'); load(); } catch (err) { show(err.message, 'error'); }
  };

  const [templateLoading, setTemplateLoading] = useState(false);

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    try { await downloadRateTemplate(); }
    catch (err) { show('Failed to download template: ' + err.message, 'error'); }
    finally { setTemplateLoading(false); }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) { show('Select a file', 'warning'); return; }
    setSubmitting(true);
    try {
      setSubmitting(true);
      const fd = new FormData(); fd.append('file', bulkFile);
      const res = await bulkUploadRates(fd);
      setBulkResult(res);
      if (res.created > 0) { show(`${res.created} of ${res.total} rate(s) imported successfully`, 'success'); load(); }
      else { show(`0 rates imported — ${res.errors?.length || 0} error(s). Check details below.`, 'warning'); }
    }
    catch (err) { show(err.message, 'error'); } finally { setSubmitting(false); }
  };

  const columns = [
    { key: 'shippingLine', title: 'Carrier', render: (v, r) => <div><div style={{ fontWeight: 700 }}>{v}</div><div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{r.shippingLineCode} · {r.rateType}</div></div> },
    { key: 'originPort', title: 'Route', render: (v, r) => <div><span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{v}</span><span style={{ color: C.textMuted, margin: '0 4px' }}>→</span><span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{r.destinationPort}</span>{r.viaPort?.length > 0 && <div style={{ fontSize: 10, color: C.textMuted }}>via {r.viaPort.join(', ')}</div>}</div> },
    { key: 'containerType', title: 'Eqpt', render: v => v ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#EFF6FF', color: C.navy }}>{v}</span> : '—' },
    { key: 'freightRateUsd', title: 'Freight (USD)', render: v => <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.navy }}>USD {(v||0).toLocaleString()}</span> },
    { key: 'totalUsd', title: 'Total (USD)', render: v => <span style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.orange }}>USD {(v||0).toLocaleString()}</span> },
    { key: 'sailingDate', title: 'Sailing', render: v => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    { key: 'transitTimeDays', title: 'Transit', render: v => v ? `${v}d` : '—' },
    { key: 'isActive', title: 'Status', render: v => <Badge status={v ? 'active' : 'rejected'} label={v ? 'Active' : 'Off'} /> },
    { key: '_id', title: '', align: 'right', render: (v, row) => <div style={{ display: 'flex', gap: 6 }}><Btn variant="ghost" size="sm" icon={<Icon name="edit" size={12} />} onClick={() => openEdit(row)}>Edit</Btn><Btn variant="danger" size="sm" onClick={() => handleDelete(v)}>Del</Btn></div> },
  ];

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader title="Rate Management" subtitle="Full-spec rate entry: freight + origin + destination charges"
        actions={<>
          <Btn variant="ghost" size="sm" icon={<Icon name="upload" size={13} />} onClick={() => { setBulkResult(null); setBulkFile(null); setModal('bulk'); }}>Bulk Upload</Btn>
          <Btn variant="orange" size="sm" icon={<Icon name="plus" size={13} />} onClick={openCreate}>+ Add Rate</Btn>
        </>}
      />
      <div style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 8, padding: 4, border: `1px solid ${C.border}` }}>
            {['', ...MODES].map(m => <button key={m} onClick={() => { setModeFilter(m); setPage(1); }} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: modeFilter === m ? C.navy : 'transparent', color: modeFilter === m ? '#fff' : C.textSub }}>{m || 'All'}</button>)}
          </div>
          <Btn variant="ghost" size="sm" icon={<Icon name="refresh" size={13} />} onClick={load}>Refresh</Btn>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: C.textMuted, alignSelf: 'center' }}>{pagination.total || 0} rates</div>
        </div>
        <Card>
          <Table columns={columns} data={data} loading={loading} emptyMsg="No rates yet. Add via form or bulk upload." />
          {pagination.pages > 1 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
            <span>Page {page} of {pagination.pages}</span>
            <div style={{ display: 'flex', gap: 6 }}><Btn variant="ghost" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</Btn><Btn variant="ghost" size="sm" disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)}>Next →</Btn></div>
          </div>}
        </Card>
      </div>

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Rate' : 'Add New Rate'} width={820}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn variant="orange" loading={submitting} onClick={handleSave}>{editId ? 'Save' : 'Create Rate'}</Btn></>}>
        <RateForm form={form} setForm={setForm} />
      </Modal>

      <Modal open={modal === 'bulk'} onClose={() => { setModal(null); setBulkResult(null); setBulkFile(null); }} title="Bulk Rate Upload (.xlsx)" width={580}
        footer={
          <div style={{ display:'flex', gap:8, width:'100%', alignItems:'center' }}>
            <Btn variant="ghost" size="sm" loading={templateLoading} onClick={handleDownloadTemplate}
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
              Download Template
            </Btn>
            <div style={{ flex:1 }}/>
            <Btn variant="ghost" onClick={() => { setModal(null); setBulkResult(null); setBulkFile(null); }}>Close</Btn>
            <Btn variant="orange" loading={submitting} onClick={handleBulkUpload} disabled={!bulkFile || submitting}>
              {submitting ? 'Uploading…' : 'Upload Rates'}
            </Btn>
          </div>
        }>
        <div>
          {/* Instructions */}
          <div style={{ padding:'11px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, marginBottom:14, fontSize:12, color:C.navy, lineHeight:1.75 }}>
            <div style={{ fontWeight:700, marginBottom:4 }}>📋 Template column format</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 16px' }}>
              {[
                'Mode, Rate Type, Shipping Line, Shipping Line Code',
                'Container Type, Service Mode, Service Name',
                'POL Code, POL Name, Origin Terminal',
                'POD Code, POD Name, Destination Terminal',
                'Via Codes, Via Names (comma-separated)',
                'Sailing Date, Transit Days, Free Days',
                'Cargo Type, Cargo Description',
                'Valid From, Valid To',
                'FC1–FC6: Name / Code / Basis / Currency / Amount',
                'OC1–OC9: Name / Code / Basis / Currency / Amount',
                'DC1–DC9: Name / Code / Basis / Currency / Amount',
                'Inclusions, Remarks',
              ].map((t,i) => <div key={i} style={{ color:'#1e40af', fontSize:11 }}>· {t}</div>)}
            </div>
            <div style={{ marginTop:6, fontSize:11, color:'#374151' }}>
              <strong>Required:</strong> Shipping Line · POL Code · POD Code · Valid From &nbsp;|&nbsp;
              <strong>Currency codes:</strong> USD · EUR · GBP · AED · INR · SGD
            </div>
          </div>

          {/* Drop zone */}
          <div onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) { setBulkFile(f); setBulkResult(null); } }}
            style={{ border:`2px dashed ${bulkFile ? C.green : C.borderMd}`, borderRadius:10, padding:'26px 20px', textAlign:'center', cursor:'pointer', background:bulkFile ? '#ECFDF5' : C.grayLight, marginBottom:12, transition:'all .15s' }}>
            <Icon name="upload" size={26} color={bulkFile ? C.green : C.textMuted} />
            <div style={{ fontSize:13, color:bulkFile ? C.green : C.textSub, marginTop:8, fontWeight:600 }}>
              {bulkFile ? bulkFile.name : 'Drop .xlsx file here or click to browse'}
            </div>
            {bulkFile && (
              <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>
                {(bulkFile.size / 1024).toFixed(1)} KB &nbsp;·&nbsp;
                <span style={{ color:C.red, cursor:'pointer', textDecoration:'underline' }}
                  onClick={e => { e.stopPropagation(); setBulkFile(null); setBulkResult(null); }}>Remove</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e => { setBulkFile(e.target.files[0]); setBulkResult(null); }} />

          {/* Results */}
          {bulkResult && (
            <div style={{ borderRadius:8, overflow:'hidden', border:`1px solid ${bulkResult.created > 0 ? '#BBF7D0' : '#FECACA'}` }}>
              {/* Header */}
              <div style={{ padding:'10px 14px', background:bulkResult.created > 0 ? '#ECFDF5' : '#FEF2F2', display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:16 }}>{bulkResult.created > 0 ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:bulkResult.created > 0 ? C.green : C.red }}>
                    {bulkResult.created} of {bulkResult.total} rate(s) imported successfully
                  </div>
                  {bulkResult.errors?.length > 0 && (
                    <div style={{ fontSize:11, color:C.textMuted }}>{bulkResult.errors.length} row(s) had errors and were skipped</div>
                  )}
                </div>
              </div>
              {/* Error list */}
              {bulkResult.errors?.length > 0 && (
                <div style={{ maxHeight:200, overflowY:'auto', background:'#fff' }}>
                  {bulkResult.errors.map((e, i) => (
                    <div key={i} style={{ display:'flex', gap:10, padding:'7px 14px', borderTop:'1px solid #FEE2E2', alignItems:'flex-start' }}>
                      <span style={{ flexShrink:0, fontSize:11, fontWeight:700, color:'#fff', background:C.red, borderRadius:4, padding:'1px 6px', marginTop:1, fontFamily:'monospace' }}>Row {e.row}</span>
                      <span style={{ fontSize:12, color:'#7f1d1d', lineHeight:1.5 }}>{e.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}
