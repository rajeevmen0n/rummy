import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');
    
    if (!uuid) {
      return NextResponse.json({ error: 'UUID is required' }, { status: 400 });
    }

    const db = await getDb();
    const game = await db.get('SELECT id FROM games WHERE uuid = ?', [uuid.trim().toUpperCase()]);
    
    if (!game) {
      return NextResponse.json({ error: 'Session not found. Please check your code.' }, { status: 404 });
    }

    return NextResponse.json({ gameId: game.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
