const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'db/test.db'), (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Connected to the test database.');
});

// Function to parse markdown questions
function parseQuestions(content) {
  const questions = [];
  const lines = content.split('\n');
  let currentQuestion = null;
  let options = [];

  for (const line of lines) {
    if (/^\d+\./.test(line)) {
      // If we have a previous question, save it
      if (currentQuestion && options.length === 4) {
        questions.push({
          question: currentQuestion,
          options: options
        });
      }
      // Start new question
      currentQuestion = line.replace(/^\d+\.\s*/, '').trim();
      options = [];
    } else if (/^[a-d]\)/.test(line.trim())) {
      options.push(line.trim());
    }
  }

  // Add the last question
  if (currentQuestion && options.length === 4) {
    questions.push({
      question: currentQuestion,
      options: options
    });
  }

  return questions;
}

// Function to parse markdown answers
function parseAnswers(content, topicName) {
  const answers = [];
  const lines = content.split('\n');
  let currentTopic = '';
  
  for (const line of lines) {
    if (line.startsWith('## Topic')) {
      currentTopic = line.replace('## Topic', '').trim();
    } else if (/^\d+\./.test(line) && currentTopic.includes(topicName)) {
      const answer = line.split(')')[1].trim();
      answers.push(answer);
    }
  }

  return answers;
}

// Import data for each topic
async function importData() {
  // First, clear existing questions
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM questions', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const topicsMap = {
    'topic1_ng_tube_insertion.md': 1,
    'topic2_tracheotomy.md': 2,
    'topic3_intubation.md': 3,
    'topic4_o2_inhalation.md': 4,
    'topic5_medical_surgical_asepsis.md': 5,
    'topic6_catheterization.md': 6,
    'topic7_bed_sore.md': 7,
    'topic8_lumbar_puncture.md': 8,
    'topic9_paracentesis.md': 9,
    'topic10_iv_therapy.md': 10
  };

  const answersContent = fs.readFileSync(
    path.join(__dirname, '../data/answers/all_answers.md'),
    'utf8'
  );

  for (const [filename, chapterId] of Object.entries(topicsMap)) {
    const questionContent = fs.readFileSync(
      path.join(__dirname, '../data/questions', filename),
      'utf8'
    );

    const questions = parseQuestions(questionContent);
    const answers = parseAnswers(answersContent, chapterId.toString());

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const correctAnswer = answers[i];
      
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO questions (chapter_id, question, options, correct_answer) VALUES (?, ?, ?, ?)',
          [
            chapterId,
            q.question,
            JSON.stringify(q.options),
            correctAnswer
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    console.log(`Imported questions for chapter ${chapterId}`);
  }

  console.log('Data import completed');
  db.close();
}

// Run the import
importData().catch(console.error);
