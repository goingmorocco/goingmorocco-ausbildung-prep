// Mock Auth API Endpoints
// In a real implementation, these would connect to Supabase Auth

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { users } = require('./db');
const { JWT_SECRET } = require('./authMiddleware');

function toPublicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    membership_status: user.membership_status,
    created_at: user.created_at
  };
}

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني موجود بالفعل'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      full_name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: 'student',
      // New members start pending: an admin approves them once payment
      // is confirmed (see api/admin.js).
      membership_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    users.push(newUser);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: toPublicUser(newUser),
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    if (user.membership_status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'تم رفض عضويتك. يرجى التواصل مع الدعم لمزيد من المعلومات.'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: toPublicUser(user),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// Auth status endpoint
router.get('/status', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: toPublicUser(user)
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

module.exports = router;
