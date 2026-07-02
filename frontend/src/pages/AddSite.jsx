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
    setLoading(true);
    setError('');

    try {
      await addSite(url, wpAppPassword);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to add site. Please check the URL and app password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
      <h1>Add Your WordPress Site</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label><strong>Website URL:</strong></label><br />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourblog.com"
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#666' }}>The full URL of your WordPress site (e.g., https://myblog.com)</small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>WordPress App Password:</strong></label><br />
          <input
            type="password"
            value={wpAppPassword}
            onChange={(e) => setWpAppPassword(e.target.value)}
            placeholder="xxxx xxxx xxxx xxxx"
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#666' }}>
            Generate this from your WordPress dashboard: Users → Profile → Application Passwords
          </small>
        </div>

        {error && (
          <div style={{ padding: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', color: '#721c24', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            {loading ? 'Adding site...' : 'Add Site'}
          </button>
          <button 
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 20px',
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

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
        <h3>How to get your WordPress App Password:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Log in to your WordPress dashboard (wp-admin)</li>
          <li>Go to <strong>Users</strong> → <strong>Profile</strong></li>
          <li>Scroll down to <strong>Application Passwords</strong></li>
          <li>Type a name (e.g., "Blog Linker") and click <strong>Add New</strong></li>
          <li>Copy the password that appears (it looks like: <code>xxxx xxxx xxxx xxxx</code>)</li>
          <li>Paste it in the field above</li>
        </ol>
      </div>
    </div>
  );
}

export default AddSite;