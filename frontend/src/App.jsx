import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddSite from './pages/AddSite';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

function App() {
  // Fallback to empty string protects your components from crash-on-null errors
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
      {/* 
        Placing BrowserRouter here guarantees that the internal Router context 
        is accessible to all nested Route elements, resolving the history.ts crash.
      */}
      <BrowserRouter>
        {token && <Navbar onLogout={handleLogout} />}
        
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route 
              path="/login" 
              element={token ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
            />
            
            <Route 
              path="/" 
              element={token ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            
            <Route 
              path="/add-site" 
              element={token ? <AddSite /> : <Navigate to="/login" replace />} 
            />

            {/* Catch-all fallback wildcard prevents unhandled blank routes */}
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