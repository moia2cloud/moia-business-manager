require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-moia-key-2026';

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large JSON payloads for state

// Database setup
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moia_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL database.');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    console.log('Please run "node install.js" to setup your database first.');
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
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Store State
app.get('/api/store', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.execute('SELECT state_json FROM store WHERE user_id = ?', [userId]);
    const row = rows[0];
    
    if (!row || !row.state_json) {
      // Return empty state if not found
      return res.json({});
    }
    const state = JSON.parse(row.state_json);
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve state' });
  }
});

// Update Store State
app.post('/api/store', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const stateJson = JSON.stringify(req.body);
  
  try {
    // Check if store exists for user
    const [rows] = await pool.execute('SELECT id FROM store WHERE user_id = ?', [userId]);
    
    if (rows.length > 0) {
      await pool.execute('UPDATE store SET state_json = ? WHERE user_id = ?', [stateJson, userId]);
    } else {
      await pool.execute('INSERT INTO store (user_id, state_json) VALUES (?, ?)', [userId, stateJson]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// OTA Update Route
const os = require('os');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AdmZip = require('adm-zip');

const upload = multer({ dest: os.tmpdir() });

app.post('/api/update', authenticateToken, upload.single('updateFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
  }

  try {
    const zip = new AdmZip(req.file.path);
    // Extract to the project root directory (one level up from server/)
    const extractTo = path.resolve(__dirname, '..');
    
    console.log('Applying OTA update to:', extractTo);
    zip.extractAllTo(extractTo, true); // true = overwrite
    
    // Clean up uploaded zip
    fs.unlinkSync(req.file.path);
    
    res.json({ success: true, message: 'تم تحديث النظام بنجاح، جاري إعادة تشغيل السيرفر...' });
    
    // Restart the server gracefully
    setTimeout(() => {
      console.log('Update applied successfully. Exiting process to allow PM2/systemd to restart...');
      process.exit(0);
    }, 2000);
    
  } catch (err) {
    console.error('Update failed:', err);
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'فشل في تطبيق التحديث: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
