import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TermsAndConditions() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (agreed) navigate('/register');
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div className="glass-panel" style={{
        padding: '2.5rem',
        borderRadius: '16px',
        backgroundColor: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          marginBottom: '2rem',
          color: '#1e3a8a',
          fontSize: '1.8rem',
          fontWeight: 'bold',
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '0.75rem',
          display: 'inline-block'
        }}>
          Terms and Conditions
        </h2>

        {/* Section 1 */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            color: '#2563eb',
            marginBottom: '0.75rem',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            1. Data Privacy and Consent
          </h3>
          <p style={{
            color: '#4b5563',
            lineHeight: '1.6',
            fontSize: '0.95rem',
            marginBottom: 0
          }}>
            By submitting this registration form, you consent to the collection, processing, and storage of your personal data by the Animal Bite Clinic Network in accordance with the Data Privacy Act of 2012. The information collected will be used solely for medical assessment, treatment, and legal documentation regarding animal bite exposure.
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            color: '#2563eb',
            marginBottom: '0.75rem',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            2. Accuracy of Information
          </h3>
          <p style={{
            color: '#4b5563',
            lineHeight: '1.6',
            fontSize: '0.95rem',
            marginBottom: 0
          }}>
            You certify that all information provided in this registration form is true, correct, and complete to the best of your knowledge. Providing false information may result in inappropriate medical treatment or refusal of service.
          </p>
        </div>

        {/* Checkbox */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '2rem',
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px'
        }}>
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              marginTop: '0.2rem',
              width: '1.1rem',
              height: '1.1rem',
              cursor: 'pointer',
              accentColor: '#2563eb'
            }}
          />
          <label htmlFor="agree" style={{
            cursor: 'pointer',
            lineHeight: '1.5',
            color: '#374151',
            fontSize: '0.9rem'
          }}>
            I have read and understood the Terms and Conditions, and I consent to the processing of my personal data for the purpose of animal bite treatment.
          </label>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/select-clinic')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e5e7eb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#374151',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
          >
            Back
          </button>
          <button
            className="btn btn-primary"
            disabled={!agreed}
            onClick={handleContinue}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: agreed ? '#2563eb' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              cursor: agreed ? 'pointer' : 'not-allowed',
              color: 'white',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'background-color 0.2s'
            }}
          >
            Continue to Registration
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;