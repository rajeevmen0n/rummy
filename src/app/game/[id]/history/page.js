"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function HistorySetup({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [matches, setMatches] = useState([{}]); 

  useEffect(() => {
    fetch(`/api/games/${id}`)
      .then(res => res.json())
      .then(data => {
        setGameData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const addMatch = () => {
    setMatches([...matches, {}]);
  };

  const updateScore = (matchIndex, playerId, value) => {
    const newMatches = [...matches];
    newMatches[matchIndex] = { ...newMatches[matchIndex], [playerId]: value };
    setMatches(newMatches);
  };

  const removeMatch = (index) => {
    const newMatches = [...matches];
    newMatches.splice(index, 1);
    setMatches(newMatches);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/scores/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: id, matches })
      });
      
      if (res.ok) {
        router.push(`/game/${id}`);
      } else {
        const data = await res.json();
        alert("Failed to save history: " + data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="container"><div className="card">Loading session...</div></div>;
  if (!gameData || !gameData.game) return <div className="container"><div className="card">Session not found</div></div>;

  const { players } = gameData;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card animate-fade-in">
        <h2 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Match History Setup</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '2rem' }}>
          Enter the scores for previous matches in this session.
        </p>

        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table>
            <thead>
              <tr>
                <th>Match</th>
                {players.map(p => (
                  <th key={p.id}>{p.name}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 'bold' }}>{i + 1}</td>
                  {players.map(p => (
                    <td key={p.id}>
                      <input
                        type="number"
                        placeholder="0"
                        value={match[p.id] || ''}
                        onChange={(e) => updateScore(i, p.id, e.target.value)}
                        style={{ width: '80px', textAlign: 'center' }}
                      />
                    </td>
                  ))}
                  <td>
                    <button 
                      onClick={() => removeMatch(i)} 
                      style={{ 
                        background: 'transparent', 
                        color: 'var(--danger-color)', 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.9rem',
                        border: '1px solid var(--danger-color)'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={addMatch} className="secondary" style={{ flex: '1 1 200px' }}>
            + Add Another Match
          </button>
          <button onClick={handleSave} style={{ flex: '2 1 300px' }}>
            Stop Accepting History & Start Session
          </button>
        </div>
        
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button 
            onClick={() => router.push(`/game/${id}`)} 
            style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', textDecoration: 'underline' }}
          >
            Stop accepting history & Skip
          </button>
        </div>
      </div>
    </div>
  );
}
