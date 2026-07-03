// Add this import statement with your other page imports
import Signup from './pages/Signup';

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddSite from './pages/AddSite';
import Navbar from './components/Navbar';

// 1. ADD THIS IMPORT (Ensure the file path matches your exact Signup component name)
import Signup from './pages/Signup'; 

const queryClient = new QueryClient();

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || "");

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken("");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {token && <Navbar onLogout={handleLogout} />}
        
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route 
              path="/login" 
              element={token ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
            />
            
            {/* 2. ADD THIS NEW ROUTE DECLARATION */}
            <Route 
              path="/signup" 
              element={token ? <Navigate to="/" replace /> : <Signup />} 
            />
            
            <Route 
              path="/" 
              element={token ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            
            <Route 
              path="/add-site" 
              element={token ? <AddSite /> : <Navigate to="/login" replace />} 
            />

            <Route 
              path="*" 
              element={<Navigate to={token ? "/" : "/login"} replace />} 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;