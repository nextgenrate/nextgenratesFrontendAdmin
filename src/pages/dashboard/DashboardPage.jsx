import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { StatCard, Card, Btn, Icon, C, fmtDate, fmtDateTime, Badge } from '../../components/UI';
import { getDashboard, exportData } from '../../services/api';

const DATE_RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
];

const PIE_COLORS = ['#0F2554', '#F97316', '#059669', '#2563EB', '#7C3AED'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? `$${p.value.toLocaleString()}` : p.value}</strong></div>)}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(Date.now() - rangeDays * 86400000).toISOString();
      const to = new Date().toISOString();
      const res = await getDashboard({ from, to });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async (resource) => {
    setExporting(true);
    try {
      const from = new Date(Date.now() - rangeDays * 86400000).toISOString();
      const blob = await exportData(resource, { from });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${resource}_${Date.now()}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setExporting(false); }
  };

  const stats = data?.overview || {};
  const revenueData = (data?.charts?.revenueByDay || []).map(r => ({ date: r._id, revenue: r.revenue, bookings: r.count }));
  const modeData = (data?.charts?.bookingsByMode || []).map(m => ({ name: m._id || 'Unknown', value: m.count }));
  const topRoutes = data?.charts?.topRoutes || [];
  const recentBookings = data?.recent?.bookings || [];
  const recentSearches = data?.recent?.searches || [];

  // Placeholder data for demo
  const placeholderRevenue = revenueData.length ? revenueData : Array.from({ length: 15 }, (_, i) => ({
    date: new Date(Date.now() - (14 - i) * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    revenue: Math.floor(3000 + Math.random() * 12000),
    bookings: Math.floor(1 + Math.random() * 8),
  }));

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview · Last ${rangeDays} days`}
        actions={<>
          <div style={{ display: 'flex', gap: 4 }}>
            {DATE_RANGES.map(r => (
              <button key={r.days} onClick={() => setRangeDays(r.days)} style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: rangeDays === r.days ? C.navy : '#fff',
                color: rangeDays === r.days ? '#fff' : C.textSub,
                border: `1px solid ${rangeDays === r.days ? C.navy : C.border}`,
              }}>{r.label}</button>
            ))}
          </div>
          <Btn variant="ghost" size="sm" icon={<Icon name="refresh" size={13} />} onClick={load}>Refresh</Btn>
          <Btn variant="ghost" size="sm" icon={<Icon name="download" size={13} />} loading={exporting} onClick={() => handleExport('bookings')}>Export</Btn>
        </>}
      />

      <div style={{ padding: '24px 28px', flex: 1 }}>
        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Users" value={loading ? '…' : stats.totalUsers} sub={`+${stats.newUsers || 0} this period`} icon="users" color={C.navy} />
          <StatCard label="KYC Pending" value={loading ? '…' : stats.kycPending} sub={`${stats.kycApproved || 0} approved`} icon="kyc" color={C.amber} />
          <StatCard label="Bookings" value={loading ? '…' : stats.totalBookings} sub={`${stats.pendingBookings || 0} pending`} icon="bookings" color={C.orange} />
          <StatCard label="Enquiries" value={loading ? '…' : stats.totalEnquiries} sub={`${stats.pendingEnquiries || 0} pending`} icon="enquiries" color={C.purple} />
          <StatCard label="Rate Searches" value={loading ? '…' : stats.totalSearches} sub="this period" icon="search" color={C.teal} />
          <StatCard label="Approved Bookings" value={loading ? '…' : stats.approvedBookings} sub="this period" icon="check" color={C.green} />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }}>
          {/* Revenue chart */}
          <Card title="Revenue & Bookings" action={
            <button onClick={() => handleExport('bookings')} style={{ fontSize: 11, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="download" size={11} color={C.blue} /> CSV
            </button>
          }>
            <div style={{ padding: '0 0 16px', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={placeholderRevenue} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textMuted }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.textMuted }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" name="Revenue (USD)" stroke={C.navy} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="bookings" name="Bookings" stroke={C.orange} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Mode pie */}
          <Card title="Bookings by Mode">
            <div style={{ padding: '0 0 16px', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {modeData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={modeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" nameKey="name">
                      {modeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} iconType="circle" formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 12 }}>
                    <PieChart width={180} height={150}>
                      <Pie data={[{ value: 60 }, { value: 25 }, { value: 15 }]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {[C.navy, C.orange, C.green].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                    </PieChart>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    {['SEA-FCL', 'SEA-LCL', 'AIR'].map((m, i) => (
                      <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: [C.navy, C.orange, C.green][i] }} />
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Top routes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Card title="Top Routes Searched">
            <div style={{ padding: '8px 0' }}>
              {(topRoutes.length ? topRoutes : [
                { _id: { origin: 'INENR', dest: 'TZDAR' }, count: 42 },
                { _id: { origin: 'INMAA', dest: 'AEDXB' }, count: 38 },
                { _id: { origin: 'INNSA', dest: 'NLRTM' }, count: 25 },
                { _id: { origin: 'INMUN', dest: 'SGSIN' }, count: 19 },
                { _id: { origin: 'INMAA', dest: 'USLAX' }, count: 11 },
              ]).map((r, i) => (
                <div key={i} style={{ padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r._id.origin} → {r._id.dest}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 80, height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: C.navy, borderRadius: 3, width: `${Math.min(100, (r.count / 50) * 100)}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, minWidth: 24 }}>{r.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent bookings */}
          <Card title="Pending Bookings" action={<a href="/bookings" style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>View all →</a>}>
            <div style={{ padding: '4px 0' }}>
              {(recentBookings.length ? recentBookings : [
                { bookingRef: 'FF-M4X2-AB12', user: { name: 'Rajesh Exports Pvt Ltd' }, originPort: 'INMAA', destinationPort: 'AEDXB', status: 'pending', createdAt: new Date() },
                { bookingRef: 'FF-L5Y3-CD34', user: { name: 'Global Trade Co.' }, originPort: 'INNSA', destinationPort: 'NLRTM', status: 'pending', createdAt: new Date(Date.now() - 3600000) },
                { bookingRef: 'FF-Q2R1-EF56', user: { name: 'Chennai Logistics' }, originPort: 'INENR', destinationPort: 'TZDAR', status: 'under_review', createdAt: new Date(Date.now() - 7200000) },
              ]).map((b, i) => (
                <div key={i} style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{b.bookingRef}</div>
                    <div style={{ fontSize: 11, color: C.textSub }}>{b.user?.name} · {b.originPort} → {b.destinationPort}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{fmtDateTime(b.createdAt)}</div>
                  </div>
                  <Badge status={b.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent searches */}
        <Card title="Recent User Searches" action={
          <button onClick={() => handleExport('searches')} style={{ fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="download" size={12} color={C.blue} /> Export
          </button>
        }>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.grayLight }}>
                  {['User', 'Mode', 'Origin → Destination', 'Container', 'Results', 'Time'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentSearches.length ? recentSearches : [
                  { user: { name: 'Priya Shipping' }, mode: 'SEA-FCL', originPort: 'INMAA', destinationPort: 'AEDXB', containerType: '40GP', resultsCount: 9, createdAt: new Date() },
                  { user: { name: 'Raj Exports' }, mode: 'SEA-FCL', originPort: 'INENR', destinationPort: 'TZDAR', containerType: '20GP', resultsCount: 5, createdAt: new Date(Date.now() - 1800000) },
                  { user: { name: 'Global Trade' }, mode: 'AIR', originPort: 'MAA', destinationPort: 'DXB', containerType: null, resultsCount: 3, createdAt: new Date(Date.now() - 3600000) },
                ]).map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: C.text }}>{s.user?.name || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: C.navyLight, color: C.navy }}>{s.mode}</span></td>
                    <td style={{ padding: '10px 14px', color: C.text }}>{s.originPort} → {s.destinationPort}</td>
                    <td style={{ padding: '10px 14px', color: C.textSub }}>{s.containerType || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: s.resultsCount > 0 ? C.green : C.red }}>{s.resultsCount}</td>
                    <td style={{ padding: '10px 14px', color: C.textMuted, fontSize: 12 }}>{fmtDateTime(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
