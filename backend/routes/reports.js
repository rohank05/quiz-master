const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user performance report
router.get('/user-performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `user_performance:${userId}`;

    // Check cache first
    let performance = await req.redis.get(cacheKey);
    if (performance) {
      return res.json(JSON.parse(performance));
    }

    // Get overall stats
    const [overallStats] = await req.db.execute(`
      SELECT
        COUNT(*) as total_quizzes,
        AVG(score) as average_score,
        MAX(score) as best_score,
        MIN(score) as worst_score
      FROM quiz_attempts
      WHERE user_id = ?
    `, [userId]);

    // Get skill-wise performance
    const [skillStats] = await req.db.execute(`
      SELECT
        s.name as skill_name,
        COUNT(qa.id) as quizzes_taken,
        AVG(qa.score) as average_score,
        MAX(qa.score) as best_score,
        MIN(qa.completed_at) as first_attempt,
        MAX(qa.completed_at) as last_attempt
      FROM quiz_attempts qa
      JOIN skills s ON qa.skill_id = s.id
      WHERE qa.user_id = ?
      GROUP BY s.id, s.name
      ORDER BY average_score DESC
    `, [userId]);

    // Get recent activity (last 10 attempts)
    const [recentActivity] = await req.db.execute(`
      SELECT
        qa.score,
        qa.completed_at,
        s.name as skill_name,
        qa.total_questions
      FROM quiz_attempts qa
      JOIN skills s ON qa.skill_id = s.id
      WHERE qa.user_id = ?
      ORDER BY qa.completed_at DESC
      LIMIT 10
    `, [userId]);

    const report = {
      overall: overallStats[0],
      skills: skillStats,
      recent_activity: recentActivity
    };

    // Cache for 10 minutes
    await req.redis.setEx(cacheKey, 600, JSON.stringify(report));

    res.json(report);

  } catch (error) {
    console.error('Error fetching user performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance report' });
  }
});

// Get admin dashboard stats (admin only)
router.get('/admin-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cacheKey = 'admin_stats';

    // Check cache first
    let stats = await req.redis.get(cacheKey);
    if (stats) {
      return res.json(JSON.parse(stats));
    }

    // Get overall system stats
    const [userStats] = await req.db.execute(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users
      FROM users
    `);

    const [quizStats] = await req.db.execute(`
      SELECT
        COUNT(*) as total_attempts,
        AVG(score) as average_score,
        COUNT(DISTINCT user_id) as active_users
      FROM quiz_attempts
    `);

    const [questionStats] = await req.db.execute(`
      SELECT
        COUNT(*) as total_questions,
        COUNT(DISTINCT skill_id) as total_skills
      FROM questions
    `);

    // Get skill performance overview
    const [skillOverview] = await req.db.execute(`
      SELECT
        s.name as skill_name,
        COUNT(DISTINCT q.id) as questions_count,
        COUNT(DISTINCT qa.id) as attempts_count,
        AVG(qa.score) as average_score
      FROM skills s
      LEFT JOIN questions q ON s.id = q.skill_id
      LEFT JOIN quiz_attempts qa ON s.id = qa.skill_id
      GROUP BY s.id, s.name
      ORDER BY attempts_count DESC
    `);

    // Get recent quiz activity
    const [recentActivity] = await req.db.execute(`
      SELECT
        qa.score,
        qa.completed_at,
        u.username,
        s.name as skill_name
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      JOIN skills s ON qa.skill_id = s.id
      ORDER BY qa.completed_at DESC
      LIMIT 10
    `);

    const report = {
      users: userStats[0],
      quizzes: quizStats[0],
      questions: questionStats[0],
      skills_overview: skillOverview,
      recent_activity: recentActivity
    };

    // Cache for 5 minutes
    await req.redis.setEx(cacheKey, 300, JSON.stringify(report));

    res.json(report);

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Get user management data (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await req.db.execute(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        COUNT(qa.id) as quizzes_taken,
        AVG(qa.score) as average_score,
        MAX(qa.completed_at) as last_activity
      FROM users u
      LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
      GROUP BY u.id, u.username, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get skill gap analysis (admin only)
router.get('/skill-gaps', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [skillGaps] = await req.db.execute(`
      SELECT
        s.name as skill_name,
        AVG(qa.score) as average_score,
        COUNT(qa.id) as total_attempts,
        COUNT(DISTINCT qa.user_id) as unique_users,
        MIN(qa.score) as lowest_score,
        MAX(qa.score) as highest_score
      FROM skills s
      LEFT JOIN quiz_attempts qa ON s.id = qa.skill_id
      GROUP BY s.id, s.name
      HAVING total_attempts > 0
      ORDER BY average_score ASC
    `);

    res.json(skillGaps);

  } catch (error) {
    console.error('Error fetching skill gaps:', error);
    res.status(500).json({ error: 'Failed to fetch skill gap analysis' });
  }
});

// Get time-based reports
router.get('/time-analysis', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, quarter

    let dateFormat, groupBy;
    switch (period) {
      case 'month':
        dateFormat = '%Y-%m';
        groupBy = 'month';
        break;
      case 'quarter':
        dateFormat = '%Y-%Q';
        groupBy = 'quarter';
        break;
      default: // week
        dateFormat = '%Y-%u';
        groupBy = 'week';
    }

    const [timeAnalysis] = await req.db.execute(`
      SELECT
        DATE_FORMAT(completed_at, '${dateFormat}') as period,
        COUNT(*) as attempts_count,
        AVG(score) as average_score,
        COUNT(DISTINCT user_id) as unique_users
      FROM quiz_attempts
      WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY period
      ORDER BY period DESC
    `);

    res.json({
      period,
      data: timeAnalysis
    });

  } catch (error) {
    console.error('Error fetching time analysis:', error);
    res.status(500).json({ error: 'Failed to fetch time analysis' });
  }
});

module.exports = router;