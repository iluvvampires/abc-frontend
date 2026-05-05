import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://abc-backend-4.onrender.com';

function ClinicSelection() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch clinics from the backend
    axios.get('https://abc-backend-4.onrender.com/api/clinics')
      .then(response => {
        setClinics(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching clinics:", err);
        setError("Could not load clinics. Please ensure the backend is running.");
        setLoading(false);
      });
  }, []);

  const handleSelect = (clinic) => {
    if (!clinic.isOpen) return;
    // Store selected clinic in local storage for the registration flow
    localStorage.setItem('selectedClinic', JSON.stringify(clinic));
    navigate('/terms');
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading clinics...</div>;
  
  return (
    <div className="container">
      <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
        &larr; Back to Home
      </button>
      <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>
        Select a Treatment Center
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem' }}>
        Please choose the clinic where you intend to receive treatment.
      </p>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2">
        {clinics.map(clinic => (
          <div 
            key={clinic.id} 
            className={`card glass-panel interactive ${!clinic.isOpen ? 'closed' : ''}`}
            style={{ 
              opacity: clinic.isOpen ? 1 : 0.6,
              cursor: clinic.isOpen ? 'pointer' : 'not-allowed',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => handleSelect(clinic)}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {clinic.name}
                {!clinic.isOpen && (
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--danger)', padding: '0.25rem 0.5rem', borderRadius: '999px', color: 'white' }}>
                    CLOSED
                  </span>
                )}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{clinic.address}</p>
            </div>
            
            {clinic.isOpen && (
              <div style={{ marginTop: '1.5rem', color: 'var(--primary)', fontWeight: '600', fontSize: '0.875rem' }}>
                Select this clinic &rarr;
              </div>
            )}
          </div>
        ))}
      </div>
      
      {clinics.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No clinics found. Please make sure the database is seeded.
        </div>
      )}
    </div>
  );
}

export default ClinicSelection;
