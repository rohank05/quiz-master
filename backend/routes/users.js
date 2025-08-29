const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateToken, requireAdmin, handleValidationErrors } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await req.db.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('username').optional().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').optional().isEmail(),
  body('current_password').optional(),
  body('new_password').optional().isLength({ min: 6 })
], handleValidationErrors, async (req, res) => {
  try {
    const { username, email, current_password, new_password } = req.body;
    const userId = req.user.id;

    // If changing password, verify current password
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set new password' });
      }

      const [users] = await req.db.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(current_password, users[0].password_hash);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    // Check if username/email already exists (if changing)
    if (username || email) {
      let checkQuery = 'SELECT id FROM users WHERE ';
      let checkParams = [];
      let conditions = [];

      if (username) {
        conditions.push('username = ?');
        checkParams.push(username);
      }
      if (email) {
        conditions.push('email = ?');
        checkParams.push(email);
      }

      checkQuery += conditions.join(' OR ') + ' AND id != ?';
      checkParams.push(userId);

      const [existingUsers] = await req.db.execute(checkQuery, checkParams);
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
    }

    // Build update query
    let updateFields = [];
    let updateParams = [];

    if (username) {
      updateFields.push('username = ?');
      updateParams.push(username);
    }
    if (email) {
      updateFields.push('email = ?');
      updateParams.push(email);
    }
    if (new_password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(new_password, saltRounds);
      updateFields.push('password_hash = ?');
      updateParams.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateParams.push(userId);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    await req.db.execute(updateQuery, updateParams);

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, username, email, role, created_at
      FROM users
      WHERE 1=1
    `;
    let params = [];

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await req.db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let countParams = [];

    if (search) {
      countQuery += ' AND (username LIKE ? OR email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await req.db.execute(countQuery, countParams);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, requireAdmin, [
  body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    // Prevent admin from demoting themselves
    if (userId == req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change your own admin role' });
    }

    const [result] = await req.db.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated successfully' });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId == req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [result] = await req.db.execute('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;