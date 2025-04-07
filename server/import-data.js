const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'db/test.db'), (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the test database.');
});

async function parseQuestionFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  const questions = [];
  let currentQuestion = null;
  let currentOptions = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Skip the title line
    if (trimmedLine.startsWith('#')) continue;

    // Check if line starts with a number followed by dot (e.g., "1." or "10.")
    if (/^\d+\./.test(trimmedLine)) {
      // Save previous question if exists
      if (currentQuestion && currentOptions.length > 0) {
        questions.push({
          question: currentQuestion,
          options: currentOptions
        });
      }
      // Start new question
      currentQuestion = trimmedLine.replace(/^\d+\.\s*/, '');
      currentOptions = [];
    }
    // Check if line starts with a letter followed by ) (e.g., "a)" or "b)")
    else if (/^[a-d]\)/.test(trimmedLine)) {
      currentOptions.push(trimmedLine.replace(/^[a-d]\)\s*/, ''));
    }
  }

  // Add the last question
  if (currentQuestion && currentOptions.length > 0) {
    questions.push({
      question: currentQuestion,
      options: currentOptions
    });
  }

  return questions;
}

async function parseAnswerFile(filePath, topicName) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  const answers = [];
  let isCurrentTopic = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for topic header
    if (trimmedLine.startsWith('## Topic')) {
      if (isCurrentTopic) {
        break;
      }
      const topicMatch = trimmedLine.match(/Topic \d+: (.+)/);
      if (topicMatch && topicMatch[1].toLowerCase() === topicName.toLowerCase()) {
        isCurrentTopic = true;
        continue;
      }
    }

    // Collect answers for current topic
    if (isCurrentTopic && /^\d+\./.test(trimmedLine)) {
      const answer = trimmedLine.match(/[a-d]\)/);
      if (answer) {
        answers.push(answer[0].replace(')', ''));
      }
    }
  }

  return answers;
}

async function importData() {
  try {
    // Drop existing tables
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS questions', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS chapters', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create tables
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER,
        question TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        options TEXT NOT NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters (id)
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Read and process each topic file
    const questionsDir = path.join(__dirname, '..', 'data', 'questions');
    const answersDir = path.join(__dirname, '..', 'data', 'answers');
    const files = await fs.readdir(questionsDir);

    for (const file of files) {
      if (!file.endsWith('.md') || file === 'all_answers.md') continue;

      const topicName = file
        .replace('topic', '')
        .replace('.md', '')
        .split('_')
        .slice(1)
        .join(' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      console.log(`Processing ${topicName}...`);

      // Insert chapter if it doesn't exist
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO chapters (name) VALUES (?)', [topicName], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Get chapter ID
      const chapter = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM chapters WHERE name = ?', [topicName], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      // Parse questions and answers
      const questions = await parseQuestionFile(path.join(questionsDir, file));
      const answers = await parseAnswerFile(path.join(answersDir, 'all_answers.md'), topicName);

      console.log(`Found ${questions.length} questions and ${answers.length} answers`);

      // Skip if we don't have exactly 50 questions and answers
      if (questions.length !== 50 || answers.length !== 50) {
        console.warn(`Skipping ${topicName}: Requires exactly 50 questions and answers (found ${questions.length} questions and ${answers.length} answers)`);
        continue;
      }

      // Insert questions
      const stmt = db.prepare(`
        INSERT INTO questions (chapter_id, question, correct_answer, options)
        VALUES (?, ?, ?, ?)
      `);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        stmt.run(
          chapter.id,
          q.question,
          answers[i],
          q.options.join(',')
        );
      }

      stmt.finalize();
      console.log(`Imported ${questions.length} questions for ${topicName}`);
    }

    console.log('Data import completed successfully');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Database connection closed.');
    });
  }
}

importData();
