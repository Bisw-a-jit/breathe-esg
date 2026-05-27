import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/dashboard/stats/').then(r => setStats(r.data));
    axios.get('http://127.0.0.1:8000/api/batches/').then(r => setBatches(r.data));
  }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <div>
      <h2 style={{ color: '#1a1a2e' }}>📊 Dashboard</h2>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {[
          { label: 'Total Records', value: stats.total, color: '#1a1a2e' },
          { label: 'Pending Review', value: stats.pending, color: '#f39c12' },
          { label: 'Approved', value: stats.approved, color: '#27ae60' },
          { label: 'Flagged', value: stats.flagged, color: '#e74c3c' },
          { label: 'Total CO₂e (kg)', value: stats.total_co2.toFixed(1), color: '#2980b9' },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff', borderRadius: '10px', padding: '20px',
            minWidth: '150px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderTop: `4px solid ${card.color}`
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: card.color }}>{card.value}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Scope Breakdown */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3>CO₂e by Scope (kg)</h3>
        {[
          { label: 'Scope 1 — Direct Emissions', value: stats.scope1_co2, color: '#e74c3c' },
          { label: 'Scope 2 — Electricity', value: stats.scope2_co2, color: '#f39c12' },
          { label: 'Scope 3 — Value Chain', value: stats.scope3_co2, color: '#3498db' },
        ].map(s => (
          <div key={s.label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{s.label}</span>
              <span style={{ fontWeight: 'bold' }}>{s.value.toFixed(1)} kg</span>
            </div>
            <div style={{ background: '#eee', borderRadius: '5px', height: '10px', marginTop: '4px' }}>
              <div style={{
                width: `${stats.total_co2 > 0 ? (s.value / stats.total_co2) * 100 : 0}%`,
                background: s.color, height: '10px', borderRadius: '5px'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Batches */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3>Recent Uploads</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['Source', 'File', 'Rows', 'Status', 'Uploaded'].map(h => (
                <th key={h} style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{b.source_type.toUpperCase()}</td>
                <td style={{ padding: '10px' }}>{b.filename}</td>
                <td style={{ padding: '10px' }}>{b.row_count}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    background: b.status === 'processed' ? '#27ae60' : b.status === 'failed' ? '#e74c3c' : '#f39c12',
                    color: '#fff', padding: '3px 8px', borderRadius: '10px', fontSize: '12px'
                  }}>{b.status}</span>
                </td>
                <td style={{ padding: '10px', fontSize: '13px' }}>{new Date(b.uploaded_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {batches.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No uploads yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;