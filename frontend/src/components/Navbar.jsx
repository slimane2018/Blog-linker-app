import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 30px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #ddd',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          🌐 Blog Linker
        </Link>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link 
          to="/" 
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold', fontSize: '14px' }}
        >
          Dashboard
        </Link>
        <Link 
          to="/add-site" 
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold', fontSize: '14px' }}
        >
          + Add Site
        </Link>
        <button
          onClick={handleLogoutClick}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;