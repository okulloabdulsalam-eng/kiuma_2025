const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'kiuma_users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            firstName TEXT,
            lastName TEXT,
            name TEXT,
            gender TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready');
            }
        });
    }
});

// POST /register - Register a new user
app.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, gender } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if email already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (row) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already registered. Please login instead.'
                });
            }

            // Hash password
            const saltRounds = 10;
            try {
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                // Construct full name
                const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || '');

                // Insert new user
                db.run(
                    `INSERT INTO users (email, password, firstName, lastName, name, gender) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [email, hashedPassword, firstName || null, lastName || null, fullName || null, gender || null],
                    function(err) {
                        if (err) {
                            console.error('Error inserting user:', err.message);
                            return res.status(500).json({
                                success: false,
                                message: 'Error creating account. Please try again.'
                            });
                        }

                        // Return success with user data (without password)
                        res.status(201).json({
                            success: true,
                            message: 'Account created successfully!',
                            user: {
                                id: this.lastID,
                                email: email,
                                firstName: firstName || null,
                                lastName: lastName || null,
                                name: fullName || null,
                                gender: gender || null
                            }
                        });
                    }
                );
            } catch (hashError) {
                console.error('Error hashing password:', hashError);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing password'
                });
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /login - Login user
app.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (!row) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password. Please try again.'
                });
            }

            // Compare password with stored hash
            try {
                const passwordMatch = await bcrypt.compare(password, row.password);

                if (!passwordMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password. Please try again.'
                    });
                }

                // Update last login time (optional)
                db.run('UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);

                // Return success with user data (without password)
                res.json({
                    success: true,
                    message: 'Login successful!',
                    user: {
                        id: row.id,
                        email: row.email,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        name: row.name,
                        gender: row.gender,
                        createdAt: row.createdAt
                    }
                });
            } catch (compareError) {
                console.error('Error comparing password:', compareError);
                return res.status(500).json({
                    success: false,
                    message: 'Error verifying password'
                });
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /users/:email - Get user by email (optional utility endpoint)
app.get('/users/:email', (req, res) => {
    const { email } = req.params;

    db.get('SELECT id, email, firstName, lastName, name, gender, createdAt FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: row
        });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'KIUMA Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`KIUMA Server is running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

