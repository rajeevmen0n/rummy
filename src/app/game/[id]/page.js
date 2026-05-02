"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import WebcamCapture from '@/components/WebcamCapture';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GamePage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Bulk entry state
  const [matchScores, setMatchScores] = useState({});
  const [calculating, setCalculating] = useState(false);
  
  // Webcam state
  const [activeWebcamPlayer, setActiveWebcamPlayer] = useState(null);

  const fetchGame = async () => {
    const res = await fetch(`/api/games/${id}`);
    if (res.ok) {
      const data = await res.json();
      setGameData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGame();
  }, [id]);

  const handleMatchScoreChange = (playerId, val) => {
    setMatchScores(prev => ({ ...prev, [playerId]: val }));
  };

  const handleCapture = async (base64Image) => {
    const player = activeWebcamPlayer;
    setActiveWebcamPlayer(null);
    setCalculating(true);
    
    try {
      const res = await fetch('/api/vision-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      
      const data = await res.json();
      if (res.ok) {
        if (confirm(`Calculated score: ${data.score} points. Use this for ${player.name}?`)) {
          handleMatchScoreChange(player.id, data.score);
        }
      } else {
        alert("Failed to calculate score: " + data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const logMatchScores = async () => {
    const hasScores = Object.values(matchScores).some(v => v !== '');
    if (!hasScores) return;

    setCalculating(true);
    try {
      const res = await fetch('/api/scores/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: id, matches: [matchScores] })
      });
      
      if (res.ok) {
        setMatchScores({});
        fetchGame();
      } else {
        const data = await res.json();
        alert("Failed to log match: " + data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const updateHistoryScore = async (roundNumber, playerId, value) => {
    try {
      const res = await fetch('/api/scores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: id, round_number: roundNumber, player_id: playerId, points: value })
      });
      if (res.ok) {
        fetchGame();
      } else {
        alert("Failed to update score");
      }
    } catch (err) {
      alert("Error updating score: " + err.message);
    }
  };

  const deleteMatch = async (roundNumber) => {
    if (!confirm(`Are you sure you want to delete Match ${roundNumber}?`)) return;
    
    try {
      const res = await fetch(`/api/scores?game_id=${id}&round_number=${roundNumber}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchGame();
      } else {
        alert("Failed to delete match");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="container"><div className="card">Loading session...</div></div>;
  if (!gameData || !gameData.game) return <div className="container"><div className="card">Session not found</div></div>;

  const { players, scores } = gameData;
  
  // Organize scores by player
  const playerTotals = {};
  
  players.forEach(p => {
    playerTotals[p.id] = 0;
  });
  
  const maxRound = scores.reduce((max, s) => Math.max(max, s.round_number), 0);
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  const roundData = {};
  rounds.forEach(r => {
    roundData[r] = {};
    players.forEach(p => {
      roundData[r][p.id] = '-';
    });
  });

  scores.forEach(s => {
    if (playerTotals[s.player_id] !== undefined) {
      playerTotals[s.player_id] += s.points;
    }
    if (roundData[s.round_number]) {
      roundData[s.round_number][s.player_id] = s.points;
    }
  });

  // Statistics Calculation
  let leader = null;
  let minScore = Infinity;
  let highestPenalty = 0;
  
  players.forEach(p => {
    if (playerTotals[p.id] < minScore) {
      minScore = playerTotals[p.id];
      leader = p;
    }
  });

  scores.forEach(s => {
    if (s.points > highestPenalty) {
      highestPenalty = s.points;
    }
  });

  const avgMatchPoints = scores.length > 0 ? (scores.reduce((sum, s) => sum + s.points, 0) / maxRound).toFixed(1) : 0;

  // Chart Data Preparation
  const chartData = [];
  const cumulativeScores = {};
  players.forEach(p => cumulativeScores[p.id] = 0);

  rounds.forEach(r => {
    const dataPoint = { match: `M${r}` };
    players.forEach(p => {
      const pts = roundData[r][p.id];
      if (pts !== '-') {
        cumulativeScores[p.id] += pts;
      }
      dataPoint[p.name] = cumulativeScores[p.id];
    });
    chartData.push(dataPoint);
  });
  
  const colors = ['#66FCF1', '#ff7b54', '#ffd56b', '#939b62', '#ffb26b', '#839b97', '#9b59b6', '#3498db'];

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Main Content Area */}
      <div className="card animate-fade-in" style={{ flex: '1 1 500px', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Live Session Board</h2>
        
        {gameData.game.uuid && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ 
              background: 'var(--bg-color)', 
              padding: '0.4rem 1rem', 
              borderRadius: '20px', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-light)', 
              fontWeight: 'bold', 
              letterSpacing: '1px',
              fontSize: '0.9rem'
            }}>
              Session Code: {gameData.game.uuid}
            </span>
            <button 
              onClick={() => router.push('/')}
              style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '20px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem' }}
              title="Return to Home Screen"
            >
              Exit Session
            </button>
            <button 
              onClick={async () => {
                if (!confirm('Are you sure you want to permanently delete this session and all its data?')) return;
                try {
                  const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
                  if (res.ok) {
                    router.push('/');
                  } else {
                    alert('Failed to delete session');
                  }
                } catch (err) {
                  alert('Error: ' + err.message);
                }
              }}
              style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--danger-color)', borderRadius: '20px', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.9rem' }}
              title="Permanently delete this session"
            >
              Delete Session
            </button>
          </div>
        )}
        
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontSize: '1.2rem' }}>
                    {p.name}
                    {leader && leader.id === p.id && <span style={{ marginLeft: '0.5rem', fontSize: '1.2rem' }} title="Current Leader">👑</span>}
                  </td>
                  <td style={{ fontSize: '1.5rem', color: 'var(--success-color)' }}>{playerTotals[p.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Log New Match Section */}
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Log Match {maxRound + 1} Scores</h3>
          
          {activeWebcamPlayer ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Take photo of {activeWebcamPlayer.name}'s hand</h4>
              <WebcamCapture 
                onCapture={handleCapture} 
                onCancel={() => setActiveWebcamPlayer(null)} 
              />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {players.map(p => (
                <div key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', margin: 0 }}>{p.name}</label>
                    <button 
                      onClick={() => setActiveWebcamPlayer(p)}
                      style={{ background: 'none', border: 'none', padding: '0 0.5rem', cursor: 'pointer', fontSize: '1.2rem', color: 'inherit' }}
                      title={`Calculate from photo for ${p.name}`}
                    >
                      📷
                    </button>
                  </div>
                  <input 
                    type="number"
                    placeholder="0"
                    value={matchScores[p.id] || ''}
                    onChange={(e) => handleMatchScoreChange(p.id, e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          )}
          
          <button onClick={logMatchScores} disabled={calculating || activeWebcamPlayer} style={{ width: '100%' }}>
            {calculating ? 'Saving/Analyzing...' : 'Save Match'}
          </button>
        </div>
      </div>

      {/* Sidebar Content Area */}
      <div className="card animate-fade-in" style={{ flex: '1 1 300px', padding: '1.5rem' }}>
        <h3 style={{ color: 'var(--accent-color)', textAlign: 'center' }}>Match History</h3>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Click a score to edit it.
        </p>
        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
          <table style={{ fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th>Match</th>
                {players.map(p => (
                  <th key={p.id}>{p.name.substring(0, 5)}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(r => (
                <tr key={r}>
                  <td style={{ fontWeight: 600, color: 'var(--text-light)' }}>{r}</td>
                  {players.map(p => (
                    <td key={p.id}>
                      <input 
                        type="number" 
                        defaultValue={roundData[r][p.id] !== '-' ? roundData[r][p.id] : ''}
                        onBlur={(e) => updateHistoryScore(r, p.id, e.target.value)}
                        style={{ 
                          width: '50px', 
                          padding: '0.2rem', 
                          textAlign: 'center', 
                          background: 'transparent', 
                          border: '1px solid transparent', 
                          color: 'var(--text-primary)',
                          fontFamily: 'inherit',
                          fontSize: 'inherit'
                        }}
                        className="editable-history-input"
                      />
                    </td>
                  ))}
                  <td>
                    <button 
                      onClick={() => deleteMatch(r)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '1rem' }}
                      title={`Delete Match ${r}`}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {rounds.length === 0 && (
                <tr>
                  <td colSpan={players.length + 2} style={{ color: 'var(--text-primary)', padding: '1rem', textAlign: 'center' }}>No matches played yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .editable-history-input:focus, .editable-history-input:hover {
            border: 1px solid var(--accent-color) !important;
            background: rgba(102, 252, 241, 0.05) !important;
            color: var(--text-light) !important;
            border-radius: 4px;
            outline: none;
          }
        `}} />
      </div>

      {/* Statistics and Visualizations */}
      <div className="card animate-fade-in" style={{ flex: '1 1 100%', padding: '2rem', marginTop: '1rem' }}>
        <h3 style={{ color: 'var(--accent-color)', textAlign: 'center', marginBottom: '2rem' }}>Session Insights</h3>
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={{ flex: '1 1 200px', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Current Leader</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
              {leader ? leader.name : '-'}
            </p>
          </div>
          <div style={{ flex: '1 1 200px', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Avg Penalty per Match</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
              {avgMatchPoints}
            </p>
          </div>
          <div style={{ flex: '1 1 200px', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Highest Single Penalty</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>
              {highestPenalty}
            </p>
          </div>
        </div>

        {rounds.length > 0 ? (
          <div style={{ height: '400px', width: '100%' }}>
            <h4 style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '1rem' }}>Cumulative Score Progression</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="match" stroke="var(--text-primary)" />
                <YAxis stroke="var(--text-primary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Legend />
                {players.map((p, i) => (
                  <Line 
                    key={p.id} 
                    type="monotone" 
                    dataKey={p.name} 
                    stroke={colors[i % colors.length]} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-primary)' }}>Log a match to see the progression chart.</p>
        )}
      </div>
    </div>
  );
}
