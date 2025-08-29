const express = require('express');
const { authenticateToken, requireAdmin, handleValidationErrors } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Validation for question creation/update
const validateQuestion = [
  body('skill_id').isInt().withMessage('Valid skill ID is required'),
  body('question_text').notEmpty().withMessage('Question text is required'),
  body('option_a').notEmpty().withMessage('Option A is required'),
  body('option_b').notEmpty().withMessage('Option B is required'),
  body('option_c').notEmpty().withMessage('Option C is required'),
  body('option_d').notEmpty().withMessage('Option D is required'),
  body('correct_option').isIn(['A', 'B', 'C', 'D']).withMessage('Correct option must be A, B, C, or D'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard')
];

// Get all questions (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [questions] = await req.db.execute(`
      SELECT q.*, s.name as skill_name
      FROM questions q
      JOIN skills s ON q.skill_id = s.id
      ORDER BY q.created_at DESC
    `);

    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get questions by skill (for quiz taking)
router.get('/skill/:skillId', authenticateToken, async (req, res) => {
  try {
    const skillId = req.params.skillId;

    const [questions] = await req.db.execute(`
      SELECT id, skill_id, question_text, option_a, option_b, option_c, option_d, difficulty
      FROM questions
      WHERE skill_id = ?
      ORDER BY RAND()
    `, [skillId]);

    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions by skill:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get all skills
router.get('/skills', authenticateToken, async (req, res) => {
  try {
    const [skills] = await req.db.execute('SELECT * FROM skills ORDER BY name');

    // Get question count for each skill
    for (let skill of skills) {
      const [count] = await req.db.execute(
        'SELECT COUNT(*) as count FROM questions WHERE skill_id = ?',
        [skill.id]
      );
      skill.question_count = count[0].count;
    }

    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Create new question (admin only)
router.post('/', authenticateToken, requireAdmin, validateQuestion, handleValidationErrors, async (req, res) => {
  try {
    const { skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty } = req.body;

    const [result] = await req.db.execute(`
      INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty]);

    // Clear cache for this skill
    await req.redis.del(`questions:skill:${skill_id}`);

    res.status(201).json({
      id: result.insertId,
      message: 'Question created successfully'
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update question (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateQuestion, handleValidationErrors, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty } = req.body;

    const [result] = await req.db.execute(`
      UPDATE questions
      SET skill_id = ?, question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?, difficulty = ?
      WHERE id = ?
    `, [skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, questionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Clear cache
    await req.redis.del(`questions:skill:${skill_id}`);

    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const questionId = req.params.id;

    // Get skill_id before deleting for cache invalidation
    const [questions] = await req.db.execute('SELECT skill_id FROM questions WHERE id = ?', [questionId]);
    if (questions.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const skillId = questions[0].skill_id;

    const [result] = await req.db.execute('DELETE FROM questions WHERE id = ?', [questionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Clear cache
    await req.redis.del(`questions:skill:${skillId}`);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router;