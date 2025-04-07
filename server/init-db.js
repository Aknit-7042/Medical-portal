const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'db/test.db'), (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the test database.');
});

// Sample data
const chapters = [
  'NG Tube Insertion',
  'Tracheotomy',
  'Intubation',
  'O2 Inhalation',
  'Medical Surgical Asepsis',
  'Catheterization',
  'Bed Sore',
  'Lumber Puncture',
  'Paracentasis',
  'IV Therapy'
];

const questions = [
  {
    chapter: 'NG Tube Insertion',
    question: 'What is the first step in NG tube insertion?',
    correct_answer: 'Explain the procedure to the patient',
    options: 'Explain the procedure to the patient,Insert the tube directly,Apply lubricant,Check tube placement'
  },
  {
    chapter: 'NG Tube Insertion',
    question: 'What size NG tube is commonly used for adults?',
    correct_answer: '16-18 French',
    options: '16-18 French,8-10 French,20-22 French,24-26 French'
  },
  {
    chapter: 'Tracheotomy',
    question: 'What is the primary purpose of a tracheotomy?',
    correct_answer: 'To create an airway bypass',
    options: 'To create an airway bypass,To feed the patient,To remove excess fluid,To measure oxygen levels'
  },
  {
    chapter: 'Tracheotomy',
    question: 'Which of the following is a complication of tracheotomy?',
    correct_answer: 'Bleeding',
    options: 'Bleeding,Weight gain,Improved speech,Better sleep'
  }
];

// Create tables and insert data
db.serialize(() => {
  // Drop existing tables
  db.run('DROP TABLE IF EXISTS questions');
  db.run('DROP TABLE IF EXISTS chapters');
  
  // Create tables
  db.run(`CREATE TABLE chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    options TEXT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters (id)
  )`);

  // Insert chapters
  const insertChapter = db.prepare('INSERT INTO chapters (name) VALUES (?)');
  chapters.forEach(chapter => {
    insertChapter.run(chapter);
  });
  insertChapter.finalize();

  // Insert questions
  const insertQuestion = db.prepare(`
    INSERT INTO questions (chapter_id, question, correct_answer, options)
    SELECT c.id, ?, ?, ?
    FROM chapters c
    WHERE c.name = ?
  `);

  questions.forEach(q => {
    insertQuestion.run(q.question, q.correct_answer, q.options, q.chapter);
  });
  insertQuestion.finalize();

  console.log('Database initialized with sample data');
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Database connection closed.');
});
