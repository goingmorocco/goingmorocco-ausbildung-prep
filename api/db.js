// Shared in-memory mock "database".
// All api/*.js modules import from here instead of declaring their own
// local arrays, so data (e.g. a user created in auth.js) is visible to
// admin.js and subscriptions.js too. This is still a MOCK data layer for
// demonstration only — replace with real Supabase queries in production.

const bcrypt = require('bcryptjs');

const users = [];
const subscriptions = [];
const notifications = []; // sent notification log
const notificationRecipients = []; // { notificationId, userId }

function seed() {
  if (users.length) return;

  const adminPasswordHash = bcrypt.hashSync('Admin@2024', 10);
  users.push({
    id: 'admin-001',
    full_name: 'مدير المنصة',
    email: 'admin@ausbildung-test-prep.com',
    phone: null,
    password: adminPasswordHash,
    role: 'admin',
    membership_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // A few demo members so the admin dashboard isn't empty on first run.
  const demo = [
    { full_name: 'محمد أحمد', email: 'mohamed.ahmed@example.com', membership_status: 'pending' },
    { full_name: 'فاطمة الزهراء', email: 'fatima.zahra@example.com', membership_status: 'active' },
    { full_name: 'يوسف بن علي', email: 'youssef.benali@example.com', membership_status: 'pending' },
    { full_name: 'سعاد المرابط', email: 'souad.mrabet@example.com', membership_status: 'rejected' }
  ];

  demo.forEach((d, i) => {
    const createdAt = new Date(Date.now() - (demo.length - i) * 86400000).toISOString();
    users.push({
      id: 'demo-' + (i + 1),
      full_name: d.full_name,
      email: d.email,
      phone: null,
      password: bcrypt.hashSync('Demo@1234', 10),
      role: 'student',
      membership_status: d.membership_status,
      created_at: createdAt,
      updated_at: createdAt
    });

    if (d.membership_status === 'active') {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 3);
      subscriptions.push({
        id: 'sub-' + (i + 1),
        user_id: 'demo-' + (i + 1),
        status: 'active',
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        cancel_at_period_end: false,
        created_at: start.toISOString(),
        updated_at: start.toISOString()
      });
    }
  });
}

seed();

module.exports = { users, subscriptions, notifications, notificationRecipients };
