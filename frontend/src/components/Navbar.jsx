import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  listSites, deleteSite, analyzeSite, getOpportunities, applyOpportunity, skipOpportunity 
} from '../api';

function Dashboard() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await listSites();
      setSites(response.data);
    } catch (err) {
      console.error('Failed to load sites', err);
    }
  };

  const handleDeleteSite = async (siteId) => {
    if (!window.confirm('Are you sure you want to delete this site?')) return;
    try {
      await deleteSite(siteId);
      setSites(sites.filter(s => s.id !== siteId));
      if (selectedSite === siteId) {
        setSelectedSite(null);
        setOpportunities([]);
      }
    } catch (err) {
      setMessage('Failed to delete site');
    }
  };

  const handleAnalyze = async (siteId) => {
    setAnalyzing(true);
    setMessage('Analyzing site... This may take a few minutes.');
    try {
      await analyzeSite(siteId);
      setMessage('Analysis complete!');
      if (selectedSite === siteId) {
        loadOpportunities(siteId);
      }
    } catch (err) {
      setMessage('Analysis failed: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectSite = async (siteId) => {
    setSelectedSite(siteId);
    await loadOpportunities(siteId);
  };

  const loadOpportunities = async (siteId) => {
    setLoading(true);
    try {
      const response = await getOpportunities(siteId);
      setOpportunities(response);
    } catch (err) {
      console.error('Failed to load opportunities', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (opportunityId) => {
    try {
      await applyOpportunity(opportunityId);
      setOpportunities(opportunities.map(opp => 
        opp.id === opportunityId ? { ...opp, status: 'created' } : opp
      ));
      setMessage('Link created successfully!');
    } catch (err) {
      setMessage('Failed to create link: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleSkip = async (opportunityId) => {
    try {
      await skipOpportunity(opportunityId);
      setOpportunities(opportunities.map(opp => 
        opp.id === opportunityId ? { ...opp, status: 'skipped' } : opp
      ));
    } catch (err) {
      setMessage('Failed to skip opportunity');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', paddingBottom: '50px' }}>
      <h1 style={{ margin: '0 0 25px 0', fontSize: '28px' }}>Dashboard</h1>
      
      {message && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px', 
          backgroundColor: '#e7f3ff', 
          border: '1px solid #b3d4fc', 
          borderRadius: '6px', 
          marginBottom: '25px',
          fontSize: '15px'
        }}>
          <span>{message}</span>
          <button 
            onClick={() => setMessage('')} 
            style={{ 
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#007bff',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Your Sites</h2>
          <button 
            onClick={() => navigate('/add-site')}
            style={{ 
              padding: '10px 18px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            + Add Site
          </button>
        </div>

        {sites.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No sites added yet. Click "Add Site" to get started.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {sites.map(site => (
              <div 
                key={site.id} 
                style={{ 
                  padding: '20px', 
                  border: selectedSite === site.id ? '2px solid #007bff' : '1px solid #ddd', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedSite === site.id ? '#f0f7ff' : 'white',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleSelectSite(site.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ fontSize: '16px', display: 'block', wordBreak: 'break-all' }}>{site.url}</strong>
                    <small style={{ color: '#777', display: 'block', marginTop: '5px' }}>
                      Last crawled: {site.last_crawled ? new Date(site.last_crawled).toLocaleString() : 'Never'}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(site.id); }}
                      disabled={analyzing}
                      style={{ 
                        flex: 1,
                        padding: '6px 12px', 
                        backgroundColor: '#ffc107', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSite(site.id); }}
                      style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSite && (
        <div>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>Linking Opportunities</h2>
          {loading ? (
            <p style={{ color: '#666' }}>Loading opportunities...</p>
          ) : opportunities.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No opportunities found. Click "Analyze" to scan your site.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {opportunities.map(opp => (
                <div 
                  key={opp.id} 
                  style={{ 
                    padding: '20px', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    backgroundColor: opp.status === 'created' ? '#e2f0d9' : opp.status === 'skipped' ? '#fbe5e1' : 'white'
                  }}
                >
                  <div style={{ marginBottom: '12px', lineHeight: '1.6', fontSize: '14px' }}>
                    <strong>From:</strong> {opp.source_title || opp.source_url}<br />
                    <strong>To:</strong> {opp.target_title || opp.target_url}<br />
                    <strong>Anchor text:</strong> <span style={{ backgroundColor: '#fff3cd', padding: '2px 4px', borderRadius: '3px' }}>"{opp.anchor_text}"</span><br />
                    <strong>Similarity:</strong> {opp.similarity_score ? (opp.similarity_score * 100).toFixed(1) + '%' : 'N/A'}<br />
                    <strong>Status:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{opp.status}</span>
                  </div>
                  
                  {opp.context_snippet && (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#f8f9fa', 
                      borderLeft: '4px solid #ddd',
                      borderRadius: '4px', 
                      fontSize: '13px',
                      marginBottom: '15px',
                      fontStyle: 'italic',
                      color: '#555'
                    }}>
                      "...{opp.context_snippet}..."
                    </div>
                  )}

                  <div>
                    {opp.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleApply(opp.id)}