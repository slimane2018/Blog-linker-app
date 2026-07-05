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
            The full URL of your WordPress site (e.g., https://myblog.com)
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
            Generate this from your WordPress dashboard: Users → Profile → Application Passwords
          </small>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#007bff',
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

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e7f3ff',
        borderRadius: '8px'
      }}>
        <h3>How to get your WordPress App Password:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Log in to your WordPress dashboard (wp-admin)</li>
          <li>Go to <strong>Users → Profile</strong></li>
          <li>Scroll down to <strong>Application Passwords</strong></li>
          <li>Type a name (e.g., "Blog Linker") and click <strong>Add New</strong></li>
          <li>Copy the password that appears (it looks like: xxxx xxxx xxxx xxxx)</li>
          <li>Paste it in the field above</li>
        </ol>
      </div>
    </div>
  );
}

export default AddSite;