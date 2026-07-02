import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#333',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: 'white'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h2 style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          Blog Linker
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: location.pathname === '/dashboard' ? '#555' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/add-site')}
            style={{
              padding: '8px 16px',
              backgroundColor: location.pathname === '/add-site' ? '#555' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Site
          </button>
        </div>
      </div>
      <button
        onClick={handleLogout}
        style={{
          padding: '8px 16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </nav>
  );
}

export default Navbar;