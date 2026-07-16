const readline = require('readline');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function runInstall() {
  console.log('\n=== MOIA Business Manager - Database Setup (MySQL) ===\n');
  
  const host = await question('Database Host (e.g. localhost): ');
  const user = await question('Database User (e.g. root): ');
  const password = await question('Database Password: ');
  const database = await question('Database Name (e.g. moia_manager): ');

  console.log('\nConnecting to MySQL...');
  
  try {
    const connection = await mysql.createConnection({
      host: host || 'localhost',
      user: user || 'root',
      password: password || '',
      database: database || 'moia_manager'
    });

    console.log('Connected successfully!');

    // Create users table
    console.log('Creating users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255)
      )
    `);

    // Create store table
    console.log('Creating store table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS store (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        state_json LONGTEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Insert default admin
    console.log('Checking default admin user...');
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await connection.execute('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
      console.log('Default admin user created: admin / admin');
    } else {
      console.log('Admin user already exists.');
    }

    await connection.end();

    // Write .env file
    console.log('\nSaving credentials to .env file...');
    const envContent = `DB_HOST=${host || 'localhost'}\nDB_USER=${user || 'root'}\nDB_PASSWORD=${password || ''}\nDB_NAME=${database || 'moia_manager'}\nJWT_SECRET=super-secret-moia-key-2026\n`;
    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    
    console.log('\n✅ Setup complete! You can now start the server using: node index.js or npm start\n');
    
  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.log('Make sure the database exists. If not, create it in phpMyAdmin first!');
  } finally {
    rl.close();
  }
}

runInstall();
