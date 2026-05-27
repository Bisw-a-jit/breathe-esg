import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Review() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [note, setNote] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchRecords = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/records/')
      .then(r => { setRecords(r.data); setLoading(false); });
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleReview = async (id, status) => {
    await axios.patch(`http://127.0.0.1:8000/api/records/${id}/review/`, {
      status, reviewer_note: note[id] || ''
    });
    fetchRecords();
  };

  const filtered = records.filter(r => filter === 'all' ? true : r.status === filter);

  const statusColor = {
    pending: '#f39c12', approved: '#27ae60',
    rejected: '#e74c3c', flagged: '#9b59b6'
  };

  const scopeColor = {
    scope1: '#e74c3c', scope2: '#f39c12', scope3: '#3498db'
  };

  return (
    <div>
      <h2 style={{ color: '#1a1a2e' }}>🔍 Analyst Review</h2>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'flagged', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: '20px', cursor: 'pointer',
            fontWeight: 'bold', border: 'none', fontSize: '13px',
            background: filter === f ? '#1a1a2e' : '#e0e0e0',
            color: filter === f ? '#fff' : '#333',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 6px' }}>
              {f === 'all' ? records.length : records.filter(r => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading && <p>Loading records...</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#999' }}>
          No records found. Upload some data first!
        </div>
      )}

      {/* Records */}
      {filtered.map(r => (
        <div key={r.id} style={{
          background: '#fff', borderRadius: '10px', padding: '20px',
          marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: `5px solid ${statusColor[r.status]}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            {/* Left Info */}
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: scopeColor[r.scope], color: '#fff', padding: '3px 8px', borderRadius: '10px', fontSize: '12px' }}>
                  {r.scope.toUpperCase()}
                </span>
                <span style={{ background: '#eee', padding: '3px 8px', borderRadius: '10px', fontSize: '12px' }}>
                  {r.category}
                </span>
                <span style={{ background: '#eee', padding: '3px 8px', borderRadius: '10px', fontSize: '12px' }}>
                  {r.source_type.toUpperCase()}
                </span>
                <span style={{ background: statusColor[r.status], color: '#fff', padding: '3px 8px', borderRadius: '10px', fontSize: '12px' }}>
                  {r.status}
                </span>
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{r.description || 'No description'}</div>
              <div style={{ color: '#555', fontSize: '14px' }}>
                📅 {r.activity_date} &nbsp;|&nbsp;
                📦 {r.quantity.toFixed(2)} {r.unit} &nbsp;|&nbsp;
                🌿 <strong>{r.co2_equivalent.toFixed(2)} kg CO₂e</strong>
              </div>
              {r.flag_reason && (
                <div style={{ color: '#9b59b6', fontSize: '13px', marginTop: '6px' }}>
                  ⚠️ {r.flag_reason}
                </div>
              )}
            </div>

            {/* Right Actions */}
            {(r.status === 'pending' || r.status === 'flagged') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                <input
                  placeholder="Add reviewer note (optional)"
                  value={note[r.id] || ''}
                  onChange={e => setNote({ ...note, [r.id]: e.target.value })}
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleReview(r.id, 'approved')} style={{
                    flex: 1, background: '#27ae60', color: '#fff', border: 'none',
                    padding: '8px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                  }}>✅ Approve</button>
                  <button onClick={() => handleReview(r.id, 'rejected')} style={{
                    flex: 1, background: '#e74c3c', color: '#fff', border: 'none',
                    padding: '8px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                  }}>❌ Reject</button>
                </div>
              </div>
            )}

            {(r.status === 'approved' || r.status === 'rejected') && (
              <div style={{ color: '#999', fontSize: '13px', alignSelf: 'center' }}>
                {r.reviewer_note && <div>💬 {r.reviewer_note}</div>}
                <div>Locked for audit</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Review;