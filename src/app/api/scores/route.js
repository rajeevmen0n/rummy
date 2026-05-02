import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { game_id, player_id, points } = await req.json();
    const db = await getDb();
    
    // Get current max round number for this player
    const row = await db.get(`SELECT MAX(round_number) as max_round FROM scores WHERE game_id = ? AND player_id = ?`, [game_id, player_id]);
    const round_number = (row.max_round || 0) + 1;
    
    const result = await db.run(
      `INSERT INTO scores (game_id, player_id, round_number, points) VALUES (?, ?, ?, ?)`,
      [game_id, player_id, round_number, points]
    );

    return NextResponse.json({ success: true, id: result.lastID, round_number });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { game_id, round_number, player_id, points } = await req.json();
    if (points === '' || points === undefined || points === null) {
        return NextResponse.json({ success: true });
    }
    const db = await getDb();
    
    // Attempt update
    const result = await db.run(
      'UPDATE scores SET points = ? WHERE game_id = ? AND round_number = ? AND player_id = ?',
      [parseInt(points), game_id, round_number, player_id]
    );

    if (result.changes === 0) {
      // If it doesn't exist, insert it
      await db.run(
        'INSERT INTO scores (game_id, player_id, round_number, points) VALUES (?, ?, ?, ?)',
        [game_id, player_id, round_number, parseInt(points)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const game_id = searchParams.get('game_id');
    const round_number = searchParams.get('round_number');
    
    if (!game_id || !round_number) {
      return NextResponse.json({ error: "Missing game_id or round_number" }, { status: 400 });
    }
    
    const db = await getDb();
    
    // Delete the match
    await db.run('DELETE FROM scores WHERE game_id = ? AND round_number = ?', [game_id, round_number]);
    
    // Shift subsequent match numbers down by 1
    await db.run('UPDATE scores SET round_number = round_number - 1 WHERE game_id = ? AND round_number > ?', [game_id, round_number]);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
