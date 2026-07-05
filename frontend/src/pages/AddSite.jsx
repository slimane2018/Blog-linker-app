import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addSite } from '../api';

function AddSite() {
  const [url, setUrl] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await addSite(url, wpAppPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to add site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Add Your WordPress Site</h1>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#ffe6e6', 
          color: '#d8000c', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Website URL:
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            The full URL of your WordPress site
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            WordPress App Password:
          </label>
          <input
            type="password"
            value={wpAppPassword}
            onChange={(e) => setWpAppPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Generate from WordPress: Users → Profile → Application Passwords
          </small>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Adding Site...' : 'Add Site'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddSite;