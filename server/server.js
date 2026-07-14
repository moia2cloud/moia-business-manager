const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-moia-key-2026';

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large JSON payloads for state

// Database setup
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database.');
});

// Initialize tables and default admin
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS store (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    state_json TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Create default admin user if not exists
  const defaultUsername = 'admin';
  const defaultPassword = 'admin';
  
  db.get(`SELECT * FROM users WHERE username = ?`, [defaultUsername], async (err, row) => {
    if (!row) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [defaultUsername, hashedPassword]);
      console.log('Default admin user created: admin / admin');
    }
  });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Login Route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token });
  });
});

// Get Store State
app.get('/api/store', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.get(`SELECT state_json FROM store WHERE user_id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row || !row.state_json) {
      // Return empty state if not found
      return res.json({});
    }
    try {
      const state = JSON.parse(row.state_json);
      res.json(state);
    } catch(e) {
      res.status(500).json({ error: 'Failed to parse state' });
    }
  });
});

// Update Store State
app.post('/api/store', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const stateJson = JSON.stringify(req.body);
  
  // Check if store exists for user
  db.get(`SELECT id FROM store WHERE user_id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    if (row) {
      db.run(`UPDATE store SET state_json = ? WHERE user_id = ?`, [stateJson, userId], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Update failed' });
        res.json({ success: true });
      });
    } else {
      db.run(`INSERT INTO store (user_id, state_json) VALUES (?, ?)`, [userId, stateJson], (insertErr) => {
        if (insertErr) return res.status(500).json({ error: 'Insert failed' });
        res.json({ success: true });
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
