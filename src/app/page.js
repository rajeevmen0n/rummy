"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [numPlayers, setNumPlayers] = useState(2);
  const [players, setPlayers] = useState([{ name: 'Player 1' }, { name: 'Player 2' }]);
  const [addHistory, setAddHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [customUuid, setCustomUuid] = useState('');
  const [defaultUuid, setDefaultUuid] = useState('');
  const [uuidError, setUuidError] = useState(false);
  const [uuidFormatError, setUuidFormatError] = useState(false);
  const [isCheckingUuid, setIsCheckingUuid] = useState(false);

  useEffect(() => {
    setDefaultUuid(Math.random().toString(36).substring(2, 10).toUpperCase());
  }, []);
  
  // Live UUID checking
  useEffect(() => {
    if (!customUuid.trim() || uuidFormatError) {
      setUuidError(false);
      return;
    }
    
    const checkUuid = async () => {
      setIsCheckingUuid(true);
      try {
        const res = await fetch(`/api/games/join?uuid=${encodeURIComponent(customUuid.trim())}`);
        if (res.ok) {
          // If it returns ok, the UUID exists and is taken
          setUuidError(true);
        } else {
          // If it returns 404, it's available
          setUuidError(false);
        }
      } catch (err) {
        console.error("Failed to check UUID", err);
      } finally {
        setIsCheckingUuid(false);
      }
    };
    
    const debounceTimer = setTimeout(checkUuid, 500);
    return () => clearTimeout(debounceTimer);
  }, [customUuid]);
  
  const [joinUuid, setJoinUuid] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  
  const router = useRouter();

  const joinGame = async (e) => {
    e.preventDefault();
    if (!joinUuid.trim()) {
      alert("Please enter a session code");
      return;
    }
    
    setJoinLoading(true);
    try {
      const res = await fetch(`/api/games/join?uuid=${encodeURIComponent(joinUuid.trim())}`);
      const data = await res.json();
      
      if (res.ok) {
        router.push(`/game/${data.gameId}`);
      } else {
        alert(data.error || "Failed to find session");
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleNumChange = (e) => {
    const num = parseInt(e.target.value);
    if (num < 2) return;
    setNumPlayers(num);
    const newPlayers = Array(num).fill(null).map((_, i) => players[i] || { name: `Player ${i + 1}` });
    setPlayers(newPlayers);
  };

  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...players];
    newPlayers[index][field] = value;
    setPlayers(newPlayers);
  };

  const startGame = async () => {
    if (players.some(p => !p.name.trim())) {
      alert("Please enter all player names");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uuid: customUuid.trim() || defaultUuid,
          players: players.map(p => ({ 
            name: p.name
          })) 
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (addHistory) {
          router.push(`/game/${data.gameId}/history`);
        } else {
          router.push(`/game/${data.gameId}`);
        }
      } else {
        const data = await res.json();
        if (data.error === 'UUID_EXISTS') {
          setUuidError(true);
          alert("The session code you entered already exists. Please choose a different unique code.");
        } else {
          alert("Failed to create game: " + data.error);
        }
        setLoading(false);
      }
    } catch (err) {
      alert("Network error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div className="card animate-fade-in" style={{ flex: '1 1 400px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--accent-color)' }}>Rummy Scorer</h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>Start a new session</p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Session Code (optional):
          </label>
          <input 
            type="text" 
            value={customUuid} 
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
              setCustomUuid(cleaned);
              if (raw !== cleaned) {
                setUuidFormatError(true);
              } else {
                setUuidFormatError(false);
              }
            }}
            placeholder={defaultUuid}
            className={(uuidError || uuidFormatError) ? 'uuid-error' : ''}
            style={{ 
              width: '100%', 
              textTransform: 'uppercase', 
              letterSpacing: '1px'
            }}
            maxLength={10}
          />
          {uuidFormatError && <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Only letters and numbers are allowed. No spaces or special characters.</p>}
          {uuidError && !uuidFormatError && <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.5rem' }}>This session code is already taken. Please choose a unique code.</p>}
          <style dangerouslySetInnerHTML={{__html: `
            .uuid-error,
            .uuid-error:focus {
              border: 2px solid var(--danger-color) !important;
              box-shadow: 0 0 8px rgba(255, 82, 82, 0.3);
            }
          `}} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Number of Players:</label>
          <input 
            type="number" 
            min="2" 
            max="10" 
            value={numPlayers} 
            onChange={handleNumChange} 
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {players.map((p, i) => (
            <div key={i}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Player {i + 1} Name:</label>
              <input 
                type="text" 
                value={p.name} 
                onChange={(e) => handlePlayerChange(i, 'name', e.target.value)}
                placeholder={`Enter name`}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="addHistory" 
            checked={addHistory}
            onChange={(e) => setAddHistory(e.target.checked)}
            style={{ width: 'auto', transform: 'scale(1.2)' }}
          />
          <label htmlFor="addHistory" style={{ fontWeight: 600, cursor: 'pointer' }}>
            Enter previous match history
          </label>
        </div>

        <button onClick={startGame} disabled={loading} style={{ width: '100%', fontSize: '1.1rem' }}>
          {loading ? 'Starting...' : 'Start Session'}
        </button>
      </div>

      <div className="card animate-fade-in" style={{ flex: '1 1 300px' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '1.5rem' }}>Resume Session</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Enter your 8-character session code to rejoin a game in progress.
        </p>
        
        <form onSubmit={joinGame} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Session Code (UUID):</label>
            <input 
              type="text" 
              value={joinUuid} 
              onChange={(e) => setJoinUuid(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              style={{ width: '100%', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
            />
          </div>
          <button type="submit" disabled={joinLoading} className="secondary" style={{ width: '100%', marginTop: '1rem', fontSize: '1.1rem' }}>
            {joinLoading ? 'Joining...' : 'Join Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
