import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, signup } from '../api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let response;
      if (isSignup) {
        response = await signup(email, password);
      } else {
        response = await login(email, password);
      }
      
      // Save the token and trigger login state update
      localStorage.setItem('token', response.data.access_token);
      if (onLogin) onLogin(response.data.access_token);
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.detail || 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '100px auto', 
      padding: '30px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>Blog Linker</h1>
      <h3 style={{ textAlign: 'center', color: '#666', margin: '0 0 20px 0', fontWeight: 'normal' }}>
        {isSignup ? 'Create an Account' : 'Log In'}
      </h3>
      
      {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              boxSizing: 'border-box' 
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              boxSizing: 'border-box' 
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <Link 
            to={isSignup ? "/login" : "/signup"} 
            onClick={() => setIsSignup(!isSignup)}
            style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;