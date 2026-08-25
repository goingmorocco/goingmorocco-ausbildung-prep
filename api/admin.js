// Admin API Endpoints (mock)
// Lets an admin review new signups, approve/reject membership, remove
// members, and broadcast notifications. All gated behind requireAdmin.

const express = require('express');
const router = express.Router();
const { users, subscriptions, notifications, notificationRecipients } = require('./db');
const { authenticateToken, requireAdmin } = require('./authMiddleware');

router.use(authenticateToken, requireAdmin);

function withSubscription(user) {
  const sub = subscriptions.find(s => s.user_id === user.id);
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    membership_status: user.membership_status,
    created_at: user.created_at,
    subscription: sub ? {
      status: sub.status,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end
    } : null
  };
}

// Dashboard stats
router.get('/stats', (req, res) => {
  const total = users.filter(u => u.role !== 'admin').length;
  const pending = users.filter(u => u.membership_status === 'pending').length;
  const active = users.filter(u => u.membership_status === 'active').length;
  const rejected = users.filter(u => u.membership_status === 'rejected').length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;

  res.json({
    success: true,
    stats: { total, pending, active, rejected, activeSubscriptions }
  });
});

// List members (optionally filtered by ?status=pending|active|rejected)
router.get('/members', (req, res) => {
  const { status, q } = req.query;
  let list = users.filter(u => u.role !== 'admin');

  if (status && status !== 'all') {
    list = list.filter(u => u.membership_status === status);
  }
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(u =>
      u.full_name.toLowerCase().includes(needle) ||
      u.email.toLowerCase().includes(needle)
    );
  }

  list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ success: true, members: list.map(withSubscription) });
});

// Approve a member (e.g. once payment is confirmed)
router.post('/members/:id/approve', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'العضو غير موجود' });
  }

  user.membership_status = 'active';
  user.updated_at = new Date().toISOString();

  // Activate (or extend) a 3-month subscription on approval.
  let sub = subscriptions.find(s => s.user_id === user.id);
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 3);

  if (sub) {
    sub.status = 'active';
    sub.current_period_start = start.toISOString();
    sub.current_period_end = end.toISOString();
    sub.cancel_at_period_end = false;
    sub.updated_at = start.toISOString();
  } else {
    sub = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      status: 'active',
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      cancel_at_period_end: false,
      created_at: start.toISOString(),
      updated_at: start.toISOString()
    };
    subscriptions.push(sub);
  }

  res.json({ success: true, member: withSubscription(user) });
});

// Reject a member
router.post('/members/:id/reject', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'العضو غير موجود' });
  }

  user.membership_status = 'rejected';
  user.updated_at = new Date().toISOString();

  const sub = subscriptions.find(s => s.user_id === user.id);
  if (sub) {
    sub.status = 'canceled';
    sub.updated_at = new Date().toISOString();
  }

  res.json({ success: true, member: withSubscription(user) });
});

// Reset a member back to pending (undo)
router.post('/members/:id/reset', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'العضو غير موجود' });
  }
  user.membership_status = 'pending';
  user.updated_at = new Date().toISOString();
  res.json({ success: true, member: withSubscription(user) });
});

// Remove a member entirely
router.delete('/members/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'العضو غير موجود' });
  }
  if (users[index].role === 'admin') {
    return res.status(400).json({ success: false, message: 'لا يمكن حذف حساب مشرف' });
  }

  const userId = users[index].id;
  users.splice(index, 1);

  for (let i = subscriptions.length - 1; i >= 0; i--) {
    if (subscriptions[i].user_id === userId) subscriptions.splice(i, 1);
  }

  res.json({ success: true });
});

// List sent notifications
router.get('/notifications', (req, res) => {
  const list = notifications
    .slice()
    .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
    .map(n => ({
      ...n,
      recipient_count: notificationRecipients.filter(r => r.notificationId === n.id).length
    }));

  res.json({ success: true, notifications: list });
});

// Send a notification. audience: 'all' | 'active' | 'pending' | 'rejected' | a specific user id
router.post('/notifications', (req, res) => {
  const { title, message, audience } = req.body;

  if (!title || !message || !audience) {
    return res.status(400).json({ success: false, message: 'العنوان والرسالة والجمهور المستهدف مطلوبة' });
  }

  let recipients;
  if (audience === 'all') {
    recipients = users.filter(u => u.role !== 'admin');
  } else if (['pending', 'active', 'rejected'].includes(audience)) {
    recipients = users.filter(u => u.membership_status === audience);
  } else {
    recipients = users.filter(u => u.id === audience);
  }

  const notification = {
    id: Math.random().toString(36).substr(2, 9),
    title,
    message,
    audience,
    sent_at: new Date().toISOString(),
    sent_by: req.adminUser.full_name
  };
  notifications.push(notification);

  recipients.forEach(u => {
    notificationRecipients.push({ notificationId: notification.id, userId: u.id });
  });

  res.json({
    success: true,
    notification: { ...notification, recipient_count: recipients.length }
  });
});

module.exports = router;
