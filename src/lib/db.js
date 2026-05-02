import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

export async function getDb() {
  if (db) {
    return db;
  }
  
  db = await open({
    filename: process.env.DATABASE_PATH || path.join(process.cwd(), 'rummy.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_games_uuid ON games(uuid);

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER,
      name TEXT,
      FOREIGN KEY(game_id) REFERENCES games(id)
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER,
      player_id INTEGER,
      round_number INTEGER,
      points INTEGER,
      FOREIGN KEY(game_id) REFERENCES games(id),
      FOREIGN KEY(player_id) REFERENCES players(id)
    );
  `);

  try {
    await db.exec('ALTER TABLE games ADD COLUMN uuid TEXT');
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_games_uuid ON games(uuid)');
  } catch (e) {
    // Ignore error if column already exists
  }

  return db;
}
