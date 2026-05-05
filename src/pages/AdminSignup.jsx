import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://abc-backend-4.onrender.com';

function AdminSignup() {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (formData.username.length < 4 || formData.username.length > 20) {
        setError('Username must be between 4 and 20 characters');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        return;
      }
      const weakPasswords = ['123456', '12345678', 'password', 'Password'];
      if (weakPasswords.includes(formData.password.toLowerCase())) {
        setError('Please choose a stronger password');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const payload = {
        username: formData.username,
        password: formData.password,
        role: 'ADMIN',
        clinic: null
      };
      await axios.post('https://abc-backend-4.onrender.com/api/auth/signup', payload);
      setMessage('Secret Admin Registration successful! You can now log in at the main portal.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data || 'Failed to sign up');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '500px', border: '2px solid var(--danger)' }}>
        <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          Secret Admin Setup
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--danger)', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
          RESTRICTED ACCESS
        </p>

        {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}
        {message && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Username</label>
            <input type="text" className="form-control" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Admin Password</label>
            <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" className="form-control" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.125rem', backgroundColor: 'var(--danger)', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}>
            Register Super Admin
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminSignup;
