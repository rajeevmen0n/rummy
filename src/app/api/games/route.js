import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { players, uuid: customUuid } = await req.json();
    if (!players || players.length === 0) {
      return NextResponse.json({ error: 'No players provided' }, { status: 400 });
    }

    const db = await getDb();
    
    // Create game
    const finalUuid = customUuid && customUuid.trim() ? customUuid.trim().toUpperCase() : crypto.randomBytes(4).toString('hex').toUpperCase();
    
    try {
      const result = await db.run('INSERT INTO games (status, uuid) VALUES (?, ?)', ['active', finalUuid]);
      const gameId = result.lastID;

      // Create players
      for (const p of players) {
        const name = typeof p === 'string' ? p : p.name;
        await db.run('INSERT INTO players (game_id, name) VALUES (?, ?)', [gameId, name]);
      }

      return NextResponse.json({ success: true, gameId });
    } catch (dbErr) {
      if (dbErr.message.includes('UNIQUE constraint failed: games.uuid')) {
        return NextResponse.json({ error: 'UUID_EXISTS' }, { status: 409 });
      }
      throw dbErr;
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const db = await getDb();
    const games = await db.all(`
      SELECT g.id, g.uuid, g.status, g.created_at, COUNT(p.id) as player_count
      FROM games g
      LEFT JOIN players p ON g.id = p.game_id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);
    
    return NextResponse.json({ games });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
