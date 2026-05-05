import React from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://abc-backend-4.onrender.com';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', marginTop: '4rem' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#60a5fa', margin: '0 auto 1.5rem', display: 'block' }}>
          <path d="M12 2a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3zm-5.5 3a2.5 2.5 0 0 0-2.5 2.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm11 0a2.5 2.5 0 0 0-2.5 2.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zM12 10c-3.5 0-6.5 2-6.5 5.5 0 2 1.5 3.5 3.5 3.5 1 0 2-.5 3-1 1 .5 2 1 3 1 2 0 3.5-1.5 3.5-3.5C18.5 12 15.5 10 12 10z"/>
        </svg>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
          Animal Bite Center Registration
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '800px', margin: '0 auto 3rem' }}>
          Streamlining patient care across our network of certified animal bite treatment centers. 
          Register quickly, safely, and securely.
        </p>
        
        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '1rem', fontSize: '1.125rem', width: '100%' }}
            onClick={() => navigate('/select-clinic')}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
