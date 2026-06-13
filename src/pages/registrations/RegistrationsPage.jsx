import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { Card, Table, Badge, Btn, Modal, Icon, C, fmtDate, fmtDateTime, useToast } from '../../components/UI';
import { getRegistrations, approveRegistration, rejectRegistration, 
         resetUserKyc, deactivateRegistration, deleteRegistration } from '../../services/api';

const STATUS_TABS = ['pending_approval', 'active', 'suspended', 'all'];
const TAB_LABELS  = { pending_approval: 'Pending Review', active: 'Approved', suspended: 'Rejected', all: 'All' };

/* ─── Info row helper ── */
const InfoRow = ({ label, value, mono, last }) => (
  <div style={{ display: 'flex', padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${C.border}`, gap: 8 }}>
    <div style={{ width: 180, flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.textMuted }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: mono ? 'ui-monospace,monospace' : 'inherit', wordBreak: 'break-all' }}>{value || '—'}</div>
  </div>
);

const SectionTitle = ({ label, color = C.navy }) => (
  <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${color}` }}>{label}</div>
);

/* ─── Detail + Approve/Reject modal ── */
function DetailModal({ reg, onClose, onApprove, onReject, onResetKyc, onDeactivate, onDelete }) {
  const [screen, setScreen]         = useState('detail'); // 'detail'|'reject'|'deactivate'|'delete'
  const [reason, setReason]         = useState('');
  const [approving, setApproving]   = useState(false);
  const [rejecting, setRejecting]   = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const doApprove = async () => {
    setApproving(true);
    try { await onApprove(reg._id); onClose(); }
    finally { setApproving(false); }
  };

  const doReject = async () => {
    if (!reason.trim()) return;
    setRejecting(true);
    try { await onReject(reg._id, reason.trim()); onClose(); }
    finally { setRejecting(false); }
  };

  const doDeactivate = async () => {
    if (!reason.trim()) return;
    setDeactivating(true);
    try { await onDeactivate(reg._id, reason.trim()); onClose(); }
    finally { setDeactivating(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try { await onDelete(reg._id); onClose(); }
    finally { setDeleting(false); }
  };

  const isPending  = reg.status === 'pending_approval';
  const isActive   = reg.status === 'active';
  const isSuspended = reg.status === 'suspended';

  const Footer = () => {
    if (screen === 'reject') return (
      <>
        <Btn variant="ghost" onClick={() => { setScreen('detail'); setReason(''); }}>← Back</Btn>
        <Btn variant="danger" loading={rejecting} onClick={doReject} disabled={!reason.trim()}>
          Confirm Rejection
        </Btn>
      </>
    );
    if (screen === 'deactivate') return (
      <>
        <Btn variant="ghost" onClick={() => { setScreen('detail'); setReason(''); }}>← Back</Btn>
        <Btn variant="danger" loading={deactivating} onClick={doDeactivate} disabled={!reason.trim()}>
          Confirm Deactivation
        </Btn>
      </>
    );
    if (screen === 'delete') return (
      <>
        <Btn variant="ghost" onClick={() => setScreen('detail')}>← Back</Btn>
        <Btn variant="danger" loading={deleting} onClick={doDelete}>
          Yes, Permanently Delete
        </Btn>
      </>
    );

    // Default footer — varies by status
    return (
      <>
        <Btn variant="ghost" onClick={onClose}>Close</Btn>

        {/* Deactivate — only for active accounts */}
        {isActive && (
          <button onClick={() => { setScreen('deactivate'); setReason(''); }}
            style={{ padding: '8px 18px', background: '#FFF7ED', color: '#C2410C', border: '1.5px solid #FED7AA', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            ⏸ Deactivate…
          </button>
        )}

        {/* Re-activate — only for suspended accounts */}
        {isSuspended && (
          <Btn variant="orange" loading={approving} onClick={doApprove}>
            ↺ Re-activate
          </Btn>
        )}

        {/* Delete — always available (super admin guard is on the API) */}
        <button onClick={() => setScreen('delete')}
          style={{ padding: '8px 18px', background: '#FFF1F0', color: '#D91A1A', border: '1.5px solid #FFCCC7', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          🗑 Delete…
        </button>

        {/* Approve — only for pending */}
        {isPending && (
          <>
            <button onClick={() => { setScreen('reject'); setReason(''); }}
              style={{ padding: '8px 18px', background: '#FFF1F0', color: '#D91A1A', border: '1.5px solid #FFCCC7', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Reject…
            </button>
            <Btn variant="orange" loading={approving} onClick={doApprove}>
              ✓ Approve & Activate
            </Btn>
          </>
        )}
      </>
    );
  };

  return (
    <Modal open onClose={onClose} title={reg.company?.name || 'Registration Detail'} width={780} footer={<Footer />}>

    {screen === 'deactivate' ? (
  <div>
    <div style={{ padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, marginBottom: 18, fontSize: 13, color: '#C2410C' }}>
      ⏸ This will <strong>suspend</strong> the account. The user will lose access immediately. You can re-activate later.
    </div>
    <label style={{ fontSize: 12, fontWeight: 700, color: C.textSub, display: 'block', marginBottom: 6 }}>
      Reason for Deactivation <span style={{ color: '#D91A1A' }}>*</span>
    </label>
    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} autoFocus
      placeholder="Explain why this account is being suspended…"
      style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{reason.length} characters</div>
  </div>
) : screen === 'delete' ? (
  <div>
    <div style={{ padding: '16px', background: '#FFF1F0', border: '1px solid #FFCCC7', borderRadius: 10, marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#D91A1A', marginBottom: 6 }}>⚠️ Permanent Deletion</div>
      <div style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.6 }}>
        This will <strong>permanently delete</strong> the registration for <strong>{reg.company?.name}</strong> and all associated data.
        This action <strong>cannot be undone</strong>. Only super admins can perform this action.
      </div>
    </div>
    <div style={{ padding: '12px 16px', background: C.grayLight, borderRadius: 10, fontSize: 13, color: C.textSub }}>
      <strong>Company:</strong> {reg.company?.name}<br />
      <strong>Contact:</strong> {reg.name} · {reg.officialEmail}<br />
      <strong>Registered:</strong> {fmtDate(reg.createdAt)}
    </div>
  </div>
) : screen === 'reject' ? (
  /* existing reject JSX unchanged */
        /* ── Reject screen ── */
        <div>
          <div style={{ padding: '12px 16px', background: '#FFF1F0', border: '1px solid #FFCCC7', borderRadius: 10, marginBottom: 18, fontSize: 13, color: '#D91A1A' }}>
            ⚠️ This will <strong>reject</strong> the registration application and suspend the account. The applicant will be notified by email.
          </div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textSub, display: 'block', marginBottom: 6 }}>Rejection Reason <span style={{ color: '#D91A1A' }}>*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={5} autoFocus
            placeholder="Clearly explain why the application is being rejected. This message will be sent to the applicant.&#10;&#10;Examples:&#10;• Company registration certificate is unclear/unreadable&#10;• Documents provided do not match company name&#10;• Invalid or expired tax certificate"
            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{reason.length} characters · Be specific so the applicant knows what to fix</div>
        </div>
      ) : (
        /* ── Detail screen ── */
        <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>

          {/* Status banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderRadius: 12, marginBottom: 22,
            background: isPending ? '#EEF3FF' : reg.status === 'active' ? '#EDFBF4' : '#FFF1F0',
            border: `1px solid ${isPending ? '#D4DCFF' : reg.status === 'active' ? '#8AEBC4' : '#FFCCC7'}`,
          }}>
            <div style={{ fontSize: 28 }}>{isPending ? '⏳' : reg.status === 'active' ? '✅' : '❌'}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isPending ? '#1A3CC8' : reg.status === 'active' ? '#0A8A56' : '#D91A1A' }}>
                {TAB_LABELS[reg.status] || reg.status}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                Application submitted {fmtDateTime(reg.createdAt)} ·
                App ID: <strong style={{ fontFamily: 'ui-monospace,monospace', color: '#1A3CC8' }}>NGR-{reg._id?.slice(-8).toUpperCase()}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Company details */}
            <div>
              <SectionTitle label="Company Details" color="#0D1B5E" />
              <InfoRow label="Company Name"    value={reg.company?.name} />
              <InfoRow label="Company Type"    value={reg.company?.type} />
              <InfoRow label="Country"         value={reg.company?.country} />
              <InfoRow label="Company Address" value={reg.company?.address} />
              <InfoRow label="ZIP / Pin Code"  value={reg.company?.zipCode} />
              <InfoRow label="Website"         value={reg.company?.website} />
              <InfoRow label="Incorporation"   value={fmtDate(reg.company?.incorporationDate)} />
              <InfoRow label="VAT/GST/TAX No." value={reg.company?.vatGstTaxNo} mono />
              <InfoRow label="Billing Same"    value={reg.company?.billingAddressSame ? 'Yes' : 'No'} last />
              {!reg.company?.billingAddressSame && <InfoRow label="Billing Address" value={reg.company?.billingAddress} last />}
            </div>

            {/* Contact + Director */}
            <div>
              <SectionTitle label="Contact Person" color="#1A3CC8" />
              <InfoRow label="Full Name"    value={reg.name} />
              <InfoRow label="Email"        value={reg.officialEmail} mono />
              <InfoRow label="Mobile"       value={reg.mobile} mono />
              <InfoRow label="Landline"     value={reg.landline} last />

              <div style={{ marginTop: 20 }}>
                <SectionTitle label="Management / Director" color="#7C3AED" />
                <InfoRow label="Director Name"   value={reg.director?.name} />
                <InfoRow label="Director Email"  value={reg.director?.email} mono />
                <InfoRow label="Director Mobile" value={reg.director?.mobile} mono last />
              </div>
            </div>
          </div>

          {/* KYC Status Info */}
          {reg.kyc && (
            <div style={{ marginTop: 22, padding:'12px 16px', borderRadius:10, background: reg.kyc.status==='approved'?'#EDFBF4':reg.kyc.status==='not_submitted'?'#EEF3FF':'#FFF8E6', border:`1px solid ${reg.kyc.status==='approved'?'#8AEBC4':reg.kyc.status==='not_submitted'?'#D4DCFF':'#FDE68A'}` }}>
              <div style={{ fontSize:11, fontWeight:800, color:reg.kyc.status==='approved'?'#0A8A56':reg.kyc.status==='not_submitted'?'#1A3CC8':'#C47B00', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>KYC Status</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>{reg.kyc.status==='approved'?'✅':reg.kyc.status==='pending'?'⏳':reg.kyc.status==='not_submitted'?'📋':reg.kyc.status==='rejected'?'❌':'⚠️'}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{reg.kyc.status?.replace(/_/g,' ').toUpperCase()}</div>
                  {reg.kyc.status==='approved' && (!reg.kyc.documents || reg.kyc.documents.length===0) && (
                    <div style={{ fontSize:11, color:'#C47B00', marginTop:2, fontWeight:600 }}>⚠️ KYC was auto-approved during registration — user has NOT uploaded KYC identity documents. Use "Reset KYC" to prompt them.</div>
                  )}
                  {reg.kyc.status==='not_submitted' && <div style={{ fontSize:11, color:'#3A4A7A', marginTop:2 }}>User needs to upload KYC documents after logging in.</div>}
                  {reg.kyc.status==='pending' && <div style={{ fontSize:11, color:'#78350F', marginTop:2 }}>KYC documents submitted — awaiting review in the KYC Review section.</div>}
                </div>
              </div>
            </div>
          )}

          {/* Registration Documents */}
          <div style={{ marginTop: 22 }}>
            <SectionTitle label={`Registration Documents (${reg.registrationDocuments?.length || 0})`} color="#0A8A56" />
            {!reg.registrationDocuments?.length ? (
              <div style={{ padding: '20px', textAlign: 'center', background: C.grayLight, borderRadius: 10, fontSize: 13, color: C.textMuted }}>
                ⚠️ No documents were uploaded with this registration
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reg.registrationDocuments.map((doc, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10,
                    background: doc.viewUrl ? '#EDFBF4' : C.grayLight,
                    border: `1px solid ${doc.viewUrl ? '#8AEBC4' : C.border}`,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: doc.viewUrl ? '#D1FAE5' : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={doc.viewUrl ? '#0A8A56' : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.originalName || doc.fieldKey || `Document ${i + 1}`}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                        {doc.mimeType} · Uploaded {fmtDate(doc.uploadedAt)}
                        {doc.scheduledDeleteAt && ` · Auto-deletes ${fmtDate(doc.scheduledDeleteAt)}`}
                      </div>
                    </div>
                    {doc.viewUrl ? (
                      <a href={doc.viewUrl} target="_blank" rel="noreferrer"
                        style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#1A3CC8,#1E50FF)', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        View →
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: C.textMuted, padding: '7px 10px', flexShrink: 0 }}>Link expired</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Main Registrations Page ── */
export default function RegistrationsPage() {
  const [data, setData]             = useState([]);
  const [counts, setCounts]         = useState({});
  const [pagination, setPagination] = useState({});
  const [statusTab, setStatusTab]   = useState('pending_approval');
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const { show, ToastEl }           = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRegistrations({ status: statusTab, page, limit: 20, search: search || undefined });
      setData(res.data.registrations);
      setPagination(res.data.pagination);
      setCounts(res.counts || {});
    } catch (err) {
      show(err.message || 'Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusTab, page, search]);

  useEffect(() => { load(); }, [load]);

  const handleResetKyc = async (userId) => {
    if (!window.confirm('Reset this user KYC to "not_submitted"? They will need to re-upload KYC documents on next login.')) return;
    try {
      await resetUserKyc(userId);
      show('✅ KYC reset — user will be prompted to upload KYC on next login', 'success');
      load();
    } catch (err) { show(err.message, 'error'); }
  };

  const handleApprove = async (userId) => {
    try {
      await approveRegistration(userId);
      show('✅ Registration approved — account activated', 'success');
      load();
    } catch (err) { show(err.message, 'error'); }
  };

  const handleDeactivate = async (userId, reason) => {
  try {
    await deactivateRegistration(userId, reason);
    show('Account deactivated (suspended)', 'success');
    load();
  } catch (err) { show(err.message, 'error'); }
};

const handleDelete = async (userId) => {
  try {
    await deleteRegistration(userId);
    show('Registration permanently deleted', 'success');
    load();
  } catch (err) { show(err.message, 'error'); }
};

  const handleReject = async (userId, reason) => {
    try {
      await rejectRegistration(userId, reason);
      show('Registration rejected', 'success');
      load();
    } catch (err) { show(err.message, 'error'); }
  };

  const columns = [
    {
      key: 'company', title: 'Company',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{r.company?.name}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{r.company?.type} · {r.company?.country}</div>
        </div>
      ),
    },
    {
      key: 'name', title: 'Contact Person',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: 'ui-monospace,monospace' }}>{r.officialEmail}</div>
        </div>
      ),
    },
    {
      key: 'mobile', title: 'Mobile',
      render: v => <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: C.textSub }}>{v || '—'}</span>,
    },
    {
      key: 'registrationDocuments', title: 'Documents',
      render: v => {
        const n = v?.length || 0;
        return (
          <span style={{ fontSize: 12, fontWeight: 700, color: n > 0 ? C.green : C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
            {n > 0
              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>{n} file{n !== 1 ? 's' : ''}</>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>None</>
            }
          </span>
        );
      },
    },
    {
      key: 'createdAt', title: 'Submitted',
      render: v => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span>,
    },
    {
      key: 'status', title: 'Status',
      render: v => <Badge status={v} label={TAB_LABELS[v] || v} />,
    },
    {
      key: '_id', title: '', align: 'right',
      render: (v, row) => (
        <Btn variant="ghost" size="sm" icon={<Icon name="eye" size={12} />} onClick={() => setSelected(row)}>
          Review
        </Btn>
      ),
    },
  ];

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader
        title="Company Registrations"
        subtitle="Review applications, verify documents, approve or reject company accounts"
        actions={
          <Btn variant="ghost" size="sm" icon={<Icon name="refresh" size={13} />} onClick={load}>
            Refresh
          </Btn>
        }
      />

      <div style={{ padding: '20px 28px' }}>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Pending Review', key: 'pending_approval', color: '#1A3CC8', bg: '#EEF3FF', icon: '⏳' },
            { label: 'Approved',       key: 'active',           color: '#0A8A56', bg: '#EDFBF4', icon: '✅' },
            { label: 'Rejected',       key: 'suspended',        color: '#D91A1A', bg: '#FFF1F0', icon: '❌' },
          ].map(s => (
            <div key={s.key} onClick={() => { setStatusTab(s.key); setPage(1); }}
              style={{ flex: 1, padding: '14px 18px', background: s.bg, borderRadius: 12, border: `1.5px solid ${statusTab === s.key ? s.color : 'transparent'}`, cursor: 'pointer', transition: 'all .15s' }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: "'Outfit',sans-serif", lineHeight: 1, marginTop: 4 }}>
                {counts[s.key] ?? '—'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginTop: 3, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 2, background: '#fff', borderRadius: 10, padding: 3, border: `1px solid ${C.border}` }}>
            {STATUS_TABS.map(s => (
              <button key={s} onClick={() => { setStatusTab(s); setPage(1); }} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all .15s',
                background: statusTab === s ? '#0D1B5E' : 'transparent',
                color: statusTab === s ? '#fff' : C.textSub,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {TAB_LABELS[s]}
                {s !== 'all' && typeof counts[s] === 'number' && counts[s] > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99,
                    background: statusTab === s ? 'rgba(255,255,255,.22)' : '#EEF3FF',
                    color: statusTab === s ? '#fff' : '#1A3CC8',
                  }}>
                    {counts[s]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Icon name="search" size={14} color={C.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search company name, email, country…"
              style={{ width: '100%', height: 40, padding: '0 14px 0 36px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            data={data}
            loading={loading}
            emptyMsg={
              statusTab === 'pending_approval'
                ? '🎉 No pending registrations — all applications have been reviewed!'
                : 'No registrations found'
            }
          />
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
              <span>Page {page} of {pagination.pages} · {pagination.total} total</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
                <Btn variant="ghost" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>
{selected && (
  <DetailModal
    reg={selected}
    onClose={() => { setSelected(null); load(); }}
    onApprove={handleApprove}
    onReject={handleReject}
    onResetKyc={handleResetKyc}
    onDeactivate={handleDeactivate}   
    onDelete={handleDelete}     
  />
)}
    </AdminLayout>
  );
}
