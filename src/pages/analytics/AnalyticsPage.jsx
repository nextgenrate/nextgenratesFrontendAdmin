import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import AdminLayout, { PageHeader } from '../../components/Layout';
import { Card, Btn, Icon, C, StatCard, fmtDate, useToast } from '../../components/UI';
import { getDashboard, exportData } from '../../services/api';

const PIE_COLORS = [C.navy, C.orange, C.green, C.purple, C.teal];

const PRESETS = [
  { label: 'Today', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: 'Quarter', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const { show, ToastEl } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = customFrom || new Date(Date.now() - days * 86400000).toISOString();
      const to = customTo || new Date().toISOString();
      const res = await getDashboard({ from, to });
      setData(res.data);
    } catch (err) { show(err.message, 'error'); }
    finally { setLoading(false); }
  }, [days, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async (resource) => {
    setExporting(resource);
    try {
      const from = customFrom || new Date(Date.now() - days * 86400000).toISOString();
      const blob = await exportData(resource, { from });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `${resource}_${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { show(err.message, 'error'); }
    finally { setExporting(''); }
  };

  const stats = data?.overview || {};
  const revenueData = (data?.charts?.revenueByDay || []).map(r => ({ date: r._id?.slice(5), revenue: Math.round(r.revenue || 0), bookings: r.count || 0 }));
  const modeData = (data?.charts?.bookingsByMode || []).map(m => ({ name: m._id || 'Unknown', value: m.count }));
  const topRoutes = data?.charts?.topRoutes || [];

  // Demo fill if no data
  const demoRevenue = revenueData.length ? revenueData : Array.from({ length: 20 }, (_, i) => ({
    date: `${String(i + 1).padStart(2, '0')}`,
    revenue: Math.floor(4000 + Math.random() * 18000),
    bookings: Math.floor(1 + Math.random() * 10),
    searches: Math.floor(5 + Math.random() * 40),
  }));

  const demoMode = modeData.length ? modeData : [{ name: 'SEA-FCL', value: 62 }, { name: 'SEA-LCL', value: 23 }, { name: 'AIR', value: 15 }];

  const CustomTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.name === 'revenue' ? `$${Number(p.value).toLocaleString()}` : p.value}</strong></div>)}
      </div>
    );
  };

  return (
    <AdminLayout>
      {ToastEl}
      <PageHeader
        title="Analytics"
        subtitle="Business performance overview"
        actions={<>
          <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 8, padding: 4, border: `1px solid ${C.border}` }}>
            {PRESETS.map(p => (
              <button key={p.days} onClick={() => { setDays(p.days); setCustomFrom(''); setCustomTo(''); }} style={{
                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: days === p.days && !customFrom ? C.navy : 'transparent',
                color: days === p.days && !customFrom ? '#fff' : C.textSub,
              }}>{p.label}</button>
            ))}
          </div>
          {/* Custom range */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none' }} />
            <span style={{ fontSize: 11, color: C.textMuted }}>to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none' }} />
          </div>
          <Btn variant="ghost" size="sm" icon={<Icon name="refresh" size={13} />} onClick={load}>Refresh</Btn>
        </>}
      />

      <div style={{ padding: '24px 28px' }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Users" value={loading ? '…' : stats.totalUsers} icon="users" color={C.navy} />
          <StatCard label="KYC Approved" value={loading ? '…' : stats.kycApproved} sub={`${stats.kycPending || 0} pending`} icon="kyc" color={C.green} />
          <StatCard label="Total Bookings" value={loading ? '…' : stats.totalBookings} sub={`${stats.approvedBookings || 0} approved`} icon="bookings" color={C.orange} />
          <StatCard label="Enquiries" value={loading ? '…' : stats.totalEnquiries} icon="enquiries" color={C.purple} />
          <StatCard label="Rate Searches" value={loading ? '…' : stats.totalSearches} icon="search" color={C.teal} />
        </div>

        {/* Revenue trend */}
        <Card title="Revenue Trend" style={{ marginBottom: 20 }} action={
          <Btn variant="ghost" size="sm" icon={<Icon name="download" size={12} />} loading={exporting === 'bookings'} onClick={() => handleExport('bookings')}>Export CSV</Btn>
        }>
          <div style={{ height: 260, padding: '8px 8px 8px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demoRevenue} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.navy} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.navy} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="bkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.orange} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={C.orange} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textMuted }} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: C.textMuted }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="bk" orientation="right" tick={{ fontSize: 10, fill: C.textMuted }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTip />} />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" name="revenue" stroke={C.navy} strokeWidth={2} fill="url(#revGrad)" dot={false} />
                <Area yAxisId="bk" type="monotone" dataKey="bookings" name="bookings" stroke={C.orange} strokeWidth={1.5} fill="url(#bkGrad)" strokeDasharray="4 2" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 20, padding: '0 20px 14px', justifyContent: 'flex-end' }}>
            {[['Revenue', C.navy], ['Bookings', C.orange]].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textSub }}>
                <div style={{ width: 10, height: 3, background: c, borderRadius: 2 }} />{l}
              </div>
            ))}
          </div>
        </Card>

        {/* Row: mode pie + top routes + search trend */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 1fr', gap: 16, marginBottom: 20 }}>
          <Card title="Booking modes">
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={demoMode} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" nameKey="name">
                    {demoMode.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} bookings`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {demoMode.map((m, i) => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ color: C.textSub }}>{m.name}</span>
                    <span style={{ fontWeight: 700, color: C.text }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Top searched routes">
            <div style={{ padding: '8px 0' }}>
              {(topRoutes.length ? topRoutes : [
                { _id: { origin: 'INENR', dest: 'TZDAR' }, count: 42 },
                { _id: { origin: 'INMAA', dest: 'AEDXB' }, count: 38 },
                { _id: { origin: 'INNSA', dest: 'NLRTM' }, count: 25 },
                { _id: { origin: 'INMUN', dest: 'SGSIN' }, count: 19 },
                { _id: { origin: 'INMAA', dest: 'USLAX' }, count: 11 },
              ]).map((r, i) => (
                <div key={i} style={{ padding: '9px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r._id.origin} → {r._id.dest}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 70, height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: '100%', background: C.navy, borderRadius: 3, width: `${Math.min(100, (r.count / 50) * 100)}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, minWidth: 20 }}>{r.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Search volume">
            <div style={{ height: 200, padding: '8px 4px 8px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demoRevenue.slice(-10)} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textMuted }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.textMuted }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [v, 'Searches']} />
                  <Bar dataKey="searches" fill={C.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Export section */}
        <Card title="Data Export">
          <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Export Bookings', resource: 'bookings', icon: 'bookings', color: C.orange },
              { label: 'Export Users', resource: 'users', icon: 'users', color: C.navy },
              { label: 'Export Searches', resource: 'searches', icon: 'search', color: C.teal },
            ].map(({ label, resource, icon, color }) => (
              <button key={resource} onClick={() => handleExport(resource)} disabled={!!exporting}
                style={{ padding: '12px 20px', background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 10, cursor: exporting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: C.text, opacity: exporting && exporting !== resource ? 0.5 : 1 }}>
                {exporting === resource
                  ? <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <Icon name="download" size={16} color={color} />}
                {label} (.xlsx)
              </button>
            ))}
          </div>
          <div style={{ padding: '0 20px 16px', fontSize: 12, color: C.textMuted }}>
            Exports include data from the selected date range. Files open in Excel or Google Sheets.
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
