import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listSites, deleteSite, analyzeSite, getOpportunities, applyOpportunity, skipOpportunity } from '../api';

function Dashboard() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Load sites when component mounts
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
      // Reload opportunities
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
    const opportunities = await getOpportunities(siteId);
    setOpportunities(opportunities);
  } catch (err) {
    console.error('Failed to load opportunities', err);
  } finally {
    setLoading(false);
  }
};

  const handleApply = async (opportunityId) => {
    try {
      await applyOpportunity(opportunityId);
      // Update the opportunity status in the list
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
    <div>
      <h1>Dashboard</h1>
      
      {message && (
        <div style={{ padding: '10px', backgroundColor: '#e7f3ff', border: '1px solid #b3d4fc', borderRadius: '4px', marginBottom: '15px' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: '10px', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Sites section */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Your Sites</h2>
          <button 
            onClick={() => navigate('/add-site')}
            style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            + Add Site
          </button>
        </div>

        {sites.length === 0 ? (
          <p>No sites added yet. Click "Add Site" to get started.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sites.map(site => (
              <div 
                key={site.id} 
                style={{ 
                  padding: '15px', 
                  border: selectedSite === site.id ? '2px solid #007bff' : '1px solid #ddd', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedSite === site.id ? '#f0f7ff' : 'white'
                }}
                onClick={() => handleSelectSite(site.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{site.url}</strong>
                    <br />
                    <small>Last crawled: {site.last_crawled ? new Date(site.last_crawled).toLocaleString() : 'Never'}</small>
                  </div>
                  <div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(site.id); }}
                      disabled={analyzing}
                      style={{ padding: '5px 10px', marginRight: '5px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSite(site.id); }}
                      style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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

      {/* Opportunities section */}
      {selectedSite && (
        <div>
          <h2>Linking Opportunities</h2>
          {loading ? (
            <p>Loading opportunities...</p>
          ) : opportunities.length === 0 ? (
            <p>No opportunities found. Click "Analyze" to scan your site.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {opportunities.map(opp => (
                <div 
                  key={opp.id} 
                  style={{ 
                    padding: '15px', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px',
                    backgroundColor: opp.status === 'created' ? '#d4edda' : opp.status === 'skipped' ? '#f8d7da' : 'white'
                  }}
                >
                  <div style={{ marginBottom: '10px' }}>
                    <strong>From:</strong> {opp.source_title || opp.source_url}<br />
                    <strong>To:</strong> {opp.target_title || opp.target_url}<br />
                    <strong>Anchor text:</strong> "{opp.anchor_text}"<br />
                    <strong>Similarity:</strong> {opp.similarity_score ? (opp.similarity_score * 100).toFixed(1) + '%' : 'N/A'}<br />
                    <strong>Status:</strong> {opp.status}
                  </div>
                  {opp.context_snippet && (
                    <div style={{ 
                      padding: '10px', 
                      backgroundColor: '#f9f9f9', 
                      borderRadius: '4px', 
                      fontSize: '0.9em',
                      marginBottom: '10px',
                      fontStyle: 'italic'
                    }}>
                      "...{opp.context_snippet}..."
                    </div>
                  )}
                  <div>
                    {opp.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApply(opp.id)}
                          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
                        >
                          Create Link
                        </button>
                        <button 
                          onClick={() => handleSkip(opp.id)}
                          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Skip
                        </button>
                      </>
                    )}
                    {opp.status === 'created' && <span style={{ color: 'green' }}>✅ Link created</span>}
                    {opp.status === 'skipped' && <span style={{ color: 'gray' }}>⏭️ Skipped</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;