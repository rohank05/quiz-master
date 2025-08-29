const express = require('express');
const { authenticateToken, handleValidationErrors } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Validation for quiz submission
const validateQuizSubmission = [
  body('skill_id').isInt().withMessage('Valid skill ID is required'),
  body('answers').isArray().withMessage('Answers must be an array'),
  body('answers.*.question_id').isInt().withMessage('Each answer must have a valid question ID'),
  body('answers.*.selected_option').isIn(['A', 'B', 'C', 'D']).withMessage('Selected option must be A, B, C, or D'),
  body('time_taken_seconds').optional().isInt({ min: 0 }).withMessage('Time taken must be a positive integer')
];

// Start a quiz (get questions for a skill)
router.get('/start/:skillId', authenticateToken, async (req, res) => {
  try {
    const skillId = req.params.skillId;
    const userId = req.user.id;

    // Check if skill exists
    const [skills] = await req.db.execute('SELECT id, name FROM skills WHERE id = ?', [skillId]);
    if (skills.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Get questions for this skill (cached)
    const cacheKey = `questions:skill:${skillId}`;
    let questions = await req.redis.get(cacheKey);

    if (!questions) {
      const [questionRows] = await req.db.execute(`
        SELECT id, question_text, option_a, option_b, option_c, option_d, difficulty
        FROM questions
        WHERE skill_id = ?
        ORDER BY RAND()
      `, [skillId]);

      questions = JSON.stringify(questionRows);
      await req.redis.setEx(cacheKey, 3600, questions); // Cache for 1 hour
    } else {
      questions = JSON.parse(questions);
    }

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions available for this skill' });
    }

    res.json({
      skill: skills[0],
      questions: questions,
      total_questions: questions.length
    });

  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// Submit quiz answers
router.post('/submit', authenticateToken, validateQuizSubmission, handleValidationErrors, async (req, res) => {
  try {
    const { skill_id, answers, time_taken_seconds } = req.body;
    const userId = req.user.id;

    // Calculate score
    let correctAnswers = 0;
    const answerInserts = [];

    for (const answer of answers) {
      // Get correct answer for this question
      const [questions] = await req.db.execute(
        'SELECT correct_option FROM questions WHERE id = ?',
        [answer.question_id]
      );

      if (questions.length === 0) {
        continue; // Skip invalid questions
      }

      const isCorrect = questions[0].correct_option === answer.selected_option;
      if (isCorrect) {
        correctAnswers++;
      }

      answerInserts.push([
        answer.question_id,
        answer.selected_option,
        isCorrect
      ]);
    }

    const totalQuestions = answers.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Insert quiz attempt
    const [attemptResult] = await req.db.execute(`
      INSERT INTO quiz_attempts (user_id, skill_id, score, total_questions, time_taken_seconds)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, skill_id, score, totalQuestions, time_taken_seconds || null]);

    const attemptId = attemptResult.insertId;

    // Insert individual answers
    if (answerInserts.length > 0) {
      const answerValues = answerInserts.map(answer => [attemptId, ...answer]);
      await req.db.execute(`
        INSERT INTO quiz_answers (attempt_id, question_id, selected_option, is_correct)
        VALUES ${answerInserts.map(() => '(?, ?, ?, ?)').join(', ')}
      `, answerValues.flat());
    }

    // Clear user performance cache
    await req.redis.del(`user_performance:${userId}`);

    res.json({
      attempt_id: attemptId,
      score,
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      message: 'Quiz submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get user's quiz history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [attempts] = await req.db.execute(`
      SELECT qa.*, s.name as skill_name
      FROM quiz_attempts qa
      JOIN skills s ON qa.skill_id = s.id
      WHERE qa.user_id = ?
      ORDER BY qa.completed_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await req.db.execute(
      'SELECT COUNT(*) as total FROM quiz_attempts WHERE user_id = ?',
      [userId]
    );

    res.json({
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

// Get specific quiz attempt details
router.get('/attempt/:attemptId', authenticateToken, async (req, res) => {
  try {
    const attemptId = req.params.attemptId;
    const userId = req.user.id;

    // Get attempt details
    const [attempts] = await req.db.execute(`
      SELECT qa.*, s.name as skill_name
      FROM quiz_attempts qa
      JOIN skills s ON qa.skill_id = s.id
      WHERE qa.id = ? AND qa.user_id = ?
    `, [attemptId, userId]);

    if (attempts.length === 0) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    // Get answers with question details
    const [answers] = await req.db.execute(`
      SELECT qaa.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option
      FROM quiz_answers qaa
      JOIN questions q ON qaa.question_id = q.id
      WHERE qaa.attempt_id = ?
      ORDER BY qaa.id
    `, [attemptId]);

    res.json({
      attempt: attempts[0],
      answers
    });

  } catch (error) {
    console.error('Error fetching quiz attempt details:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempt details' });
  }
});

module.exports = router;