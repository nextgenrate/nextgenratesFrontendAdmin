// ══════════════════════════════════════════════════════════════
//  UsersPage
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { Card, Table, Badge, Btn, Modal, Input, Icon, C, fmtDate, fmtDateTime, useToast } from '../../components/UI';
import { getUsers, createUser, getUserSearches, exportData } from '../../services/api';

export function UsersPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [searches, setSearches] = useState([]);
  const [modal, setModal] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', email: '', companyName: '' });
  const [submitting, setSubmitting] = useState(false);
  const { show, ToastEl } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ search, kyc: kycFilter || undefined, page, limit: 20 });
      setData(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) { show(err.message, 'error'); }
    finally { setLoading(false); }
  }, [search, kycFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openUser = async (user) => {
    setSelected(user);
    setModal('detail');
    try {
      const res = await getUserSearches(user._id);
      setSearches(res.data);
    } catch {}
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email) { show('Name and email required', 'warning'); return; }
    setSubmitting(true);
    try {
      await createUser(createForm);
      show('User created. Credentials sent by email.', 'success');
      setModal(null);
      setCreateForm({ name: '', email: '', companyName: '' });
      load();
    } catch (err) { show(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const columns = [
    { key: 'name', title: 'Name', render: (v, r) => <div><div style={{ fontWeight: 700, fontSize: 13 }}>{v}</div><div style={{ fontSize: 11, color: C.textMuted }}>{r.email}</div></div> },
    { key: 'company', title: 'Company', render: v => v?.name || '—' },
    { key: 'kyc', title: 'KYC', render: v => <Badge status={v?.status || 'not_submitted'} /> },
    { key: 'status', title: 'Account', render: v => <Badge status={v} /> },
    { key: 'lastLoginAt', title: 'Last Login', render: v => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    { key: 'createdAt', title: 'Joined', render: v => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    { key: '_id', title: '', align: 'right', render: (v, row) => <Btn variant="ghost" size="sm" icon={<Icon name="eye" size={12} />} onClick={() => openUser(row)}>View</Btn> },
  ];

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader title="Users" subtitle="Customer accounts and activity"
        actions={<>
          <Btn variant="ghost" size="sm" icon={<Icon name="download" size={13} />} onClick={async () => { try { const b = await exportData('users', {}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download='users.xlsx'; a.click(); } catch {} }}>Export</Btn>
          <Btn variant="orange" size="sm" icon={<Icon name="plus" size={13} />} onClick={() => setModal('create')}>Create User</Btn>
        </>}
      />
      <div style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={14} color={C.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, company…"
              style={{ padding: '8px 12px 8px 32px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', width: 260 }} />
          </div>
          <select value={kycFilter} onChange={e => { setKycFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
            <option value="">All KYC Status</option>
            {['not_submitted', 'pending', 'approved', 'rejected', 'resubmit_required'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <Card>
          <Table columns={columns} data={data} loading={loading} emptyMsg="No users found" />
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
              <span>{pagination.total} users</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</Btn>
                <Btn variant="ghost" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p+1)}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* User detail modal */}
      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title={selected?.name} width={680}>
        {selected && <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: C.grayLight, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            {[['Email', selected.email], ['Phone', `${selected.phoneCountryCode}${selected.phone}`], ['Company', selected.company?.name], ['GST', selected.kyc?.gstNumber], ['KYC', <Badge status={selected.kyc?.status} />], ['Account', <Badge status={selected.status} />], ['Created By Admin', selected.createdByAdmin ? 'Yes' : 'No'], ['Joined', fmtDate(selected.createdAt)]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13 }}>{v || '—'}</div></div>
            ))}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>Recent Searches</div>
          {searches.length === 0 ? <div style={{ color: C.textMuted, fontSize: 13, padding: 12, textAlign: 'center', background: C.grayLight, borderRadius: 8 }}>No searches yet</div>
            : <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {searches.map((s, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>{s.mode} · <strong>{s.originPort} → {s.destinationPort}</strong> {s.containerType && `(${s.containerType})`}</span>
                  <span style={{ color: C.textMuted }}>{fmtDateTime(s.createdAt)}</span>
                </div>
              ))}
            </div>
          }
        </div>}
      </Modal>

      {/* Create user modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create User Account" width={440}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn variant="orange" loading={submitting} onClick={handleCreate}>Create & Send Credentials</Btn></>}>
        <div>
          <p style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>A temporary password will be generated and emailed to the user. They must change it on first login.</p>
          <Input label="Full Name *" value={createForm.name} onChange={e => setCreateForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Rajesh Kumar" />
          <Input label="Email Address *" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({...f, email: e.target.value}))} placeholder="user@company.com" />
          <Input label="Company Name" value={createForm.companyName} onChange={e => setCreateForm(f => ({...f, companyName: e.target.value}))} placeholder="Optional" />
        </div>
      </Modal>
    </AdminLayout>
  );
}

// ══════════════════════════════════════════════════════════════
//  EnquiriesPage
// ══════════════════════════════════════════════════════════════
import { getEnquiries, updateEnquiry } from '../../services/api';

export function EnquiriesPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { show, ToastEl } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEnquiries({ status: statusFilter || undefined, page, limit: 20 });
      setData(res.data.enquiries);
      setPagination(res.data.pagination);
    } catch (err) { show(err.message, 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

const handleRespond = async (newStatus) => {
  setSubmitting(true);
  try {
    await updateEnquiry(selected._id, { status: newStatus, adminResponse: responseText });

    const msgs = {
      responded:    'Response sent — customer notified by email ✅',
      under_review: 'Marked as under review',
      closed:       'Enquiry closed — customer notified',
    };
    show(msgs[newStatus] || 'Updated', 'success');
    setModal(false);
    load();
  } catch (err) { show(err.message, 'error'); }
  finally { setSubmitting(false); }
};

  const columns = [
    { key: 'enquiryRef', title: 'Ref', render: v => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: C.purple }}>{v}</span> },
    { key: 'user', title: 'Customer', render: v => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{v?.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{v?.email}</div></div> },
    { key: 'mode', title: 'Mode', render: v => <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: C.navyLight, color: C.navy }}>{v}</span> },
    { key: 'originPort', title: 'Route', render: (v, r) => `${v} → ${r.destinationPort}` },
    { key: 'containerType', title: 'Container' },
    { key: 'targetRate', title: 'Target', render: (v, r) => v ? `${r.currency} ${v}` : '—' },
    { key: 'status', title: 'Status', render: v => <Badge status={v} /> },
    { key: 'createdAt', title: 'Date', render: v => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    { key: '_id', title: '', align: 'right', render: (v, row) => <Btn variant="ghost" size="sm" onClick={() => { setSelected(row); setResponseText(row.adminResponse || ''); setModal(true); }}>Respond</Btn> },
  ];

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader title="Enquiries" subtitle="Custom rate requests from customers" />
      <div style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 6, border: `1px solid ${C.border}`, width: 'fit-content' }}>
          {['pending', 'under_review', 'responded', 'closed'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{
              padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: statusFilter === s ? C.navy : 'transparent', color: statusFilter === s ? '#fff' : C.textSub,
            }}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</button>
          ))}
        </div>
        <Card>
          <Table columns={columns} data={data} loading={loading} emptyMsg="No enquiries" />
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
              <span>{pagination.total} total</span>
              <div style={{ display: 'flex', gap: 6 }}><Btn variant="ghost" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</Btn><Btn variant="ghost" size="sm" disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)}>Next →</Btn></div>
            </div>
          )}
        </Card>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={`Enquiry — ${selected?.enquiryRef}`} width={540}
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>Close</Btn><Btn variant="ghost" loading={submitting} onClick={() => handleRespond('under_review')}>Mark Review</Btn><Btn variant="orange" loading={submitting} onClick={() => handleRespond('responded')}>Send Response</Btn><Btn variant="ghost" loading={submitting} onClick={() => handleRespond('closed')}>Close Enquiry</Btn></>}>
        {selected && <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: C.grayLight, borderRadius: 8, padding: 14, marginBottom: 16 }}>
            {[['Customer', selected.user?.name], ['Route', `${selected.originPort} → ${selected.destinationPort}`], ['Mode', selected.mode], ['Container', selected.containerType], ['Target Rate', selected.targetRate ? `${selected.currency} ${selected.targetRate}` : '—'], ['Cargo Wt', selected.cargoWeight ? `${selected.cargoWeight} ${selected.weightUnit}` : '—'], ['Preferred Liner', selected.preferredLiner || '—'], ['Free Days', selected.freeDays || '—'], ['Sailing Date', fmtDate(selected.preferredSailingDate)]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted }}>{l}</div><div style={{ fontSize: 13 }}>{v || '—'}</div></div>
            ))}
          </div>
          {selected.notes && <div style={{ padding: 12, background: C.navyLight, borderRadius: 8, marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 4 }}>CUSTOMER NOTE</div><div style={{ fontSize: 13, color: C.navy }}>{selected.notes}</div></div>}
          <div style={{ marginBottom: 5, fontSize: 12, fontWeight: 600, color: C.textSub }}>Response to customer (will be sent by email)</div>
          <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={4} placeholder="Write your response here…" style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical' }} />
        </div>}
      </Modal>
    </AdminLayout>
  );
}

// ══════════════════════════════════════════════════════════════
//  SearchActivityPage
// ══════════════════════════════════════════════════════════════
import { getSearchActivity } from '../../services/api';

export function SearchActivityPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { show, ToastEl } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSearchActivity({ page, limit: 50 });
      setData(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) { show(err.message, 'error'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'user', title: 'User', render: v => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{v?.name || 'Guest'}</div><div style={{ fontSize: 11, color: C.textMuted }}>{v?.email}</div></div> },
    { key: 'mode', title: 'Mode', render: v => <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: C.navyLight, color: C.navy }}>{v}</span> },
    { key: 'originPort', title: 'Route', render: (v, r) => <span style={{ fontWeight: 600 }}>{v} → {r.destinationPort}</span> },
    { key: 'containerType', title: 'Container' },
    { key: 'resultsCount', title: 'Results', render: v => <span style={{ fontWeight: 700, color: v > 0 ? C.green : C.red }}>{v}</span> },
    { key: 'ip', title: 'IP', render: v => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.textMuted }}>{v}</span> },
    { key: 'createdAt', title: 'Time', render: v => <span style={{ fontSize: 12 }}>{fmtDateTime(v)}</span> },
  ];

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader title="Search Activity" subtitle="Live view of what users are searching" actions={<Btn variant="ghost" size="sm" icon={<Icon name="refresh" size={13} />} onClick={load}>Refresh</Btn>} />
      <div style={{ padding: '20px 28px' }}>
        <Card>
          <Table columns={columns} data={data} loading={loading} emptyMsg="No search activity yet" />
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
              <span>{pagination.total} searches</span>
              <div style={{ display: 'flex', gap: 6 }}><Btn variant="ghost" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</Btn><Btn variant="ghost" size="sm" disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)}>Next →</Btn></div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
