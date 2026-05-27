import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import Review from './components/Review';
import './App.css';

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Navbar */}
      <div style={{ background: '#1a1a2e', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '30px' }}>
        <span style={{ color: '#00d4aa', fontWeight: 'bold', fontSize: '20px' }}>🌿 Breathe ESG</span>
        <button onClick={() => setPage('dashboard')} style={navBtn(page === 'dashboard')}>Dashboard</button>
        <button onClick={() => setPage('upload')} style={navBtn(page === 'upload')}>Upload Data</button>
        <button onClick={() => setPage('review')} style={navBtn(page === 'review')}>Review</button>
      </div>

      {/* Page Content */}
      <div style={{ padding: '30px' }}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'upload' && <Upload />}
        {page === 'review' && <Review />}
      </div>
    </div>
  );
}

function navBtn(active) {
  return {
    background: active ? '#00d4aa' : 'transparent',
    color: active ? '#000' : '#fff',
    border: '1px solid #00d4aa',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };
}

export default App;