const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const { authenticateUser, validateToken, setAuthorizedUser } = require('./auth');

// Set up authorized user with sister's credentials
setAuthorizedUser('pmatwa@icloud.com', 'pass-10041998');

const app = express();
const port = process.env.PORT || 5001;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '..', 'build')));

// Configure CORS for your domain
app.use(cors({
  origin: ['http://matwa.in', 'https://matwa.in', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const token = authenticateUser(email, password);
  
  if (token) {
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protect all /api routes except login
app.use('/api', (req, res, next) => {
  if (req.path === '/login') {
    return next();
  }
  validateToken(req, res, next);
});

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'db/test.db'), (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the test database.');
});

// Create tables
db.serialize(() => {
  // Chapters table with UNIQUE constraint
  db.run(`CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  // Questions table
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    options TEXT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters (id)
  )`);

  // Results table
  db.run(`CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapters TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // No need to insert sample chapters as they are handled by import-data.js
});

// Get all chapters
app.get('/api/chapters', (req, res) => {
  db.all('SELECT * FROM chapters', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get questions by chapter IDs
app.post('/api/questions', (req, res) => {
  const chapterIds = req.body.chapterIds;
  if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
    return res.status(400).json({ error: 'Invalid chapter IDs' });
  }
  
  const placeholders = chapterIds.map(() => '?').join(',');
  
  db.all(
    `SELECT * FROM questions WHERE chapter_id IN (${placeholders})`,
    chapterIds,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Submit test and get results
app.post('/api/submit', async (req, res) => {
  const { answers } = req.body;
  
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid submission data' });
  }

  try {
    // Get question IDs from the answers
    const questionIds = answers.map(a => a.questionId);
    const placeholders = questionIds.map(() => '?').join(',');
    const query = `SELECT id, correct_answer FROM questions WHERE id IN (${placeholders})`;
    
    db.all(query, questionIds, (err, questions) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Create a map of question ID to correct answer
      const correctAnswers = new Map(questions.map(q => [q.id, q.correct_answer]));

      // Calculate score
      let score = 0;
      answers.forEach(answer => {
        if (correctAnswers.has(answer.questionId) && 
            answer.answer === correctAnswers.get(answer.questionId)) {
          score++;
        }
      });

      // Get unique chapter IDs for these questions
      const chapterQuery = `
        SELECT DISTINCT chapter_id 
        FROM questions 
        WHERE id IN (${placeholders})
      `;

      db.all(chapterQuery, questionIds, (err, chapters) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const chapterIds = chapters.map(c => c.chapter_id);

        // Save results
        db.run(
          'INSERT INTO results (chapters, score, total_questions) VALUES (?, ?, ?)',
          [JSON.stringify(chapterIds), score, questions.length],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({
              id: this.lastID,
              score,
              total: questions.length,
              percentage: (score / questions.length) * 100,
              correctAnswers: questions.reduce((acc, q) => {
                acc[q.id] = q.correct_answer;
                return acc;
              }, {})
            });
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all results
app.get('/api/results', (req, res) => {
  const query = `
    SELECT r.*, GROUP_CONCAT(c.name) as topics
    FROM results r
    LEFT JOIN chapters c ON c.id IN (SELECT value FROM json_each(r.chapters))
    GROUP BY r.id
    ORDER BY r.date DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Format the results
    const formattedRows = rows.map(row => ({
      id: row.id,
      date: row.date,
      score: row.score,
      totalQuestions: row.total_questions,
      topics: row.topics,
      percentage: (row.score / row.total_questions) * 100
    }));

    res.json(formattedRows);
  });
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
