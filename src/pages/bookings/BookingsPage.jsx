import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { Card, Table, Badge, Btn, Modal, Textarea, Icon, C, fmtDate, fmtDateTime, useToast } from '../../components/UI';
import { getBookings, updateBooking, exportData } from '../../services/api';

const STATUS_TABS = ['pending', 'under_review', 'approved', 'confirmed', 'rejected', 'cancelled'];

export default function BookingsPage() {
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { show, ToastEl } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBookings({ status, page, limit: 20 });
      setData(res.data.bookings);
      setPagination(res.data.pagination);
    } catch (err) { show(err.message, 'error'); }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (booking) => { setSelected(booking); setAdminNotes(booking.adminNotes || ''); setModal(true); };

  const handleStatus = async (newStatus) => {
    setSubmitting(true);
    try {
      await updateBooking(selected._id, { status: newStatus, adminNotes });
      show(`Booking ${newStatus}`, 'success');
      setModal(false);
      load();
    } catch (err) { show(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportData('bookings', { status });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `bookings_${status}_${Date.now()}.xlsx`; a.click();
    } catch (err) { show(err.message, 'error'); }
    finally { setExporting(false); }
  };

  const columns = [
    { key: 'bookingRef', title: 'Ref', render: v => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: C.orange }}>{v}</span> },
    {
      key: 'user', title: 'Customer',
      render: v => <div><div style={{ fontWeight: 600, fontSize: 13 }}>{v?.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{v?.email}</div><div style={{ fontSize: 11, color: C.textMuted }}>{v?.company?.name}</div></div>,
    },
    { key: 'mode', title: 'Mode', render: v => <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: C.navyLight, color: C.navy }}>{v}</span> },
    { key: 'originPort', title: 'Route', render: (v, r) => <span style={{ fontWeight: 600 }}>{v} → {r.destinationPort}</span> },
    { key: 'carrier', title: 'Carrier' },
    { key: 'totalAmount', title: 'Amount', render: (v, r) => v ? `${r.currency || 'USD'} ${Number(v).toLocaleString()}` : '—' },
    { key: 'status', title: 'Status', render: v => <Badge status={v} /> },
    { key: 'createdAt', title: 'Submitted', render: v => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    {
      key: '_id', title: '', align: 'right',
      render: (v, row) => <Btn variant="ghost" size="sm" icon={<Icon name="eye" size={12} />} onClick={() => openDetail(row)}>Review</Btn>,
    },
  ];

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader title="Bookings" subtitle="Review and manage booking requests"
        actions={<>
          <Btn variant="ghost" size="sm" icon={<Icon name="download" size={13} />} loading={exporting} onClick={handleExport}>Export</Btn>
        </>}
      />

      <div style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 6, border: `1px solid ${C.border}`, width: 'fit-content', flexWrap: 'wrap' }}>
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: status === s ? C.navy : 'transparent', color: status === s ? '#fff' : C.textSub,
            }}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</button>
          ))}
        </div>

        <Card>
          <Table columns={columns} data={data} loading={loading} emptyMsg={`No ${status} bookings`} />
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSub }}>
              <span>{pagination.total} total · Page {page} of {pagination.pages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
                <Btn variant="ghost" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={`Booking — ${selected?.bookingRef}`} width={680}
        footer={<>
          <Btn variant="ghost" onClick={() => setModal(false)}>Close</Btn>
          {selected?.status === 'pending' && <>
            <Btn variant="ghost" loading={submitting} onClick={() => handleStatus('under_review')}>Mark Under Review</Btn>
            <Btn variant="danger" loading={submitting} onClick={() => handleStatus('rejected')}>Reject</Btn>
            <Btn variant="success" loading={submitting} onClick={() => handleStatus('approved')}>Approve</Btn>
          </>}
          {selected?.status === 'approved' && (
            <Btn variant="orange" loading={submitting} onClick={() => handleStatus('confirmed')}>Confirm Booking</Btn>
          )}
          {selected?.status === 'under_review' && <>
            <Btn variant="danger" loading={submitting} onClick={() => handleStatus('rejected')}>Reject</Btn>
            <Btn variant="success" loading={submitting} onClick={() => handleStatus('approved')}>Approve</Btn>
          </>}
        </>}>
        {selected && (
          <div>
            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, background: C.grayLight, borderRadius: 8, padding: 16 }}>
              {[
                ['Booking Ref', selected.bookingRef],
                ['Status', <Badge status={selected.status} />],
                ['Customer', selected.user?.name],
                ['Email', selected.user?.email],
                ['Company', selected.user?.company?.name || '—'],
                ['Phone', selected.user?.phone || '—'],
                ['Mode', selected.mode],
                ['Container', selected.containerType || '—'],
                ['Route', `${selected.originPort} → ${selected.destinationPort}`],
                ['Carrier', selected.carrier || '—'],
                ['Sailing Date', fmtDate(selected.sailingDate)],
                ['Total Amount', selected.totalAmount ? `${selected.currency} ${Number(selected.totalAmount).toLocaleString()}` : '—'],
                ['Cargo Type', selected.cargoType || '—'],
                ['Commodity', selected.commodity || '—'],
                ['HS Code', selected.hsCode || '—'],
                ['Incoterms', selected.incoterms || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: C.text }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Addresses */}
            {selected.pickupAddress?.company && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[['Pickup Address', selected.pickupAddress], ['Delivery Address', selected.deliveryAddress]].map(([label, addr]) => addr && (
                  <div key={label} style={{ padding: 12, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                      {addr.company}<br />{addr.street}<br />{addr.city}, {addr.country} {addr.postalCode}<br />
                      {addr.contact && <>{addr.contact} · {addr.email}</>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selected.customerNotes && (
              <div style={{ marginBottom: 16, padding: 12, background: C.navyLight, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 4 }}>CUSTOMER NOTES</div>
                <div style={{ fontSize: 13, color: C.navy }}>{selected.customerNotes}</div>
              </div>
            )}

            <Textarea label="Admin Notes (sent to customer)" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add internal notes or message for the customer…" rows={3} />

            <div style={{ padding: '10px 12px', background: '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#92400E', border: '1px solid #FDE68A' }}>
              <Icon name="info" size={13} color="#D97706" style={{ marginRight: 6 }} />
              Status change will send an automated email notification to the customer.
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
