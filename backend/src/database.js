import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Create images table
    db.run(`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed BOOLEAN DEFAULT 0,
        detections_hash TEXT,
        file_hash TEXT,
        idempotency_key TEXT
      )
    `);
    
    // Add idempotency_key column if it doesn't exist (for existing databases)
    db.run(`
      ALTER TABLE images ADD COLUMN idempotency_key TEXT
    `, (err) => {
      // Ignore error if column already exists
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding idempotency_key column:', err.message);
      }
    });

    // Create detections table
    db.run(`
      CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_id TEXT NOT NULL,
        label TEXT NOT NULL,
        confidence REAL NOT NULL,
        bbox_x REAL NOT NULL,
        bbox_y REAL NOT NULL,
        bbox_width REAL NOT NULL,
        bbox_height REAL NOT NULL,
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
      )
    `);

    // Create labels table
    db.run(`
      CREATE TABLE IF NOT EXISTS labels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // Insert default labels
    const defaultLabels = [
      ['helmet', 'Hard hat or safety helmet'],
      ['vest', 'High-visibility safety vest'],
      ['person', 'Person detected in image']
    ];

    const insertLabel = db.prepare('INSERT OR IGNORE INTO labels (name, description) VALUES (?, ?)');
    defaultLabels.forEach(label => {
      insertLabel.run(label);
    });
    insertLabel.finalize();
  });
}

export default db;
