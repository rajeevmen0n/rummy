import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();

    const game = await db.get('SELECT * FROM games WHERE id = ?', [id]);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const players = await db.all('SELECT * FROM players WHERE game_id = ?', [id]);
    const scores = await db.all('SELECT * FROM scores WHERE game_id = ? ORDER BY round_number ASC', [id]);

    return NextResponse.json({ game, players, scores });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Delete associated scores and players first
    await db.run('DELETE FROM scores WHERE game_id = ?', [id]);
    await db.run('DELETE FROM players WHERE game_id = ?', [id]);
    
    // Delete the game
    const result = await db.run('DELETE FROM games WHERE id = ?', [id]);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
