import React, { useState } from 'react';
import axios from 'axios';

function Upload() {
  const [activeTab, setActiveTab] = useState('sap');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sources = [
    { key: 'sap', label: '🏭 SAP Fuel & Procurement', scope: 'Scope 1' },
    { key: 'utility', label: '⚡ Utility Electricity', scope: 'Scope 2' },
    { key: 'travel', label: '✈️ Corporate Travel', scope: 'Scope 3' },
  ];

  const handleUpload = async () => {
    if (!file) return alert('Please select a file first');
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/ingest/${activeTab}/`, formData);
      setResult({ success: true, message: res.data.message, rows: res.data.rows });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Upload failed' });
    }
    setLoading(false);
  };

  const sampleData = {
    sap: `document_number,posting_date,material_description,quantity,unit,category,plant_code
4500012345,2024-01-15,Diesel Fuel B7,500,liters,fuel,PLANT01
4500012346,2024-01-18,Petrol Unleaded,300,liters,fuel,PLANT02
4500012347,2024-01-20,Industrial Lubricant,150,liters,fuel,PLANT01
4500012348,2024-01-22,Office Supplies,1000,liters,procurement,PLANT03
4500012349,2024-01-25,Diesel Fuel B7,750,liters,fuel,PLANT01`,

    utility: `meter_id,site_name,billing_period_start,billing_period_end,consumption_kwh,tariff,amount_gbp
MTR001,London HQ,2024-01-01,2024-01-31,45000,Business Standard,5400
MTR002,Manchester Office,2024-01-01,2024-01-31,12000,SME Tariff,1440
MTR003,Birmingham Warehouse,2024-01-01,2024-01-31,78000,Industrial,8580
MTR004,Leeds Factory,2024-02-01,2024-02-29,92000,Industrial,10120
MTR005,Bristol Office,2024-02-01,2024-02-29,8500,Business Standard,1020`,

    travel: `trip_id,employee_id,travel_date,travel_type,origin,destination,distance_km,nights,class
TRP001,EMP101,2024-01-10,flight,LHR,JFK,5570,0,economy
TRP002,EMP102,2024-01-12,hotel,London,,0,3,
TRP003,EMP103,2024-01-15,ground,Manchester,Leeds,70,0,
TRP004,EMP104,2024-01-18,flight,LHR,DXB,5500,0,business
TRP005,EMP105,2024-01-20,hotel,New York,,0,2,`,
  };

  const downloadSample = () => {
    const blob = new Blob([sampleData[activeTab]], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${activeTab}.csv`;
    a.click();
  };

  return (
    <div>
      <h2 style={{ color: '#1a1a2e' }}>📤 Upload Data</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        {sources.map(s => (
          <button key={s.key} onClick={() => { setActiveTab(s.key); setFile(null); setResult(null); }}
            style={{
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
              background: activeTab === s.key ? '#1a1a2e' : '#fff',
              color: activeTab === s.key ? '#00d4aa' : '#333',
              border: '2px solid #1a1a2e'
            }}>
            {s.label}
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 'normal', color: activeTab === s.key ? '#aaa' : '#999' }}>{s.scope}</span>
          </button>
        ))}
      </div>

      {/* Upload Box */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '600px' }}>
        <p style={{ color: '#555', marginBottom: '20px' }}>
          Upload a CSV file for <strong>{sources.find(s => s.key === activeTab)?.label}</strong>.
          Don't have one? Download a sample below.
        </p>

        <button onClick={downloadSample} style={{
          background: '#f0f0f0', border: '1px solid #ccc', padding: '8px 16px',
          borderRadius: '5px', cursor: 'pointer', marginBottom: '20px', fontSize: '13px'
        }}>⬇️ Download Sample CSV</button>

        <div style={{ border: '2px dashed #ccc', borderRadius: '10px', padding: '30px', textAlign: 'center', marginBottom: '20px' }}>
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])}
            style={{ display: 'block', margin: '0 auto' }} />
          {file && <p style={{ color: '#27ae60', marginTop: '10px' }}>✅ {file.name} selected</p>}
        </div>

        <button onClick={handleUpload} disabled={loading} style={{
          background: loading ? '#ccc' : '#00d4aa', color: '#000', border: 'none',
          padding: '12px 30px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold', fontSize: '16px', width: '100%'
        }}>
          {loading ? '⏳ Uploading...' : '🚀 Upload & Ingest'}
        </button>

        {result && (
          <div style={{
            marginTop: '20px', padding: '15px', borderRadius: '8px',
            background: result.success ? '#d4edda' : '#f8d7da',
            color: result.success ? '#155724' : '#721c24'
          }}>
            {result.success ? `✅ ${result.message} — ${result.rows} rows ingested` : `❌ ${result.message}`}
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;