import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TermsAndConditions() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (agreed) navigate('/register');
  };

  return (
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Terms and Conditions</h2>

          <div style={{
            height: '300px',
            overflowY: 'auto',
            padding: '1.5rem',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: '0.9rem',
            color: 'var(--text-main)'
          }}>
            <h4 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>1. Data Privacy and Consent</h4>
            <p style={{ marginBottom: '1rem' }}>
              By submitting this registration form, you consent to the collection, processing, and storage of your personal data by the Animal Bite Clinic Network in accordance with the Data Privacy Act of 2012.
              The information collected will be used solely for medical assessment, treatment, and legal documentation regarding animal bite exposure.
            </p>

            <h4 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>2. Accuracy of Information</h4>
            <p style={{ marginBottom: '1rem' }}>
              You certify that all information provided in this registration form is true, correct, and complete to the best of your knowledge.
              Providing false information may result in inappropriate medical treatment or refusal of service.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: '0.25rem', width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="agree" style={{ cursor: 'pointer', lineHeight: '1.5' }}>
              I have read and understood the Terms and Conditions, and I consent to the processing of my personal data for the purpose of animal bite treatment.
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-light-blue" onClick={() => navigate('/select-clinic')}>Back</button>
            <button className="btn btn-primary" disabled={!agreed} onClick={handleContinue}>Continue to Registration</button>
          </div>
        </div>
      </div>
    );
  }

  export default TermsAndConditions;