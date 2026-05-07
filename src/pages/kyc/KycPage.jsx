import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { Card, Table, Badge, Btn, Modal, Textarea, Icon, C, fmtDate, fmtDateTime, useToast } from '../../components/UI';
import { getKycList, reviewKyc, adminVerifyGst } from '../../services/api';

const STATUS_TABS = ['pending', 'approved', 'rejected', 'resubmit_required'];

export default function KycPage() {
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'review' | 'docs'
  const [reviewForm, setReviewForm] = useState({ status: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const { show, ToastEl } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getKycList({ status, page, limit: 15, search });
      setData(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [status, page, search]);

  useEffect(() => { load(); }, [load]);

  const openReview = (user, reviewStatus) => {
    setSelected(user);
    setReviewForm({ status: reviewStatus, reason: '' });
    setModal('review');
  };

  const openDocs = (user) => { setSelected(user); setModal('docs'); };

  const handleReview = async () => {
    if (!reviewForm.status) return;
    if ((reviewForm.status === 'rejected' || reviewForm.status === 'resubmit_required') && !reviewForm.reason) {
      show('Please provide a rejection reason', 'warning'); return;
    }
    setSubmitting(true);
    try {
      await reviewKyc(selected._id, { status: reviewForm.status, rejectionReason: reviewForm.reason });
      show(`KYC ${reviewForm.status} for ${selected.name}`, 'success');
      setModal(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name', title: 'Customer',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 700, color: C.text }}>{v}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{row.email}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{row.phoneCountryCode}{row.phone}</div>
        </div>
      ),
    },
    {
      key: 'company', title: 'Company',
      render: (v) => <div><div style={{ fontSize: 13, color: C.text }}>{v?.name || '—'}</div><div style={{ fontSize: 11, color: C.textMuted }}>{v?.city}, {v?.country}</div></div>,
    },
    {
      key: 'kyc', title: 'GST / Docs',
      render: (v) => (
        <div>
          <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{v?.gstNumber || '—'}</div>
          {v?.gstVerified && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>✓ GST Verified</span>}
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{v?.documents?.filter(d => !d.deleted).length || 0} document(s)</div>
        </div>
      ),
    },
    { key: 'kyc', title: 'Submitted', render: (v) => <span style={{ fontSize: 12 }}>{fmtDateTime(v?.submittedAt)}</span> },
    { key: 'kyc', title: 'Status', render: (v) => <Badge status={v?.status} /> },
    {
      key: '_id', title: 'Actions', align: 'right',
      render: (v, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" size="sm" icon={<Icon name="eye" size={12} />} onClick={() => openDocs(row)}>Docs</Btn>
          {row.kyc?.status === 'pending' && <>
            <Btn variant="success" size="sm" onClick={() => openReview(row, 'approved')}>Approve</Btn>
            <Btn variant="danger" size="sm" onClick={() => openReview(row, 'rejected')}>Reject</Btn>
            <Btn variant="ghost" size="sm" onClick={() => openReview(row, 'resubmit_required')}>Resubmit</Btn>
          </>}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader title="KYC Review" subtitle="Verify customer identity documents" />

      <div style={{ padding: '20px 28px' }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 6, border: `1px solid ${C.border}`, width: 'fit-content' }}>
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: status === s ? C.navy : 'transparent',
              color: status === s ? '#fff' : C.textSub,
            }}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Icon name="search" size={14} color={C.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email…"
              style={{ width: '100%', padding: '8px 10px 8px 32px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', color: C.text }} />
          </div>
          <Btn variant="ghost" size="sm" icon={<Icon name="refresh" size={13} />} onClick={load}>Refresh</Btn>
        </div>

        <Card>
          <Table columns={columns} data={data} loading={loading} emptyMsg={`No ${status} KYC applications`} />
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
              <span>Page {page} of {pagination.pages} ({pagination.total} total)</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
                <Btn variant="ghost" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Docs Modal */}
      <Modal open={modal === 'docs'} onClose={() => setModal(null)} title={`KYC Documents — ${selected?.name}`} width={720}
        footer={<>
          {selected?.kyc?.status === 'pending' && <>
            <Btn variant="success" onClick={() => { setModal(null); openReview(selected, 'approved'); }}>Approve</Btn>
            <Btn variant="danger" onClick={() => { setModal(null); openReview(selected, 'rejected'); }}>Reject</Btn>
          </>}
          <Btn variant="ghost" onClick={() => setModal(null)}>Close</Btn>
        </>}>
        {selected && (
          <div>
            {/* Customer info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, background: C.grayLight, borderRadius: 8, padding: 16 }}>
              {[
                ['Full Name', selected.name],
                ['Email', selected.email],
                ['Phone', `${selected.phoneCountryCode}${selected.phone}`],
                ['Company', selected.company?.name || '—'],
                ['GST Number', selected.kyc?.gstNumber || '—'],
                ['GST Verified', selected.kyc?.gstVerified ? '✅ Yes' : '❌ No'],
                ['Submitted', fmtDateTime(selected.kyc?.submittedAt)],
                ['Status', <Badge status={selected.kyc?.status} />],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: C.text }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Documents */}
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 10 }}>Documents</div>
            {selected.kyc?.documents?.filter(d => !d.deleted).length === 0 ? (
              <div style={{ color: C.textMuted, fontSize: 13, padding: 16, textAlign: 'center', background: C.grayLight, borderRadius: 8 }}>No documents uploaded</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {selected.kyc?.documents?.filter(d => !d.deleted).map((doc, i) => (
                  <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: 'capitalize' }}>{doc.type?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>Uploaded {fmtDate(doc.uploadedAt)}</div>
                      <div style={{ fontSize: 10, color: C.red }}>Auto-delete {fmtDate(doc.scheduledDeleteAt)}</div>
                    </div>
                    {doc.viewUrl ? (
                      <a href={doc.viewUrl} target="_blank" rel="noreferrer">
                        <Btn variant="ghost" size="sm" icon={<Icon name="eye" size={12} />}>View</Btn>
                      </a>
                    ) : <span style={{ fontSize: 11, color: C.textMuted }}>Link expired</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Rejection reason if any */}
            {selected.kyc?.rejectionReason && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4 }}>REJECTION REASON</div>
                <div style={{ fontSize: 13, color: '#7F1D1D' }}>{selected.kyc.rejectionReason}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review Decision Modal */}
      <Modal open={modal === 'review'} onClose={() => setModal(null)} title={`KYC Decision — ${selected?.name}`} width={480}
        footer={<>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn
            variant={reviewForm.status === 'approved' ? 'success' : 'danger'}
            loading={submitting} onClick={handleReview}>
            Confirm {reviewForm.status?.replace(/_/g, ' ')}
          </Btn>
        </>}>
        {selected && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: C.textSub }}>Applying decision for: </span>
              <strong style={{ color: C.text }}>{selected.name}</strong>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['approved', 'rejected', 'resubmit_required'].map(s => (
                <button key={s} onClick={() => setReviewForm(f => ({ ...f, status: s }))} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${reviewForm.status === s ? (s === 'approved' ? C.green : C.red) : C.border}`,
                  background: reviewForm.status === s ? (s === 'approved' ? '#ECFDF5' : s === 'rejected' ? '#FEF2F2' : '#FFFBEB') : '#fff',
                  color: reviewForm.status === s ? (s === 'approved' ? C.green : s === 'rejected' ? C.red : C.amber) : C.textSub,
                }}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</button>
              ))}
            </div>

            {(reviewForm.status === 'rejected' || reviewForm.status === 'resubmit_required') && (
              <Textarea
                label="Reason *"
                value={reviewForm.reason}
                onChange={e => setReviewForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Explain what documents are missing or why KYC is rejected…"
                rows={4}
              />
            )}

            <div style={{ padding: '10px 12px', background: C.amberLight || '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#92400E', border: `1px solid #FDE68A` }}>
              <Icon name="info" size={13} color="#D97706" style={{ marginRight: 6, display: 'inline' }} />
              An email notification will be sent to the customer automatically.
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
