import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddSite from './pages/AddSite';
import Navbar from './components/Navbar';

// Create a client for React Query (handles API calls)
const queryClient = new QueryClient();

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Function to save token when user logs in
  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  // Function to log out
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Only show navbar if user is logged in */}
        {token && <Navbar onLogout={handleLogout} />}
        
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            {/* If not logged in, show login page */}
            <Route 
              path="/login" 
              element={token ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
            />
            
            {/* If logged in, show dashboard */}
            <Route 
              path="/" 
              element={token ? <Dashboard /> : <Navigate to="/login" />} 
            />
            
            {/* Add site page */}
            <Route 
              path="/add-site" 
              element={token ? <AddSite /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;