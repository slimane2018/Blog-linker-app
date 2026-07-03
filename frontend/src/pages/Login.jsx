import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, signup } from '../api';

function Login() {
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

      // Save the token and redirect to dashboard
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.detail || 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1 style={{ textAlign: 'center' }}>Blog Linker</h1>
      <h2 style={{ textAlign: 'center' }}>{isSignup ? 'Sign Up' : 'Login'}</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
        </button>

        {/* ... your password inputs and Login button should be right here ... */}
         {/* This is the only button you need. Delete the plain <button> if it's duplicated below */}
        <button type="submit" className="login-btn">
          Log In
        </button>

        {/* This cleanly handles the navigation path without leaving open HTML tags */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#0070f3', textDecoration: 'none' }}>Sign Up</Link>
        </p>

      </form>
    </div>
  );
}

export default Login;