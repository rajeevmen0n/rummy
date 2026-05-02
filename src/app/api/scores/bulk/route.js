import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { game_id, matches } = await req.json();
    const db = await getDb();
    
    for (const match of matches) {
      for (const [playerId, points] of Object.entries(match)) {
        if (points === '' || points === null || points === undefined) continue;
        
        const row = await db.get(`SELECT MAX(round_number) as max_round FROM scores WHERE game_id = ? AND player_id = ?`, [game_id, playerId]);
        const round_number = (row.max_round || 0) + 1;
        
        await db.run(
          `INSERT INTO scores (game_id, player_id, round_number, points) VALUES (?, ?, ?, ?)`,
          [game_id, playerId, round_number, parseInt(points)]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
